import { useCallback, useEffect, useRef, useState } from 'react'
import {
  attackInstrumentSound,
  ensureAudio,
  playInstrumentSound,
  releaseInstrumentSound,
  stopAllAudio,
} from '../music/audioEngine'
import {
  INSTRUMENT_SOUND_INFO,
  type InstrumentInteraction,
  type InstrumentSoundId,
} from '../music/instrumentSounds'
import Visualizer, { useNoteBursts } from '../components/Visualizer'
import { useApp } from '../state/appState'
import './instrumentSound.css'

interface InstrumentSoundPageProps {
  instrument: InstrumentSoundId
}

interface PlayableNote {
  note: string
  name: string
  jianpu: string
  key: string
  color?: string
}

interface DrumPad {
  note: string
  label: string
  key: string
  icon: string
}

interface FingeringNote extends PlayableNote {
  holes: boolean[]
  thumb: boolean
}

const KEYBOARD_NOTES: PlayableNote[] = [
  { note: 'C3', name: 'C', jianpu: '1↓', key: 'a', color: '#4f72d8' },
  { note: 'D3', name: 'D', jianpu: '2↓', key: 's', color: '#3b9d88' },
  { note: 'E3', name: 'E', jianpu: '3↓', key: 'd', color: '#e99b48' },
  { note: 'F3', name: 'F', jianpu: '4↓', key: 'f', color: '#dc6683' },
  { note: 'G3', name: 'G', jianpu: '5↓', key: 'g', color: '#9371c9' },
  { note: 'A3', name: 'A', jianpu: '6↓', key: 'h', color: '#df7b50' },
  { note: 'B3', name: 'B', jianpu: '7↓', key: 'j', color: '#56a9c9' },
  { note: 'C4', name: 'C', jianpu: '1', key: 'k', color: '#4f72d8' },
  { note: 'D4', name: 'D', jianpu: '2', key: 'l', color: '#3b9d88' },
  { note: 'E4', name: 'E', jianpu: '3', key: ';', color: '#e99b48' },
]

const MALLET_NOTES: PlayableNote[] = [
  { note: 'C4', name: 'C', jianpu: '1', key: 'a', color: '#4f72d8' },
  { note: 'D4', name: 'D', jianpu: '2', key: 's', color: '#3b9d88' },
  { note: 'E4', name: 'E', jianpu: '3', key: 'd', color: '#e99b48' },
  { note: 'F4', name: 'F', jianpu: '4', key: 'f', color: '#dc6683' },
  { note: 'G4', name: 'G', jianpu: '5', key: 'g', color: '#9371c9' },
  { note: 'A4', name: 'A', jianpu: '6', key: 'h', color: '#df7b50' },
  { note: 'B4', name: 'B', jianpu: '7', key: 'j', color: '#56a9c9' },
  { note: 'C5', name: 'C', jianpu: '1·', key: 'k', color: '#4f72d8' },
  { note: 'D5', name: 'D', jianpu: '2·', key: 'l', color: '#3b9d88' },
]

const WIND_NOTES: FingeringNote[] = [
  { note: 'C5', name: 'C', jianpu: '1', key: 'a', thumb: true, holes: [true, true, true, true, true, true, true] },
  { note: 'D5', name: 'D', jianpu: '2', key: 's', thumb: true, holes: [true, true, true, true, true, true, false] },
  { note: 'E5', name: 'E', jianpu: '3', key: 'd', thumb: true, holes: [true, true, true, true, true, false, false] },
  { note: 'F5', name: 'F', jianpu: '4', key: 'f', thumb: true, holes: [true, true, true, true, false, false, false] },
  { note: 'G5', name: 'G', jianpu: '5', key: 'g', thumb: true, holes: [true, true, true, false, false, false, false] },
  { note: 'A5', name: 'A', jianpu: '6', key: 'h', thumb: true, holes: [true, true, false, false, false, false, false] },
  { note: 'B5', name: 'B', jianpu: '7', key: 'j', thumb: true, holes: [true, false, false, false, false, false, false] },
  { note: 'C6', name: 'C', jianpu: '1·', key: 'k', thumb: false, holes: [false, true, false, false, false, false, false] },
]

