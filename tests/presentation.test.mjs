import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function loadPresentation() {
  const sourcePath = path.resolve('src/components/presentation.ts')
  const source = fs.readFileSync(sourcePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const module = { exports: {} }
  new Function('module', 'exports', transpiled)(module, module.exports)
  return module.exports
}

test('展示页索引会被限制在有效范围内', () => {
  const { clampPageIndex } = loadPresentation()

  assert.equal(clampPageIndex(-3, 4), 0)
  assert.equal(clampPageIndex(2, 4), 2)
  assert.equal(clampPageIndex(9, 4), 3)
  assert.equal(clampPageIndex(2, 0), 0)
})

test('展示列表分页只返回当前页且对异常页大小安全兜底', () => {
  const { getPageSlice } = loadPresentation()
  const items = ['a', 'b', 'c', 'd', 'e']

  assert.deepEqual(getPageSlice(items, 0, 2), { items: ['a', 'b'], pageCount: 3, pageIndex: 0 })
  assert.deepEqual(getPageSlice(items, 2, 2), { items: ['e'], pageCount: 3, pageIndex: 2 })
  assert.deepEqual(getPageSlice(items, 20, 2), { items: ['e'], pageCount: 3, pageIndex: 2 })
  assert.deepEqual(getPageSlice(items, 0, 0), { items, pageCount: 1, pageIndex: 0 })
})
