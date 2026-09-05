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

function installStorage() {
  const values = new Map()
  const previous = globalThis.localStorage
  globalThis.localStorage = {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
    removeItem(key) {
      values.delete(key)
    },
  }
  return {
    get: (key) => values.get(key),
    restore: () => {
      globalThis.localStorage = previous
    },
  }
}

test('exploration sessions advance in fixed order and only complete at reflect after a relisten choice', () => {
  const load = createTsLoader()
  const {
    createExplorationSession,
    advanceExplorationStage,
    updateExplorationSession,
    isExplorationComplete,
  } = load('src/state/explorationSessions.ts')

  let session = createExplorationSession('jasmine', ' student-1 ', 4, 100)
  assert.equal(session.stage, 'listen')
  assert.equal(session.studentId, 'student-1')
  assert.equal(session.grade, 4)
  assert.equal(advanceExplorationStage(session, 'evidence', 200), session)
  assert.equal(advanceExplorationStage(session, 'unknown', 200), session)
  assert.equal(advanceExplorationStage(session, 'listen', 200), session)

  for (const stage of ['express', 'evidence', 'concept', 'relisten', 'reflect']) {
    session = advanceExplorationStage(session, stage, session.updatedAt + 1)
  }
  assert.equal(session.stage, 'reflect')
  assert.equal(isExplorationComplete(session), false)
  assert.equal(session.completedAt, undefined)

  session = updateExplorationSession(session, { relistenChoice: 'new-clue' }, 300)
  assert.equal(session.relistenChoice, 'new-clue')
  assert.equal(session.completedAt, 300)
  assert.equal(isExplorationComplete(session), true)
})

test('response updates preserve subjective choices and normalize known fields', () => {
  const load = createTsLoader()
  const { createExplorationSession, updateExplorationSession } = load(
    'src/state/explorationSessions.ts'
  )
  const session = updateExplorationSession(
    createExplorationSession('jasmine', 'student-1', 3, 100),
    {
      firstFeelingId: ' gentle ',
      pathId: 'story',
      expressionId: ' river ',
      evidenceId: ' flowing ',
      conceptIds: [' melody ', 'melody', 'timbre', '', 42],
      relistenChoice: 'change',
      relistenReflection: ` ${'a'.repeat(300)} `,
      ignored: 'value',
    },
    200
  )

  assert.equal(session.firstFeelingId, 'gentle')
  assert.equal(session.pathId, 'story')
  assert.equal(session.expressionId, 'river')
  assert.equal(session.evidenceId, 'flowing')
  assert.deepEqual(session.conceptIds, ['melody', 'timbre'])
  assert.equal(session.relistenChoice, 'change')
  assert.equal(session.relistenReflection.length, 240)
  assert.equal(session.ignored, undefined)
  assert.equal(session.updatedAt, 200)
})

test('changing path clears the old expression selection for the express stage', () => {
  const load = createTsLoader()
  const { createExplorationSession, updateExplorationSession } = load(
    'src/state/explorationSessions.ts'
  )

  let session = updateExplorationSession(createExplorationSession('jasmine', 'student-1', 3, 100), {
    firstFeelingId: 'bright',
    pathId: 'emotion',
    expressionId: 'warm',
  }, 200)
  assert.equal(Boolean(session.firstFeelingId && session.pathId && session.expressionId), true)

  session = updateExplorationSession(session, { pathId: 'movement' }, 300)

  assert.equal(session.pathId, 'movement')
  assert.equal(session.expressionId, undefined)
  assert.equal(session.firstFeelingId, 'bright')
  assert.equal(Boolean(session.firstFeelingId && session.pathId && session.expressionId), false)
})

