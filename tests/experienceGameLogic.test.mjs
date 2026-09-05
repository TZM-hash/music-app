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

test('声音侦探答案判定会区分正确与错误并返回得分', () => {
  const load = createTsLoader()
  const { getSoundChallenges, evaluateSoundAnswer } = load('src/music/experienceGameLogic.ts')
  const challenge = getSoundChallenges('primary-1-2')[0]

  assert.equal(evaluateSoundAnswer(challenge, challenge.answer).correct, true)
  assert.equal(evaluateSoundAnswer(challenge, challenge.answer).points, 100)
  assert.equal(evaluateSoundAnswer(challenge, challenge.answer === 'a' ? 'b' : 'a').correct, false)
  assert.equal(evaluateSoundAnswer(challenge, challenge.answer === 'a' ? 'b' : 'a').points, 0)
})

test('候选试听可反复切换，只有显式确认才会产生判定', () => {
  const load = createTsLoader()
  const { auditionChoice, confirmAuditionChoice, createAuditionDecision } = load(
    'src/music/experienceGameLogic.ts'
  )

  const scenarios = [
    { label: '声音侦探', first: 'a', latest: 'b', evaluate: (choice) => choice === 'b' },
    { label: '节奏精灵', first: 1, latest: 0, evaluate: (choice) => choice === 0 },
    { label: '音乐画布', first: 'calm', latest: 'bright' },
  ]

  for (const scenario of scenarios) {
    let decision = createAuditionDecision()
    decision = auditionChoice(scenario.first)
    assert.equal(decision.confirmed, false, `${scenario.label}首次试听不能确认`)
    assert.equal(decision.correct, null, `${scenario.label}首次试听不能判定`)

    decision = auditionChoice(scenario.latest)
    assert.equal(decision.choice, scenario.latest, `${scenario.label}应以最后试听项为准`)
    assert.equal(decision.confirmed, false, `${scenario.label}切换试听仍不能确认`)
    assert.equal(decision.correct, null, `${scenario.label}切换试听仍不能判定`)

    decision = confirmAuditionChoice(decision, scenario.evaluate)
    assert.equal(decision.confirmed, true, `${scenario.label}显式确认后应进入确认态`)
    assert.equal(
      decision.correct,
      scenario.evaluate ? true : null,
      `${scenario.label}确认结果应符合玩法语义`
    )
  }
})

test('声音线索用完整音序表现旋律方向、力度对比和可听见的时值差异', () => {
  const load = createTsLoader()
  const { getSoundChallenges } = load('src/music/experienceGameLogic.ts')

  const lower = getSoundChallenges('primary-1-2')
  const middle = getSoundChallenges('primary-3-4')
  const upper = getSoundChallenges('primary-5-6')
  const length = lower.find((challenge) => challenge.id === 'low-length')
  const middlePitch = middle.find((challenge) => challenge.id === 'middle-pitch')
  const upperPitch = upper.find((challenge) => challenge.id === 'high-register')
  const upperDynamic = upper.find((challenge) => challenge.id === 'high-dynamic')

  assert.ok([...lower, ...middle, ...upper].every((challenge) => challenge.prompt.length > 0))
  assert.ok(length.cues.a[0].waitMs > length.cues.b[0].waitMs * 2)
  assert.equal(length.cues.a[0].patch, 'organ')
  assert.equal(length.cues.b[0].patch, 'organ')
  assert.deepEqual(
    middlePitch.cues.b.map((cue) => cue.note),
    ['C4', 'G4']
  )
  assert.deepEqual(
    upperPitch.cues.b.map((cue) => cue.note),
    ['C4', 'E4', 'G4']
  )
  assert.ok(upperDynamic.cues.a[1].velocity - upperDynamic.cues.a[0].velocity > 0.5)
  assert.equal(upperDynamic.cues.b[0].velocity, upperDynamic.cues.b[1].velocity)
})

test('延迟启动期间快速切换时，只播放最新候选并等待完整音序', async () => {
  const load = createTsLoader()
  const { PlaybackTokenGate, runSoundCueSequence } = load('src/music/experienceGameLogic.ts')
  const gate = new PlaybackTokenGate()
  const emitted = []
  const waited = []
  let resolveFirstStart
  const firstStart = new Promise((resolve) => {
    resolveFirstStart = resolve
  })
  const firstCue = { note: 'C4', duration: '4n', velocity: 0.7, patch: 'piano', waitMs: 620 }
  const secondCues = [
    { note: 'E4', duration: '8n', velocity: 0.7, patch: 'piano', waitMs: 340 },
    { note: 'G4', duration: '8n', velocity: 0.7, patch: 'piano', waitMs: 340 },
  ]

  const firstToken = gate.begin()
  const firstRun = runSoundCueSequence(
    [firstCue],
    firstToken,
    gate,
    () => firstStart,
    (cue) => emitted.push(cue.note),
    async (milliseconds) => {
      waited.push(milliseconds)
    }
  )

  const secondToken = gate.begin()
  const secondRun = runSoundCueSequence(
    secondCues,
    secondToken,
    gate,
    async () => true,
    (cue) => emitted.push(cue.note),
    async (milliseconds) => {
      waited.push(milliseconds)
    }
  )
  resolveFirstStart(true)

  assert.equal(await firstRun, false)
  assert.equal(await secondRun, true)
  assert.deepEqual(emitted, ['E4', 'G4'])
  assert.deepEqual(waited, [340, 340])
})

