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
  const cache = new Map()
  const load = (filePath) => {
    const resolved = path.resolve(filePath.endsWith('.ts') ? filePath : `${filePath}.ts`)
    if (cache.has(resolved)) return cache.get(resolved).exports
    const source = fs.readFileSync(resolved, 'utf8')
    const transpiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText
    const module = { exports: {} }
    cache.set(resolved, module)
    const localRequire = (specifier) => {
      if (specifier.startsWith('.')) return load(path.resolve(path.dirname(resolved), specifier))
      return require(specifier)
    }
    new Function('module', 'exports', 'require', transpiled)(module, module.exports, localRequire)
    return module.exports
  }
  return load('src/state/discoveries.ts')
}

beforeEach(() => {
  globalThis.localStorage = makeLocalStorage()
})

test('我的音乐发现按学生隔离并按最新时间排序', () => {
  const discoveries = loadDiscoveries()
  discoveries.saveMusicDiscovery(
    {
      studentId: 'stu-a',
      topicId: 'steady-beat',
      title: '稳定拍',
      statement: '我发现脚步要一直走。',
      grade: 2,
    },
    100
  )
  discoveries.saveMusicDiscovery(
    {
      studentId: 'stu-a',
      topicId: 'pitch-up-down',
      title: '音的高低',
      statement: '我发现旋律会向上走。',
      grade: 2,
    },
    200
  )
  discoveries.saveMusicDiscovery(
    {
      studentId: 'stu-b',
      topicId: 'sound-four-properties',
      title: '声音的四个要素',
      statement: '我发现声音有不同的样子。',
      grade: 1,
    },
    300
  )

  const own = discoveries.loadMusicDiscoveries('stu-a')
  assert.equal(own.length, 2)
  assert.equal(own[0].topicId, 'pitch-up-down')
  assert.equal(discoveries.loadMusicDiscoveries('stu-b').length, 1)
  assert.equal(discoveries.loadMusicDiscoveries('stu-c').length, 0)
})

test('发现摘要提供数量、最近记录和友好文案', () => {
  const discoveries = loadDiscoveries()
  discoveries.saveMusicDiscovery(
    {
      studentId: 'stu-a',
      topicId: 'pentatonic-scale',
      title: '五声音阶',
      statement: '五个音也能写出旋律。',
      source: 'textbook',
    },
    500
  )

  const summary = discoveries.buildDiscoverySummary(discoveries.loadMusicDiscoveries('stu-a'))
  assert.equal(summary.total, 1)
  assert.equal(summary.latest[0].title, '五声音阶')
  assert.match(summary.headline, /1|发现/)
})

test('删除学生时可以级联清理发现记录', () => {
  const discoveries = loadDiscoveries()
  discoveries.saveMusicDiscovery(
    {
      studentId: 'stu-a',
      topicId: 'steady-beat',
      title: '稳定拍',
      statement: '我能跟着拍点走。',
    },
    100
  )
  discoveries.saveMusicDiscovery(
    {
      studentId: 'stu-b',
      topicId: 'tempo-basic',
      title: '速度',
      statement: '我能听出快慢。',
    },
    200
  )

  discoveries.removeStudentDiscoveries('stu-a')
  assert.equal(discoveries.loadMusicDiscoveries('stu-a').length, 0)
  assert.equal(discoveries.loadMusicDiscoveries('stu-b').length, 1)
})

test('探索发现卡保存感受、路径、音乐证据和二次聆听变化', () => {
  const discoveries = loadDiscoveries()
  discoveries.saveMusicDiscovery(
    {
      studentId: 'stu-a',
      unitId: 'jasmine',
      topicId: 'pentatonic-scale',
      title: '茉莉花 · 江南的味道',
      statement: '我从平稳的旋律里听到温柔。',
      path: 'emotion',
      firstFeeling: '温柔',
      evidence: ['级进', '音色柔和'],
      concepts: ['旋律', '五声音阶'],
      relistenChoice: 'new-clue',
      relistenReflection: '第二次听到了旋律里的五个音。',
    },
    600
  )

  const [saved] = discoveries.loadMusicDiscoveries('stu-a')
  assert.equal(saved.unitId, 'jasmine')
  assert.deepEqual(saved.evidence, ['级进', '音色柔和'])
  assert.equal(saved.relistenChoice, 'new-clue')
})

