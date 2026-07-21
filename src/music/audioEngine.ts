// 音频引擎 2.0：音色切换 · 和弦 · 太鼓音效 · 节拍器
// 按需导入 Tone.js，避免把整个库打进单文件包
import { PITCH_CLASSES, chordNotes as buildTriad } from './notes'
import {
  start as toneStart,
  now as toneNow,
  Draw,
  FMSynth,
  Loop,
  MembraneSynth,
  MetalSynth,
  NoiseSynth,
  PolySynth,
  Reverb,
  Sampler,
  Synth,
  Transport,
} from 'tone'

let started = false

/**
 * 确保 AudioContext 已启动。内部吞掉所有错误（浏览器拒绝自动播放策略等），
 * 返回是否成功——调用方据此决定是否继续发声，不会产生 unhandled rejection。
 */
export async function ensureAudio(): Promise<boolean> {
  if (started) return true
  try {
    await toneStart()
    started = true
    return true
  } catch {
    return false
  }
}

// —— 音色系统 ——
export type TonePatch = 'piano' | 'musicbox' | 'strings' | 'organ'
let currentPatch: TonePatch = 'piano'
let currentVolume = -6

// 钢琴：真实采样(Salamander Grand)优先，加载失败/离线降级为增强合成
export type PianoLoadState = 'idle' | 'loading' | 'sampled' | 'fallback'
let pianoLoadState: PianoLoadState = 'idle'
let pianoLoadListeners: ((s: PianoLoadState) => void)[] = []
let pianoSampler: Sampler | null = null
let pianoFallback: PolySynth | null = null
let pianoReverb: Reverb | null = null

export function onPianoLoad(cb: (s: PianoLoadState) => void): () => void {
  pianoLoadListeners.push(cb)
  cb(pianoLoadState)
  return () => {
    pianoLoadListeners = pianoLoadListeners.filter((c) => c !== cb)
  }
}
function setPianoState(s: PianoLoadState) {
  pianoLoadState = s
  pianoLoadListeners.forEach((c) => c(s))
}

function buildPianoFallback(): PolySynth {
  // 增强合成：FM 合成 + 轻微 lowpass，比纯三角波温暖厚实
  const synth = new PolySynth(FMSynth, {
    harmonicity: 2.5,
    modulationIndex: 6,
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.004, decay: 0.5, sustain: 0.25, release: 1.4 },
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 0.002, decay: 0.35, sustain: 0.1, release: 0.6 },
  })
  return synth
}

/**
 * 预加载钢琴采样（在用户首次进入钢琴页时调用）。
 * 采样来自 tonejs.github.io CDN —— 需要联网；离线或加载失败（8 秒超时）
 * 会自动降级为内置 FM 合成音色，功能不受影响，只是音色不同。
 */
export function preloadPiano(): void {
  if (pianoLoadState !== 'idle') return
  setPianoState('loading')

  // 混响让钢琴更有空间感
  if (!pianoReverb) pianoReverb = new Reverb({ decay: 1.6, wet: 0.18 }).toDestination()
  if (!pianoFallback) {
    pianoFallback = buildPianoFallback().connect(pianoReverb)
    pianoFallback.volume.value = currentVolume
  }

  // Salamander Grand Piano 采样（Tone.js 官方 CDN 示例音源）
  try {
    pianoSampler = new Sampler({
      urls: {
        A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
        A1: 'A1.mp3', C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
        A2: 'A2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
        A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
        A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
        A5: 'A5.mp3', C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
        A6: 'A6.mp3', C7: 'C7.mp3',
      },
      release: 1.4,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => {
        setPianoState('sampled')
      },
      onerror: () => {
        setPianoState('fallback')
      },
    }).connect(pianoReverb)
  } catch {
    setPianoState('fallback')
  }

  // 超时保护：8 秒还没加载好就用降级音源
  window.setTimeout(() => {
    if (pianoLoadState === 'loading') setPianoState('fallback')
  }, 8000)
}

