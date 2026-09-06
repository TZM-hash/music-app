import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ensureAudio, playInstrumentSound, stopAllAudio } from '../../music/audioEngine'
import type { JourneyStepId, ReferenceActivity } from '../../music/referenceCourseware'

interface RhythmBuilderActivityProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}

const CARDS = ['X', 'XX', '—']

export default function RhythmBuilderActivity({
  onEvidence,
  onStepComplete,
}: RhythmBuilderActivityProps) {
  const [pattern, setPattern] = useState<string[]>([])
  const [notice, setNotice] = useState('选择节奏卡，再听听它怎样走。')
  const [isPlaying, setIsPlaying] = useState(false)
  const playbackToken = useRef(0)
  const playbackTimer = useRef<number | null>(null)
  const playbackResolve = useRef<(() => void) | null>(null)

  const stopPatternPlayback = () => {
    playbackToken.current += 1
    if (playbackTimer.current !== null) {
      window.clearTimeout(playbackTimer.current)
      playbackTimer.current = null
    }
    playbackResolve.current?.()
    playbackResolve.current = null
    setIsPlaying(false)
  }

  useEffect(() => stopPatternPlayback, [])

  const tap = async (card: string) => {
    setPattern((current) => [...current, card].slice(-8))
    try {
      if (!(await ensureAudio())) {
        setNotice('设备暂时没有发出声音，但仍可以继续拼节奏。')
        return
      }
      if (card !== '—') {
        playInstrumentSound(
          'woodblock',
          card === 'X' ? 'C4' : 'E4',
          card === 'X' ? '8n' : '16n',
          0.7
        )
      }
      setNotice(`加入了 ${card}，留意它和前一张卡的长短差别。`)
    } catch {
      setNotice('设备暂时没有发出声音，但仍可以继续拼节奏。')
    }
  }

  const playPattern = async (playbackPattern: string[]): Promise<boolean> => {
    stopPatternPlayback()
    const token = playbackToken.current
    if (!(await ensureAudio())) {
      setNotice('设备暂时没有发出声音，但仍可以观察这条节奏。')
      return false
    }
    stopAllAudio()
    setIsPlaying(true)
    setNotice('正在播放你的节奏，请听每一格之间的停顿。')
    try {
      const patternToPlay = playbackPattern
      for (const card of patternToPlay) {
        if (token !== playbackToken.current) return false
        if (card !== '—') {
          playInstrumentSound(
            'woodblock',
            card === 'X' ? 'C4' : 'E4',
            card === 'X' ? '8n' : '16n',
            0.78
          )
        }
        await new Promise<void>((resolve) => {
          playbackResolve.current = resolve
          playbackTimer.current = window.setTimeout(
            () => {
              playbackTimer.current = null
              playbackResolve.current = null
              resolve()
            },
            card === 'XX' ? 260 : 520
          )
        })
      }
      if (token !== playbackToken.current) return false
      setNotice('播放完成：你可以听出每个敲击和休止的位置了吗？')
      return true
    } finally {
      if (token === playbackToken.current) {
        playbackTimer.current = null
        setIsPlaying(false)
      }
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

  const submitPattern = async () => {
    if (pattern.length === 0) {
      setNotice('先选择至少一张节奏卡。')
      return
    }
    const completed = await playPattern(pattern)
    if (!completed) return
    const value = pattern.join(' ')
    onEvidence(value)
    onStepComplete('try')
    setNotice('你的节奏已经留下，可以再听一次或继续创编。')
  }

  return (
    <section
      className="reference-activity"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-labelledby="rhythm-builder-title"
    >
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
        <button
          type="button"
          className="primary"
          onClick={() => void submitPattern()}
          disabled={isPlaying}
        >
          {isPlaying ? '正在播放…' : '听听我的节奏'}
        </button>
        <span>也可以按 Space 敲一下 X</span>
      </div>
      <p className="reference-activity__live" aria-live="polite">
        {notice}
      </p>
    </section>
  )
}
