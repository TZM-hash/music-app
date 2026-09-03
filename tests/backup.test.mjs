import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test, beforeEach } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function makeLocalStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  }
}

function loadBackup() {
  const sourcePath = path.resolve('src/state/backup.ts')
  const source = fs.readFileSync(sourcePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const module = { exports: {} }
  new Function('module', 'exports', 'require', transpiled)(module, module.exports, require)
  return module.exports
}

beforeEach(() => {
  globalThis.localStorage = makeLocalStorage()
})

test('课堂备份包含我的音乐发现数据', () => {
  const backup = loadBackup()
  globalThis.localStorage.setItem(
    'music-edu-discoveries-v1',
    JSON.stringify([{ id: 'discovery-1-1', topicId: 'steady-beat' }])
  )

  const parsed = JSON.parse(backup.exportClassroomBackup())
  assert.equal(parsed.data['music-edu-discoveries-v1'], '[{"id":"discovery-1-1","topicId":"steady-beat"}]')
})

test('旧版备份没有发现字段时仍可成功导入', () => {
  const backup = loadBackup()
  const result = backup.importClassroomBackup(JSON.stringify({
    app: 'music-edu-app',
    version: 1,
    data: { 'music-edu-roster-v1': '[]' },
  }))

  assert.equal(result.ok, true)
  assert.equal(globalThis.localStorage.getItem('music-edu-roster-v1'), '[]')
})
