import assert from 'node:assert/strict'
import fs from 'node:fs'
import { test } from 'node:test'

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

test('理论页以音乐线索库承载先听后命名', () => {
  const theory = read('src/pages/Theory.tsx')
  assert.match(theory, /音乐线索库/)
  assert.match(theory, /theory-clue-card/)
  assert.match(theory, /想知道这个线索的乐理名字/)
})

test('我的页面展示可回看的发现卡和证据', () => {
  const adventure = read('src/pages/AdventureMap.tsx')
  assert.match(adventure, /我的音乐发现/)
  assert.match(adventure, /discovery-card-grid/)
  assert.match(adventure, /再次聆听/)
})

test('教师看板展示音乐探索过程观察', () => {
  const dashboard = read('src/pages/Dashboard.tsx')
  assert.match(dashboard, /buildDiscoveryAnalytics/)
  assert.match(dashboard, /过程观察/)
  assert.match(dashboard, /学生怎样在听音乐/)
})
