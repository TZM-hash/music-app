import { useState, type KeyboardEvent } from 'react'
import { ensureAudio, playNote } from '../../music/audioEngine'
import type { JourneyStepId, ReferenceActivity } from '../../music/referenceCourseware'

interface RhythmBuilderActivityProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}

const CARDS = ['X', 'XX', '—']

export default function RhythmBuilderActivity({ onEvidence, onStepComplete }: RhythmBuilderActivityProps) {
  const [pattern, setPattern] = useState<string[]>([])
  const [notice, setNotice] = useState('选择节奏卡，再听听它怎样走。')

  const tap = async (card: string) => {
    setPattern((current) => [...current, card].slice(-8))
    try {
      if (!(await ensureAudio())) {
        setNotice('设备暂时没有发出声音，但仍可以继续拼节奏。')
        return
      }
      if (card !== '—') playNote(card === 'X' ? 'C4' : 'E4', card === 'X' ? '8n' : '16n', 0.7)
      setNotice(`加入了 ${card}，留意它和前一张卡的长短差别。`)
    } catch {
      setNotice('设备暂时没有发出声音，但仍可以继续拼节奏。')
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target
    if (
      event.code === 'Space' &&
      !event.repeat &&
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLTextAreaElement) &&
      !(target instanceof HTMLSelectElement)
    ) {
      event.preventDefault()
      void tap('X')
    }
  }

  const submitPattern = () => {
    if (pattern.length === 0) {
      setNotice('先选择至少一张节奏卡。')
      return
    }
    const value = pattern.join(' ')
    onEvidence(value)
    onStepComplete('try')
    setNotice('你的节奏已经留下，可以再听一次或继续创编。')
  }

  return (
    <section className="reference-activity" tabIndex={0} onKeyDown={handleKeyDown} aria-labelledby="rhythm-builder-title">
      <span className="reference-activity__eyebrow">节奏工作台</span>
      <h2 id="rhythm-builder-title">用节奏卡搭一条小路</h2>
      <div className="reference-activity__rhythm-cards">
        {CARDS.map((card) => (
          <button type="button" key={card} onClick={() => void tap(card)}>
            <strong>{card}</strong>
            <small>节奏卡</small>
          </button>
        ))}
      </div>
      <p className="reference-activity__pattern" aria-label="当前节奏">
        {pattern.length > 0 ? pattern.join(' · ') : '还没有节奏卡'}
      </p>
      <div className="reference-activity__actions">
        <button type="button" className="primary" onClick={submitPattern}>
          听听我的节奏
        </button>
        <span>也可以按 Space 敲一下 X</span>
      </div>
      <p className="reference-activity__live" aria-live="polite">
        {notice}
      </p>
    </section>
  )
}
