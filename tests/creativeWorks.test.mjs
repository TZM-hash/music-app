import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

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

test('createCreativeWork turns a mixer draft into a student work record', () => {
  const { createCreativeWork } = createTsLoader()('src/state/creativeWorks.ts')

  const work = createCreativeWork(
    {
      title: '我的节奏',
      source: 'mixer',
      studentId: 'stu-1',
      summary: '3 条音轨，12 个触发点',
      reflection: '我想做一个有跳跃感的节奏',
      abilityTags: ['creating', 'rhythm'],
      snapshot: { bpm: 120 },
    },
    1000,
    2
  )

  assert.equal(work.id, 'work-1000-2')
  assert.equal(work.title, '我的节奏')
  assert.deepEqual(work.abilityTags, ['creating', 'rhythm'])
  assert.equal(work.studentId, 'stu-1')
})

test('addCreativeWork keeps the newest works first and limits the list', () => {
  const { addCreativeWorkToList } = createTsLoader()('src/state/creativeWorks.ts')
  const existing = Array.from({ length: 24 }, (_, index) => ({
    id: `old-${index}`,
    title: `旧作品 ${index}`,
    source: 'mixer',
    studentId: null,
    summary: '旧作品',
    reflection: '',
    abilityTags: ['creating'],
    snapshot: {},
    createdAt: index,
  }))
  const next = {
    id: 'new-work',
    title: '新作品',
    source: 'mixer',
    studentId: null,
    summary: '新作品',
    reflection: '',
    abilityTags: ['creating'],
    snapshot: {},
    createdAt: 99,
  }

  const list = addCreativeWorkToList(existing, next)

  assert.equal(list.length, 24)
  assert.equal(list[0].id, 'new-work')
  assert.equal(list.at(-1).id, 'old-22')
})

test('buildCreativePortfolio summarizes latest works and ability tags', () => {
  const { buildCreativePortfolio } = createTsLoader()('src/state/creativeWorks.ts')
  const works = [
    {
      id: 'older',
      title: '节奏开场',
      source: 'mixer',
      studentId: 'stu-1',
      summary: '2 条音轨',
      reflection: '像开场',
      abilityTags: ['creating', 'rhythm'],
      snapshot: {},
      createdAt: 100,
    },
    {
      id: 'newer',
      title: '听感发现',
      source: 'theory',
      studentId: 'stu-1',
      summary: '完成音高探险',
      reflection: '我听到上行',
      abilityTags: ['listening', 'creating'],
      snapshot: {},
      createdAt: 200,
    },
  ]

  const portfolio = buildCreativePortfolio(works)

  assert.equal(portfolio.totalWorks, 2)
  assert.equal(portfolio.featuredWork.id, 'newer')
  assert.deepEqual(portfolio.latestWorks.map((work) => work.id), ['newer', 'older'])
  assert.deepEqual(
    portfolio.abilityChips.map((chip) => [chip.id, chip.label, chip.count]),
    [
      ['creating', '创作表达', 2],
      ['listening', '听感力', 1],
      ['rhythm', '节奏力', 1],
    ]
  )
  assert.deepEqual(
    portfolio.sourceChips.map((chip) => [chip.source, chip.label, chip.count]),
    [
      ['theory', '探索发现', 1],
      ['mixer', '混音创作', 1],
    ]
  )
  assert.match(portfolio.headline, /2 个音乐作品/)
})

test('buildCreativePortfolio returns a friendly empty state', () => {
  const { buildCreativePortfolio } = createTsLoader()('src/state/creativeWorks.ts')

  const portfolio = buildCreativePortfolio([])

  assert.equal(portfolio.totalWorks, 0)
  assert.equal(portfolio.latestWorks.length, 0)
  assert.equal(portfolio.featuredWork, null)
  assert.match(portfolio.headline, /第一段音乐作品/)
})
