import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const readSource = (filePath) => fs.readFileSync(path.resolve(filePath), 'utf8')

test('班级对战不再作为可进入的应用功能', () => {
  const app = readSource('src/App.tsx')
  const sidebar = readSource('src/components/Sidebar.tsx')

  assert.doesNotMatch(app, /TeamBattle/)
  assert.doesNotMatch(app, /displayedRoute === ['"]battle['"]|route === ['"]battle['"]/)
  assert.doesNotMatch(sidebar, /route:\s*['"]battle['"]|班级对战/)
})

test('首页把声谱、成长轨道、徽章和 KPI 收拢为本次进度卡片', () => {
  const home = readSource('src/pages/Home.tsx')

  assert.match(home, /className="home-progress-card card"/)
  assert.match(home, /<h2[^>]*>本次进度<\/h2>/)
  assert.match(home, /className="home-progress-stats"/)
  assert.match(home, /className="home-progress-spectrum"/)
  assert.match(home, /className="home-progress-growth"/)
  assert.match(home, /className="home-progress-badges"/)

  assert.doesNotMatch(home, /className="pro-status"/)
  assert.doesNotMatch(home, /className="badge-shelf compact"/)
  assert.doesNotMatch(home, /className="home-lab-panel card spectrum-panel"/)
  assert.doesNotMatch(home, /className="home-lab-panel card growth-panel"/)
})

test('首页采用任务驱动结构并保留探索卡片', () => {
  const home = readSource('src/pages/Home.tsx')

  assert.match(home, /className="pro-recommend card"/)
  assert.match(home, /className="review-rail card today-task-card"/)
  assert.match(home, /今日任务/)
  assert.match(home, /className="portfolio-panel card home-recent-work"/)

  assert.doesNotMatch(home, /className="home-lab-panel card command-panel"/)
  assert.doesNotMatch(home, /className="home-entry-panel card"/)
  assert.doesNotMatch(home, /className="hero-status-grid"/)
  assert.doesNotMatch(home, /className="lesson-flow-mini"/)
})
