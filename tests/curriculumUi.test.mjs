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

test('音乐探索馆展示教材对照和浙江拓展', () => {
  const theory = read('src/pages/Theory.tsx')

  assert.match(theory, /教材对照/)
  assert.match(theory, /浙江拓展/)
  assert.match(theory, /保存我的发现/)
})

test('顶部全局年级筛选接管探索馆内容范围', () => {
  const topbar = read('src/components/TopBar.tsx')
  const theory = read('src/pages/Theory.tsx')

  assert.match(topbar, /LearningScopeSelector/)
  assert.match(theory, /selectedGrade/)
  assert.doesNotMatch(theory, /title="成长阶段"/)
  assert.doesNotMatch(theory, /title="教材年级"/)
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

test('主要内容页面统一读取顶部全局年级', () => {
  for (const file of [
    'src/pages/Home.tsx',
    'src/pages/CourseCenter.tsx',
    'src/pages/LessonMode.tsx',
    'src/pages/TrainingCenter.tsx',
    'src/pages/AdventureMap.tsx',
    'src/pages/Library.tsx',
  ]) {
    assert.match(read(file), /selectedGrade/, `${file} should use selectedGrade`)
  }
})

test('探索馆左侧分类筛选使用下拉菜单', () => {
  const theory = read('src/pages/Theory.tsx')

  assert.match(theory, /function FilterGroup/)
  assert.match(theory, /<select/)
  assert.match(theory, /title="音乐方向"/)
  assert.match(theory, /title="教材来源"/)
  assert.match(theory, /aria-label=\{`选择\$\{title\}`\}/)
})

test('探索馆无匹配筛选时右侧不会展示旧主题', () => {
  const theory = read('src/pages/Theory.tsx')

  assert.match(theory, /theory-empty-panel/)
  assert.match(theory, /暂时没有匹配的发现卡/)
})

test('探索馆主内容提供知识学习与探索发现分页', () => {
  const theory = read('src/pages/Theory.tsx')

  assert.match(theory, /theory-content-tabs/)
  assert.match(theory, /知识学习/)
  assert.match(theory, /探索发现/)
  assert.match(theory, /activePanel/)
})

test('探索馆蓝色知识点区域使用下拉菜单选择主题', () => {
  const theory = read('src/pages/Theory.tsx')

  assert.match(theory, /aria-label="选择知识点"/)
  assert.match(theory, /topic-select/)
  assert.doesNotMatch(theory, /className=\{topic\.id === active\.id \? 'on' : ''\}/)
})
