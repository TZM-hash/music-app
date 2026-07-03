import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function loadTsModule(filePath) {
  const source = fs.readFileSync(path.resolve(filePath), 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const module = { exports: {} }
  const fn = new Function('module', 'exports', transpiled)
  fn(module, module.exports)
  return module.exports
}

test('every theory demo kind has an interactive scene', () => {
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
  const demos = loadTsModule('src/music/theoryDemos.ts')

  assert.deepEqual(
    demos.getDemoScene('pitch').controls.map((control) => control.value),
    ['ascending', 'descending', 'skip']
  )
  assert.ok(demos.getDemoScene('meter').controls.some((control) => control.value === '6-8'))
  assert.ok(demos.getDemoScene('chord').controls.some((control) => control.value === 'dominant7'))
})
