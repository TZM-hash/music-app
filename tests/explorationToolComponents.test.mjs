import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const read = (file) => fs.readFileSync(path.resolve(file), 'utf8')

test('乐器探秘台声明样本边界并支持音色、家族与 A/B 比较', () => {
  const source = read('src/components/InstrumentExplorer.tsx')
  assert.match(source, /export interface InstrumentExplorerProps/)
  for (const prop of ['samples', 'onNote', 'onReturn']) assert.match(source, new RegExp(`\\b${prop}\\b`))
  assert.match(source, /InstrumentSample/)
  assert.match(source, /texture/)
  assert.match(source, /family/)
  assert.match(source, /comparison|比较|A\s*\/\s*B/)
  assert.match(source, /最多选择两个|slice\(0, 2\)/)
  assert.match(source, /cultureNote/)
  assert.match(source, /合成样本|合成音色样本/)
})

test('乐器探秘台可用键盘和按钮试听，并提供无音频降级、保存和返回', () => {
  const source = read('src/components/InstrumentExplorer.tsx')
  for (const helper of ['ensureAudio', 'playNote', 'stopAllAudio']) assert.match(source, new RegExp(helper))
  assert.match(source, /className="instrument-explorer__play" onClick=/)
  assert.match(source, /<button type="button" className="instrument-explorer__play"/)
  assert.doesNotMatch(source, /className="instrument-explorer__play"[\s\S]{0,300}onKeyDown/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /audioUnavailable/)
  assert.match(source, /设备暂时没有发出声音/)
  assert.match(source, /onNote\(/)
  assert.match(source, /onReturn\(\)/)
  assert.match(source, /保存我的观察/)
  assert.match(source, /回到作品再听/)
})

test('节奏与动作工作台提供稳定拍时间线、Space 去重和鼠标记录', () => {
  const source = read('src/components/RhythmMovementLab.tsx')
  assert.match(source, /export interface RhythmMovementLabProps/)
  assert.match(source, /RhythmPattern/)
  assert.match(source, /stableBeat|稳定拍|beatTimeline/)
  assert.match(source, /onKeyDown/)
  assert.match(source, /event\.code === 'Space'/)
  assert.match(source, /event\.repeat/)
  assert.match(source, /onClick/)
  assert.match(source, /tapTimes|tapRecords|clickTimes/)
})

test('节奏与动作工作台允许动作词，只输出观察性反馈并支持保存返回', () => {
  const source = read('src/components/RhythmMovementLab.tsx')
  for (const word of ['走', '跳', '摇', '停', '推', '拉']) assert.match(source, new RegExp(word))
  assert.match(source, /很稳定/)
  assert.match(source, /正在靠近/)
  assert.match(source, /可以再听/)
  assert.doesNotMatch(source, /正确|错误|不对|答对|答错/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /onNote\(/)
  assert.match(source, /onReturn\(\)/)
  assert.match(source, /保存我的观察/)
  assert.match(source, /回到作品再听/)
})

test('探索工具样式只增加桌面乐器和节奏工作台布局', () => {
  const styles = read('src/components/explorationTools.css')
  assert.match(styles, /\.instrument-explorer\s*\{/)
  assert.match(styles, /\.rhythm-movement-lab\s*\{/)
  assert.doesNotMatch(styles, /@media\s*\(max-width:/)
})
