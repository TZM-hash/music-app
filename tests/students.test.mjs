import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function loadStudents() {
  const sourcePath = path.resolve('src/state/students.ts')
  const source = fs.readFileSync(sourcePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const module = { exports: {} }
  const localRequire = (specifier) => {
    if (specifier === './progress') return { removeStudentProgress() {} }
    if (specifier === './theoryReview') return { removeStudentReviewBook() {} }
    if (specifier === './creativeWorks') return { removeStudentCreativeWorks() {} }
    return require(specifier)
  }
  new Function('module', 'exports', 'require', transpiled)(module, module.exports, localRequire)
  return module.exports
}

test('findStudentById follows the selected student id', () => {
  const students = loadStudents()
  const roster = [
    { id: 'stu-a', name: '小明', avatar: '🦁', createdAt: 0 },
    { id: 'stu-b', name: '小红', avatar: '🐯', createdAt: 1 },
  ]

  assert.equal(students.findStudentById(roster, 'stu-a')?.name, '小明')
  assert.equal(students.findStudentById(roster, 'stu-b')?.name, '小红')
  assert.equal(students.findStudentById(roster, null), null)
  assert.equal(students.findStudentById(roster, 'missing'), null)
})
