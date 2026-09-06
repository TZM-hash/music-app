import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ensureAudio, playNote, stopAllAudio } from '../music/audioEngine'
import { type MusicDiscoveryToolNote, type RhythmPattern } from '../music/explorationTools'
import './explorationTools.css'

export interface RhythmMovementLabProps {
  pattern: RhythmPattern
  onNote: (note: MusicDiscoveryToolNote) => void
  onReturn: () => void
}

const MOVEMENT_WORDS = ['走', '跳', '摇', '停', '推', '拉']

export default function RhythmMovementLab({ pattern, onNote, onReturn }: RhythmMovementLabProps) {
  const [movement, setMovement] = useState(
    pattern.movementWords.find((word) => MOVEMENT_WORDS.includes(word)) ?? '走'
  )
  const [tapTimes, setTapTimes] = useState<number[]>([])
  const [observation, setObservation] = useState('')
  const [saveNotice, setSaveNotice] = useState('')
  const [feedback, setFeedback] = useState('可以再听')
  const startedAt = useRef<number | null>(null)
  const lastTapAt = useRef<number | null>(null)
  const beatMs = 60000 / Math.max(pattern.bpm, 1)

  useEffect(() => () => stopAllAudio(), [])

  const beatTimeline = useMemo(() => {
    let cursor = 0
    return pattern.steps.map((step, index) => {
      const item = { ...step, index, start: cursor }
      cursor += step.beats
      return item
    })
  }, [pattern.steps])

  const recordTap = (timestamp = performance.now()) => {
    if (lastTapAt.current !== null && timestamp - lastTapAt.current < 80) return
    if (startedAt.current === null) startedAt.current = timestamp
    lastTapAt.current = timestamp
    setTapTimes((current) => [...current, timestamp].slice(-12))
    const elapsed = timestamp - startedAt.current
    const nearestBeat = Math.round(elapsed / beatMs) * beatMs
    const distance = Math.abs(elapsed - nearestBeat)
    setFeedback(
      distance < beatMs * 0.12 ? '很稳定' : distance < beatMs * 0.3 ? '正在靠近' : '可以再听'
    )
    void ensureAudio().then((ready) => {
      if (ready) playNote('C4', '16n', 0.75, 'piano')
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault()
      recordTap()
    }
  }

  const saveObservation = () => {
    if (!observation.trim() && tapTimes.length === 0) return
    onNote({ toolId: 'rhythm', observation: observation.trim(), evidence: [movement, feedback] })
    setSaveNotice('我的观察已经保存。')
  }

  return (
    <section
      className="rhythm-movement-lab"
      aria-labelledby="rhythm-movement-lab-title"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <header className="rhythm-movement-lab__header">
        <div>
          <span className="rhythm-movement-lab__eyebrow">再听工具 · 节奏与动作工作台</span>
          <h1 id="rhythm-movement-lab-title">让身体靠近稳定拍</h1>
          <p>跟着稳定的拍点点击或按 Space，观察自己的动作如何靠近音乐。</p>
        </div>
        <button type="button" className="rhythm-movement-lab__return" onClick={() => onReturn()}>
          回到作品再听
        </button>
      </header>
      <div className="rhythm-movement-lab__layout">
        <main>
          <div className="rhythm-movement-lab__section-heading">
            <span>稳定拍时间线</span>
            <small>
              {pattern.bpm} BPM · {pattern.beatsPerBar} 拍
            </small>
          </div>
          <div className="rhythm-movement-lab__timeline" aria-label="稳定拍时间线">
            {beatTimeline.map((step) => (
              <div className={step.accent ? 'accent' : ''} key={`${step.index}-${step.label}`}>
                <b>{step.index + 1}</b>
                <span>{step.label}</span>
                <small>{step.beats} 拍</small>
              </div>
            ))}
          </div>
          <button type="button" className="rhythm-movement-lab__tap" onClick={() => recordTap()}>
            点击记录动作
          </button>
          <p className="rhythm-movement-lab__record">
            已记录 {tapTimes.length} 次 · {feedback}
          </p>
          <p className="rhythm-movement-lab__live" aria-live="polite">
            {feedback}
          </p>
        </main>
        <aside className="rhythm-movement-lab__movement">
          <h2>动作词</h2>
          <div>
            {pattern.movementWords.map((word) => (
              <button
                type="button"
                key={word}
                className={movement === word ? 'selected' : ''}
                aria-pressed={movement === word}
                onClick={() => setMovement(word)}
              >
                {word}
              </button>
            ))}
          </div>
          <p>现在的动作：{movement}</p>
          <label className="rhythm-movement-lab__field">
            <span>我的观察</span>
            <textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              maxLength={160}
              placeholder="我感到……"
            />
          </label>
          <button
            type="button"
            className="rhythm-movement-lab__save"
            disabled={!observation.trim() && tapTimes.length === 0}
            onClick={saveObservation}
          >
            保存我的观察
          </button>
          {saveNotice && <p aria-live="polite">{saveNotice}</p>}
        </aside>
      </div>
    </section>
  )
}
