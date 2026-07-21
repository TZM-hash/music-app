import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function createTsLoader() {
  const cache = new Map()
  const load = (filePath) => {
    const resolved = path.resolve(filePath.endsWith('.ts') ? filePath : `${filePath}.ts`)
    if (cache.has(resolved)) return cache.get(resolved).exports
    const source = fs.readFileSync(resolved, 'utf8')
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText
    const module = { exports: {} }
    cache.set(resolved, module)
    const localRequire = (specifier) => {
      if (specifier.startsWith('.')) return load(path.resolve(path.dirname(resolved), specifier))
      return require(specifier)
    }
    const fn = new Function('module', 'exports', 'require', transpiled)
    fn(module, module.exports, localRequire)
    return module.exports
  }
  return load
}

test('focusFromReviewItem maps theory source to topicId', () => {
  const loadTs = createTsLoader()
  const { focusFromReviewItem } = loadTs('src/state/reviewDeepLink.ts')
  const focus = focusFromReviewItem({
    source: 'theory',
    itemId: 'pitch-up-down',
    category: '音高与唱名',
    stage: 'primary-lower',
  })
  assert.equal(focus.topicId, 'pitch-up-down')
  assert.equal(focus.category, '音高与唱名')
  assert.equal(focus.stage, 'primary-lower')
})

test('focusFromReviewItem maps encyclopedia source without fake topicId', () => {
  const loadTs = createTsLoader()
  const { focusFromReviewItem } = loadTs('src/state/reviewDeepLink.ts')
  const focus = focusFromReviewItem({
    source: 'encyclopedia',
    itemId: 'enc-mozart',
    category: '音乐故事',
  })
  assert.equal(focus.topicId, undefined)
  assert.equal(focus.category, '音乐故事')
})

test('focusFromWeakCategory only sets category', () => {
  const loadTs = createTsLoader()
  const { focusFromWeakCategory } = loadTs('src/state/reviewDeepLink.ts')
  assert.deepEqual(focusFromWeakCategory('节奏与拍号'), { category: '节奏与拍号' })
})

test('focusFromTheoryTopic sets topicId category stage', () => {
  const loadTs = createTsLoader()
  const { focusFromTheoryTopic } = loadTs('src/state/reviewDeepLink.ts')
  const focus = focusFromTheoryTopic({
    id: 'cadence',
    category: '音程与和声',
    stage: 'junior-advanced',
  })
  assert.deepEqual(focus, {
    topicId: 'cadence',
    category: '音程与和声',
    stage: 'junior-advanced',
  })
})