/** 返回当前可用的钢琴发声对象 */
function getPianoVoice(): Sampler | PolySynth {
  if (pianoLoadState === 'idle') preloadPiano()
  if (pianoSampler && pianoLoadState === 'sampled') return pianoSampler
  if (!pianoFallback) {
    // 兜底路径：preloadPiano 未执行到时，保证只有一个 fallback 实例
    if (!pianoReverb) pianoReverb = new Reverb({ decay: 1.6, wet: 0.18 }).toDestination()
    pianoFallback = buildPianoFallback().connect(pianoReverb)
    pianoFallback.volume.value = currentVolume
  }
  return pianoFallback
}

// 其它音色仍用 PolySynth
const synths: Record<Exclude<TonePatch, 'piano'>, PolySynth | null> = {
  musicbox: null,
  strings: null,
  organ: null,
}

function getOtherSynth(patch: Exclude<TonePatch, 'piano'>): PolySynth {
  if (!synths[patch]) {
    switch (patch) {
      case 'musicbox':
        synths.musicbox = new PolySynth(Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.002, decay: 0.1, sustain: 0, release: 0.6 },
        }).toDestination()
        synths.musicbox.volume.value = currentVolume - 6
        break
      case 'strings':
        synths.strings = new PolySynth(Synth, {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.3, decay: 0.4, sustain: 0.6, release: 1.8 },
        }).toDestination()
        synths.strings.volume.value = currentVolume - 4
        break
      case 'organ':
        synths.organ = new PolySynth(Synth, {
          oscillator: { type: 'fmsine' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 },
        }).toDestination()
        synths.organ.volume.value = currentVolume - 2
        break
    }
  }
  return synths[patch]!
}

export function setPatch(patch: TonePatch): void {
  currentPatch = patch
}

// 各音色相对钢琴的响度偏移（dB），setVolume 时必须保留，避免音色平衡被破坏
const PATCH_VOLUME_OFFSET: Record<Exclude<TonePatch, 'piano'>, number> = {
  musicbox: -6,
  strings: -4,
  organ: -2,
}

export function setVolume(v: number): void {
  currentVolume = v
  if (pianoFallback) pianoFallback.volume.value = v
  if (pianoSampler) pianoSampler.volume.value = v
  for (const p of Object.keys(synths) as Exclude<TonePatch, 'piano'>[]) {
    if (synths[p]) synths[p]!.volume.value = v + PATCH_VOLUME_OFFSET[p]
  }
}

export function getVolume(): number {
  return currentVolume
}

export function getCurrentPatch(): TonePatch {
  return currentPatch
}

export const PATCH_INFO: Record<TonePatch, { name: string; icon: string }> = {
  piano: { name: '钢琴', icon: '🎹' },
  musicbox: { name: '八音盒', icon: '🔔' },
  strings: { name: '弦乐', icon: '🎻' },
  organ: { name: '电子琴', icon: '🎛️' },
}

// —— 延音踏板 ——
// 开关式：开启后松开琴键，音符按 sustainSeconds 自然衰减；关闭则立即止音
let sustainOn = false
let sustainSeconds = 2.5 // 延音时长（秒），可调
const DEFAULT_RELEASE = 0.4 // 关闭延音时的默认释放

// 把当前的 release 时长应用到钢琴音源
function applyPianoRelease(): void {
  const rel = sustainOn ? sustainSeconds : DEFAULT_RELEASE
  if (pianoSampler) pianoSampler.release = rel
  if (pianoFallback) pianoFallback.set({ envelope: { release: rel } })
}

/** 开/关延音踏板 */
export function setSustain(on: boolean): void {
  sustainOn = on
  applyPianoRelease()
}

/** 设定延音时长（秒） */
export function setSustainTime(seconds: number): void {
  sustainSeconds = seconds
  applyPianoRelease()
}

export function isSustainOn(): boolean {
  return sustainOn
}

// —— 单音 / 和弦（支持力度 velocity 0..1，可指定 patch 而不改全局）——
export function playNote(note: string, duration = '4n', velocity = 0.85, patch?: TonePatch): void {
  const p = patch ?? currentPatch
  if (p === 'piano') {
    getPianoVoice().triggerAttackRelease(note, duration, undefined, velocity)
  } else {
    getOtherSynth(p).triggerAttackRelease(note, duration, undefined, velocity)
  }
}

export function attackNote(note: string, velocity = 0.85, patch?: TonePatch): void {
  const p = patch ?? currentPatch
  if (p === 'piano') {
    getPianoVoice().triggerAttack(note, undefined, velocity)
  } else {
    getOtherSynth(p).triggerAttack(note, undefined, velocity)
  }
}

