import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const candidateFrontend = fileURLToPath(new URL('../yudream-frontend/', import.meta.url))
const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'yd-ui-git-batch-'))
const frontend = path.join(tempRoot, 'yudream-frontend')
const fixedDate = '2000-01-01T00:00:00Z'
const gitEnv = { ...process.env, GIT_AUTHOR_DATE: fixedDate, GIT_COMMITTER_DATE: fixedDate }
const run = (args) => execFileSync('git', args, { cwd: tempRoot, encoding: 'utf8', env: gitEnv, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const write = (relative, content) => {
  const file = path.join(tempRoot, relative)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content, 'utf8')
}
const scan = (sha) => {
  const result = spawnSync(process.execPath, [path.join(frontend, 'scripts/audit-ui.mjs'), `--source=git:${sha}`], { cwd: tempRoot, encoding: 'utf8' })
  if (result.error || (result.status !== 0 && result.status !== 1)) {
    throw result.error ?? new Error(`scanner exited ${result.status}: ${result.stderr}`)
  }
  const report = JSON.parse(readFileSync(path.join(frontend, 'audit-report.json'), 'utf8'))
  assert.equal(report.source, `git:${sha}`, 'report must identify the immutable commit used')
  return report
}
const commit = (message) => {
  run(['add', 'yudream-frontend/package.json', 'yudream-frontend/packages', 'yudream-plugins'])
  run(['-c', 'user.name=Temp Fixture', '-c', 'user.email=temp@example.invalid', 'commit', '--quiet', '-m', message])
  return run(['rev-parse', 'HEAD'])
}

try {
  mkdirSync(path.join(frontend, 'scripts'), { recursive: true })
  for (const file of ['audit-ui.mjs', 'brand-token-scanner.mjs', 'ui-source-scanner.mjs']) {
    copyFileSync(path.join(candidateFrontend, 'scripts', file), path.join(frontend, 'scripts', file))
  }
  // On Windows, unlink the junction explicitly before deleting the fixture tree.
  symlinkSync(path.join(candidateFrontend, 'node_modules'), path.join(frontend, 'node_modules'), 'junction')
  write('yudream-frontend/package.json', '{"name":"audit-batch-fixture","private":true,"type":"module"}')

  run(['init', '--quiet'])
  run(['config', 'core.quotePath', 'false'])
  run(['-c', 'user.name=Temp Fixture', '-c', 'user.email=temp@example.invalid', 'commit', '--allow-empty', '--quiet', '-m', 'empty source tree'])
  const emptyTree = run(['rev-parse', 'HEAD'])
  const emptyReport = scan(emptyTree)
  assert.deepEqual(emptyReport.summary, { filesScanned: 0, violationCount: 0 }, 'empty Git tree must be a valid zero scan')
  assert.deepEqual(emptyReport.violations, [])

  write('yudream-frontend/packages/plugin-probe/src/Widget.vue', `<script setup>\nimport { YdButton } from '@yudream/components'\n</script>\n<template><YdButton>ok</YdButton></template>`)
  write('yudream-frontend/packages/plugin-probe/src/中文入口.vue', '<template><button>中文内容</button></template>')
  write('yudream-frontend/packages/plugin-probe/src/index.ts', `import './theme.css'`)
  write('yudream-frontend/packages/plugin-probe/vite.config.ts', `export default { build: { lib: { cssFileName: 'style' } } }`)
  write('yudream-frontend/packages/plugin-probe/src/theme.css', '.site-page { --primary-6: #123456; }')
  // Missing index.ts, vite.config.ts, and Java metadata must not authorize this token.
  write('yudream-frontend/packages/plugin-orphan/src/missing.css', '.site-page { --primary-6: #abcdef; }')
  write('yudream-plugins/yudream-plugin-probe/src/main/java/Probe.java', '@PluginTheme(code = "probe", scopes = {PluginThemeScope.SITE}, styles = {"style.css"})')
  const first = commit('first snapshot')
  const firstReport = scan(first)
  assert.equal(firstReport.summary.filesScanned, 5)
  assert.equal(firstReport.summary.violationCount, 2)
  assert.deepEqual(firstReport.violations.map(({ file, rule, message, line }) => [file, rule, message, line]), [
    ['packages/plugin-orphan/src/missing.css', 'no-brand-color-token', '业务样式禁止私有品牌色令牌 --primary-6', 1],
    ['packages/plugin-probe/src/中文入口.vue', 'yd-only-native-control', '业务模板禁止原生通用交互 <button>；请使用 YD 组件。', 1],
  ])

  write('yudream-frontend/packages/plugin-probe/src/Widget.vue', `<script setup>\nimport { FaButton } from '@yudream/components'\n</script>\n<template><FaButton>bad</FaButton></template>`)
  run(['add', 'yudream-frontend/packages/plugin-probe/src/Widget.vue'])
  run(['-c', 'user.name=Temp Fixture', '-c', 'user.email=temp@example.invalid', 'commit', '--quiet', '-m', 'second snapshot'])
  const second = run(['rev-parse', 'HEAD'])
  const secondReport = scan(second)
  assert.equal(secondReport.summary.filesScanned, 5)
  assert.equal(secondReport.summary.violationCount, 3)
  assert.deepEqual(secondReport.violations.map(({ file, rule, message, line }) => [file, rule, message, line]), [
    ['packages/plugin-orphan/src/missing.css', 'no-brand-color-token', '业务样式禁止私有品牌色令牌 --primary-6', 1],
    ['packages/plugin-probe/src/Widget.vue', 'yd-only', '禁止业务依赖 FaButton；请使用 @yudream/components 公开 YD 入口。', 2],
    ['packages/plugin-probe/src/中文入口.vue', 'yd-only-native-control', '业务模板禁止原生通用交互 <button>；请使用 YD 组件。', 1],
  ])

  // Deliberately introduce uncommitted source; scanning a fixed SHA must ignore it.
  write('yudream-frontend/packages/plugin-probe/src/Widget.vue', `<script setup>\nimport { AButton } from '@arco-design/web-vue'\n</script>\n<template><AButton>working tree only</AButton></template>`)
  const repeatedFirst = scan(first)
  assert.deepEqual(repeatedFirst.summary, firstReport.summary)
  assert.deepEqual(repeatedFirst.violations, firstReport.violations)
  console.log(JSON.stringify({ emptyTree, first, second, empty: emptyReport.summary, firstSnapshot: firstReport.summary, secondSnapshot: secondReport.summary, chinesePathScanned: true, missingMetadataStillFlagged: true, uncommittedSourceExcluded: true }, null, 2))
}
finally {
  const resolvedTemp = path.resolve(tempRoot)
  const resolvedOsTemp = path.resolve(os.tmpdir())
  const tempPrefix = `${resolvedOsTemp}${path.sep}`
  assert(resolvedTemp.startsWith(tempPrefix), `refusing to remove path outside os.tmpdir(): ${resolvedTemp}`)
  assert.equal(path.basename(resolvedTemp).startsWith('yd-ui-git-batch-'), true, `unexpected Temp fixture directory: ${resolvedTemp}`)
  const modulesLink = path.join(frontend, 'node_modules')
  try {
    if (lstatSync(modulesLink).isSymbolicLink()) unlinkSync(modulesLink)
  }
  catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  rmSync(resolvedTemp, { recursive: true, force: true })
}