test('exploration progress stays within bounds and completed sessions report one', () => {
  const load = createTsLoader()
  const {
    createExplorationSession,
    advanceExplorationStage,
    updateExplorationSession,
    getExplorationProgress,
    isExplorationComplete,
  } = load('src/state/explorationSessions.ts')
  let session = createExplorationSession('jasmine', 'student-1', 2, 100)
  assert.equal(getExplorationProgress(session), 0)
  session = advanceExplorationStage(session, 'express', 200)
  assert.equal(getExplorationProgress(session), 1 / 6)
  assert.equal(getExplorationProgress({ ...session, stage: 'not-a-stage' }), 0)
  session = advanceExplorationStage(session, 'evidence', 300)
  assert.equal(advanceExplorationStage(session, 'express', 350), session)
  session = advanceExplorationStage(session, 'concept', 400)
  session = advanceExplorationStage(session, 'relisten', 500)
  session = updateExplorationSession(session, { relistenChoice: 'keep' }, 600)
  session = advanceExplorationStage(session, 'reflect', 700)
  assert.equal(getExplorationProgress(session), 1)
  assert.equal(session.completedAt, 700)
  assert.equal(isExplorationComplete(session), true)
})

test('sessions persist by student and unit while anonymous sessions remain in memory', () => {
  const storage = installStorage()
  try {
    const load = createTsLoader()
    const {
      createExplorationSession,
      loadExplorationSession,
      saveExplorationSession,
      clearExplorationSession,
    } = load('src/state/explorationSessions.ts')

    assert.equal(storage.get('music-edu-exploration-sessions-v1'), undefined)
    saveExplorationSession(createExplorationSession('anonymous', null, null, 400))
    assert.equal(storage.get('music-edu-exploration-sessions-v1'), undefined)

    saveExplorationSession(createExplorationSession('jasmine', 'student-1', 4, 100))
    saveExplorationSession(createExplorationSession('other', 'student-1', 4, 200))
    saveExplorationSession(createExplorationSession('jasmine', 'student-2', 5, 300))

    assert.equal(loadExplorationSession('student-1', 'jasmine').startedAt, 100)
    assert.equal(loadExplorationSession('student-1', 'other').startedAt, 200)
    assert.equal(loadExplorationSession('student-2', 'jasmine').startedAt, 300)
    assert.equal(loadExplorationSession(null, 'anonymous'), null)

    clearExplorationSession('student-1', 'jasmine')
    assert.equal(loadExplorationSession('student-1', 'jasmine'), null)
    assert.equal(loadExplorationSession('student-1', 'other').startedAt, 200)
    assert.equal(loadExplorationSession('student-2', 'jasmine').startedAt, 300)
    assert.ok(storage.get('music-edu-exploration-sessions-v1'))
  } finally {
    storage.restore()
  }
})

test('missing localStorage does not throw and returns default values', () => {
  const previous = globalThis.localStorage
  const hadStorage = Object.prototype.hasOwnProperty.call(globalThis, 'localStorage')
  delete globalThis.localStorage
  try {
    const load = createTsLoader()
    const {
      createExplorationSession,
      loadExplorationSession,
      saveExplorationSession,
      clearExplorationSession,
    } = load('src/state/explorationSessions.ts')
    assert.equal(loadExplorationSession('student-1', 'jasmine'), null)
    assert.doesNotThrow(() =>
      saveExplorationSession(createExplorationSession('jasmine', 'student-1', 4, 100))
    )
    assert.doesNotThrow(() => clearExplorationSession('student-1', 'jasmine'))
    assert.equal(loadExplorationSession('student-1', 'jasmine'), null)
  } finally {
    if (hadStorage) globalThis.localStorage = previous
    else delete globalThis.localStorage
  }
})

test('malformed storage data and records return null without throwing', () => {
  const storage = installStorage()
  try {
    const load = createTsLoader()
    const { loadExplorationSession, clearExplorationSession } = load(
      'src/state/explorationSessions.ts'
    )
    globalThis.localStorage.setItem('music-edu-exploration-sessions-v1', '{not json')
    assert.equal(loadExplorationSession('student-1', 'jasmine'), null)
    assert.doesNotThrow(() => clearExplorationSession('student-1', 'jasmine'))

    globalThis.localStorage.setItem(
      'music-edu-exploration-sessions-v1',
      JSON.stringify([
        { studentId: 'student-1', unitId: 'jasmine', updatedAt: 1 },
        { studentId: 'student-1', unitId: 'jasmine', stage: 'listen' },
        { studentId: 'student-1', unitId: 'jasmine', stage: 'invalid', updatedAt: 1 },
      ])
    )
    assert.equal(loadExplorationSession('student-1', 'jasmine'), null)
  } finally {
    storage.restore()
  }
})
