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
    new Function('module', 'exports', 'require', transpiled)(module, module.exports, localRequire)
    return module.exports
  }
  return load
}

test('参考知识点覆盖一至三年级并支持来源、年级和关键词筛选', () => {
  const load = createTsLoader()
  const catalog = load('src/music/referenceCourseware.ts')

  assert.ok(catalog.REFERENCE_KNOWLEDGE_POINTS.length >= 37)
  assert.equal(
    new Set(catalog.REFERENCE_KNOWLEDGE_POINTS.map((point) => point.id)).size,
    catalog.REFERENCE_KNOWLEDGE_POINTS.length
  )
  assert.deepEqual(catalog.getReferenceKnowledgePoints({ grade: 1 }).every((point) => point.grade === 1), true)
  assert.ok(
    catalog
      .getReferenceKnowledgePoints({ source: 'renyin-reference', search: '力度' })
      .some((point) => point.id === 'g1-dynamics' || point.id === 'g3-dynamics-marks')
  )
})

test('活动步骤包含试听、操作和反思，且所有引用都能解析到知识点', () => {
  const load = createTsLoader()
  const catalog = load('src/music/referenceCourseware.ts')
  const activities = load('src/music/referenceActivityCatalog.ts')

  assert.ok(activities.REFERENCE_ACTIVITIES.length > 0)
  assert.ok(
    activities.REFERENCE_ACTIVITIES.every((activity) =>
      ['listen', 'try', 'reflect'].every((step) => activity.steps.includes(step))
    )
  )
  assert.ok(
    activities.REFERENCE_ACTIVITIES.every(
      (activity) => activity.feedback.correct && activity.feedback.retry && activity.feedback.complete
    )
  )
  assert.deepEqual(catalog.validateReferenceCatalog(catalog.REFERENCE_KNOWLEDGE_POINTS, activities.REFERENCE_ACTIVITIES), {
    valid: true,
    errors: [],
  })
})

test('活动筛选支持年级和互动类型', () => {
  const load = createTsLoader()
  const { getReferenceActivities } = load('src/music/referenceActivityCatalog.ts')

  assert.ok(getReferenceActivities({ grade: 1 }).every((activity) => activity.knowledgePointId.startsWith('g1-')))
  assert.ok(getReferenceActivities({ kind: 'listen-and-choose' }).length > 0)
})