export function releaseNote(note: string, patch?: TonePatch): void {
  const p = patch ?? currentPatch
  if (p === 'piano') {
    // 无论是否延音都触发释放；release 时长决定余音长度（延音开=长，关=短）
    getPianoVoice().triggerRelease(note)
  } else {
    getOtherSynth(p).triggerRelease(note)
  }
}

/** 播放一个三和弦 */
export function playChord(root: string, quality: 'maj' | 'min', duration = '2n'): void {
  const notes = buildTriad(root, quality)
  if (notes.length === 0) return
  if (currentPatch === 'piano') {
    getPianoVoice().triggerAttackRelease(notes, duration)
  } else {
    getOtherSynth(currentPatch).triggerAttackRelease(notes, duration)
  }
}

// —— 打击乐 ——
type DrumKind = 'kick' | 'snare' | 'hihat' | 'tom' | 'clap' | 'crash'

let kick: MembraneSynth | null = null
let snare: NoiseSynth | null = null
let hihat: MetalSynth | null = null
let tom: MembraneSynth | null = null
let crash: MetalSynth | null = null

function initDrums() {
  if (kick) return
  // 底鼓：低频冲击 + 弹性
  kick = new MembraneSynth({
    octaves: 8,
    pitchDecay: 0.06,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 },
  }).toDestination()
  kick.volume.value = -2

  // 嗵鼓
  tom = new MembraneSynth({
    octaves: 4,
    pitchDecay: 0.1,
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
  }).toDestination()
  tom.volume.value = -4

  // 军鼓：白噪声 + body 共鸣
  snare = new NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
  }).toDestination()
  snare.volume.value = -6

  // 踩镲：更清脆
  hihat = new MetalSynth({
    envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
    harmonicity: 6.1,
    resonance: 5000,
  }).toDestination()
  hihat.volume.value = -14

  // 吊镲：更持久的 shimmer
  crash = new MetalSynth({
    envelope: { attack: 0.001, decay: 1.2, release: 0.4 },
    harmonicity: 5.1,
    resonance: 3500,
  }).toDestination()
  crash.volume.value = -14
}

export function playDrum(kind: DrumKind, time?: number): void {
  initDrums()
  switch (kind) {
    case 'kick':
      kick!.triggerAttackRelease('C1', '8n', time)
      break
    case 'tom':
      tom!.triggerAttackRelease('G2', '8n', time)
      break
    case 'snare':
    case 'clap':
      snare!.triggerAttackRelease('8n', time)
      break
    case 'hihat':
      hihat!.triggerAttackRelease('C6', '16n', time)
      break
    case 'crash':
      crash!.triggerAttackRelease('C6', '2n', time)
      break
  }
}
export type { DrumKind }

// —— 太鼓音效（咚/咔） ——
let donSynth: MembraneSynth | null = null
let kaSynth: NoiseSynth | null = null

export function taikoDON(): void {
  if (!donSynth) {
    donSynth = new MembraneSynth({
      octaves: 10,
      pitchDecay: 0.03,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.15 },
    }).toDestination()
    donSynth.volume.value = -1
  }
  donSynth.triggerAttackRelease('C2', '4n')
}

export function taikoKA(): void {
  if (!kaSynth) {
    kaSynth = new NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0 },
    }).toDestination()
    kaSynth.volume.value = -3
  }
  kaSynth.triggerAttackRelease('8n', toneNow())
}

// —— Transport 共享管理 ——
// 节拍器/伴奏/鼓循环都跑在 Transport 上（采样级精确，切后台自动暂停）。
// Transport 是全局单例（bpm/swing 只有一份），多循环直接共用会互相覆盖设置、
// 引用计数也会因重复 stop 失衡，因此所有循环统一登记到 TransportLoopManager：
// - bpm/swing 由最后注册的活跃循环决定，停止后自动回退到上一个循环的设置
// - 引用计数天然平衡（每注册一次 +1，注销一次 -1）
// - stopAllAudio() 可一键停掉所有循环，切页不再有残留
interface LoopEntry {
  loop: Loop
  bpm: number
  swing: number
  stopped: boolean
}
const transportLoops: LoopEntry[] = []

