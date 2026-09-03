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

test('exploration loop follows the student task-card order', () => {
  const loadTsModule = createTsLoader()
  const catalog = loadTsModule('src/music/theoryCatalog.ts')
  const demos = loadTsModule('src/music/theoryDemos.ts')
  const { buildExplorationLoop } = loadTsModule('src/music/explorationLoop.ts')
  const topic = catalog.THEORY_TOPICS.find((item) => item.id === 'steady-beat')
  const scene = demos.getDemoScene(topic.demo.kind)

  const steps = buildExplorationLoop(topic, scene)

  assert.deepEqual(steps.map((step) => step.id), ['listen', 'guess', 'play', 'create', 'speak'])
  assert.ok(steps.every((step) => step.title.length >= 2))
  assert.ok(steps.every((step) => step.microGoal.length >= 4))
  assert.equal(steps.find((step) => step.id === 'play').route, 'game-taiko')
  assert.equal(steps.find((step) => step.id === 'create').route, 'mixer')
  assert.ok(steps.every((step) => !/[知识|讲解|训练|复习|教材]/.test(step.prompt)))
})

test('task card packages a topic into listen, guess, play, create, speak missions', () => {
  const loadTsModule = createTsLoader()
  const catalog = loadTsModule('src/music/theoryCatalog.ts')
  const demos = loadTsModule('src/music/theoryDemos.ts')
  const { buildExplorationTaskCard } = loadTsModule('src/music/explorationLoop.ts')
  const topic = catalog.THEORY_TOPICS.find((item) => item.id === 'pitch-up-down')
  const scene = demos.getDemoScene(topic.demo.kind)

  const card = buildExplorationTaskCard(topic, scene)

  assert.equal(card.topicId, 'pitch-up-down')
  assert.equal(card.title, '音的高低声音探险卡')
  assert.deepEqual(card.steps.map((step) => step.id), ['listen', 'guess', 'play', 'create', 'speak'])
  assert.ok(card.mission.includes('听'))
  assert.ok(card.mission.includes('创'))
  assert.ok(card.checkpoints.length >= 3)
  assert.ok(card.steps.every((step) => step.badge.length >= 2))
  assert.equal(card.sourceLabel, '教材同步')
  assert.ok(card.curriculum.grades.includes(1))
  assert.ok(card.curriculum.unitTitle.length >= 2)
})

test('create step suggests a creative action when topic actions do not include one', () => {
  const loadTsModule = createTsLoader()
  const catalog = loadTsModule('src/music/theoryCatalog.ts')
  const demos = loadTsModule('src/music/theoryDemos.ts')
  const { buildExplorationLoop } = loadTsModule('src/music/explorationLoop.ts')
  const topic = catalog.THEORY_TOPICS[0]
  const scene = demos.getDemoScene(topic.demo.kind)

  const steps = buildExplorationLoop(topic, scene)
  const create = steps.find((step) => step.id === 'create')

  assert.equal(create.route, 'mixer')
  assert.match(create.prompt, /创|编|作品|旋律|节奏/)
})
