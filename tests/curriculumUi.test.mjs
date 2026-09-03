import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const read = (file) => fs.readFileSync(path.resolve(file), 'utf8')

test('首页用当前学生年级推荐探索卡并显示我的发现', () => {
  const home = read('src/pages/Home.tsx')

  assert.match(home, /recommendExplorationTopic/)
  assert.match(home, /探索卡片/)
  assert.match(home, /我的发现/)
  assert.match(home, /loadMusicDiscoveries/)
})

test('音乐探索馆展示教材对照、年级筛选和浙江拓展', () => {
  const theory = read('src/pages/Theory.tsx')

  assert.match(theory, /教材年级/)
  assert.match(theory, /教材对照/)
  assert.match(theory, /浙江拓展/)
  assert.match(theory, /保存我的发现/)
})

test('学段总览和名册明确支持浙江人音版小学 1-6 年级', () => {
  const course = read('src/pages/CourseCenter.tsx')
  const roster = read('src/pages/ClassRoster.tsx')

  assert.match(course, /浙江人音版小学音乐/)
  assert.match(course, /PRIMARY_GRADES/)
  assert.match(course, /getGradeLabel/)
  assert.doesNotMatch(course, /初中基础|初中进阶/)
  assert.match(roster, /年级/)
  assert.match(roster, /册次/)
})
