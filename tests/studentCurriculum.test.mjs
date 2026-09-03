import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
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

let removedDiscoveryIds = []

function loadStudents() {
  const sourcePath = path.resolve('src/state/students.ts')
  const source = fs.readFileSync(sourcePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const module = { exports: {} }
  const localRequire = (specifier) => {
    if (specifier === './progress') return { removeStudentProgress() {} }
    if (specifier === './theoryReview') return { removeStudentReviewBook() {} }
    if (specifier === './creativeWorks') return { removeStudentCreativeWorks() {} }
    if (specifier === './discoveries') return { removeStudentDiscoveries: (id) => removedDiscoveryIds.push(id) }
    return require(specifier)
  }
  new Function('module', 'exports', 'require', transpiled)(module, module.exports, localRequire)
  return module.exports
}

test('学生档案保存并更新浙江人音版年级与册次', () => {
  globalThis.localStorage = makeLocalStorage()
  const students = loadStudents()

  const created = students.addStudent('小乐', '🦊', { grade: 5, semester: 2 })
  assert.equal(created.grade, 5)
  assert.equal(created.semester, 2)

  const updated = students.updateStudentProfile(created.id, { grade: 6 })
  assert.equal(updated?.grade, 6)
  assert.equal(updated?.semester, 2)
  assert.equal(students.loadRoster().find((item) => item.id === created.id)?.grade, 6)
})

test('旧学生没有教材字段时仍可读取并安全更新', () => {
  globalThis.localStorage = makeLocalStorage()
  globalThis.localStorage.setItem(
    'music-edu-roster-v1',
    JSON.stringify([{ id: 'stu-old', name: '旧同学', avatar: '🐼', createdAt: 0 }])
  )
  const students = loadStudents()

  assert.equal(students.loadRoster()[0].grade, undefined)
  const updated = students.updateStudentProfile('stu-old', { semester: 1 })
  assert.equal(updated?.semester, 1)
  assert.equal(updated?.name, '旧同学')
})

test('删除学生会通知发现记录层做级联清理', () => {
  globalThis.localStorage = makeLocalStorage()
  removedDiscoveryIds = []
  const students = loadStudents()
  const created = students.addStudent('待删除')

  students.removeStudent(created.id)
  assert.deepEqual(removedDiscoveryIds, [created.id])
})
