#!/usr/bin/env node
// The syntax scanner is maintained with the host's YD contract documentation.
import { execFileSync } from 'node:child_process'
import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { findThemeBrandDeclarationOffsets, resolvePluginThemeCssSources, scanBrandTokenUsage } from './brand-token-scanner.mjs'
import { scanUiSyntax } from './ui-source-scanner.mjs'

const frontend = fileURLToPath(new URL('..', import.meta.url))
const root = path.resolve(frontend, '..')
const require = createRequire(import.meta.url)
const resolver = readFileSync(require.resolve('@yudream/components/resolver'), 'utf8')
const publicNames = new Set([...resolver.matchAll(/'((?:Fa|Yd|useYd)[A-Za-z0-9]+)'/g)].map(match => match[1].replace(/^Fa/, 'Yd')))
const thirdPartySources = ['@arco-design/', 'reka-ui', 'radix-vue', 'shadcn-vue', 'element-plus', 'ant-design-vue', 'naive-ui', 'vuetify', 'primevue', 'bootstrap-vue', 'tdesign-vue']
const baselinePath = path.join(root, 'ci/yd-ui-baseline.json')
const requestedSource = process.argv.find(argument => argument.startsWith('--source=git:'))?.slice('--source=git:'.length)
if (requestedSource && (!/^[A-Za-z0-9_./-]+$/.test(requestedSource) || requestedSource.startsWith('-'))) {
  throw new Error('Invalid git source reference')
}
const source = requestedSource
  ? execFileSync('git', ['rev-parse', '--verify', `${requestedSource}^{commit}`], { cwd: root, encoding: 'utf8' }).trim()
  : undefined
