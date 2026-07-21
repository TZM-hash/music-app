import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { ensureAudio, playXylophone } from '../music/audioEngine'
import { useApp } from '../state/appState'
import Visualizer, { useNoteBursts } from '../components/Visualizer'
import './xylophone.css'

interface XyloNote {
  note: string
  name: string
  jianpu: string
  key: string
  color: string
}

const NOTES: XyloNote[] = [
  { note: 'C4', name: 'C', jianpu: '1', key: 'a', color: '#007aff' },
  { note: 'D4', name: 'D', jianpu: '2', key: 's', color: '#34c759' },
  { note: 'E4', name: 'E', jianpu: '3', key: 'd', color: '#ff9500' },
  { note: 'F4', name: 'F', jianpu: '4', key: 'f', color: '#ff2d55' },
  { note: 'G4', name: 'G', jianpu: '5', key: 'g', color: '#af52de' },
  { note: 'A4', name: 'A', jianpu: '6', key: 'h', color: '#ff6b35' },
  { note: 'B4', name: 'B', jianpu: '7', key: 'j', color: '#5ac8fa' },
  { note: 'C5', name: 'C', jianpu: '1·', key: 'k', color: '#007aff' },
  { note: 'D5', name: 'D', jianpu: '2·', key: 'l', color: '#34c759' },
  { note: 'E5', name: 'E', jianpu: '3·', key: ';', color: '#ff9500' },
]

const SEMI_NOTES: XyloNote[] = [
  { note: 'C#4', name: 'C#', jianpu: '#1', key: 'w', color: '#0066cc' },
  { note: 'D#4', name: 'D#', jianpu: '#2', key: 'e', color: '#28a745' },
  { note: 'F#4', name: 'F#', jianpu: '#4', key: 't', color: '#cc2952' },
  { note: 'G#4', name: 'G#', jianpu: '#5', key: 'y', color: '#8b3dc7' },
  { note: 'A#4', name: 'A#', jianpu: '#6', key: 'u', color: '#cc5529' },
]

export default function Xylophone() {
  const { showNoteNames } = useApp()
  const [active, setActive] = useState<Set<string>>(new Set())
  const { bursts, push: pushBurst } = useNoteBursts()
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
    pushBurst(xPos, n.color, showNoteNames ? n.jianpu : '')
  }, [showNoteNames, pushBurst])

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
        <Visualizer bursts={bursts} />

        <div className="xylo-semi-row">
          {SEMI_NOTES.map((n) => (
            <button
              key={n.note}
              className={`xylo-semi-bar ${active.has(n.note) ? 'active' : ''}`}
              style={{ '--bar-color': n.color } as CSSProperties}
              aria-label={`半音琴条 ${n.name}（按键 ${n.key.toUpperCase()}）`}
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
              aria-label={`琴条 ${n.name}（简谱 ${n.jianpu}，按键 ${n.key.toUpperCase()}）`}
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