function refreshTransportSettings(): void {
  const active = transportLoops.filter((e) => !e.stopped)
  const last = active[active.length - 1]
  Transport.bpm.value = last ? last.bpm : 120
  Transport.swing = last ? last.swing : 0
  if (active.length === 0) {
    if (Transport.state !== 'stopped') Transport.stop()
  } else if (Transport.state !== 'started') {
    Transport.start()
  }
}

/** 把 UI 回调（setState 等）对齐到音频时间轴上执行，避免视觉与声音错位 */
export function scheduleVisual(fn: () => void, time: number): void {
  Draw.schedule(() => fn(), time)
}

/**
 * 在 Transport 上启动一个定时循环，返回停止函数（幂等，可安全多次调用）。
 * callback 收到的 time 是音频时间轴时间，应传给 triggerAttackRelease 等以保证精确发声。
 * swing: 0..1，把奇数步（off-beat）往后推的比例（Transport.swingSubdivision 粒度）。
 */
export function startTransportLoop(
  bpm: number,
  interval: string,
  callback: (time: number) => void,
  opts?: { swing?: number }
): () => void {
  const loop = new Loop(callback, interval)
  loop.start(0)
  const entry: LoopEntry = { loop, bpm, swing: opts?.swing ?? 0, stopped: false }
  transportLoops.push(entry)
  refreshTransportSettings()
  return () => {
    if (entry.stopped) return
    entry.stopped = true
    loop.stop()
    loop.dispose()
    const i = transportLoops.indexOf(entry)
    if (i >= 0) transportLoops.splice(i, 1)
    refreshTransportSettings()
  }
}

/** 停掉 Transport 上的所有循环（切页时由 stopAllAudio 调用） */
export function stopAllTransportLoops(): void {
  for (const e of transportLoops.splice(0)) {
    e.stopped = true
    e.loop.stop()
    e.loop.dispose()
  }
  refreshTransportSettings()
}

// —— 节拍器 ——
let stopMetro: (() => void) | null = null
let metroClick: MembraneSynth | null = null

export function startMetronome(bpm: number, onBeat?: (beat: number) => void): void {
  stopMetronome()
  if (!metroClick) {
    metroClick = new MembraneSynth({ octaves: 2, pitchDecay: 0.008 }).toDestination()
    metroClick.volume.value = -8
  }
  let beat = 0
  stopMetro = startTransportLoop(bpm, '4n', (time) => {
    const b = beat % 4
    metroClick!.triggerAttackRelease(b === 0 ? 'C4' : 'C3', '32n', time)
    if (onBeat) scheduleVisual(() => onBeat(b), time)
    beat++
  })
}

export function stopMetronome(): void {
  if (stopMetro) {
    stopMetro()
    stopMetro = null
  }
}

/** 播放一个预设的打击节奏循环（回调每次 tick 收到当前步序号，已对齐音频时间轴） */
export function playDrumLoop(
  pattern: ('kick' | 'snare' | 'hihat' | null)[],
  bpm: number,
  onStep?: (step: number) => void
): () => void {
  let step = 0
  return startTransportLoop(bpm, '16n', (time) => {
    const s = step % pattern.length
    const hit = pattern[s]
    if (hit) playDrum(hit, time)
    if (onStep) scheduleVisual(() => onStep(s), time)
    step++
  })
}

// —— 混音器音源 ——
// 每种可选音源：鼓类直接 playDrum，音高类用独立 synth 弹固定音
export type VoiceKind =
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'tom'
  | 'crash'
  | 'clap'
  | 'piano'
  | 'bass'
  | 'bell'
  | 'pluck'
  | 'marimba'
  | 'synth'
  | 'organ2'

const mixSynths: Partial<Record<VoiceKind, PolySynth | Synth>> = {}

