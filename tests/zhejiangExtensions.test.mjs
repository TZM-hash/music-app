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

test('浙江拓展素材覆盖地方戏曲、丝竹、民歌和节奏场景', () => {
  const extensions = createTsLoader()('src/music/zhejiangExtensions.ts')

  assert.ok(extensions.ZHEJIANG_EXTENSIONS.length >= 6)
  assert.ok(extensions.ZHEJIANG_EXTENSIONS.some((item) => /越剧/.test(item.title)))
  assert.ok(extensions.ZHEJIANG_EXTENSIONS.some((item) => /丝竹/.test(item.title)))
  assert.ok(extensions.ZHEJIANG_EXTENSIONS.every((item) => item.region === '浙江'))
})

test('拓展素材能根据主题类别和年级稳定选择', () => {
  const load = createTsLoader()
  const extensions = load('src/music/zhejiangExtensions.ts')
  const catalog = load('src/music/theoryCatalog.ts')
  const topic = catalog.THEORY_TOPICS.find((item) => item.id === 'pentatonic-scale')

  const first = extensions.getZhejiangExtension(topic, 5)
  const second = extensions.getZhejiangExtension(topic, 5)

  assert.ok(first)
  assert.equal(first.id, second.id)
  assert.ok(first.grades.includes(5))
  assert.ok(first.connection.length >= 8)
})
