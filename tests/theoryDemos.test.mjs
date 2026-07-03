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

test('every theory demo kind has an interactive scene', () => {
  const loadTsModule = createTsLoader()
  const catalog = loadTsModule('src/music/theoryCatalog.ts')
  const demos = loadTsModule('src/music/theoryDemos.ts')
  const kinds = Array.from(new Set(catalog.THEORY_TOPICS.map((topic) => topic.demo.kind)))

  assert.ok(kinds.length >= 10)
  for (const kind of kinds) {
    const scene = demos.getDemoScene(kind)
    assert.equal(scene.kind, kind)
    assert.ok(scene.title.length >= 2, `${kind} needs a title`)
    assert.ok(scene.prompt.length >= 8, `${kind} needs a classroom prompt`)
    assert.ok(scene.controls.length >= 3, `${kind} needs at least three controls`)
    assert.ok(scene.observations.length >= 2, `${kind} needs observations`)

    for (const control of scene.controls) {
      assert.ok(control.label, `${kind} control needs a label`)
      assert.ok(control.value, `${kind} control needs a value`)
      assert.ok(Array.isArray(control.notes), `${kind} control notes should be an array`)
    }
  }
})

test('keyboard, rhythm, and harmony demos expose classroom-ready controls', () => {
  const loadTsModule = createTsLoader()
  const demos = loadTsModule('src/music/theoryDemos.ts')

  assert.deepEqual(
    demos.getDemoScene('pitch').controls.map((control) => control.value),
    ['ascending', 'descending', 'skip']
  )
  assert.ok(demos.getDemoScene('meter').controls.some((control) => control.value === '6-8'))
  assert.ok(demos.getDemoScene('chord').controls.some((control) => control.value === 'dominant7'))
})
