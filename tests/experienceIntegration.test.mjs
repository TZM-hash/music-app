import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const readSource = (filePath) => fs.readFileSync(path.resolve(filePath), 'utf8')

test('玩乐中心展示三种音乐探险玩法并使用当前学生年级', () => {
  const source = readSource('src/pages/TrainingCenter.tsx')

  assert.match(source, /MusicExperienceStage/)
  assert.match(source, /getRecommendedActivities/)
  assert.match(source, /buildExperienceJourney/)
  assert.match(source, /getCurrentStudent/)
  assert.match(source, /今日玩乐/)
  assert.match(source, /activity\.title/)
  assert.match(source, /training-experience-door/)
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
