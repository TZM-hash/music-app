// 音频引擎 2.0：音色切换 · 和弦 · 太鼓音效 · 节拍器
import * as Tone from 'tone'

let started = false

export async function ensureAudio(): Promise<void> {
  if (started) return
  await Tone.start()
  started = true
}

// —— 音色系统 ——
export type TonePatch = 'piano' | 'musicbox' | 'strings' | 'organ'
let currentPatch: TonePatch = 'piano'
let currentVolume = -6

// 钢琴：真实采样(Salamander Grand)优先，加载失败/离线降级为增强合成
export type PianoLoadState = 'idle' | 'loading' | 'sampled' | 'fallback'
let pianoLoadState: PianoLoadState = 'idle'
let pianoLoadListeners: ((s: PianoLoadState) => void)[] = []
let pianoSampler: Tone.Sampler | null = null
let pianoFallback: Tone.PolySynth | null = null
let pianoReverb: Tone.Reverb | null = null

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

function buildPianoFallback(): Tone.PolySynth {
  // 增强合成：FM 合成 + 轻微 lowpass，比纯三角波温暖厚实
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2.5,
    modulationIndex: 6,
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.004, decay: 0.5, sustain: 0.25, release: 1.4 },
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 0.002, decay: 0.35, sustain: 0.1, release: 0.6 },
  })
  return synth
}

/** 预加载钢琴采样（在用户首次进入钢琴页时调用） */
export function preloadPiano(): void {
  if (pianoLoadState !== 'idle') return
  setPianoState('loading')

  // 混响让钢琴更有空间感
  pianoReverb = new Tone.Reverb({ decay: 1.6, wet: 0.18 }).toDestination()
  pianoFallback = buildPianoFallback().connect(pianoReverb)
  pianoFallback.volume.value = currentVolume

  // Salamander Grand Piano 采样（Tone.js 官方 CDN 示例音源）
  try {
    pianoSampler = new Tone.Sampler({
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
function getPianoVoice(): Tone.Sampler | Tone.PolySynth {
  if (pianoLoadState === 'idle') preloadPiano()
  if (pianoSampler && pianoLoadState === 'sampled') return pianoSampler
  return pianoFallback ?? (pianoFallback = buildPianoFallback().toDestination())
}

// 其它音色仍用 PolySynth
const synths: Record<Exclude<TonePatch, 'piano'>, Tone.PolySynth | null> = {
  musicbox: null,
  strings: null,
  organ: null,
}

function getOtherSynth(patch: Exclude<TonePatch, 'piano'>): Tone.PolySynth {
  if (!synths[patch]) {
    const vol = currentVolume
    switch (patch) {
      case 'musicbox':
        synths.musicbox = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.002, decay: 0.1, sustain: 0, release: 0.6 },
        }).toDestination()
        synths.musicbox.volume.value = vol - 6
        break
      case 'strings':
        synths.strings = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.3, decay: 0.4, sustain: 0.6, release: 1.8 },
        }).toDestination()
        synths.strings.volume.value = vol - 4
        break
      case 'organ':
        synths.organ = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'fmsine' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 },
        }).toDestination()
        synths.organ.volume.value = vol - 2
        break
    }
  }
  return synths[patch]!
}

export function setPatch(patch: TonePatch): void {
  currentPatch = patch
}

export function setVolume(v: number): void {
  currentVolume = v
  if (pianoFallback) pianoFallback.volume.value = v
  if (pianoSampler) pianoSampler.volume.value = v
  for (const p of Object.keys(synths) as Exclude<TonePatch, 'piano'>[]) {
    if (synths[p]) synths[p]!.volume.value = v
  }
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
const physicallyHeld = new Set<string>()

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
    physicallyHeld.add(note)
    getPianoVoice().triggerAttack(note, undefined, velocity)
  } else {
    getOtherSynth(p).triggerAttack(note, undefined, velocity)
  }
}

export function releaseNote(note: string, patch?: TonePatch): void {
  const p = patch ?? currentPatch
  if (p === 'piano') {
    physicallyHeld.delete(note)
    // 无论是否延音都触发释放；release 时长决定余音长度（延音开=长，关=短）
    getPianoVoice().triggerRelease(note)
  } else {
    getOtherSynth(p).triggerRelease(note)
  }
}