const DRUM_PADS: DrumPad[] = [
  { note: 'C2', label: '低音脉搏', key: 'a', icon: '●' },
  { note: 'C3', label: '短促重音', key: 's', icon: '◼' },
  { note: 'C4', label: '清脆一击', key: 'd', icon: '✦' },
  { note: 'C5', label: '亮点', key: 'f', icon: '✧' },
  { note: 'C6', label: '高处回响', key: 'g', icon: '◌' },
  { note: 'C2', label: '再来一下', key: 'h', icon: '↗' },
]

const DEFAULT_RHYTHM = [true, false, true, true, false, true, false, true]

const INTERACTION_COPY: Record<InstrumentInteraction, { title: string; hint: string }> = {
  keyboard: { title: '排一小段旋律', hint: '点击琴键，或用 A–; 键试着把声音连起来。' },
  'drum-pad': { title: '敲出你的节奏', hint: '先敲垫子，再点亮节拍格，听听规律怎样改变动作。' },
  'wind-fingering': { title: '按住吹一口气', hint: '按住音符按钮发声，松开按钮停下；右侧会显示指法。' },
  'mallet-bars': { title: '敲一串有颜色的音', hint: '点击琴条或用键盘演奏，让每个音留下一个小光点。' },
}

export default function InstrumentSoundPage({ instrument }: InstrumentSoundPageProps) {
  const { showNoteNames } = useApp()
  const info = INSTRUMENT_SOUND_INFO[instrument]
  const interaction = info.interaction
  const copy = INTERACTION_COPY[interaction]
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState('先听一听，再说说这个声音像什么。')
  const [rhythm, setRhythm] = useState(DEFAULT_RHYTHM)
  const [rhythmPlaying, setRhythmPlaying] = useState(false)
  const [rhythmStep, setRhythmStep] = useState(-1)
  const activeTimers = useRef<Record<string, number>>({})
  const rhythmTimers = useRef<number[]>([])
  const { bursts, push: pushBurst } = useNoteBursts()

  const flashNote = useCallback((note: string) => {
    setActiveNotes((previous) => new Set(previous).add(note))
    window.clearTimeout(activeTimers.current[note])
    activeTimers.current[note] = window.setTimeout(() => {
      setActiveNotes((previous) => {
        const next = new Set(previous)
        next.delete(note)
        return next
      })
    }, 300)
  }, [])

  const playOneShot = useCallback(
    async (note = info.note, velocity = 0.82) => {
      if (!(await ensureAudio())) {
        setNotice('设备暂时没有发出声音，请检查浏览器的声音权限。')
        return
      }
      playInstrumentSound(instrument, note, '4n', velocity)
      flashNote(note)
      setNotice(`${info.name}发出了${note}。它更像脚步、风，还是一个故事的开头？`)
    },
    [flashNote, info.name, info.note, instrument]
  )

  const startWind = useCallback(
    async (note: string) => {
      if (!(await ensureAudio())) {
        setNotice('设备暂时没有发出声音，请检查浏览器的声音权限。')
        return
      }
      attackInstrumentSound(instrument, note, 0.82)
      setActiveNotes((previous) => new Set(previous).add(note))
      setNotice(`按住${note}，听听${info.name}的气息如何改变音高。`)
    },
    [info.name, instrument]
  )

  const stopWind = useCallback(
    (note: string) => {
      releaseInstrumentSound(instrument, note)
      setActiveNotes((previous) => {
        const next = new Set(previous)
        next.delete(note)
        return next
      })
    },
    [instrument]
  )

  const stopRhythm = useCallback(() => {
    rhythmTimers.current.forEach((timer) => window.clearTimeout(timer))
    rhythmTimers.current = []
    setRhythmPlaying(false)
    setRhythmStep(-1)
  }, [])

  const playRhythm = useCallback(async () => {
    if (!(await ensureAudio())) {
      setNotice('设备暂时没有发出声音，请检查浏览器的声音权限。')
      return
    }
    stopRhythm()
    setRhythmPlaying(true)
    setNotice('节奏正在走，听听它给身体带来了什么动作。')
    rhythm.forEach((enabled, index) => {
      const timer = window.setTimeout(() => {
        setRhythmStep(index)
        if (enabled) void playOneShot(DRUM_PADS[index % DRUM_PADS.length]!.note, 0.86)
        if (index === rhythm.length - 1) window.setTimeout(() => stopRhythm(), 230)
      }, index * 230)
      rhythmTimers.current.push(timer)
    })
  }, [playOneShot, rhythm, stopRhythm])

  useEffect(() => {
    const notes: Array<PlayableNote | DrumPad> =
      interaction === 'wind-fingering'
        ? WIND_NOTES
        : interaction === 'mallet-bars'
          ? MALLET_NOTES
          : interaction === 'drum-pad'
            ? DRUM_PADS
            : KEYBOARD_NOTES
    const down = (event: KeyboardEvent) => {
      if (event.repeat) return
      const note = notes.find((item) => item.key === event.key.toLowerCase())
      if (!note) return
      event.preventDefault()
      if (interaction === 'wind-fingering') void startWind(note.note)
      else void playOneShot(note.note)
    }
    const up = (event: KeyboardEvent) => {
      if (interaction !== 'wind-fingering') return
      const note = WIND_NOTES.find((item) => item.key === event.key.toLowerCase())
      if (note) stopWind(note.note)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [interaction, playOneShot, startWind, stopWind])

  useEffect(
    () => () => {
      Object.values(activeTimers.current).forEach((timer) => window.clearTimeout(timer))
      stopRhythm()
      stopAllAudio()
    },
    [stopRhythm]
  )

  const renderKeyboard = () => (
    <div className="instrument-sound__interaction-card">
      <div className="instrument-sound__section-title">
        <div>
          <span className="instrument-sound__eyebrow">钢琴式探索</span>
          <h2>{copy.title}</h2>
        </div>
        <span className="instrument-sound__keyboard-hint">A S D F G H J K L ;</span>
      </div>
      <div className="instrument-sound__keyboard" role="grid" aria-label={`${info.name}键盘`}>
        {KEYBOARD_NOTES.map((item) => (
          <button
            type="button"
            role="gridcell"
            key={item.note}
            className={`instrument-sound__key ${activeNotes.has(item.note) ? 'active' : ''}`}
            style={{ '--key-color': item.color } as React.CSSProperties}
            onPointerDown={() => void playOneShot(item.note)}
          >
            <strong>{showNoteNames ? item.jianpu : '●'}</strong>
            {showNoteNames && <small>{item.name}</small>}
            <span>{item.key.toUpperCase()}</span>
          </button>
        ))}
      </div>
      <p className="instrument-sound__hint">{copy.hint}</p>
    </div>
  )

  const renderDrumPads = () => (
    <div className="instrument-sound__interaction-card">
      <div className="instrument-sound__section-title">
        <div>
          <span className="instrument-sound__eyebrow">架子鼓式探索</span>
          <h2>{copy.title}</h2>
        </div>
        <button type="button" className="instrument-sound__play-rhythm" onClick={() => void playRhythm()}>
          {rhythmPlaying ? '节奏进行中…' : '▶ 播放节奏'}
        </button>
      </div>
      <div className="instrument-sound__pads" role="grid" aria-label={`${info.name}打击垫`}>
        {DRUM_PADS.map((pad) => (
          <button
            type="button"
            role="gridcell"
            key={`${pad.label}-${pad.key}`}
            className={`instrument-sound__pad ${activeNotes.has(pad.note) ? 'active' : ''}`}
            onPointerDown={() => void playOneShot(pad.note, 0.9)}
          >
            <strong>{pad.icon}</strong>
            <span>{pad.label}</span>
            <small>{pad.key.toUpperCase()}</small>
          </button>
        ))}
      </div>
      <div className="instrument-sound__rhythm" aria-label="八步节奏编辑器">
        {rhythm.map((enabled, index) => (
          <button
            type="button"
            key={index}
            className={`${enabled ? 'on' : ''} ${rhythmStep === index ? 'current' : ''}`}
            aria-label={`第${index + 1}拍${enabled ? '已敲击' : '空拍'}`}
            aria-pressed={enabled}
            onClick={() => setRhythm((previous) => previous.map((value, i) => (i === index ? !value : value)))}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <p className="instrument-sound__hint">{copy.hint}</p>
    </div>
  )

  const renderWind = () => {
    const shown = WIND_NOTES.find((item) => activeNotes.has(item.note)) ?? WIND_NOTES[0]!
    return (
      <div className="instrument-sound__interaction-card instrument-sound__wind-card">
        <div className="instrument-sound__section-title">
          <div>
            <span className="instrument-sound__eyebrow">竖笛式探索</span>
            <h2>{copy.title}</h2>
          </div>
          <span className="instrument-sound__keyboard-hint">按住 A S D F G H J K</span>
        </div>
        <div className="instrument-sound__wind-layout">
          <div className="instrument-sound__wind-notes" role="grid" aria-label={`${info.name}指法音符`}>
            {WIND_NOTES.map((item) => (
              <button
                type="button"
                role="gridcell"
                key={item.note}
                className={`instrument-sound__wind-note ${activeNotes.has(item.note) ? 'active' : ''}`}
                onPointerDown={() => void startWind(item.note)}
                onPointerUp={() => stopWind(item.note)}
                onPointerCancel={() => stopWind(item.note)}
                onPointerLeave={() => activeNotes.has(item.note) && stopWind(item.note)}
              >
                <strong>{item.jianpu}</strong>
                {showNoteNames && <small>{item.name}</small>}
                <span>{item.key.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <div className="instrument-sound__fingering" aria-label={`${info.name}指法图`}>
            <div className="instrument-sound__fingering-title">
              指法提示：{shown.name}（{shown.jianpu}）
            </div>
            <div className="instrument-sound__fingering-body">
              <div className="instrument-sound__mouth" />
              <div className={`instrument-sound__hole thumb ${shown.thumb ? 'pressed' : ''}`}>拇</div>
              {shown.holes.map((pressed, index) => (
                <div className={`instrument-sound__hole ${pressed ? 'pressed' : ''}`} key={index}>
                  {index + 1}
                </div>
              ))}
              <div className="instrument-sound__foot" />
            </div>
            <div className="instrument-sound__legend">● 按住 · ○ 松开</div>
          </div>
        </div>
        <p className="instrument-sound__hint">{copy.hint}</p>
      </div>
    )
  }

  const renderMalletBars = () => (
    <div className="instrument-sound__interaction-card">
      <div className="instrument-sound__section-title">
        <div>
          <span className="instrument-sound__eyebrow">木琴式探索</span>
          <h2>{copy.title}</h2>
        </div>
        <span className="instrument-sound__keyboard-hint">A S D F G H J K L</span>
      </div>
      <div className="instrument-sound__mallet-stage">
        <Visualizer bursts={bursts} />
        <div className="instrument-sound__mallet-bars" role="grid" aria-label={`${info.name}琴条`}>
          {MALLET_NOTES.map((item, index) => (
            <button
              type="button"
              role="gridcell"
              key={item.note}
              className={`instrument-sound__mallet-bar ${activeNotes.has(item.note) ? 'active' : ''}`}
              style={{ '--key-color': item.color, '--bar-height': `${70 + index * 3}%` } as React.CSSProperties}
              onPointerDown={() => {
                void playOneShot(item.note)
                pushBurst((index + 0.5) / MALLET_NOTES.length, item.color ?? '#7b6aab', showNoteNames ? item.jianpu : '')
              }}
            >
              {showNoteNames && <b>{item.jianpu}</b>}
              <span>{item.key.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="instrument-sound__hint">{copy.hint}</p>
    </div>
  )

  const renderInteraction = () => {
    if (interaction === 'drum-pad') return renderDrumPads()
    if (interaction === 'wind-fingering') return renderWind()
    if (interaction === 'mallet-bars') return renderMalletBars()
    return renderKeyboard()
  }

  return (
    <section className="instrument-sound-page" aria-labelledby="instrument-sound-title">
      <div className="instrument-sound-page__hero">
        <span className="instrument-sound-page__icon" aria-hidden="true">
          {info.icon}
        </span>
        <div>
          <span className="instrument-sound__eyebrow">乐器声音探索</span>
          <h1 id="instrument-sound-title">{info.name}</h1>
          <p>{info.hint}。先听、再动手，最后说说它让你想到了什么动作、场景或故事。</p>
        </div>
      </div>

      {renderInteraction()}

      <div className="instrument-sound-page__prompt">
        <span>👂</span>
        <p>
          <strong>听完以后：</strong>它的声音更像脚步、阳光、风、舞蹈，还是另一个你熟悉的声音？没有唯一答案。
        </p>
      </div>

      <p className="instrument-sound-page__live" aria-live="polite">
        {notice}
      </p>
    </section>
  )
}
