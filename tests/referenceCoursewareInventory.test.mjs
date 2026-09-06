import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildReferenceInventory,
  classifyReferenceFile,
} from '../scripts/reference-courseware-inventory.mjs'

test('参考文件分类识别年级、资源类型和候选用途', () => {
  assert.deepEqual(classifyReferenceFile('一上/森林乐器/木鱼.mp3'), {
    grade: 1,
    semester: 1,
    kind: 'audio',
    status: 'selected',
  })
  assert.deepEqual(classifyReferenceFile('三上/演唱形式/轮唱.html'), {
    grade: 3,
    semester: 1,
    kind: 'html',
    status: 'selected',
  })
})

test('索引排除元数据和备份，并按哈希归并重复资源', () => {
  const entries = buildReferenceInventory([
    { path: '一上/森林/乐器.mp3', bytes: 'a', size: 10 },
    { path: '一上/备份/乐器.mp3', bytes: 'a', size: 10 },
    { path: '一上/__MACOSX/._乐器.mp3', bytes: 'b', size: 3 },
  ])

  assert.equal(entries.filter((item) => item.status === 'selected').length, 1)
  assert.equal(entries.filter((item) => item.status === 'excluded').length, 2)
  assert.equal(entries.find((item) => item.status === 'selected')?.sha256, 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb')
})

test('未知文件保留为待审条目，不静默丢弃', () => {
  const entries = buildReferenceInventory([
    { path: '二上/说明/课程说明.xyz', bytes: 'notes', size: 5 },
  ])

  assert.deepEqual(entries[0], {
    relativePath: '二上/说明/课程说明.xyz',
    grade: 2,
    semester: 1,
    extension: '.xyz',
    kind: 'unknown',
    size: 5,
    sha256: 'ab5aa97074c454a0632057e704220d9a6678fbf773a0a5806fc09b8173b07309',
    status: 'review',
    duplicateOf: null,
    candidateUses: [],
  })
})
