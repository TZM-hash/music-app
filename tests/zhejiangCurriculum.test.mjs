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
    new Function('module', 'exports', 'require', transpiled)(module, module.exports, localRequire)
    return module.exports
  }
  return load
}

test('浙江人音版教材骨架覆盖小学 1-6 年级和上下册', () => {
  const curriculum = createTsLoader()('src/music/zhejiangCurriculum.ts')

  assert.deepEqual(curriculum.PRIMARY_GRADES, [1, 2, 3, 4, 5, 6])
  assert.equal(curriculum.ZHEJIANG_RENYIN_UNITS.length, 36)
  for (const grade of curriculum.PRIMARY_GRADES) {
    const units = curriculum.getCurriculumUnits(grade)
    assert.equal(units.length, 6)
    assert.ok(units.some((unit) => unit.semester === 1))
    assert.ok(units.some((unit) => unit.semester === 2))
  }
})

test('理论主题注入教材对照，初中主题保留为教材外拓展', () => {
  const catalog = createTsLoader()('src/music/theoryCatalog.ts')
  const primary = catalog.THEORY_TOPICS.filter((topic) => topic.stage.startsWith('primary-'))
  const junior = catalog.THEORY_TOPICS.filter((topic) => topic.stage.startsWith('junior-'))

  assert.ok(primary.length > 0)
  assert.ok(junior.length > 0)
  assert.ok(primary.every((topic) => topic.curriculum?.edition === 'zhejiang-renyin'))
  assert.ok(primary.every((topic) => topic.curriculum?.source === 'textbook'))
  assert.ok(junior.every((topic) => topic.curriculum?.source === 'extension'))
  assert.ok(primary.some((topic) => topic.curriculum.grades.includes(1)))
  assert.ok(primary.some((topic) => topic.curriculum.grades.includes(6)))
})

test('理论主题支持按教材年级和来源筛选', () => {
  const catalog = createTsLoader()('src/music/theoryCatalog.ts')
  const gradeOne = catalog.filterTheoryTopics({ grade: 1 })
  const gradeSix = catalog.filterTheoryTopics({ grade: 6 })
  const extensions = catalog.filterTheoryTopics({ source: 'extension' })

  assert.ok(gradeOne.length >= 5)
  assert.ok(gradeSix.length >= 5)
  assert.ok(gradeOne.every((topic) => topic.curriculum.grades.includes(1)))
  assert.ok(gradeSix.every((topic) => topic.curriculum.grades.includes(6)))
  assert.ok(extensions.length > 0)
  assert.ok(extensions.every((topic) => topic.curriculum.source === 'extension'))
})
