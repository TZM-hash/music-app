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
    new Function('module', 'exports', 'require', transpiled)(module, module.exports, localRequire)
    return module.exports
  }
  return load
}

test('体验目录覆盖声音侦探、节奏精灵和音乐画布三种类型', () => {
  const load = createTsLoader()
  const { EXPERIENCE_ACTIVITIES } = load('src/music/experienceActivities.ts')

  assert.deepEqual(
    EXPERIENCE_ACTIVITIES.map((activity) => activity.kind),
    ['sound-detective', 'rhythm-sprite', 'music-canvas']
  )
  assert.ok(EXPERIENCE_ACTIVITIES.every((activity) => activity.grades.length > 0))
  assert.ok(EXPERIENCE_ACTIVITIES.every((activity) => activity.prompts.listen.length >= 6))
})

test('年级会稳定映射到低、中、高三个体验段', () => {
  const load = createTsLoader()
  const { getAgeBand } = load('src/music/experienceActivities.ts')

  assert.equal(getAgeBand(1), 'primary-1-2')
  assert.equal(getAgeBand(2), 'primary-1-2')
  assert.equal(getAgeBand(3), 'primary-3-4')
  assert.equal(getAgeBand(4), 'primary-3-4')
  assert.equal(getAgeBand(5), 'primary-5-6')
  assert.equal(getAgeBand(6), 'primary-5-6')
  assert.equal(getAgeBand(undefined), 'primary-1-2')
})

test('推荐活动按年级保持三种能力互补且包含浙江拓展入口', () => {
  const load = createTsLoader()
  const { getRecommendedActivities } = load('src/music/experienceActivities.ts')

  for (const grade of [1, 4, 6]) {
    const activities = getRecommendedActivities(grade)
    assert.equal(activities.length, 3)
    assert.deepEqual(
      activities.map((activity) => activity.kind),
      ['sound-detective', 'rhythm-sprite', 'music-canvas']
    )
    assert.ok(activities.some((activity) => activity.zhejiangTag))
  }
})

test('体验旅程始终按听、找、动、玩、创、说六步生成，并带有年龄提示', () => {
  const load = createTsLoader()
  const { EXPERIENCE_ACTIVITIES, buildExperienceJourney } = load('src/music/experienceActivities.ts')

  const lower = buildExperienceJourney(EXPERIENCE_ACTIVITIES[0], 1)
  const upper = buildExperienceJourney(EXPERIENCE_ACTIVITIES[0], 6)

  assert.equal(lower.ageBand, 'primary-1-2')
  assert.equal(upper.ageBand, 'primary-5-6')
  assert.deepEqual(
    lower.steps.map((step) => step.id),
    ['listen', 'find', 'move', 'play', 'create', 'share']
  )
  assert.ok(lower.steps.every((step) => step.prompt.length >= 4))
  assert.notEqual(lower.steps[1].prompt, upper.steps[1].prompt)
})

