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

test('探索工具目录和茉莉花样板数据提供可消费的纯数据', () => {
  const load = createTsLoader()
  const tools = load('src/music/explorationTools.ts')
  const ids = tools.EXPLORATION_TOOL_CATALOG.map((tool) => tool.id)

  assert.deepEqual(ids, ['microscope', 'instrument', 'rhythm'])
  assert.ok(tools.JASMINE_MICROSCOPE_CUES.length >= 3)
  assert.ok(tools.JASMINE_INSTRUMENT_SAMPLES.length >= 2)
  assert.ok(tools.JASMINE_RHYTHM_PATTERN.steps.length >= 4)
  assert.ok(tools.JASMINE_MICROSCOPE_CUES.every((cue) => cue.note && cue.beats > 0 && cue.patch))
  assert.ok(
    tools.JASMINE_INSTRUMENT_SAMPLES.every(
      (sample) => sample.id && sample.label && sample.instrument && sample.family && sample.cue
    )
  )
  assert.ok(
    tools.JASMINE_RHYTHM_PATTERN.steps.every(
      (step) => typeof step.beats === 'number' && step.beats > 0 && step.label
    )
  )
})

test('工具反馈按观察角度给出短提示且不否定主观反应', () => {
  const load = createTsLoader()
  const { getToolFeedback } = load('src/music/explorationTools.ts')

  for (const toolId of ['microscope', 'instrument', 'rhythm']) {
    const feedback = getToolFeedback(toolId, ['旋律', '音色'])
    assert.ok(feedback.length > 0)
    assert.ok(feedback.length <= 160)
    assert.doesNotMatch(feedback, /错误|不对|错了|应该选择/)
  }
  assert.equal(getToolFeedback('unknown', []), '')
})

test('工具观察记录会过滤、裁剪、去重并限制数量', () => {
  const load = createTsLoader()
  const { normalizeToolNotes } = load('src/music/explorationTools.ts')
  const longObservation = '观'.repeat(200)
  const notes = normalizeToolNotes([
    {
      toolId: 'microscope',
      observation: `  ${longObservation}  `,
      evidence: ['旋律', '旋律', '音色', '', null],
    },
    { toolId: 'instrument', observation: '  音色变得更明亮  ', evidence: ['明亮'] },
    { toolId: 'rhythm', observation: '拍点正在靠近', evidence: ['稳定'] },
    { toolId: 'unknown', observation: '忽略我', evidence: ['无效'] },
  ])

  assert.equal(notes.length, 3)
  assert.equal(notes[0].observation.length, 160)
  assert.deepEqual(notes[0].evidence, ['旋律', '音色'])
  assert.equal(normalizeToolNotes({ toolId: 'microscope' }), undefined)
})