function getMixSynth(kind: VoiceKind): PolySynth | Synth {
  if (mixSynths[kind]) return mixSynths[kind]!
  let s: PolySynth | Synth
  switch (kind) {
    case 'bass':
      s = new Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4 } }).toDestination()
      break
    case 'bell':
      s = new PolySynth(Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.002, decay: 0.3, sustain: 0, release: 0.5 } }).toDestination()
      break
    case 'pluck':
      s = new PolySynth(Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.002, decay: 0.15, sustain: 0, release: 0.2 } }).toDestination()
      break
    case 'marimba':
      s = new PolySynth(Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 } }).toDestination()
      break
    case 'synth':
      s = new PolySynth(Synth, { oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 } }).toDestination()
      break
    case 'organ2':
      s = new PolySynth(Synth, { oscillator: { type: 'fmsine' }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 } }).toDestination()
      break
    default: // piano
      s = new PolySynth(Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.3, sustain: 0.3, release: 0.8 } }).toDestination()
  }
  mixSynths[kind] = s
  return s
}

/** 混音器触发一个音源的一步（可指定音高、音量 dB、音频时间轴时间） */
export function triggerVoice(kind: VoiceKind, note: string, volumeDb: number, time?: number): void {
  if (kind === 'kick' || kind === 'snare' || kind === 'hihat' || kind === 'tom' || kind === 'crash' || kind === 'clap') {
    playDrum(kind === 'clap' ? 'clap' : kind, time)
    return
  }
  const synth = getMixSynth(kind)
  synth.volume.value = volumeDb
  synth.triggerAttackRelease(note, '16n', time)
}

export const VOICE_INFO: Record<VoiceKind, { name: string; icon: string; pitched: boolean; defaultNote: string }> = {
  kick: { name: '底鼓', icon: '🥁', pitched: false, defaultNote: 'C1' },
  snare: { name: '军鼓', icon: '🪘', pitched: false, defaultNote: 'C2' },
  hihat: { name: '踩镲', icon: '🎩', pitched: false, defaultNote: 'C6' },
  tom: { name: '嗵鼓', icon: '🛢️', pitched: false, defaultNote: 'G2' },
  crash: { name: '吊镲', icon: '💥', pitched: false, defaultNote: 'C6' },
  clap: { name: '拍手', icon: '👏', pitched: false, defaultNote: 'C3' },
  piano: { name: '钢琴', icon: '🎹', pitched: true, defaultNote: 'C4' },
  bass: { name: '贝斯', icon: '🎸', pitched: true, defaultNote: 'C2' },
  bell: { name: '铃铛', icon: '🔔', pitched: true, defaultNote: 'C5' },
  pluck: { name: '拨弦', icon: '🪕', pitched: true, defaultNote: 'E4' },
  marimba: { name: '马林巴', icon: '🎶', pitched: true, defaultNote: 'C4' },
  synth: { name: '合成器', icon: '🎛️', pitched: true, defaultNote: 'C4' },
  organ2: { name: '管风琴', icon: '🎹', pitched: true, defaultNote: 'C4' },
}

// —— 背景伴奏（和弦垫 + 贝斯 + 鼓点 groove）——
export interface Chord {
  root: string // 如 C4
  quality: 'maj' | 'min'
}
// 默认走向：C-G-Am-F（1-5-6-4）
const DEFAULT_PROG: Chord[] = [
  { root: 'C4', quality: 'maj' },
  { root: 'G3', quality: 'maj' },
  { root: 'A3', quality: 'min' },
  { root: 'F3', quality: 'maj' },
]

let stopAccomp: (() => void) | null = null
let padSynth: PolySynth | null = null
let bassSynth: Synth | null = null

function chordNotes(root: string, quality: 'maj' | 'min'): string[] {
  const notes = buildTriad(root, quality)
  return notes.length > 0 ? notes : [root]
}
// 和弦根音降两个八度作为贝斯
function bassOf(root: string): string {
  const name = root.slice(0, -1)
  const octave = parseInt(root.slice(-1), 10)
  return `${name}${Math.max(1, octave - 2)}`
}

/**
 * 从旋律推断每小节和弦：统计小节内音级，匹配最合适的自然大调和弦(I ii iii IV V vi)。
 * 让伴奏跟着歌走，而不是固定 C-G-Am-F。
 */
