import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const read = (file) => fs.readFileSync(path.resolve(file), 'utf8')

test('音乐显微镜声明数据边界并提供 A/B 试听与片段时间线', () => {
  const source = read('src/components/MusicMicroscope.tsx')
  assert.match(source, /export interface MusicMicroscopeProps/)
  for (const prop of ['cues', 'evidenceLabels', 'onNote', 'onReturn']) {
    assert.match(source, new RegExp(`\\b${prop}\\b`))
  }
  assert.match(source, /flowing/)
  assert.match(source, /jumping/)
  assert.match(source, /timeline|时间线/)
  assert.match(source, /markedCueIndex|markedIndex/)
  assert.match(source, /aria-pressed=/)
})

test('音乐显微镜沿用音频 helper、播放令牌和无音频降级', () => {
  const source = read('src/components/MusicMicroscope.tsx')
  for (const helper of ['ensureAudio', 'playNote', 'stopAllAudio']) {
    assert.match(source, new RegExp(helper))
  }
  assert.match(source, /tokenRef/)
  assert.match(source, /audioUnavailable/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /设备暂时没有发出声音，但仍可以继续选择、比较和保存发现/)
})

test('音乐显微镜支持证据切换、保存观察和回到作品再听', () => {
  const source = read('src/components/MusicMicroscope.tsx')
  assert.match(source, /getToolFeedback/)
  assert.match(source, /onNote\(/)
  assert.match(source, /onReturn\(/)
  assert.match(source, /回到作品再听/)
  assert.match(source, /保存我的观察/)
  assert.match(source, /观察|observation/)
})

test('音乐显微镜样式只定义桌面三栏工具，不添加移动断点', () => {
  const styles = read('src/components/explorationTools.css')
  assert.match(styles, /\.music-microscope\s*\{/) 
  assert.match(styles, /grid-template-columns:\s*minmax\(180px, 0\.8fr\)\s+minmax\(420px, 1\.8fr\)\s+minmax\(220px, 0\.9fr\)/)
  assert.match(styles, /\.music-microscope__timeline/)
  assert.match(styles, /\.music-microscope__observation/)
  assert.doesNotMatch(styles, /@media\s*\(max-width:/)
})
