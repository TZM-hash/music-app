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
      if (specifier.endsWith('.mp3')) return { __esModule: true, default: 'data:audio/mpeg;base64,AA==' }
      if (specifier.startsWith('.')) return load(path.resolve(path.dirname(resolved), specifier))
      return require(specifier)
    }
    new Function('module', 'exports', 'require', transpiled)(module, module.exports, localRequire)
    return module.exports
  }
  return load
}

test('参考资源只暴露项目相对路径并默认按需加载', () => {
  const load = createTsLoader()
  const assets = load('src/music/referenceAssets.ts')
  const instrument = assets.getReferenceAsset('g1/forest/clappers')

  assert.ok(instrument)
  assert.equal(instrument.kind, 'audio')
  assert.equal(instrument.preload, 'none')
  assert.match(instrument.src, /^data:audio\/mpeg/)
  assert.doesNotMatch(instrument.src, /E:|人音版小学音乐/)
})

test('活动资源可以按活动 ID取得，缺失资源不会抛异常', () => {
  const load = createTsLoader()
  const assets = load('src/music/referenceAssets.ts')

  assert.ok(assets.getActivityAssets('g1-clappers-activity').length >= 1)
  assert.ok(assets.getActivityAssets('g3-music-emotion-activity').length >= 1)
  assert.deepEqual(assets.getActivityAssets('unknown-activity'), [])
  assert.equal(assets.getReferenceAsset('missing'), undefined)
})
