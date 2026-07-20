// 生命周期 hooks 单元测试：定时器注册表 + 卸载保护 + 旋律试听
import { test } from 'node:test'
import assert from 'node:assert/strict'

// —— 模拟 hooks 的核心行为（与 src/hooks/useTimers.ts 同源，node 环境直接测逻辑）——
function makeTimerRegistry() {
  const timers = new Set()
  let alive = true
  return {
    later(fn, ms) {
      const id = setTimeout(() => {
        timers.delete(id)
        if (alive) fn()
      }, ms)
      timers.add(id)
      return id
    },
    cancel(id) {
      timers.delete(id)
      clearTimeout(id)
    },
    destroy() {
      alive = false
      timers.forEach((id) => clearTimeout(id))
      timers.clear()
    },
    size: () => timers.size,
  }
}

test('useTimers: 卸载后已登记的定时器不再触发回调', async () => {
  const reg = makeTimerRegistry()
  let fired = 0
  reg.later(() => fired++, 20)
  reg.later(() => fired++, 30)
  reg.destroy() // 模拟组件卸载
  await new Promise((r) => setTimeout(r, 60))
  assert.equal(fired, 0)
})

test('useTimers: 未卸载时定时器正常触发，且从注册表移除', async () => {
  const reg = makeTimerRegistry()
  let fired = 0
  reg.later(() => fired++, 10)
  assert.equal(reg.size(), 1)
  await new Promise((r) => setTimeout(r, 40))
  assert.equal(fired, 1)
  assert.equal(reg.size(), 0)
  reg.destroy()
})

test('useTimers: cancel 可单独取消某个定时器', async () => {
  const reg = makeTimerRegistry()
  let fired = 0
  const id = reg.later(() => fired++, 10)
  reg.later(() => fired++, 15)
  reg.cancel(id)
  await new Promise((r) => setTimeout(r, 40))
  assert.equal(fired, 1)
  reg.destroy()
})

// —— 旋律试听：重复 play 不叠加 ——
function makeMelodyPreview(onNote) {
  const timers = new Set()
  let playing = false
  const clear = () => {
    timers.forEach((id) => clearTimeout(id))
    timers.clear()
  }
  return {
    play(notes, beatMs = 20) {
      clear()
      playing = true
      let t = 0
      for (const n of notes) {
        const at = t
        const id = setTimeout(() => {
          timers.delete(id)
          onNote(n.note)
        }, at)
        timers.add(id)
        t += n.beats * beatMs
      }
      const endId = setTimeout(() => {
        timers.delete(endId)
        playing = false
      }, t)
      timers.add(endId)
    },
    stop() {
      clear()
      playing = false
    },
    isPlaying: () => playing,
    pending: () => timers.size,
  }
}

test('useMelodyPreview: 重复 play 清掉上一段，音符不叠加', async () => {
  const played = []
  const preview = makeMelodyPreview((n) => played.push(n))
  const melody = [
    { note: 'C4', beats: 1 },
    { note: 'D4', beats: 1 },
    { note: 'E4', beats: 1 },
  ]
  preview.play(melody)
  // 立即再次播放同一旋律：上一段的 D4/E4 不应再响
  preview.play(melody)
  await new Promise((r) => setTimeout(r, 100))
  assert.deepEqual(played, ['C4', 'D4', 'E4']) // 只有一段，无重复
  assert.equal(preview.isPlaying(), false)
})

test('useMelodyPreview: stop 立即停止后续音符', async () => {
  const played = []
  const preview = makeMelodyPreview((n) => played.push(n))
  preview.play(
    [
      { note: 'C4', beats: 1 },
      { note: 'D4', beats: 1 },
      { note: 'E4', beats: 1 },
    ],
    25
  )
  await new Promise((r) => setTimeout(r, 10)) // 第一个音已响
  preview.stop()
  await new Promise((r) => setTimeout(r, 120))
  assert.deepEqual(played, ['C4'])
})
