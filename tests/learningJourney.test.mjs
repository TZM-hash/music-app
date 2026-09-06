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

test('学习旅程从第一步开始，且不能跳过试听和操作', () => {
  const load = createTsLoader()
  const { createJourneyState, completeJourneyStep } = load('src/music/learningJourney.ts')
  const { REFERENCE_ACTIVITIES } = load('src/music/referenceActivityCatalog.ts')
  const activity = REFERENCE_ACTIVITIES[0]

  const initial = createJourneyState(activity)
  assert.deepEqual(initial, {
    activityId: activity.id,
    steps: activity.steps,
    stepIndex: 0,
    completedStepIds: [],
    heardAudioIds: [],
    selectedEvidence: [],
    attempts: 0,
    status: 'active',
  })
  assert.deepEqual(completeJourneyStep(initial, 'try'), initial)

  const afterHook = completeJourneyStep(initial, 'hook')
  assert.equal(afterHook.stepIndex, 1)
  assert.deepEqual(completeJourneyStep(afterHook, 'listen'), afterHook)
  assert.deepEqual(completeJourneyStep(afterHook, 'hook'), afterHook)
})

test('试听、证据、重试和步骤完成都产生有界状态', () => {
  const load = createTsLoader()
  const {
    createJourneyState,
    completeJourneyStep,
    registerJourneyAttempt,
    recordJourneyAudio,
    selectJourneyEvidence,
  } = load('src/music/learningJourney.ts')
  const { REFERENCE_ACTIVITIES } = load('src/music/referenceActivityCatalog.ts')
  const activity = REFERENCE_ACTIVITIES[0]

  let state = createJourneyState(activity)
  state = recordJourneyAudio(state, 'sample-a')
  state = recordJourneyAudio(state, 'sample-a')
  state = selectJourneyEvidence(state, '轻松')
  state = selectJourneyEvidence(state, '轻松')
  state = registerJourneyAttempt(state)
  state = registerJourneyAttempt(state)

  assert.deepEqual(state.heardAudioIds, ['sample-a'])
  assert.deepEqual(state.selectedEvidence, ['轻松'])
  assert.equal(state.attempts, 2)
})

test('完成全部步骤后才可以提交，并返回 1 到 3 星结果', () => {
  const load = createTsLoader()
  const { createJourneyState, completeJourneyStep, recordJourneyAudio, submitJourney } = load(
    'src/music/learningJourney.ts'
  )
  const { REFERENCE_ACTIVITIES } = load('src/music/referenceActivityCatalog.ts')
  const activity = REFERENCE_ACTIVITIES[0]

  let state = createJourneyState(activity)
  assert.deepEqual(submitJourney(state, activity).next, state)
  for (const step of activity.steps) {
    if (step === 'listen') state = recordJourneyAudio(state, 'fallback:reference-welcome')
    state = completeJourneyStep(state, step)
  }

  const result = submitJourney(state, activity)
  assert.equal(result.next.status, 'complete')
  assert.equal(result.next.stepIndex, activity.steps.length)
  assert.ok(result.stars >= 1 && result.stars <= 3)
  assert.ok(result.score >= 0 && result.score <= 100)
})

test('学习旅程容器提供试听、反馈、进度和回到探索入口', () => {
  const source = fs.readFileSync(path.resolve('src/components/LearningJourney.tsx'), 'utf8')
  assert.match(source, /export interface LearningJourneyProps/)
  assert.match(source, /recordResult\(`reference-activity:/)
  assert.match(source, /试听这一段/)
  assert.match(source, /audioUnavailable|没有可用音频/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /回到探索/)
})
