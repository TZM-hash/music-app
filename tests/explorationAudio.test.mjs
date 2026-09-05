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

const audio = () => createTsLoader()('src/music/explorationAudio.ts')

test('茉莉花旋律非空、无休止符并包含完整音频提示字段', () => {
  const { getSongMelody } = audio()
  const melody = getSongMelody('jasmine')

  assert.ok(melody.length > 0)
  assert.ok(melody.every((cue) => cue.note !== 'rest'))
  assert.ok(melody.every((cue) => cue.note && cue.beats > 0 && cue.velocity > 0 && cue.patch))
  assert.deepEqual(getSongMelody('unknown-song'), [])
})

test('茉莉花片段按可演奏旋律切出八个提示', () => {
  const { getSongMelody, getSongFragment } = audio()
  const melody = getSongMelody('jasmine')
  const fragment = getSongFragment('jasmine', 0, 8)

  assert.equal(fragment.length, 8)
  assert.ok(fragment.length < melody.length)
})

test('片段边界会限制在可用范围且结束位置早于开始位置时为空', () => {
  const { getSongMelody, getSongFragment } = audio()
  const melody = getSongMelody('jasmine')

  assert.equal(getSongFragment('jasmine', -4, 3).length, 3)
  assert.equal(getSongFragment('jasmine', 0, melody.length + 4).length, melody.length)
  assert.deepEqual(getSongFragment('jasmine', 4, 2), [])
})

test('茉莉花流动与跳跃证据变体长度相同但音符序列不同', () => {
  const { getEvidenceVariant } = audio()
  const flowing = getEvidenceVariant('jasmine', 'flowing')
  const jumping = getEvidenceVariant('jasmine', 'jumping')

  assert.ok(flowing.length > 0)
  assert.equal(jumping.length, flowing.length)
  assert.notDeepEqual(
    jumping.map((cue) => cue.note),
    flowing.map((cue) => cue.note)
  )
  assert.deepEqual(
    jumping.map((cue) => cue.beats),
    flowing.map((cue) => cue.beats)
  )
})

test('未知证据单元和无效变体回退到流动的茉莉花片段', () => {
  const { getEvidenceVariant } = audio()
  const flowing = getEvidenceVariant('jasmine', 'flowing')

  assert.deepEqual(getEvidenceVariant('unknown-unit', 'flowing'), flowing)
  assert.deepEqual(getEvidenceVariant('jasmine', 'invalid-variant'), flowing)
})

test('旋律、片段和两种证据变体的返回结果相互独立', () => {
  const { getSongMelody, getSongFragment, getEvidenceVariant } = audio()
  const melody = getSongMelody('jasmine')
  const fragment = getSongFragment('jasmine', 0, 8)
  const flowing = getEvidenceVariant('jasmine', 'flowing')
  const jumping = getEvidenceVariant('jasmine', 'jumping')
  const melodyLength = melody.length
  const fragmentLength = fragment.length
  const flowingLength = flowing.length
  const jumpingLength = jumping.length

  melody.pop()
  melody[0].note = 'C9'
  fragment.pop()
  fragment[0].note = 'D9'
  flowing.pop()
  flowing[0].note = 'E9'
  jumping.pop()
  jumping[0].note = 'F9'

  assert.equal(getSongMelody('jasmine').length, melodyLength)
  assert.equal(getSongMelody('jasmine')[0].note, 'E4')
  assert.equal(getSongFragment('jasmine', 0, 8).length, fragmentLength)
  assert.equal(getSongFragment('jasmine', 0, 8)[0].note, 'E4')
  assert.equal(getEvidenceVariant('jasmine', 'flowing').length, flowingLength)
  assert.equal(getEvidenceVariant('jasmine', 'flowing')[0].note, 'E4')
  assert.equal(getEvidenceVariant('jasmine', 'jumping').length, jumpingLength)
  assert.equal(getEvidenceVariant('jasmine', 'jumping')[0].note, 'E4')
})

test('提示时长按拍数换算并处理无效速度与短拍', () => {
  const { getCueDurationMs } = audio()
  const cue = { note: 'C4', beats: 1, velocity: 0.8, patch: 'piano' }

  assert.equal(getCueDurationMs(cue, 60), 1000)
  assert.equal(getCueDurationMs({ ...cue, beats: 0 }, Number.NaN), 125)
  assert.ok(getCueDurationMs({ ...cue, beats: 0.25 }, 0) > 0)
})
