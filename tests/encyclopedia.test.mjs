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

function loadModules() {
  const load = createTsLoader()
  return {
    encyclopedia: load('src/music/encyclopedia.ts'),
    catalog: load('src/music/theoryCatalog.ts'),
  }
}

test('encyclopedia has planned category breadth and enough entries', () => {
  const { encyclopedia } = loadModules()
  const types = encyclopedia.ENCYCLOPEDIA_CATEGORIES.map((item) => item.type)

  assert.equal(encyclopedia.ENCYCLOPEDIA_ENTRIES.length, 36)
  assert.deepEqual(types, [
    'composer',
    'appreciation',
    'chinese-music',
    'western-history',
    'instrument',
    'genre-form',
  ])

  for (const type of types) {
    assert.ok(
      encyclopedia.ENCYCLOPEDIA_ENTRIES.filter((entry) => entry.type === type).length >= 6,
      `${type} needs at least six entries`
    )
  }
})

test('every encyclopedia entry is quiz-ready and classroom-ready', () => {
  const { encyclopedia } = loadModules()

  for (const entry of encyclopedia.ENCYCLOPEDIA_ENTRIES) {
    assert.ok(entry.id, 'entry needs id')
    assert.ok(entry.title, `${entry.id} needs title`)
    assert.ok(entry.summary, `${entry.id} needs summary`)
    assert.ok(entry.prompt, `${entry.id} needs classroom prompt`)
    assert.ok(entry.keyFacts.length >= 3, `${entry.id} needs key facts`)
    assert.ok(entry.relatedTheoryIds.length > 0, `${entry.id} needs related theory ids`)
    assert.ok(entry.quiz.length >= 3, `${entry.id} needs quiz questions`)

    for (const question of entry.quiz) {
      assert.ok(question.question, `${entry.id} has empty quiz question`)
      assert.ok(question.options.length >= 3, `${entry.id} quiz needs options`)
      assert.equal(typeof question.answer, 'number')
      assert.ok(question.explanation, `${entry.id} quiz needs explanation`)
    }
  }
})

test('related theory ids resolve to existing theory topics', () => {
  const { encyclopedia, catalog } = loadModules()
  const topicIds = new Set(catalog.THEORY_TOPICS.map((topic) => topic.id))

  for (const entry of encyclopedia.ENCYCLOPEDIA_ENTRIES) {
    for (const id of entry.relatedTheoryIds) {
      assert.ok(topicIds.has(id), `${entry.id} references missing topic ${id}`)
    }
  }
})

test('core school music examples are present', () => {
  const { encyclopedia } = loadModules()
  const byId = new Set(encyclopedia.ENCYCLOPEDIA_ENTRIES.map((entry) => entry.id))

  assert.ok(byId.has('beethoven'))
  assert.ok(byId.has('ode-to-joy'))
  assert.ok(byId.has('pentatonic-sound'))
  assert.ok(byId.has('baroque'))
  assert.ok(byId.has('erhu'))
  assert.ok(byId.has('march'))
})

test('filtering and review-question conversion work', () => {
  const { encyclopedia } = loadModules()
  const composers = encyclopedia.filterEncyclopediaEntries({ type: 'composer' })
  const search = encyclopedia.filterEncyclopediaEntries({ search: '贝多芬' })
  const beethoven = search.find((entry) => entry.id === 'beethoven')
  const questions = encyclopedia.encyclopediaToReviewQuestions([beethoven])

  assert.equal(composers.length, 6)
  assert.ok(beethoven)
  assert.equal(questions.length, beethoven.quiz.length)
  assert.ok(questions.every((item) => item.source === 'encyclopedia'))
  assert.ok(questions.every((item) => item.itemId === 'beethoven'))
})
