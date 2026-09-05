import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const readSource = (filePath) => fs.readFileSync(path.resolve(filePath), 'utf8')
const sectionBetween = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start + startMarker.length)
  assert.ok(start >= 0 && end > start, `找不到源码区段：${startMarker} → ${endMarker}`)
  return source.slice(start, end)
}

test('玩乐中心展示三种音乐探险玩法并使用当前学生年级', () => {
  const source = readSource('src/pages/TrainingCenter.tsx')

  assert.match(source, /MusicExperienceStage/)
  assert.match(source, /getRecommendedActivities/)
  assert.match(source, /buildExperienceJourney/)
  assert.match(source, /getCurrentStudent/)
  assert.match(source, /今日玩乐/)
  assert.match(source, /activity\.title/)
  assert.match(source, /training-experience-door/)
  assert.match(source, /key=\{buildExperienceInstanceKey\(/)
})

test('旧挑战路由仍然保留在更多练习入口', () => {
  const source = readSource('src/pages/TrainingCenter.tsx')

  for (const route of ['game-ear', 'game-read', 'game-sing', 'game-taiko', 'game-echo']) {
    assert.match(source, new RegExp(`route: '${route}'`))
  }
  assert.match(source, /更多练习/)
})

test('浙江声景活动明确标记为教材拓展', () => {
  const source = readSource('src/music/experienceActivities.ts')

  assert.match(source, /越剧声腔/)
  assert.match(source, /龙舟鼓点/)
  assert.match(source, /西湖水乡/)
  assert.match(source, /source: 'extension'/)
})

test('音乐探险舞台提供活动专属玩法和可恢复的交互控件', () => {
  const source = readSource('src/components/MusicExperienceStage.tsx')

  assert.match(source, /getSoundChallenges/)
  assert.match(source, /playRhythmPattern/)
  assert.match(source, /canSubmitCanvas/)
  assert.match(source, /experience-sound-game/)
  assert.match(source, /experience-rhythm-game/)
  assert.match(source, /experience-canvas-game/)
  assert.match(source, /重置本局/)
  assert.match(source, /确定选择/)
  assert.match(source, /播放作品/)
  assert.match(source, /撤销/)
  assert.match(source, /aria-live="polite"/)
})

test('节奏网格暴露选中状态并支持整组键盘操作', () => {
  const source = readSource('src/components/MusicExperienceStage.tsx')

  assert.match(source, /aria-pressed=\{input\[index\]\}/)
  assert.match(source, /event\.key !== ' ' && event\.key !== 'Enter'/)
})

test('三个找一找游戏都把候选试听和确定判定分开', () => {
  const source = readSource('src/components/MusicExperienceStage.tsx')

  for (const handler of [
    'previewSoundAnswer',
    'confirmSoundAnswer',
    'previewRhythmChoice',
    'confirmRhythmChoice',
    'previewCanvasMood',
    'confirmCanvasMood',
  ]) {
    assert.match(source, new RegExp(`const ${handler}`))
  }
  assert.equal(source.match(/确定选择/g)?.length, 3)
  assert.match(source, /playRhythmPattern/)
  assert.match(source, /CANVAS_MOOD_AUDIO/)
  assert.match(source, /soundChallenge\.prompt/)
})

test('三个候选流程的 preview 只试听，confirm 才可能完成找一找', () => {
  const source = readSource('src/components/MusicExperienceStage.tsx')
  const flows = [
    ['previewSoundAnswer', 'confirmSoundAnswer', 'handleFreePlay'],
    ['previewRhythmChoice', 'confirmRhythmChoice', 'toggleRhythmCreateCell'],
    ['previewCanvasMood', 'confirmCanvasMood', 'handleCanvasCell'],
  ]

  for (const [previewName, confirmName, afterConfirmName] of flows) {
    const preview = sectionBetween(source, `const ${previewName}`, `const ${confirmName}`)
    const confirm = sectionBetween(source, `const ${confirmName}`, `const ${afterConfirmName}`)
    assert.match(preview, /auditionChoice\(/, `${previewName} 应进入未确认试听态`)
    assert.doesNotMatch(preview, /completeStep\('find'\)/, `${previewName} 不得完成找一找`)
    assert.match(confirm, /confirmAuditionChoice\(/, `${confirmName} 应显式确认当前选择`)
    assert.match(confirm, /completeStep\('find'\)/, `${confirmName} 才可完成找一找`)
  }
})

test('候选试听支持中断旧播放并完整等待音符时值', () => {
  const source = readSource('src/components/MusicExperienceStage.tsx')

  assert.match(source, /stopAllAudio/)
  assert.match(source, /PlaybackTokenGate/)
  assert.match(source, /runSoundCueSequence/)
  assert.doesNotMatch(source, /if \(isPlaying \|\| !soundChallenge/)
})

test('五步旅程在桌面端使用五列步骤导航', () => {
  const css = readSource('src/components/musicExperience.css')

  assert.match(css, /\.experience-stepper\s*\{[^}]*repeat\(5,/s)
  assert.doesNotMatch(css, /\.experience-stepper\s*\{[^}]*repeat\(6,/s)
})

test('音乐探险舞台不再渲染或完成动一动步骤', () => {
  const source = readSource('src/components/MusicExperienceStage.tsx')

  assert.doesNotMatch(source, /activeStep\.id === 'move'/)
  assert.doesNotMatch(source, /completeStep\('move'\)/)
  assert.doesNotMatch(source, /跟着拍一遍/)
})
