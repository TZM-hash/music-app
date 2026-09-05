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

test('茉莉花探索单元提供四条路径、音乐证据和二次聆听内容', () => {
  const load = createTsLoader()
  const { JASMINE_EXPLORATION_UNIT } = load('src/music/explorationUnits.ts')

  assert.equal(JASMINE_EXPLORATION_UNIT.id, 'jasmine')
  assert.equal(JASMINE_EXPLORATION_UNIT.songId, 'jasmine')
  assert.match(JASMINE_EXPLORATION_UNIT.title, /江南/)
  assert.equal(JASMINE_EXPLORATION_UNIT.question, '一朵花，为什么能唱出江南的味道？')
  assert.deepEqual(
    JASMINE_EXPLORATION_UNIT.paths.map((path) => path.id),
    ['emotion', 'movement', 'story', 'culture']
  )
  assert.ok(JASMINE_EXPLORATION_UNIT.evidence.options.length >= 2)
  assert.ok(
    JASMINE_EXPLORATION_UNIT.evidence.options.every(
      (option) => option.feedback && option.conceptId && typeof option.isBest === 'boolean'
    )
  )
  assert.ok(JASMINE_EXPLORATION_UNIT.concepts.length >= 3)
  assert.ok(JASMINE_EXPLORATION_UNIT.concepts.some((concept) => /级进|平稳/.test(concept.body)))
  assert.ok(JASMINE_EXPLORATION_UNIT.concepts.some((concept) => /音色/.test(concept.body)))
  assert.ok(JASMINE_EXPLORATION_UNIT.concepts.some((concept) => /五声音阶|地域/.test(concept.body)))
  assert.match(JASMINE_EXPLORATION_UNIT.culture.title, /江苏|茉莉花/)
  assert.match(JASMINE_EXPLORATION_UNIT.culture.body, /地域|江苏/)
  assert.match(JASMINE_EXPLORATION_UNIT.relisten.prompt, /再听|听到/)
  assert.ok(JASMINE_EXPLORATION_UNIT.relisten.choices.length >= 3)
  assert.ok(
    JASMINE_EXPLORATION_UNIT.relisten.choices.every((choice) => choice.label.length > 0)
  )
})

test('探索单元按年级映射低中高三种支架', () => {
  const load = createTsLoader()
  const { getExplorationAgeBand } = load('src/music/explorationUnits.ts')

  assert.equal(getExplorationAgeBand(1), 'primary-1-2')
  assert.equal(getExplorationAgeBand(4), 'primary-3-4')
  assert.equal(getExplorationAgeBand(6), 'primary-5-6')
  assert.equal(getExplorationAgeBand(undefined), 'primary-1-2')
  assert.equal(getExplorationAgeBand(null), 'primary-1-2')
  assert.equal(getExplorationAgeBand(0), 'primary-1-2')
  assert.equal(getExplorationAgeBand(7), 'primary-1-2')
})

test('未知探索单元回退到茉莉花', () => {
  const load = createTsLoader()
  const { JASMINE_EXPLORATION_UNIT, EXPLORATION_UNITS, getExplorationUnit } = load(
    'src/music/explorationUnits.ts'
  )

  assert.equal(getExplorationUnit().id, 'jasmine')
  assert.equal(getExplorationUnit('missing'), JASMINE_EXPLORATION_UNIT)
  assert.equal(EXPLORATION_UNITS[0], JASMINE_EXPLORATION_UNIT)
})

test('四条路径至少提供三个选择且课程主题 id 均为字符串', () => {
  const load = createTsLoader()
  const { JASMINE_EXPLORATION_UNIT } = load('src/music/explorationUnits.ts')

  assert.ok(JASMINE_EXPLORATION_UNIT.paths.every((path) => path.choices.length >= 3))
  assert.ok(JASMINE_EXPLORATION_UNIT.curriculumTopicIds.length > 0)
  assert.ok(JASMINE_EXPLORATION_UNIT.curriculumTopicIds.every((id) => typeof id === 'string'))
})
