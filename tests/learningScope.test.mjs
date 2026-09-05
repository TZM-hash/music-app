import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function createTsLoader() {
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
  return load
}

test('学习范围按年级和班级筛选学生，并兼容旧名册', () => {
  const { matchesLearningScope } = createTsLoader()('src/state/learningScope.ts')
  const roster = [
    { id: 'a', grade: 2, className: '一班' },
    { id: 'b', grade: 2, className: '二班' },
    { id: 'c', grade: 3 },
  ]

  assert.deepEqual(
    roster.filter((student) => matchesLearningScope(student, { grade: 2, className: '二班' })).map((student) => student.id),
    ['b']
  )
  assert.equal(matchesLearningScope(roster[2], { grade: 3, className: '一班' }), true)
})

test('班级下拉选项包含默认班级和名册中的自定义班级', () => {
  const { classOptionsForRoster } = createTsLoader()('src/state/learningScope.ts')
  const options = classOptionsForRoster([
    { grade: 1, className: '一班' },
    { grade: 1, className: '音乐社' },
  ], 1)

  assert.ok(options.includes('一班'))
  assert.ok(options.includes('音乐社'))
})

test('百科内容可以按全局年级筛选', () => {
  const load = createTsLoader()
  const { filterEncyclopediaEntries } = load('src/music/encyclopedia.ts')
  const entries = filterEncyclopediaEntries({ grade: 1 })

  assert.ok(entries.length > 0)
  assert.ok(entries.every((entry) => entry.stage === 'primary-lower'))
})

test('顶部提供年级班级选择，探索馆不再重复显示年级和成长阶段筛选', () => {
  const read = (filePath) => fs.readFileSync(path.resolve(filePath), 'utf8')
  const topbar = read('src/components/TopBar.tsx')
  const theory = read('src/pages/Theory.tsx')
  const selector = read('src/components/LearningScopeSelector.tsx')

  assert.match(topbar, /LearningScopeSelector/)
  assert.match(selector, /选择年级/)
  assert.match(selector, /选择班级/)
  assert.match(theory, /selectedGrade/)
  assert.doesNotMatch(theory, /title="成长阶段"/)
  assert.doesNotMatch(theory, /title="教材年级"/)
})
