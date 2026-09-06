import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function createTsLoader() {
  const cache = new Map()
  const load = (filePath) => {
    const resolved = path.resolve(filePath.endsWith('.ts') ? filePath : `${filePath}.ts`)
    if (cache.has(resolved)) return cache.get(resolved).exports
    const source = fs.readFileSync(resolved, 'utf8')
    const transpiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText
    const module = { exports: {} }
    cache.set(resolved, module)
    const localRequire = (specifier) => {
      if (specifier.startsWith('.')) return load(path.resolve(path.dirname(resolved), specifier))
      return require(specifier)
    }
    new Function('module', 'exports', 'require', transpiled)(module, module.exports, localRequire)
    return module.exports
  }
  return load
}

const GRADE_TWO_IDS = [
  'g2-do-mi-sol',
  'g2-135-polyphony',
  'g2-fast-rhythm',
  'g2-solfege-listen',
  'g2-135-hearing',
  'g2-meter-creation',
  'g2-note-values',
  'g2-violin-piano-flute',
  'g2-fa-si-high-do',
  'g2-meter-2-3',
  'g2-percussion-family',
  'g2-review',
]

test('二年级上册所有知识点都有活动和资源映射', () => {
  const load = createTsLoader()
  const catalog = load('src/music/referenceCourseware.ts')
  const lessons = load('src/music/referenceLessons/gradeTwoUpper.ts')
  const activities = load('src/music/referenceActivityCatalog.ts')
  const points = catalog.getReferenceKnowledgePoints({ grade: 2 })

  assert.deepEqual(points.map((point) => point.id), GRADE_TWO_IDS)
  assert.ok(points.every((point) => point.activityIds.length > 0))
  assert.equal(lessons.GRADE_TWO_ACTIVITIES.length, GRADE_TWO_IDS.length)
  assert.ok(lessons.GRADE_TWO_ACTIVITIES.every((activity) => activity.audioIds.length > 0 && activity.assetIds.length > 0))
  assert.ok(activities.getReferenceActivities({ grade: 2 }).length >= GRADE_TWO_IDS.length)
})

test('二年级内容覆盖唱名、时值、节拍创编、乐器和多声部互动', () => {
  const load = createTsLoader()
  const lessons = load('src/music/referenceLessons/gradeTwoUpper.ts')
  const kinds = new Set(lessons.GRADE_TWO_ACTIVITIES.map((activity) => activity.kind))

  assert.ok(kinds.has('note-ladder'))
  assert.ok(kinds.has('rhythm-builder'))
  assert.ok(kinds.has('instrument-detective'))
  assert.ok(kinds.has('layered-listening'))
  assert.ok(lessons.GRADE_TWO_ACTIVITIES.find((activity) => activity.id.includes('note-values')))
})
