import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const read = (file) => fs.readFileSync(path.resolve(file), 'utf8')

test('活动渲染器按互动类型选择通用子组件', () => {
  const source = read('src/components/reference/ReferenceActivityStage.tsx')
  for (const name of [
    'ListenChoiceActivity',
    'InstrumentDetectiveActivity',
    'RhythmBuilderActivity',
    'MovementActivity',
    'ReviewQuestActivity',
  ]) {
    assert.match(source, new RegExp(name))
  }
  assert.match(source, /onStepComplete/)
  assert.match(source, /onEvidence/)
  assert.match(source, /audioUnavailable/)
})

test('听辨活动提供候选试听、确认和无音频反馈', () => {
  const source = read('src/components/reference/ListenChoiceActivity.tsx')
  assert.match(source, /ensureAudio/)
  assert.match(source, /playNote|playSequence/)
  assert.match(source, /候选|试听/)
  assert.match(source, /确定|确认/)
  assert.match(source, /没有发出声音|无音频|继续观察/)
  assert.match(source, /aria-live="polite"/)
})

test('乐器活动显示示例声音、A/B 比较、文化线索和观察保存', () => {
  const source = read('src/components/reference/InstrumentDetectiveActivity.tsx')
  assert.match(source, /示例声音/)
  assert.match(source, /A|B/)
  assert.match(source, /文化|演奏方式/)
  assert.match(source, /onEvidence|onObservation/)
  assert.match(source, /试听/)
})

test('节奏活动支持节奏卡、点击和不重复的 Space 输入', () => {
  const source = read('src/components/reference/RhythmBuilderActivity.tsx')
  assert.match(source, /节奏卡/)
  assert.match(source, /Space/)
  assert.match(source, /event\.repeat/)
  assert.match(source, /onStepComplete|onEvidence/)
})

test('动作活动提供情绪和力度的主观表达选项', () => {
  const source = read('src/components/reference/MovementActivity.tsx')
  assert.match(source, /情绪/)
  assert.match(source, /动作/)
  assert.match(source, /强|弱|渐强|渐弱/)
  assert.match(source, /onEvidence/)
})

test('复习活动显示星级、反馈和总结', () => {
  const source = read('src/components/reference/ReviewQuestActivity.tsx')
  assert.match(source, /星|score|stars/)
  assert.match(source, /反馈|feedback/)
  assert.match(source, /summary|总结/)
  assert.match(source, /onStepComplete/)
})
