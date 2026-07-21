// progress.ts 单元测试：进度读写、recordResult 徽章逻辑、内存缓存失效、legacy 迁移
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test, beforeEach } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

// —— 内存版 localStorage 桩（progress/students 等模块通过全局 localStorage 访问）——
function makeLocalStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)) },
    removeItem: (k) => { map.delete(k) },
    clear: () => map.clear(),
    _map: map,
  }
}
globalThis.localStorage = makeLocalStorage()

function createTsLoader() {
  const cache = new Map()
  const load = (filePath) => {
    const resolved = path.resolve(filePath.endsWith('.ts') ? filePath : `${filePath}.ts`)
    if (cache.has(resolved)) return cache.get(resolved).exports
    const source = fs.readFileSync(resolved, 'utf8')
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText
    const module = { exports: {} }
    cache.set(resolved, module)
    const localRequire = (specifier) => {
      if (specifier.startsWith('.')) return load(path.resolve(path.dirname(resolved), specifier))
      return require(specifier)
    }
    const fn = new Function('module', 'exports', 'require', transpiled)
    fn(module, module.exports, localRequire)
    return module.exports
  }
  return load
}

// 所有测试共用同一模块实例（模块级缓存），每个测试前清空 localStorage
const progress = createTsLoader()('src/state/progress.ts')

beforeEach(() => {
  globalThis.localStorage.clear()
})

test('loadProgress 对未知学生返回空白进度', () => {
  const p = progress.loadProgress('stu-x')
  assert.deepEqual(p, { stars: {}, bestScores: {}, playCount: 0, badges: [] })
})

test('saveProgress / loadProgress 往返一致', () => {
  progress.saveProgress(
    { stars: { 'game-ear': { 1: 3 } }, bestScores: { 'game-ear': 500 }, playCount: 2, badges: ['first-play'] },
    'stu-a'
  )
  const p = progress.loadProgress('stu-a')
  assert.equal(p.stars['game-ear'][1], 3)
  assert.equal(p.bestScores['game-ear'], 500)
  assert.equal(p.playCount, 2)
  assert.deepEqual(p.badges, ['first-play'])
})

test('recordResult 累计次数、刷新最高星/分并授予徽章', () => {
  const r1 = progress.recordResult('game-ear', 1, 2, 300, { accuracy: 0.75 })
  assert.equal(r1.progress.playCount, 1)
  assert.equal(r1.progress.stars['game-ear'][1], 2)
  assert.equal(r1.progress.bestScores['game-ear'], 300)
  assert.ok(r1.isNewBest)
  assert.ok(r1.newBadges.includes('first-play'))

  // 第二次：低分不刷新纪录，3 星授予 perfect
  const r2 = progress.recordResult('game-ear', 1, 3, 200)
  assert.equal(r2.progress.playCount, 2)
  assert.equal(r2.progress.stars['game-ear'][1], 3, '星数取历史最高')
  assert.equal(r2.progress.bestScores['game-ear'], 300, '低分不覆盖最高分')
  assert.equal(r2.isNewBest, false)
  assert.ok(r2.newBadges.includes('perfect'))
  assert.ok(!r2.newBadges.includes('first-play'), '已获得的徽章不重复授予')
})

test('缓存失效：外部直接改写 localStorage（模拟备份导入）后能读到新数据', () => {
  progress.saveProgress({ stars: {}, bestScores: {}, playCount: 1, badges: [] }, 'stu-b')
  assert.equal(progress.loadProgress('stu-b').playCount, 1)

  // 绕过 progress 模块直接改 localStorage（importClassroomBackup 就是这么做的）
  const raw = JSON.parse(globalThis.localStorage.getItem('music-edu-progress-by-student-v1'))
  raw['stu-b'].playCount = 99
  globalThis.localStorage.setItem('music-edu-progress-by-student-v1', JSON.stringify(raw))

  assert.equal(progress.loadProgress('stu-b').playCount, 99, '字符串变化后缓存应失效')
})

test('缓存命中：字符串未变时不重复解析（行为一致性验证）', () => {
  progress.saveProgress({ stars: {}, bestScores: {}, playCount: 5, badges: [] }, 'stu-c')
  const a = progress.loadProgress('stu-c')
  const b = progress.loadProgress('stu-c')
  assert.equal(a.playCount, 5)
  assert.equal(b.playCount, 5)
})

test('removeStudentProgress 删除指定学生且不影响其他学生', () => {
  progress.saveProgress({ stars: {}, bestScores: {}, playCount: 1, badges: [] }, 'stu-d')
  progress.saveProgress({ stars: {}, bestScores: {}, playCount: 2, badges: [] }, 'stu-e')
  progress.removeStudentProgress('stu-d')
  assert.equal(progress.loadProgress('stu-d').playCount, 0)
  assert.equal(progress.loadProgress('stu-e').playCount, 2)
})

test('legacy 迁移：旧版单份进度迁入匿名域并删除旧 key', () => {
  globalThis.localStorage.setItem(
    'music-edu-progress-v1',
    JSON.stringify({ stars: { 'game-ear': { 1: 2 } }, bestScores: { 'game-ear': 123 }, playCount: 7, badges: ['first-play'] })
  )
  const p = progress.loadProgress(null)
  assert.equal(p.playCount, 7)
  assert.equal(p.bestScores['game-ear'], 123)
  assert.equal(globalThis.localStorage.getItem('music-edu-progress-v1'), null, 'legacy key 应被删除')
  assert.ok(globalThis.localStorage.getItem('music-edu-progress-by-student-v1'), '新 store 应已写入')
})