test('旧发现记录没有新增字段时仍然可以读取', () => {
  globalThis.localStorage.setItem(
    'music-edu-discoveries-v1',
    JSON.stringify([
      {
        id: 'legacy-1',
        studentId: 'stu-old',
        topicId: 'steady-beat',
        title: '稳定拍',
        statement: '我能跟着拍点走。',
        createdAt: 100,
      },
    ])
  )
  const discoveries = loadDiscoveries()
  const [legacy] = discoveries.loadMusicDiscoveries('stu-old')
  assert.equal(legacy.title, '稳定拍')
  assert.equal(legacy.unitId, undefined)
  assert.equal(legacy.toolNotes, undefined)
  assert.equal(legacy.cultureOpened, undefined)
})

test('发现卡保存可选的文化换镜开启状态', () => {
  const discoveries = loadDiscoveries()
  discoveries.saveMusicDiscovery(
    {
      topicId: 'pentatonic-scale',
      title: '文化换镜',
      statement: '我带着江南水乡的线索又听了一次。',
      cultureOpened: true,
    },
    650
  )

  const [saved] = discoveries.loadMusicDiscoveries()
  assert.equal(saved.cultureOpened, true)
})

test('发现卡保存有界的工具观察记录', () => {
  const discoveries = loadDiscoveries()
  const longObservation = '观察'.repeat(100)
  discoveries.saveMusicDiscovery(
    {
      topicId: 'pentatonic-scale',
      title: '工具观察',
      statement: '我找到了声音线索。',
      toolNotes: [
        {
          toolId: 'microscope',
          observation: longObservation,
          evidence: ['旋律', '旋律', '音色', '级进', '多余'],
        },
        { toolId: 'instrument', observation: '音色更亮', evidence: ['音色'] },
        { toolId: 'rhythm', observation: '拍点稳定', evidence: ['节奏'] },
        { toolId: 'unknown', observation: '不应保存', evidence: ['无效'] },
      ],
    },
    700
  )

  const [saved] = discoveries.loadMusicDiscoveries()
  assert.equal(saved.toolNotes.length, 3)
  assert.equal(saved.toolNotes[0].observation.length, 160)
  assert.deepEqual(saved.toolNotes[0].evidence, ['旋律', '音色', '级进', '多余'])
  assert.equal(saved.toolNotes[1].toolId, 'instrument')
  assert.equal(saved.toolNotes[2].toolId, 'rhythm')
})

test('教师观察分析汇总感受、证据、路径和二次聆听', () => {
  const discoveries = loadDiscoveries()
  const analytics = discoveries.buildDiscoveryAnalytics([
    {
      id: 'one',
      studentId: 'stu-a',
      topicId: 'jasmine',
      title: '一',
      statement: '我听到了流动。',
      path: 'emotion',
      firstFeeling: '温柔',
      evidence: ['级进', '旋律'],
      relistenChoice: 'new-clue',
      toolNotes: [{ toolId: 'microscope', observation: '', evidence: [] }],
      tags: [],
      createdAt: 1,
    },
    {
      id: 'two',
      studentId: 'stu-b',
      topicId: 'jasmine',
      title: '二',
      statement: '我想摇一摇。',
      path: 'movement',
      firstFeeling: '温柔',
      evidence: ['节奏'],
      cultureOpened: true,
      tags: [],
      createdAt: 2,
    },
  ])

  assert.equal(analytics.total, 2)
  assert.equal(analytics.studentCount, 2)
  assert.equal(analytics.pathCounts.emotion, 1)
  assert.equal(analytics.pathCounts.movement, 1)
  assert.equal(analytics.feelingCounts['温柔'], 2)
  assert.equal(analytics.evidenceCounts['级进'], 1)
  assert.equal(analytics.withRelisten, 1)
  assert.equal(analytics.cultureOpened, 1)
  assert.equal(analytics.toolCounts.microscope, 1)
})
