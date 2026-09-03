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

test('体验会话记录唯一步骤并将进度限制在 0 到 1', () => {
  const load = createTsLoader()
  const {
    createExperienceSession,
    recordExperienceStep,
    getExperienceProgress,
    isExperienceComplete,
  } = load('src/state/experienceSessions.ts')

  let session = createExperienceSession('sound-detective')
  session = recordExperienceStep(session, 'listen')
  session = recordExperienceStep(session, 'listen')
  session = recordExperienceStep(session, 'share')

  assert.deepEqual(session.completedStepIds, ['listen', 'share'])
  assert.equal(getExperienceProgress(session, 6), 2 / 6)
  assert.equal(isExperienceComplete(session, 2), true)
  assert.equal(getExperienceProgress(session, 0), 0)
})

test('重置会话会保留活动标识但清空步骤', () => {
  const load = createTsLoader()
  const { createExperienceSession, recordExperienceStep, resetExperienceSession } = load('src/state/experienceSessions.ts')

  const session = recordExperienceStep(createExperienceSession('music-canvas'), 'create')
  const reset = resetExperienceSession(session)

  assert.equal(reset.activityId, 'music-canvas')
  assert.deepEqual(reset.completedStepIds, [])
})

test('只有带学生 ID 的会话才允许写入个人发现', () => {
  const load = createTsLoader()
  const { canPersistExperience } = load('src/state/experienceSessions.ts')

  assert.equal(canPersistExperience('student-1'), true)
  assert.equal(canPersistExperience(''), false)
  assert.equal(canPersistExperience(null), false)
  assert.equal(canPersistExperience(undefined), false)
})