export function inferChords(
  melody: { note: string; beats: number }[],
  beatsPerBar: number
): Chord[] {
  // C 大调常用和弦及其和弦音（音级 pitch class）
  const candidates: { chord: Chord; tones: number[] }[] = [
    { chord: { root: 'C4', quality: 'maj' }, tones: [0, 4, 7] },
    { chord: { root: 'F3', quality: 'maj' }, tones: [5, 9, 0] },
    { chord: { root: 'G3', quality: 'maj' }, tones: [7, 11, 2] },
    { chord: { root: 'A3', quality: 'min' }, tones: [9, 0, 4] },
    { chord: { root: 'D3', quality: 'min' }, tones: [2, 5, 9] },
    { chord: { root: 'E3', quality: 'min' }, tones: [4, 7, 11] },
  ]
  const bars: Chord[] = []
  let acc = 0
  let barWeights: Record<number, number> = {}
  const flush = () => {
    let best = candidates[0]
    let bestScore = -1
    for (const c of candidates) {
      let score = 0
      for (const t of c.tones) score += barWeights[t] ?? 0
      // 主/属/下属稍加权，倾向常见进行
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }
    bars.push(best.chord)
    barWeights = {}
  }
  for (const n of melody) {
    if (n.note !== 'rest') {
      const m = /^([A-G]#?)(-?\d)$/.exec(n.note)
      if (m) {
        const pc = PITCH_CLASSES.indexOf(m[1])
        barWeights[pc] = (barWeights[pc] ?? 0) + n.beats
      }
    }
    acc += n.beats
    if (acc >= beatsPerBar) {
      flush()
      acc -= beatsPerBar
    }
  }
  if (Object.keys(barWeights).length > 0) flush()
  return bars.length > 0 ? bars : DEFAULT_PROG
}

/** 启动背景伴奏。可传入和弦进行（不传则用默认 1-5-6-4） */
export function startAccompaniment(bpm: number, prog?: Chord[]): void {
  stopAccompaniment()
  const chords = prog && prog.length > 0 ? prog : DEFAULT_PROG
  if (!padSynth) {
    padSynth = new PolySynth(Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.08, decay: 0.3, sustain: 0.5, release: 0.8 },
    }).toDestination()
    padSynth.volume.value = -18
  }
  if (!bassSynth) {
    bassSynth = new Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.3 },
    }).toDestination()
    bassSynth.volume.value = -14
  }
  let sixteenthCount = 0
  stopAccomp = startTransportLoop(bpm, '16n', (time) => {
    const step16 = sixteenthCount % 16
    const barIndex = Math.floor(sixteenthCount / 16) % chords.length
    const ch = chords[barIndex]

    if (step16 === 0) {
      padSynth!.triggerAttackRelease(chordNotes(ch.root, ch.quality), '1m', time)
      bassSynth!.triggerAttackRelease(bassOf(ch.root), '8n', time)
    }
    if (step16 === 8) {
      bassSynth!.triggerAttackRelease(bassOf(ch.root), '8n', time)
    }

    if (step16 % 8 === 0) playDrum('kick', time)
    if (step16 === 4 || step16 === 12) playDrum('snare', time)
    if (step16 % 2 === 0) playDrum('hihat', time)

    sixteenthCount++
  })
}

export function stopAccompaniment(): void {
  if (stopAccomp) {
    stopAccomp()
    stopAccomp = null
    padSynth?.releaseAll?.()
  }
}

export function isAccompanimentOn(): boolean {
  return stopAccomp !== null
}
// —— 木琴音色 ——
let xylophoneSynth: PolySynth | null = null

function getXylophoneSynth(): PolySynth {
  if (!xylophoneSynth) {
    xylophoneSynth = new PolySynth(Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.5 },
    }).toDestination()
    xylophoneSynth.volume.value = -4
  }
  return xylophoneSynth
}

/** 播放木琴音 */
export function playXylophone(note: string): void {
  getXylophoneSynth().triggerAttackRelease(note, '8n')
}

// —— 全局停止：切换页面时调用，确保没有后台音频残留 ——
export function stopAllAudio(): void {
  stopMetronome()
  stopAccompaniment()
  stopAllTransportLoops() // 兜底：停掉鼓机/混音等所有 Transport 循环
  setSustain(false)
  // 释放所有持续中的合成器音
  try {
    pianoSampler?.releaseAll?.()
    pianoFallback?.releaseAll?.()
    for (const p of Object.keys(synths) as Exclude<TonePatch, 'piano'>[]) {
      synths[p]?.releaseAll?.()
    }
  } catch {
    /* ignore */
  }
}
