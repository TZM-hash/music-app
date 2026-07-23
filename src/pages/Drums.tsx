import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureAudio, playDrum, DrumKind, startTransportLoop, scheduleVisual } from '../music/audioEngine'
import { useMounted } from '../hooks/useTimers'
import './drums.css'

interface Pad {
  kind: DrumKind
  label: string
  key: string
  color: string
}

const PADS: Pad[] = [
  { kind: 'crash', label: '吊镲', key: 'q', color: '#f6c945' },
  { kind: 'hihat', label: '踩镲', key: 'w', color: '#ffd43b' },
  { kind: 'tom', label: '嗵鼓', key: 'e', color: '#69db7c' },
  { kind: 'snare', label: '军鼓', key: 's', color: '#4dabf7' },
  { kind: 'kick', label: '底鼓', key: ' ', color: '#ff6b6b' },
]

// 循环机的三条轨
const SEQ_TRACKS: { kind: 'kick' | 'snare' | 'hihat'; label: string; color: string }[] = [
  { kind: 'hihat', label: '踩镲', color: '#ffd43b' },
  { kind: 'snare', label: '军鼓', color: '#4dabf7' },
  { kind: 'kick', label: '底鼓', color: '#ff6b6b' },
]

const STEPS = 16
type Grid = Record<'kick' | 'snare' | 'hihat', boolean[]>

const emptyGrid = (): Grid => ({
  kick: Array(STEPS).fill(false),
  snare: Array(STEPS).fill(false),
  hihat: Array(STEPS).fill(false),
})

// 预设节奏型
const PRESETS: { name: string; grid: () => Grid }[] = [
  {
    name: '摇滚 Rock',
    grid: () => ({
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0].map(Boolean),
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0].map(Boolean),
    }),
  },
  {
    name: '放克 Funk',
    grid: () => ({
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0].map(Boolean),
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1].map(Boolean),
      hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map(Boolean),
    }),
  },
  {
    name: '迪斯科 Disco',
    grid: () => ({
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
      hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0].map(Boolean),
    }),
  },
]

export default function Drums() {
  const [hit, setHit] = useState<string | null>(null)
  const timers = useRef<Record<string, number>>({})

  // 循环机状态
  const [grid, setGrid] = useState<Grid>(() => PRESETS[0].grid())
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpm] = useState(100)
  const [curStep, setCurStep] = useState(-1)
  const gridRef = useRef(grid)
  const stopRef = useRef<(() => void) | null>(null)
  const mounted = useMounted()
  gridRef.current = grid

  const strike = useCallback(async (kind: DrumKind) => {
    await ensureAudio()
    playDrum(kind)
    setHit(kind)
    window.clearTimeout(timers.current[kind])
    timers.current[kind] = window.setTimeout(() => setHit(null), 120)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      const pad = PADS.find((p) => p.key === e.key.toLowerCase())
      if (pad) {
        e.preventDefault()
        strike(pad.kind)
      }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [strike])

  const toggleCell = (kind: 'kick' | 'snare' | 'hihat', step: number) => {
    setGrid((g) => {
      const next = { ...g, [kind]: [...g[kind]] }
      next[kind][step] = !next[kind][step]
      return next
    })
  }

  const togglePlay = async () => {
    await ensureAudio()
    if (!mounted.current) return
    if (playing) {
      stopRef.current?.()
      stopRef.current = null
      setPlaying(false)
      setCurStep(-1)
      return
    }
    // 跑在 Tone.Transport 上：采样级精确，切后台自动暂停
    let step = 0
    stopRef.current = startTransportLoop(bpm, '16n', (time) => {
      const g = gridRef.current
      if (g.kick[step]) playDrum('kick', time)
      if (g.snare[step]) playDrum('snare', time)
      if (g.hihat[step]) playDrum('hihat', time)
      const s = step
      scheduleVisual(() => {
        if (mounted.current) setCurStep(s)
      }, time)
      step = (step + 1) % STEPS
    })
    setPlaying(true)
  }

  // 卸载/切页时停止循环并重置 UI 状态
  useEffect(
    () => () => {
      stopRef.current?.()
      stopRef.current = null
    },
    []
  )

  // 卸载时清除鼓面高亮复位定时器，避免切页后 setHit 报错
  useEffect(() => {
    const timersMap = timers.current
    return () => {
      Object.values(timersMap).forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const hasAnyStep = () => Object.values(gridRef.current).some((steps) => steps.some(Boolean))
  const applyPreset = (i: number) => {
    const preset = PRESETS[i]
    if (hasAnyStep() && !window.confirm(`确定用「${preset.name}」替换当前鼓机循环吗？`)) return
    setGrid(preset.grid())
  }
  const clearGrid = () => {
    if (!hasAnyStep()) return
    if (!window.confirm('确定清空当前鼓机循环吗？')) return
    setGrid(emptyGrid())
  }

  return (
    <div className="instrument-wrap">
      <div className="instrument-toolbar">
        <span className="hint">💡 上方鼓面可点击/键盘(Q W E S 空格)敲击；下方是节奏循环机</span>
      </div>

      {/* 鼓面 */}
      <div className="drum-kit compact">
        {PADS.map((p) => (
          <button
            key={p.kind}
            className={`drum-pad ${p.kind} ${hit === p.kind ? 'hit' : ''}`}
            style={{ '--pad-color': p.color } as React.CSSProperties}
            aria-label={`鼓面 ${p.label}（按键 ${p.key === ' ' ? '空格' : p.key.toUpperCase()}）`}
            onPointerDown={() => strike(p.kind)}
          >
            <span className="drum-label">{p.label}</span>
            <span className="drum-key">{p.key === ' ' ? '空格' : p.key.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* 循环机 */}
      <div className="sequencer card">
        <div className="seq-toolbar">
          <button className={`seq-play ${playing ? 'on' : ''}`} onClick={togglePlay}>
            {playing ? '⏹ 停止' : '▶ 播放循环'}
          </button>
          <div className="ctrl-group">
            <span className="ctrl-label">速度 {bpm}</span>
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              aria-label="循环速度"
              onChange={(e) => setBpm(Number(e.target.value))}
            />
          </div>
          <div className="seq-presets">
            <span className="ctrl-label">节奏型：</span>
            {PRESETS.map((p, i) => (
              <button key={p.name} className="preset-btn" onClick={() => applyPreset(i)}>
                {p.name}
              </button>
            ))}
            <button className="preset-btn clear" onClick={clearGrid}>
              清空
            </button>
          </div>
        </div>

        <div className="seq-grid">
          {SEQ_TRACKS.map((track) => (
            <div key={track.kind} className="seq-row">
              <div className="seq-row-label" style={{ color: track.color }}>
                {track.label}
              </div>
              <div className="seq-cells">
                {grid[track.kind].map((on, step) => (
                  <button
                    key={step}
                    className={`seq-cell ${on ? 'on' : ''} ${curStep === step ? 'cur' : ''} ${
                      step % 4 === 0 ? 'beat' : ''
                    }`}
                    style={on ? { background: track.color } : undefined}
                    aria-label={`${track.label} 第 ${step + 1} 步${on ? '（已启用）' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleCell(track.kind, step)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
