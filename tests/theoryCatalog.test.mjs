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

function loadCatalog() {
  return createTsLoader()('src/music/theoryCatalog.ts')
}

test('catalog covers primary and junior-high theory with classroom filters', () => {
  const catalog = loadCatalog()

  assert.equal(catalog.THEORY_STAGES.length, 5)
  assert.deepEqual(
    catalog.THEORY_STAGES.map((stage) => stage.id),
    ['primary-lower', 'primary-middle', 'primary-upper', 'junior-basic', 'junior-advanced']
  )

  assert.ok(catalog.THEORY_CATEGORIES.length >= 8)
  assert.ok(catalog.THEORY_TOPICS.length >= 100)

  for (const topic of catalog.THEORY_TOPICS) {
    assert.ok(topic.id, 'topic needs an id')
    assert.ok(topic.title, `${topic.id} needs a title`)
    assert.ok(topic.category, `${topic.id} needs a category`)
    assert.ok(topic.stage, `${topic.id} needs a stage`)
    assert.ok(topic.demo?.kind, `${topic.id} needs an interactive demo kind`)
    assert.ok(topic.quiz.length >= 6, `${topic.id} needs at least six quiz questions`)
    assert.equal(topic.keyPoints.length, 3, `${topic.id} needs three key points`)
  }
})

test('filterTheoryTopics supports category and stage together', () => {
  const catalog = loadCatalog()
  const rhythmUpper = catalog.filterTheoryTopics({
    category: '节奏与节拍',
    stage: 'primary-upper',
  })

  assert.ok(rhythmUpper.length >= 4)
  assert.ok(rhythmUpper.every((topic) => topic.category === '节奏与节拍'))
  assert.ok(rhythmUpper.every((topic) => topic.stage === 'primary-upper'))
  assert.ok(rhythmUpper.some((topic) => topic.id === 'syncopation'))
})

test('junior advanced topics include harmony, form, and composition', () => {
  const catalog = loadCatalog()
  const advanced = catalog.filterTheoryTopics({ stage: 'junior-advanced' })
  const ids = advanced.map((topic) => topic.id)

  assert.ok(ids.includes('seventh-chords'))
  assert.ok(ids.includes('cadence'))
  assert.ok(ids.includes('variation-development'))
  assert.ok(ids.includes('four-bar-phrase-writing'))
})

test('expanded catalog gives every category meaningful depth', () => {
  const catalog = loadCatalog()
  const byCategory = new Map()

  for (const topic of catalog.THEORY_TOPICS) {
    byCategory.set(topic.category, (byCategory.get(topic.category) ?? 0) + 1)
  }

  for (const category of catalog.THEORY_CATEGORIES) {
    assert.ok((byCategory.get(category) ?? 0) >= 8, `${category} needs at least eight topics`)
  }
})
