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

const GRADE_THREE_IDS = [
  'g3-solfege-note-names',
  'g3-dynamics-marks',
  'g3-music-emotion',
  'g3-low-567-high-1',
  'g3-labor-chant',
  'g3-sound-dictation',
  'g3-ostinato',
  'g3-voice-ranges',
  'g3-two-part',
  'g3-unison-chorus-round',
  'g3-polyphony',
  'g3-crescendo-diminuendo',
  'g3-review',
]

test('三年级上册所有知识点都有活动和资源映射', () => {
  const load = createTsLoader()
  const catalog = load('src/music/referenceCourseware.ts')
  const lessons = load('src/music/referenceLessons/gradeThreeUpper.ts')
  const activities = load('src/music/referenceActivityCatalog.ts')
  const points = catalog.getReferenceKnowledgePoints({ grade: 3 })

  assert.deepEqual(points.map((point) => point.id), GRADE_THREE_IDS)
  assert.ok(points.every((point) => point.activityIds.length > 0))
  assert.equal(lessons.GRADE_THREE_ACTIVITIES.length, GRADE_THREE_IDS.length)
  assert.ok(activities.getReferenceActivities({ grade: 3 }).length >= GRADE_THREE_IDS.length)
})

test('三年级活动覆盖情绪、演唱形式、声部、力度和听音记谱', () => {
  const load = createTsLoader()
  const lessons = load('src/music/referenceLessons/gradeThreeUpper.ts')
  const kinds = new Set(lessons.GRADE_THREE_ACTIVITIES.map((activity) => activity.kind))

  assert.ok(kinds.has('listen-and-choose'))
  assert.ok(kinds.has('voice-form-guess'))
  assert.ok(kinds.has('layered-listening'))
  assert.ok(kinds.has('sound-dictation'))
  assert.ok(lessons.GRADE_THREE_ACTIVITIES.some((activity) => activity.id.includes('emotion')))
  assert.ok(lessons.GRADE_THREE_ACTIVITIES.some((activity) => activity.id.includes('crescendo')))
})
