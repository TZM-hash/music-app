// notes.ts 工具函数单元测试：PITCH_CLASSES / transposeNote / chordNotes
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

const notes = () => createTsLoader()('src/music/notes.ts')

test('PITCH_CLASSES 包含 12 个半音且以 C 起始、B 结尾', () => {
  const { PITCH_CLASSES } = notes()
  assert.equal(PITCH_CLASSES.length, 12)
  assert.equal(PITCH_CLASSES[0], 'C')
  assert.equal(PITCH_CLASSES[6], 'F#')
  assert.equal(PITCH_CLASSES[11], 'B')
})

test('transposeNote 半音移调（含跨八度与负数）', () => {
  const { transposeNote } = notes()
  assert.equal(transposeNote('C4', 0), 'C4')
  assert.equal(transposeNote('D4', 3), 'F4')
  assert.equal(transposeNote('B4', 1), 'C5')
  assert.equal(transposeNote('C4', -1), 'B3')
  assert.equal(transposeNote('C4', 12), 'C5')
  assert.equal(transposeNote('C4', -12), 'C3')
  assert.equal(transposeNote('F#4', 6), 'C5')
})

test('transposeNote 非法输入原样返回', () => {
  const { transposeNote } = notes()
  assert.equal(transposeNote('rest', 5), 'rest')
  assert.equal(transposeNote('', 5), '')
})

test('chordNotes 大三和弦组成音正确', () => {
  const { chordNotes } = notes()
  assert.deepEqual(chordNotes('C4', 'maj'), ['C4', 'E4', 'G4'])
  assert.deepEqual(chordNotes('G3', 'maj'), ['G3', 'B3', 'D4'])
  assert.deepEqual(chordNotes('F3', 'maj'), ['F3', 'A3', 'C4'])
})

test('chordNotes 小三和弦组成音正确', () => {
  const { chordNotes } = notes()
  assert.deepEqual(chordNotes('A3', 'min'), ['A3', 'C4', 'E4'])
  assert.deepEqual(chordNotes('D3', 'min'), ['D3', 'F3', 'A3'])
  assert.deepEqual(chordNotes('E3', 'min'), ['E3', 'G3', 'B3'])
})

test('chordNotes 非法根音返回空数组', () => {
  const { chordNotes } = notes()
  assert.deepEqual(chordNotes('rest', 'maj'), [])
  assert.deepEqual(chordNotes('', 'min'), [])
})
