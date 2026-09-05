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

test('更多入口常驻展示，乐器入口恢复为独立可折叠分组', () => {
  const nav = readSource('src/components/studentNavigation.ts')
  const sidebar = readSource('src/components/Sidebar.tsx')

  assert.match(sidebar, /<div className="side-more-group">/)
  assert.doesNotMatch(sidebar, /<details className="side-more-group">/)
  assert.match(sidebar, /更多入口/)
  assert.match(sidebar, /<details[\s\S]*className="side-instrument-group"/)
  assert.match(sidebar, /STUDENT_INSTRUMENT_NAV/)

  for (const [route, label] of [
    ['piano', '钢琴'],
    ['drums', '架子鼓'],
    ['recorder', '竖笛'],
    ['xylophone', '木琴'],
  ]) {
    assert.match(nav, new RegExp(`route:\\s*['"]${route}['"]`))
    assert.match(nav, new RegExp(`label:\\s*['"]${label}['"]`))
  }
})

test('侧栏移除教师空间及学生档案、成长观察入口', () => {
  const nav = readSource('src/components/studentNavigation.ts')
  const sidebar = readSource('src/components/Sidebar.tsx')
  const secondaryItems = nav.match(/STUDENT_SECONDARY_NAV[^=]*=\s*\[([\s\S]*?)\]/)?.[1] ?? ''

  assert.doesNotMatch(sidebar, /教师空间/)
  assert.doesNotMatch(sidebar, /学生档案/)
  assert.doesNotMatch(sidebar, /成长观察/)
  assert.doesNotMatch(sidebar, /TEACHER_ITEMS/)
  assert.doesNotMatch(secondaryItems, /route:\s*['"]course['"]/)
})
