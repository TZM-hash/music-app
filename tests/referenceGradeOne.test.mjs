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

const GRADE_ONE_IDS = [
  'g1-posture',
  'g1-x-xx-rhythm',
  'g1-dynamics',
  'g1-meter-2-3',
  'g1-duration',
  'g1-pitch',
  'g1-clappers',
  'g1-woodblock',
  'g1-bell',
  'g1-labor-rhythm',
  'g1-gong-drum-cymbal',
  'g1-concert-review',
]

test('一年级上册所有知识点都有稳定活动映射', () => {
  const load = createTsLoader()
  const catalog = load('src/music/referenceCourseware.ts')
  const activities = load('src/music/referenceActivityCatalog.ts')
  const gradeOnePoints = catalog.getReferenceKnowledgePoints({ grade: 1 })

  assert.deepEqual(gradeOnePoints.map((point) => point.id), GRADE_ONE_IDS)
  assert.ok(gradeOnePoints.every((point) => point.activityIds.length > 0))
  assert.ok(activities.getReferenceActivities({ grade: 1 }).length >= GRADE_ONE_IDS.length)
  assert.ok(
    activities
      .getReferenceActivities({ grade: 1 })
      .every((activity) => activity.steps.includes('listen') && activity.steps.includes('reflect'))
  )
})

test('森林乐器大冒险提供序章、五关、终章和星级进度', () => {
  const load = createTsLoader()
  const quest = load('src/music/referenceLessons/gradeOneUpper.ts')

  assert.equal(quest.GRADE_ONE_FOREST_QUEST.length, 7)
  assert.equal(quest.GRADE_ONE_FOREST_QUEST[0].id, 'prologue')
  assert.equal(quest.GRADE_ONE_FOREST_QUEST[6].id, 'finale')
  assert.ok(quest.GRADE_ONE_FOREST_QUEST.every((stage) => stage.activityId && stage.label))
  assert.ok(quest.GRADE_ONE_ACTIVITIES.every((activity) => activity.assetIds.length > 0))
})

test('一年级森林样板组件提供地图、关卡、活动和庆祝反馈', () => {
  const source = fs.readFileSync(
    path.resolve('src/components/reference/GradeOneForestQuest.tsx'),
    'utf8'
  )
  assert.match(source, /GRADE_ONE_FOREST_QUEST/)
  assert.match(source, /ReferenceActivityStage/)
  assert.match(source, /星|stars/)
  assert.match(source, /庆祝|完成/)
  assert.match(source, /onComplete/)
})
