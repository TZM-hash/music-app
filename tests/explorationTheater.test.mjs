import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(relativePath), 'utf8')
}

test('探索剧场呈现六个学习阶段并包含核心追问', () => {
  const source = readSource('src/components/ExplorationTheater.tsx')
  for (const stage of ['listen', 'express', 'evidence', 'concept', 'relisten', 'reflect']) {
    assert.match(source, new RegExp(stage))
  }
  assert.match(source, /你是从音乐的哪里听出来的/)
  assert.match(source, /保存我的音乐发现/)
  assert.match(source, /aria-live="polite"/)
})

test('探索剧场包含试听、确认、再听和无音频降级路径', () => {
  const source = readSource('src/components/ExplorationTheater.tsx')
  assert.match(source, /ensureAudio/)
  assert.match(source, /playNote/)
  assert.match(source, /stopAllAudio/)
  assert.match(source, /audioUnavailable/)
  assert.match(source, /再听一次/)
  assert.match(source, /evidenceId/)
  assert.match(source, /relistenChoice/)
})

test('探索剧场使用观察性反馈而不是统一审美答案', () => {
  const source = readSource('src/components/ExplorationTheater.tsx')
  assert.match(source, /因为/)
  assert.match(source, /再听/)
  assert.doesNotMatch(source, /审美正确|你的感受是错误的/)
})