test('首个音符已经发出后切换候选，旧音序不会继续播放后续音符', async () => {
  const load = createTsLoader()
  const { PlaybackTokenGate, runSoundCueSequence } = load('src/music/experienceGameLogic.ts')
  const gate = new PlaybackTokenGate()
  const emitted = []
  let signalPauseStarted
  let releasePause
  const pauseStarted = new Promise((resolve) => {
    signalPauseStarted = resolve
  })
  const firstPause = () => {
    signalPauseStarted()
    return new Promise((resolve) => {
      releasePause = resolve
    })
  }
  const cues = [
    { note: 'C4', duration: '8n', velocity: 0.7, patch: 'piano', waitMs: 340 },
    { note: 'E4', duration: '8n', velocity: 0.7, patch: 'piano', waitMs: 340 },
  ]

  const firstToken = gate.begin()
  const firstRun = runSoundCueSequence(
    cues,
    firstToken,
    gate,
    async () => true,
    (cue) => emitted.push(cue.note),
    firstPause
  )
  await pauseStarted
  assert.deepEqual(emitted, ['C4'])

  gate.begin()
  releasePause()
  assert.equal(await firstRun, false)
  assert.deepEqual(emitted, ['C4'])
})

test('探险实例 key 会区分学生、精确年级和活动', () => {
  const load = createTsLoader()
  const { buildExperienceInstanceKey } = load('src/music/experienceGameLogic.ts')
  const base = buildExperienceInstanceKey('student-a', 1, 'sound-detective')

  assert.notEqual(base, buildExperienceInstanceKey('student-a', 2, 'sound-detective'))
  assert.notEqual(base, buildExperienceInstanceKey('student-b', 1, 'sound-detective'))
  assert.notEqual(base, buildExperienceInstanceKey('student-a', 1, 'rhythm-sprite'))
  assert.equal(
    buildExperienceInstanceKey(null, null, 'sound-detective'),
    'guest:all:sound-detective'
  )
})

test('节奏评分会报告命中、漏拍、多拍和准确率', () => {
  const load = createTsLoader()
  const { scoreRhythmInput } = load('src/music/experienceGameLogic.ts')

  assert.deepEqual(scoreRhythmInput([true, false, true, false], [true, false, true, false]), {
    hits: 2,
    misses: 0,
    extras: 0,
    accuracy: 1,
    perfect: true,
  })
  assert.deepEqual(scoreRhythmInput([true, false, true, false], [false, true, true, true]), {
    hits: 1,
    misses: 1,
    extras: 2,
    accuracy: 0.25,
    perfect: false,
  })
})

test('音乐画布会按格子更新、限制数量并支持撤销与提交门槛', () => {
  const load = createTsLoader()
  const { upsertCanvasMark, undoCanvasMark, canSubmitCanvas } = load(
    'src/music/experienceGameLogic.ts'
  )
  const first = { row: 0, column: 1, color: '#5b9df9', shape: '●' }
  const replacement = { row: 0, column: 1, color: '#f2994a', shape: '✦' }

  let marks = upsertCanvasMark([], first)
  marks = upsertCanvasMark(marks, replacement)
  assert.equal(marks.length, 1)
  assert.deepEqual(marks[0], replacement)
  assert.equal(canSubmitCanvas(marks, 2), false)
  marks = upsertCanvasMark(marks, { row: 1, column: 2, color: '#55b685', shape: '／' })
  assert.equal(canSubmitCanvas(marks, 2), true)
  assert.deepEqual(undoCanvasMark(marks), [replacement])
})

test('节奏型会按年级和轮次生成稳定的八拍目标', () => {
  const load = createTsLoader()
  const { getRhythmPattern } = load('src/music/experienceGameLogic.ts')

  const lower = getRhythmPattern('primary-1-2', 0)
  const upper = getRhythmPattern('primary-5-6', 0)
  assert.equal(lower.length, 8)
  assert.equal(upper.length, 8)
  assert.notDeepEqual(lower, upper)
  assert.deepEqual(lower, getRhythmPattern('primary-1-2', 0))
})