const gitSourceFiles = new Map()
if (source) {
  const tree = execFileSync('git', ['ls-tree', '-r', '-z', '--full-tree', source, '--', 'yudream-frontend/packages', 'yudream-plugins'], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
  const entries = tree.toString('utf8').split('\0').filter(Boolean).map((entry) => {
    const tab = entry.indexOf('\t')
    const [mode, type, oid] = entry.slice(0, tab).split(' ')
    return { mode, type, oid, path: entry.slice(tab + 1) }
  }).filter(entry => entry.type === 'blob' && (
    /^yudream-frontend\/packages\/plugin-[^/]+\/src\/.*\.(?:vue|ts|tsx|css|scss)$/.test(entry.path)
    || /^yudream-frontend\/packages\/plugin-[^/]+\/(?:src\/index\.ts|vite\.config\.ts)$/.test(entry.path)
    || /^yudream-plugins\/yudream-plugin-[^/]+\/src\/main\/java\/.*\.java$/.test(entry.path)
  ))
  const uniqueOids = [...new Set(entries.map(entry => entry.oid))]
  const batch = uniqueOids.length
    ? execFileSync('git', ['cat-file', '--batch'], { cwd: root, input: Buffer.from(`${uniqueOids.join('\n')}\n`, 'ascii'), maxBuffer: 256 * 1024 * 1024 })
    : Buffer.alloc(0)
  const objectText = new Map()
  let offset = 0
  while (offset < batch.length) {
    const headerEnd = batch.indexOf(0x0a, offset)
    if (headerEnd < 0) throw new Error('Malformed git cat-file --batch header')
    const header = batch.toString('ascii', offset, headerEnd).split(' ')
    if (header.length !== 3 || header[1] !== 'blob') throw new Error(`Unexpected git object response: ${header.join(' ')}`)
    const size = Number(header[2])
    const bodyStart = headerEnd + 1
    const bodyEnd = bodyStart + size
    if (!Number.isSafeInteger(size) || size < 0 || bodyEnd >= batch.length || batch[bodyEnd] !== 0x0a) throw new Error('Malformed git cat-file --batch body')
    objectText.set(header[0], batch.subarray(bodyStart, bodyEnd).toString('utf8'))
    offset = bodyEnd + 1
  }
  for (const entry of entries) gitSourceFiles.set(entry.path, objectText.get(entry.oid))
}
const files = source
  ? [...gitSourceFiles.keys()].filter(file => /^yudream-frontend\/packages\/plugin-[^/]+\/src\/.*\.(?:vue|ts|tsx|css|scss)$/.test(file))
      .map(file => file.replace(/^yudream-frontend\//, ''))
  : ['vue', 'ts', 'tsx', 'css', 'scss'].flatMap(extension => globSync(`packages/plugin-*/src/**/*.${extension}`, { cwd: frontend, exclude: ['**/node_modules/**'] }))
      .map(file => file.replaceAll(path.sep, '/'))
const webFiles = files.filter(file => /^packages\/plugin-[^/]+\/src\/.*\.(?:vue|ts|tsx|css|scss)$/.test(file)
  && !/^packages\/plugin-(?:mobile-ui|[^/]+-mobile)\//.test(file)).sort()
const violations = []
const themeAssetCache = new Map()
function readRepositoryFile(file) {
  if (source) {
    return gitSourceFiles.get(file)
  }
  const absolute = path.join(root, file)
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : undefined
}

function declaredSiteThemeAssets(pluginCode) {
  if (themeAssetCache.has(pluginCode)) {
    return themeAssetCache.get(pluginCode)
  }
  const javaRoot = `yudream-plugins/yudream-plugin-${pluginCode}/src/main/java`
  const javaFiles = source
    ? [...gitSourceFiles.keys()].filter(file => file.startsWith(`${javaRoot}/`) && file.endsWith('.java'))
    : globSync(`${javaRoot}/**/*.java`, { cwd: root })
  const assets = resolvePluginThemeCssSources({
    pluginCode,
    javaSources: javaFiles.map(readRepositoryFile).filter(Boolean),
    entrySource: readRepositoryFile(`yudream-frontend/packages/plugin-${pluginCode}/src/index.ts`) ?? '',
    viteConfigSource: readRepositoryFile(`yudream-frontend/packages/plugin-${pluginCode}/vite.config.ts`) ?? '',
  })
  themeAssetCache.set(pluginCode, assets)
  return assets
}

for (const file of webFiles) {
  const content = source
    ? gitSourceFiles.get(`yudream-frontend/${file}`) ?? ''
    : readFileSync(path.join(frontend, file), 'utf8')
  const lineOf = index => content.slice(0, index).split('\n').length
  if (!/\.(?:css|scss)$/.test(file)) {
    for (const finding of scanUiSyntax(content, file, { publicNames, thirdPartySources, requireResponsiveTables: true })) {
      violations.push({ file, rule: finding.rule, message: finding.message, line: lineOf(finding.index) })
    }
  }
  const pluginMatch = /^packages\/plugin-([^/]+)\/(.+)$/.exec(file)
  const siteThemeAssets = pluginMatch ? declaredSiteThemeAssets(pluginMatch[1]) : []
  const themeAsset = siteThemeAssets.find(asset => asset.path === pluginMatch?.[2])
  const allowedDeclarationOffsets = /\.(?:css|scss)$/.test(file) && themeAsset
    ? findThemeBrandDeclarationOffsets(content, themeAsset.scope)
    : new Set()
  for (const match of scanBrandTokenUsage(content, { allowedDeclarationOffsets })) {
    violations.push({ file, rule: 'no-brand-color-token', message: `业务样式禁止私有品牌色令牌 ${match.token}`, line: lineOf(match.index) })
  }
}
const report = { source: source ? `git:${source}` : 'working-tree', generatedAt: new Date().toISOString(), summary: { filesScanned: webFiles.length, violationCount: violations.length }, violations }
writeFileSync(path.join(frontend, 'audit-report.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(`[audit:ui] ${webFiles.length} Web source files, ${violations.length} YD contract findings; audit-report.json contains full details.`)
const counts = {}
for (const finding of violations) {
  const key = JSON.stringify([finding.file, finding.rule, finding.message])
  counts[key] = (counts[key] ?? 0) + 1
}
if (process.argv.includes('--write-baseline')) {
  if (!source) {
    throw new Error('Baseline requires --source=git:HEAD; working-tree violations cannot be accepted.')
  }
  writeFileSync(baselinePath, `${JSON.stringify({ sourceCommit: source, findings: counts }, null, 2)}\n`)
}
else if (process.argv.includes('--baseline')) {
  if (!existsSync(baselinePath)) {
    throw new Error('Missing initial migration baseline')
  }
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')).findings ?? {}
  const regressions = Object.entries(counts).filter(([key, count]) => count > (baseline[key] ?? 0))
  for (const [key, count] of regressions.slice(0, 12)) {
    console.error(`[audit:ui] ${key} +${count - (baseline[key] ?? 0)}`)
  }
  if (regressions.length) {
    console.error(`[audit:ui] ${regressions.length} new/increased finding types; migration gate failed.`)
    process.exitCode = 1
  }
  else {
    console.log('[audit:ui] No new violations relative to the committed migration baseline.')
  }
}
else if (violations.length) {
  process.exitCode = 1
}
