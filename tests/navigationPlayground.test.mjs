import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const readSource = (filePath) => fs.readFileSync(path.resolve(filePath), 'utf8')

test('学生导航收拢为今日、探索、玩乐、我的四个主入口', () => {
  const nav = readSource('src/components/studentNavigation.ts')
  const sidebar = readSource('src/components/Sidebar.tsx')

  for (const label of ['今日', '探索', '玩乐', '我的']) assert.match(nav, new RegExp(label))
  assert.match(sidebar, /STUDENT_PRIMARY_NAV/)
  assert.doesNotMatch(sidebar, /班级对战|route:\s*['"]battle['"]/)
})

test('窄屏提供同一组四项底部导航', () => {
  const mobileNav = readSource('src/components/MobileNav.tsx')
  const app = readSource('src/App.tsx')

  assert.match(mobileNav, /STUDENT_PRIMARY_NAV/)
  assert.match(mobileNav, /mobile-nav/)
  assert.match(app, /<MobileNav\s*\/>/)
})

test('首页保留探索卡并增加今日音乐探险的三个入口', () => {
  const home = readSource('src/pages/Home.tsx')

  assert.match(home, /今日音乐探险/)
  assert.match(home, /home-playground/)
  assert.match(home, /EXPERIENCE_ACTIVITIES/)
  assert.match(home, /activity\.title/)
  assert.match(home, /className="pro-recommend card"/)
})
