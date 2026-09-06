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

test('阶段四新增五个浙江及节日主题探索单元', () => {
  const units = createTsLoader()('src/music/explorationUnits.ts')
  const ids = units.EXPLORATION_UNITS.map((unit) => unit.id)

  for (const id of [
    'spring-festival-overture',
    'jiangnan-sizhu',
    'yue-opera',
    'liang-zhu',
    'dragon-boat-rhythm',
  ]) {
    assert.ok(ids.includes(id), `missing exploration unit: ${id}`)
  }

  const extensions = units.EXPLORATION_UNITS.filter((unit) => unit.source === 'extension')
  assert.equal(extensions.length, 5)
  assert.ok(extensions.every((unit) => unit.paths.length === 4))
  assert.ok(extensions.every((unit) => unit.paths.every((item) => item.choices.length >= 3)))
  assert.ok(extensions.every((unit) => unit.evidence.options.length === 2))
  assert.ok(extensions.every((unit) => unit.tools?.length))
})

test('阶段四主题拥有可试听的课堂示范音型和不同工具数据', () => {
  const load = createTsLoader()
  const units = load('src/music/explorationUnits.ts')
  const audio = load('src/music/explorationAudio.ts')

  for (const unit of units.EXPLORATION_UNITS.filter((item) => item.source === 'extension')) {
    const melody = audio.getSongMelody(unit.songId)
    const flowing = audio.getEvidenceVariant(unit.id, 'flowing')
    const jumping = audio.getEvidenceVariant(unit.id, 'jumping')
    assert.ok(melody.length >= 8, unit.id)
    assert.ok(flowing.length > 0, unit.id)
    assert.equal(jumping.length, flowing.length, unit.id)
    assert.notDeepEqual(jumping.map((cue) => cue.note), flowing.map((cue) => cue.note), unit.id)
    assert.ok(unit.toolData?.instrumentSamples?.length >= 2, unit.id)
    assert.ok(unit.toolData?.rhythmPattern?.steps.length >= 4, unit.id)
  }
})

test('首页推荐会按年级进入对应主题，未选年级保留茉莉花兼容入口', () => {
  const { getRecommendedExplorationUnit } = createTsLoader()('src/music/explorationUnits.ts')

  assert.equal(getRecommendedExplorationUnit().id, 'jasmine')
  assert.equal(getRecommendedExplorationUnit(1).id, 'dragon-boat-rhythm')
  assert.notEqual(getRecommendedExplorationUnit(5).id, 'jasmine')
})

test('课程中心和浙江拓展目录已接入新增文化内容', () => {
  const course = fs.readFileSync(path.resolve('src/pages/CourseCenter.tsx'), 'utf8')
  const extensions = createTsLoader()('src/music/zhejiangExtensions.ts')

  assert.match(course, /EXPLORATION_UNITS/)
  assert.match(course, /unitToWork/)
  for (const title of ['春节序曲', '江南丝竹', '越剧', '梁祝']) {
    assert.ok(extensions.ZHEJIANG_EXTENSIONS.some((item) => item.title.includes(title)), title)
  }
})