/** 播放一个三和弦 */
export function playChord(root: string, quality: 'maj' | 'min', duration = '2n'): void {
  const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = parseInt(root.slice(-1), 10)
  const name = root.slice(0, -1)
  const idx = chromatic.indexOf(name)
  if (idx < 0) return
  const third = quality === 'maj' ? 4 : 3
  const fifth = 7
  const notes = [
    root,
    `${chromatic[(idx + third) % 12]}${octave + Math.floor((idx + third) / 12)}`,
    `${chromatic[(idx + fifth) % 12]}${octave + Math.floor((idx + fifth) / 12)}`,
  ]
  if (currentPatch === 'piano') {
    getPianoVoice().triggerAttackRelease(notes, duration)
  } else {
    getOtherSynth(currentPatch).triggerAttackRelease(notes, duration)
  }
}

// —— 打击乐 ——
type DrumKind = 'kick' | 'snare' | 'hihat' | 'tom' | 'clap' | 'crash'

let kick: Tone.MembraneSynth | null = null
let snare: Tone.NoiseSynth | null = null
let hihat: Tone.MetalSynth | null = null
let tom: Tone.MembraneSynth | null = null
let crash: Tone.MetalSynth | null = null

function initDrums() {
  if (kick) return
  // 底鼓：低频冲击 + 弹性
  kick = new Tone.MembraneSynth({
    octaves: 8,
    pitchDecay: 0.06,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 },
  }).toDestination()
  kick.volume.value = -2

  // 嗵鼓
  tom = new Tone.MembraneSynth({
    octaves: 4,
    pitchDecay: 0.1,
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
  }).toDestination()
  tom.volume.value = -4

  // 军鼓：白噪声 + body 共鸣
  snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
  }).toDestination()
  snare.volume.value = -6

  // 踩镲：更清脆
  hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
    harmonicity: 6.1,
    resonance: 5000,
  }).toDestination()
  hihat.volume.value = -14

  // 吊镲：更持久的 shimmer
  crash = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 1.2, release: 0.4 },
    harmonicity: 5.1,
    resonance: 3500,
  }).toDestination()
  crash.volume.value = -14
}

export function playDrum(kind: DrumKind): void {
  initDrums()
  switch (kind) {
    case 'kick':
      kick!.triggerAttackRelease('C1', '8n')
      break
    case 'tom':
      tom!.triggerAttackRelease('G2', '8n')
      break
    case 'snare':
    case 'clap':
      snare!.triggerAttackRelease('8n', Tone.now())
      break
    case 'hihat':
      hihat!.triggerAttackRelease('C6', '16n')
      break
    case 'crash':
      crash!.triggerAttackRelease('C6', '2n')
      break
  }
}
export type { DrumKind }

// —— 太鼓音效（咚/咔） ——
let donSynth: Tone.MembraneSynth | null = null
let kaSynth: Tone.NoiseSynth | null = null

export function taikoDON(): void {
  if (!donSynth) {
    donSynth = new Tone.MembraneSynth({
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
    kaSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0 },
    }).toDestination()
    kaSynth.volume.value = -3
  }
  kaSynth.triggerAttackRelease('8n', Tone.now())
}

// —— 节拍器 ——
let metroId: number | null = null
let metroClick: Tone.MembraneSynth | null = null

export function startMetronome(bpm: number, onBeat?: (beat: number) => void): void {
  stopMetronome()
  if (!metroClick) {
    metroClick = new Tone.MembraneSynth({ octaves: 2, pitchDecay: 0.008 }).toDestination()
    metroClick.volume.value = -8
  }
  const interval = (60 / bpm) * 1000
  let beat = 0
  const tick = () => {
    metroClick!.triggerAttackRelease(beat % 4 === 0 ? 'C4' : 'C3', '32n')
    onBeat?.(beat % 4)
    beat++
  }
  tick()
  metroId = window.setInterval(tick, interval)
}

export function stopMetronome(): void {
  if (metroId !== null) {
    window.clearInterval(metroId)
    metroId = null
  }
}

