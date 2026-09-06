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

test('课程中心桌面端展示作品地图和可筛选的茉莉花作品卡', () => {
  const course = read('src/pages/CourseCenter.tsx')
  const css = read('src/pages/course.css')

  assert.match(course, /作品地图/)
  assert.match(course, /当前年级|current-grade/)
  for (const label of ['作品', '来源', '路径', '标签']) assert.match(course, new RegExp(label))
  assert.match(course, /茉莉花/)
  assert.match(course, /音乐显微镜|乐器探秘台/)
  assert.match(course, /开始探索/)
  assert.match(course, /查看音乐线索/)
  assert.match(course, /没有匹配的作品|暂无匹配作品/)
  assert.match(course, /教师支持/)
  assert.match(css, /course-works-map/)
  assert.match(css, /course-filter-rail/)
  assert.match(css, /course-work-detail/)
  assert.match(css, /@media \(min-width: 1024px\)/)
  const desktopStyles = css.slice(css.indexOf('@media (min-width: 1024px)'))
  assert.match(desktopStyles, /\.course-works-map\s*\{[\s\S]*grid-template-columns/)
  assert.doesNotMatch(css.slice(0, css.indexOf('@media (min-width: 1024px)')), /\.course-works-map/)
})

test('课程中心保留旧学段课程入口并直接进入对应课堂', () => {
  const course = read('src/pages/CourseCenter.tsx')

  assert.match(course, /COURSES/)
  assert.match(course, /小学低段：听见高低长短/)
  assert.match(course, /小学中段：读懂谱面基本信息/)
  assert.match(course, /小学高段：连接旋律、节奏与调式/)
  assert.match(course, /进入这个学段的课堂/)
  assert.match(course, /openLesson\(activeCourse\.id\)/)
  assert.match(course, /openTheory\(\{ stage: activeCourse\.id \}\)/)
})

test('作品地图选择全部年级后摘要和空状态重置保持全部年级', () => {
  const course = read('src/pages/CourseCenter.tsx')

  assert.match(course, /displayedGrade = gradeFilter === 'all' \? null : gradeFilter/)
  assert.match(course, /displayedGrade\s*\?\s*`\$\{getGradeLabel\(displayedGrade\)\}/)
  assert.match(course, /setGradeFilter\(gradeFilter\)/)
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

test('互动课堂以探索剧场承载当前年级并保留教师支持入口', () => {
  const lesson = read('src/pages/LessonMode.tsx')

  assert.match(lesson, /ExplorationTheater/)
  assert.match(lesson, /getGradeLabel/)
  assert.match(lesson, /今日探索|探索剧场/)
  assert.match(lesson, /navigate\('course'\)/)
  assert.match(lesson, /navigate\('training'\)/)
  assert.match(lesson, /navigate\('theory'\)/)
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
