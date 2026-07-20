// 麦克风音高检测：Web Audio + 自相关基频检测（纯前端，离线可用）

export interface PitchReading {
  /** 基频 Hz，未检测到为 -1 */
  freq: number
  /** 音名，如 C4；无则空串 */
  note: string
  /** 音分偏差 -50..50（相对最近音名） */
  cents: number
  /** 清晰度 0..1，越高越可信 */
  clarity: number
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** 频率 → 音名（含八度）+ 音分偏差 */
export function freqToNote(freq: number): { note: string; cents: number; midi: number } {
  const midiFloat = 69 + 12 * Math.log2(freq / 440)
  const midi = Math.round(midiFloat)
  const cents = Math.round((midiFloat - midi) * 100)
  const name = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  return { note: `${name}${octave}`, cents, midi }
}

/** 音名 → midi 号（如 C4=60） */
export function noteToMidi(note: string): number {
  const m = /^([A-G]#?)(-?\d)$/.exec(note)
  if (!m) return -1
  const idx = NOTE_NAMES.indexOf(m[1])
  const octave = parseInt(m[2], 10)
  return (octave + 1) * 12 + idx
}

export class PitchDetector {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private buf = new Float32Array(2048)
  private sampleRate = 44100

  /** 请求麦克风并开始。失败抛错，调用方需捕获给出友好提示 */
  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
    this.ctx = new AudioContext()
    this.sampleRate = this.ctx.sampleRate
    const source = this.ctx.createMediaStreamSource(this.stream)
    this.source = source
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.buf = new Float32Array(this.analyser.fftSize)
    source.connect(this.analyser)
  }

  stop(): void {
    // 断开音频图引用，保证 MediaStream / source 能被 GC
    try {
      this.source?.disconnect()
      this.analyser?.disconnect()
    } catch {
      /* ignore */
    }
    this.stream?.getTracks().forEach((t) => t.stop())
    this.ctx?.close().catch(() => undefined)
    this.ctx = null
    this.analyser = null
    this.source = null
    this.stream = null
  }

  /** 取一帧读数 */
  read(): PitchReading {
    if (!this.analyser) return { freq: -1, note: '', cents: 0, clarity: 0 }
    this.analyser.getFloatTimeDomainData(this.buf)
    const { freq, clarity } = autoCorrelate(this.buf, this.sampleRate)
    if (freq < 0) return { freq: -1, note: '', cents: 0, clarity }
    const { note, cents } = freqToNote(freq)
    return { freq, note, cents, clarity }
  }
}

// 自相关基频检测（McLeod 简化版）
function autoCorrelate(buf: Float32Array, sampleRate: number): { freq: number; clarity: number } {
  const SIZE = buf.length

  // 计算 RMS，太安静则视为无声
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) return { freq: -1, clarity: 0 }

  // 找首尾"明显有信号"的区段（阈值随 RMS 自适应），跳过静音头尾；
  // 之前逻辑反了（找的是第一个*低于*固定阈值的点），会把有效信号截断
  const thres = Math.max(0.02, rms * 0.6)
  let r1 = 0
  let r2 = SIZE - 1
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) >= thres) {
      r1 = i
      break
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) >= thres) {
      r2 = SIZE - i
      break
    }
  }
  const trimmed = buf.subarray(r1, r2)
  const n = trimmed.length

  // 只计算人声范围内的 lag（70Hz–1100Hz），省去大量无用的自相关计算
  const minLag = Math.max(2, Math.floor(sampleRate / 1100))
  const maxLag = Math.min(n - 1, Math.ceil(sampleRate / 70))
  if (maxLag <= minLag) return { freq: -1, clarity: 0 }

  // 自相关（仅人声 lag 区间）
  const c = new Array(n).fill(0)
  let c0 = 0
  for (let i = 0; i < n; i++) c0 += trimmed[i] * trimmed[i]
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = 0; i < n - lag; i++) sum += trimmed[i] * trimmed[i + lag]
    c[lag] = sum
  }

  // 找第一个上升后的最大峰
  let d = minLag
  while (d < maxLag && c[d] > c[d + 1]) d++
  let maxval = -1
  let maxpos = -1
  for (let i = d; i <= maxLag; i++) {
    if (c[i] > maxval) {
      maxval = c[i]
      maxpos = i
    }
  }
  let T0 = maxpos
  if (T0 <= 0) return { freq: -1, clarity: 0 }

  // 抛物线插值提高精度
  const x1 = c[T0 - 1] ?? 0
  const x2 = c[T0]
  const x3 = c[T0 + 1] ?? 0
  const a = (x1 + x3 - 2 * x2) / 2
  const b = (x3 - x1) / 2
  if (a) T0 = T0 - b / (2 * a)

  const freq = sampleRate / T0
  // clarity 用真实零滞后能量（Σx²）归一；之前分母量纲不匹配，轻声演唱被系统性低估
  const clarity = Math.min(1, Math.max(0, maxval / (c0 || 1)))
  // 过滤人声范围外（约 70Hz–1100Hz）
  if (freq < 70 || freq > 1100) return { freq: -1, clarity }
  return { freq, clarity }
}
