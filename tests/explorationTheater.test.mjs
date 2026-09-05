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
  assert.match(source, /getSongFragment/)
  assert.match(source, /getEvidenceVariant/)
  assert.match(source, /getCueDurationMs/)
  assert.match(source, /loadExplorationSession/)
  assert.match(source, /createExplorationSession/)
  assert.match(source, /updateExplorationSession/)
  assert.match(source, /advanceExplorationStage/)
  assert.match(source, /saveExplorationSession/)
  assert.match(source, /saveMusicDiscovery/)
})

test('探索剧场声明完整 props 和响应式三栏布局契约', () => {
  const component = readSource('src/components/ExplorationTheater.tsx')
  const styles = readSource('src/components/explorationTheater.css')
  assert.match(component, /export interface ExplorationTheaterProps/)
  for (const prop of ['unit', 'studentId', 'grade', 'onExit', 'onComplete']) {
    assert.match(component, new RegExp(`\\b${prop}\\b`))
  }
  assert.match(component, /aria-current=/)
  assert.match(component, /disabled=/)
  assert.match(component, /aria-pressed=/)
  assert.match(component, /role="status"/)
  assert.match(styles, /\.exploration-theater\s*\{/)
  assert.match(styles, /grid-template-columns:\s*174px\s+minmax\(0, 1fr\)\s+210px/)
  assert.match(styles, /@media\s*\(max-width:\s*720px\)/)
  assert.match(styles, /\.exploration-theater__layout\s*\{[\s\S]*?display:\s*block/)
})

test('探索剧场使用观察性反馈而不是统一审美答案', () => {
  const source = readSource('src/components/ExplorationTheater.tsx')
  assert.match(source, /因为/)
  assert.match(source, /再听/)
  assert.doesNotMatch(source, /审美正确|你的感受是错误的/)
})

test('探索剧场恢复反思、支持回退修订并隔离切换单元后的播放', () => {
  const source = readSource('src/components/ExplorationTheater.tsx')

  assert.match(source, /setReflection\(restored\?\.relistenReflection \?\? ''\)/)
  assert.match(source, /relistenReflection:\s*reflection/)
  assert.match(source, /goToPreviousStage/)
  assert.match(source, />\s*上一步\s*</)
  assert.match(source, /onClick=\{\(\) => goToStage\(stage\.id\)\}/)
  assert.match(source, /completedAt:\s*undefined/)
  assert.match(
    source,
    /const goToStage[\s\S]*?savedRef\.current = false[\s\S]*?setSaveNotice\(''\)/
  )
  assert.match(
    source,
    /useEffect\(\(\) => \{[\s\S]*?tokenRef\.current \+= 1[\s\S]*?stopAllAudio\(\)[\s\S]*?setIsPlaying\(false\)[\s\S]*?return \(\) => \{[\s\S]*?tokenRef\.current \+= 1[\s\S]*?stopAllAudio\(\)[\s\S]*?\}\s*\}, \[unit\.id\]\)/
  )
})
