import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test, beforeEach } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function makeLocalStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  }
}

function loadDiscoveries() {
  const sourcePath = path.resolve('src/state/discoveries.ts')
  const source = fs.readFileSync(sourcePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const module = { exports: {} }
  new Function('module', 'exports', 'require', transpiled)(module, module.exports, require)
  return module.exports
}

beforeEach(() => {
  globalThis.localStorage = makeLocalStorage()
})

test('我的音乐发现按学生隔离并按最新时间排序', () => {
  const discoveries = loadDiscoveries()
  discoveries.saveMusicDiscovery({
    studentId: 'stu-a',
    topicId: 'steady-beat',
    title: '稳定拍',
    statement: '我发现脚步要一直走。',
    grade: 2,
  }, 100)
  discoveries.saveMusicDiscovery({
    studentId: 'stu-a',
    topicId: 'pitch-up-down',
    title: '音的高低',
    statement: '我发现旋律会向上走。',
    grade: 2,
  }, 200)
  discoveries.saveMusicDiscovery({
    studentId: 'stu-b',
    topicId: 'sound-four-properties',
    title: '声音的四个要素',
    statement: '我发现声音有不同的样子。',
    grade: 1,
  }, 300)

  const own = discoveries.loadMusicDiscoveries('stu-a')
  assert.equal(own.length, 2)
  assert.equal(own[0].topicId, 'pitch-up-down')
  assert.equal(discoveries.loadMusicDiscoveries('stu-b').length, 1)
  assert.equal(discoveries.loadMusicDiscoveries('stu-c').length, 0)
})

test('发现摘要提供数量、最近记录和友好文案', () => {
  const discoveries = loadDiscoveries()
  discoveries.saveMusicDiscovery({
    studentId: 'stu-a',
    topicId: 'pentatonic-scale',
    title: '五声音阶',
    statement: '五个音也能写出旋律。',
    source: 'textbook',
  }, 500)

  const summary = discoveries.buildDiscoverySummary(discoveries.loadMusicDiscoveries('stu-a'))
  assert.equal(summary.total, 1)
  assert.equal(summary.latest[0].title, '五声音阶')
  assert.match(summary.headline, /1|发现/)
})

test('删除学生时可以级联清理发现记录', () => {
  const discoveries = loadDiscoveries()
  discoveries.saveMusicDiscovery({
    studentId: 'stu-a',
    topicId: 'steady-beat',
    title: '稳定拍',
    statement: '我能跟着拍点走。',
  }, 100)
  discoveries.saveMusicDiscovery({
    studentId: 'stu-b',
    topicId: 'tempo-basic',
    title: '速度',
    statement: '我能听出快慢。',
  }, 200)

  discoveries.removeStudentDiscoveries('stu-a')
  assert.equal(discoveries.loadMusicDiscoveries('stu-a').length, 0)
  assert.equal(discoveries.loadMusicDiscoveries('stu-b').length, 1)
})
