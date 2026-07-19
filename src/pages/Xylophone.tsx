import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { ensureAudio, playXylophone } from '../music/audioEngine'
import { useApp } from '../state/appState'
import './xylophone.css'

interface XyloNote {
  note: string
  name: string
  jianpu: string
  key: string
  color: string
}

const NOTES: XyloNote[] = [
  { note: 'C4', name: 'C', jianpu: '1', key: 'a', color: '#22e5ff' },
  { note: 'D4', name: 'D', jianpu: '2', key: 's', color: '#3dffc0' },
  { note: 'E4', name: 'E', jianpu: '3', key: 'd', color: '#ffd60a' },
  { note: 'F4', name: 'F', jianpu: '4', key: 'f', color: '#ff4fa3' },
  { note: 'G4', name: 'G', jianpu: '5', key: 'g', color: '#a06bff' },
  { note: 'A4', name: 'A', jianpu: '6', key: 'h', color: '#ff8c42' },
  { note: 'B4', name: 'B', jianpu: '7', key: 'j', color: '#4fc3ff' },
  { note: 'C5', name: 'C', jianpu: '1·', key: 'k', color: '#22e5ff' },
  { note: 'D5', name: 'D', jianpu: '2·', key: 'l', color: '#3dffc0' },
  { note: 'E5', name: 'E', jianpu: '3·', key: ';', color: '#ffd60a' },
]

const SEMI_NOTES: XyloNote[] = [
  { note: 'C#4', name: 'C#', jianpu: '#1', key: 'w', color: '#1ab8cc' },
  { note: 'D#4', name: 'D#', jianpu: '#2', key: 'e', color: '#2cd4a0' },
  { note: 'F#4', name: 'F#', jianpu: '#4', key: 't', color: '#d43d80' },
  { note: 'G#4', name: 'G#', jianpu: '#5', key: 'y', color: '#8055cc' },
  { note: 'A#4', name: 'A#', jianpu: '#6', key: 'u', color: '#cc7035' },
]

export default function Xylophone() {
  const { showNoteNames } = useApp()
  const [active, setActive] = useState<Set<string>>(new Set())
  const [bursts, setBursts] = useState<{ id: number; x: number; color: string; label: string }[]>([])
  const burstId = useRef(0)
  const timers = useRef<Record<string, number>>({})

  const strike = useCallback(async (n: XyloNote) => {
    await ensureAudio()
    playXylophone(n.note)
    setActive((s) => new Set(s).add(n.note))
    window.clearTimeout(timers.current[n.note])
    timers.current[n.note] = window.setTimeout(() => {
      setActive((s) => {
        const next = new Set(s)
        next.delete(n.note)
        return next
      })
    }, 300)

    const barIndex = NOTES.findIndex((x) => x.note === n.note)
    const xPos = barIndex >= 0 ? (barIndex + 0.5) / NOTES.length : 0.5
    const id = burstId.current++
    setBursts((b) => [...b, { id, x: xPos, color: n.color, label: showNoteNames ? n.jianpu : '' }])
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 900)
  }, [showNoteNames])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      const all = [...NOTES, ...SEMI_NOTES]
      const n = all.find((x) => x.key === e.key.toLowerCase())
      if (n) {
        e.preventDefault()
        strike(n)
      }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [strike])

  return (
    <div className="instrument-wrap">
      <div className="instrument-toolbar">
        <span className="hint">💡 点击琴条或用键盘 A-L 演奏，W-U 为半音</span>
      </div>

      <div className="xylo-stage">
        <div className="viz-layer">
          {bursts.map((b) => (
            <XyloBubble key={b.id} burst={b} />
          ))}
        </div>

        <div className="xylo-semi-row">
          {SEMI_NOTES.map((n) => (
            <button
              key={n.note}
              className={`xylo-semi-bar ${active.has(n.note) ? 'active' : ''}`}
              style={{ '--bar-color': n.color } as CSSProperties}
              onPointerDown={() => strike(n)}
            >
              {showNoteNames && <small>{n.name}</small>}
            </button>
          ))}
        </div>

        <div className="xylo-bars">
          {NOTES.map((n) => (
            <button
              key={n.note}
              className={`xylo-bar ${active.has(n.note) ? 'active' : ''}`}
              style={{ '--bar-color': n.color } as CSSProperties}
              onPointerDown={() => strike(n)}
            >
              <span className="xylo-bar-label">
                {showNoteNames && <b>{n.jianpu}</b>}
                {showNoteNames && <small>{n.name}</small>}
              </span>
              <span className="rk-key">{n.key.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function XyloBubble({ burst }: { burst: { id: number; x: number; color: string; label: string } }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%, -180px) scale(1.4)'
      el.style.opacity = '0'
    })
  }, [])
  return (
    <div
      ref={ref}
      className="viz-bubble"
      style={{
        left: `${burst.x * 100}%`,
        background: burst.color,
        boxShadow: `0 0 30px ${burst.color}`,
      }}
    >
      {burst.label}
    </div>
  )
}
