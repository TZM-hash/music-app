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

test('推荐优先选择当前年级的教材同步主题，并在同一天保持稳定', () => {
  const load = createTsLoader()
  const catalog = load('src/music/theoryCatalog.ts')
  const { recommendExplorationTopic } = load('src/music/explorationRecommendations.ts')
  const context = {
    grade: 2,
    semester: 1,
    studentId: 'stu-2',
    dayKey: '2026-09-03',
    weakCategories: ['节奏与节拍'],
  }

  const first = recommendExplorationTopic(catalog.THEORY_TOPICS, context)
  const second = recommendExplorationTopic(catalog.THEORY_TOPICS, context)

  assert.ok(first)
  assert.equal(first.topic.id, second.topic.id)
  assert.equal(first.topic.curriculum.source, 'textbook')
  assert.ok(first.topic.curriculum.grades.includes(2))
  assert.match(first.reason, /二年级|教材同步/)
})

test('当前年级主题全部完成后会回退到仍可探索的核心主题', () => {
  const load = createTsLoader()
  const catalog = load('src/music/theoryCatalog.ts')
  const { recommendExplorationTopic } = load('src/music/explorationRecommendations.ts')
  const gradeOneIds = catalog.filterTheoryTopics({ grade: 1, source: 'textbook' }).map((topic) => topic.id)

  const result = recommendExplorationTopic(catalog.THEORY_TOPICS, {
    grade: 1,
    completedTopicIds: gradeOneIds,
    studentId: 'stu-1',
    dayKey: '2026-09-03',
  })

  assert.ok(result)
  assert.equal(result.topic.curriculum.source, 'textbook')
  assert.ok(result.topic.curriculum.grades.includes(1) || result.topic.curriculum.grades.includes(2))
})

test('没有学生年级时仍返回小学教材主题而不是初中拓展', () => {
  const load = createTsLoader()
  const catalog = load('src/music/theoryCatalog.ts')
  const { recommendExplorationTopic } = load('src/music/explorationRecommendations.ts')

  const result = recommendExplorationTopic(catalog.THEORY_TOPICS, { dayKey: '2026-09-03' })

  assert.ok(result)
  assert.equal(result.topic.curriculum.source, 'textbook')
  assert.ok(result.topic.stage.startsWith('primary-'))
})