/** 播放一个预设的打击节奏循环（回调每次 tick 返回当前步序号） */
export function playDrumLoop(
  pattern: ('kick' | 'snare' | 'hihat' | null)[],
  bpm: number,
  onStep?: (step: number) => void
): () => void {
  const interval = (60 / bpm / 4) * 1000 // 16分音符
  let step = 0
  const id = window.setInterval(() => {
    const hit = pattern[step % pattern.length]
    if (hit) playDrum(hit)
    onStep?.(step % pattern.length)
    step++
  }, interval)
  return () => window.clearInterval(id)
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

const mixSynths: Partial<Record<VoiceKind, Tone.PolySynth | Tone.Synth>> = {}

function getMixSynth(kind: VoiceKind): Tone.PolySynth | Tone.Synth {
  if (mixSynths[kind]) return mixSynths[kind]!
  let s: Tone.PolySynth | Tone.Synth
  switch (kind) {
    case 'bass':
      s = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4 } }).toDestination()
      break
    case 'bell':
      s = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.002, decay: 0.3, sustain: 0, release: 0.5 } }).toDestination()
      break
    case 'pluck':
      s = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.002, decay: 0.15, sustain: 0, release: 0.2 } }).toDestination()
      break
    case 'marimba':
      s = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 } }).toDestination()
      break
    case 'synth':
      s = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 } }).toDestination()
      break
    case 'organ2':
      s = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fmsine' }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 } }).toDestination()
      break
    default: // piano
      s = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.3, sustain: 0.3, release: 0.8 } }).toDestination()
  }
  mixSynths[kind] = s
  return s
}

/** 混音器触发一个音源的一步（可指定音高、音量 dB） */
export function triggerVoice(kind: VoiceKind, note: string, volumeDb: number): void {
  if (kind === 'kick' || kind === 'snare' || kind === 'hihat' || kind === 'tom' || kind === 'crash' || kind === 'clap') {
    playDrum(kind === 'clap' ? 'clap' : kind)
    return
  }
  const synth = getMixSynth(kind)
  synth.volume.value = volumeDb
  synth.triggerAttackRelease(note, '16n')
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

let accompId: number | null = null
let padSynth: Tone.PolySynth | null = null
let bassSynth: Tone.Synth | null = null

const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
function chordNotes(root: string, quality: 'maj' | 'min'): string[] {
  const octave = parseInt(root.slice(-1), 10)
  const idx = chromaticScale.indexOf(root.slice(0, -1))
  if (idx < 0) return [root]
  const third = quality === 'maj' ? 4 : 3
  return [
    root,
    `${chromaticScale[(idx + third) % 12]}${octave + Math.floor((idx + third) / 12)}`,
    `${chromaticScale[(idx + 7) % 12]}${octave + Math.floor((idx + 7) / 12)}`,
  ]
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
        const pc = chromaticScale.indexOf(m[1])
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
    padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.08, decay: 0.3, sustain: 0.5, release: 0.8 },
    }).toDestination()
    padSynth.volume.value = -18
  }
  if (!bassSynth) {
    bassSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.3 },
    }).toDestination()
    bassSynth.volume.value = -14
  }
  const beatMs = (60 / bpm) * 1000
  const sixteenth = beatMs / 4
  let sixteenthCount = 0
  const tick = () => {
    const step16 = sixteenthCount % 16
    const barIndex = Math.floor(sixteenthCount / 16) % chords.length
    const ch = chords[barIndex]

    if (step16 === 0) {
      padSynth!.triggerAttackRelease(chordNotes(ch.root, ch.quality), (beatMs * 3.6) / 1000)
      bassSynth!.triggerAttackRelease(bassOf(ch.root), (beatMs * 0.9) / 1000)
    }
    if (step16 === 8) {
      bassSynth!.triggerAttackRelease(bassOf(ch.root), (beatMs * 0.9) / 1000)
    }

    if (step16 % 8 === 0) playDrum('kick')
    if (step16 === 4 || step16 === 12) playDrum('snare')
    if (step16 % 2 === 0) playDrum('hihat')

    sixteenthCount++
  }
  accompId = window.setInterval(tick, sixteenth)
}

export function stopAccompaniment(): void {
  if (accompId !== null) {
    window.clearInterval(accompId)
    accompId = null
    padSynth?.releaseAll?.()
  }
}

export function isAccompanimentOn(): boolean {
  return accompId !== null
}
// —— 木琴音色 ——
let xylophoneSynth: Tone.PolySynth | null = null

function getXylophoneSynth(): Tone.PolySynth {
  if (!xylophoneSynth) {
    xylophoneSynth = new Tone.PolySynth(Tone.Synth, {
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
