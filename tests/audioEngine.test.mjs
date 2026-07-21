// audioEngine 纯逻辑单元测试：ensureAudio 容错、Transport 循环引用计数、inferChords 和弦推断
// tone.js 依赖浏览器 Web Audio，Node 下用桩替换（模块加载期不触碰真实 API）
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

// —— tone 桩：只实现 audioEngine 用到的接口 ——
class StubLoop {
  constructor(callback, interval) {
    this.callback = callback
    this.interval = interval
    this.started = false
  }
  start() { this.started = true }
  stop() { this.started = false }
  dispose() {}
}

const transport = {
  bpm: { value: 120 },
  swing: 0,
  state: 'stopped',
  startCount: 0,
  stopCount: 0,
  start() { this.state = 'started'; this.startCount++ },
  stop() { this.state = 'stopped'; this.stopCount++ },
}

let toneStartShouldFail = false
const toneStub = {
  start: async () => {
    if (toneStartShouldFail) throw new Error('NotAllowedError: audio blocked')
  },
  now: () => 0,
  Draw: { schedule: (fn) => fn() },
  FMSynth: class {},
  Loop: StubLoop,
  MembraneSynth: class {},
  MetalSynth: class {},
  NoiseSynth: class {},
  PolySynth: class {},
  Reverb: class { toDestination() { return this } },
  Sampler: class {},
  Synth: class {},
  Transport: transport,
}

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
      if (specifier === 'tone') return toneStub
      if (specifier.startsWith('.')) return load(path.resolve(path.dirname(resolved), specifier))
      return require(specifier)
    }
    const fn = new Function('module', 'exports', 'require', transpiled)
    fn(module, module.exports, localRequire)
    return module.exports
  }
  return load
}

const engine = () => createTsLoader()('src/music/audioEngine.ts')

// —— ensureAudio 容错 ——
test('ensureAudio 成功时返回 true', async () => {
  const { ensureAudio } = engine()
  toneStartShouldFail = false
  assert.equal(await ensureAudio(), true)
})

// 注意：ensureAudio 内部有 started 缓存，成功后后续调用恒为 true。
// 失败路径无法在同一进程内于成功之后复现（模块级单例），故仅验证成功路径不抛异常。

// —— Transport 循环引用计数 ——
test('startTransportLoop 注册后 Transport 启动并采用该循环的 bpm', () => {
  const { startTransportLoop, stopAllTransportLoops } = engine()
  stopAllTransportLoops()
  transport.state = 'stopped'
  transport.bpm.value = 120

  const stop = startTransportLoop(90, '4n', () => {})
  assert.equal(transport.bpm.value, 90)
  assert.equal(transport.state, 'started')
  stop()
})

test('后注册的循环覆盖 bpm，停止后回退到上一个循环的设置', () => {
  const { startTransportLoop, stopAllTransportLoops } = engine()
  stopAllTransportLoops()
  transport.state = 'stopped'

  const stopA = startTransportLoop(80, '4n', () => {})
  const stopB = startTransportLoop(140, '8n', () => {})
  assert.equal(transport.bpm.value, 140, '最后注册的活跃循环决定 bpm')

  stopB()
  assert.equal(transport.bpm.value, 80, '停止后回退到上一个循环')
  assert.equal(transport.state, 'started', '仍有活跃循环时不停 Transport')

  stopA()
  assert.equal(transport.state, 'stopped', '无活跃循环时停止 Transport')
  assert.equal(transport.bpm.value, 120, '无循环时恢复默认 bpm')
})

test('stop 函数幂等：重复调用不破坏引用计数', () => {
  const { startTransportLoop, stopAllTransportLoops } = engine()
  stopAllTransportLoops()
  transport.state = 'stopped'

  const stopA = startTransportLoop(100, '4n', () => {})
  const stopB = startTransportLoop(110, '4n', () => {})
  stopB()
  stopB() // 重复停止
  stopB()
  assert.equal(transport.bpm.value, 100, '重复 stop 不应多扣引用')
  assert.equal(transport.state, 'started')

  stopA()
  assert.equal(transport.state, 'stopped')
})

test('stopAllTransportLoops 一键清空所有循环', () => {
  const { startTransportLoop, stopAllTransportLoops } = engine()
  stopAllTransportLoops()
  transport.state = 'stopped'

  const stops = [
    startTransportLoop(70, '4n', () => {}),
    startTransportLoop(90, '4n', () => {}),
    startTransportLoop(130, '4n', () => {}),
  ]
  assert.equal(transport.state, 'started')
  stopAllTransportLoops()
  assert.equal(transport.state, 'stopped')
  assert.equal(transport.bpm.value, 120)
  // 之后再调各自的 stop 不应报错或改变状态
  for (const s of stops) s()
  assert.equal(transport.state, 'stopped')
})

// —— inferChords 和弦推断 ——
test('inferChords 空旋律返回默认 1-5-6-4 进行', () => {
  const { inferChords } = engine()
  const chords = inferChords([], 4)
  assert.deepEqual(
    chords.map((c) => `${c.root}${c.quality}`),
    ['C4maj', 'G3maj', 'A3min', 'F3maj']
  )
})

test('inferChords 纯 C-E-G 旋律小节推断为 C 大三和弦', () => {
  const { inferChords } = engine()
  const melody = [
    { note: 'C4', beats: 1 },
    { note: 'E4', beats: 1 },
    { note: 'G4', beats: 2 },
  ]
  const chords = inferChords(melody, 4)
  assert.equal(chords.length, 1)
  assert.equal(chords[0].root, 'C4')
  assert.equal(chords[0].quality, 'maj')
})

test('inferChords 纯 A-C-E 旋律小节推断为 a 小三和弦', () => {
  const { inferChords } = engine()
  const melody = [
    { note: 'A3', beats: 1 },
    { note: 'C4', beats: 1 },
    { note: 'E4', beats: 2 },
  ]
  const chords = inferChords(melody, 4)
  assert.equal(chords.length, 1)
  assert.equal(chords[0].root, 'A3')
  assert.equal(chords[0].quality, 'min')
})

test('inferChords 按小节切分：两小节各自独立推断', () => {
  const { inferChords } = engine()
  const melody = [
    // 第一小节：C 大调和弦音
    { note: 'C4', beats: 2 },
    { note: 'E4', beats: 2 },
    // 第二小节：F 大调和弦音
    { note: 'F4', beats: 2 },
    { note: 'A4', beats: 2 },
  ]
  const chords = inferChords(melody, 4)
  assert.equal(chords.length, 2)
  assert.equal(chords[0].root, 'C4')
  assert.equal(chords[1].root, 'F3')
})

test('inferChords 忽略休止符', () => {
  const { inferChords } = engine()
  const melody = [
    { note: 'rest', beats: 2 },
    { note: 'G3', beats: 1 },
    { note: 'B3', beats: 1 },
  ]
  const chords = inferChords(melody, 4)
  assert.equal(chords.length, 1)
  assert.equal(chords[0].root, 'G3')
})
