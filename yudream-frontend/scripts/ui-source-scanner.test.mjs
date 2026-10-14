import assert from 'node:assert/strict'
import test from 'node:test'
import { scanUiSyntax } from './ui-source-scanner.mjs'

const options = { publicNames: new Set(['YdButton', 'YdResponsiveTable']), thirdPartySources: ['@arco-design/', 'reka-ui'], requireResponsiveTables: true }
test('nested slot content cannot hide native controls or missing card views', () => {
  const source = '<template><YdResponsiveTable><template #header>标题</template><button>保存</button></YdResponsiveTable></template>'
  const findings = scanUiSyntax(source, 'screen.vue', options)
  assert.ok(findings.some(finding => finding.rule === 'yd-only-native-control'))
  assert.ok(findings.some(finding => finding.rule === 'yd-only-table-card'))
})
test('public components, semantic labels, comments and documentation strings pass', () => {
  assert.deepEqual(scanUiSyntax('<template><label>字段</label><!-- <FaButton /> --><YdButton /></template>', 'screen.vue', options), [])
  assert.deepEqual(scanUiSyntax('const doc = "FaButton reka-ui"', 'screen.ts', options), [])
})
test('imports, aliased renderers and malformed source fail closed', () => {
  assert.ok(scanUiSyntax('import { h as render } from "vue"; render("input")', 'screen.ts', options).length)
  assert.ok(scanUiSyntax('import type { ButtonProps } from "@arco-design/web-vue"', 'screen.ts', options).length)
  assert.ok(scanUiSyntax('const broken = {', 'screen.ts', options).some(finding => finding.rule === 'yd-only-parse-error'))
})
