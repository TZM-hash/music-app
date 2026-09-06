import { useState } from 'react'
import { ensureAudio, playInstrumentSound, stopAllAudio } from '../music/audioEngine'
import { INSTRUMENT_SOUND_INFO, type InstrumentSoundId } from '../music/instrumentSounds'
import './instrumentSound.css'

interface InstrumentSoundPageProps {
  instrument: InstrumentSoundId
}

const DEMO_NOTES = ['C4', 'E4', 'G4']

export default function InstrumentSoundPage({ instrument }: InstrumentSoundPageProps) {
  const info = INSTRUMENT_SOUND_INFO[instrument]
  const [activeNote, setActiveNote] = useState('')
  const [notice, setNotice] = useState('点击一个音符，听一听它的声音颜色。')

  const play = async (note = info.note) => {
    stopAllAudio()
    setActiveNote(note)
    if (!(await ensureAudio())) {
      setNotice('设备暂时没有发出声音，请检查浏览器的声音权限。')
      return
    }
    playInstrumentSound(instrument, note, '4n', 0.82)
    setNotice(`${info.name}正在发声：${note}。你听到的是${info.hint}。`)
  }

  return (
    <section className="instrument-sound-page" aria-labelledby="instrument-sound-title">
      <div className="instrument-sound-page__hero">
        <span className="instrument-sound-page__icon" aria-hidden="true">
          {info.icon}
        </span>
        <div>
          <span className="instrument-sound-page__eyebrow">乐器声音卡</span>
          <h1 id="instrument-sound-title">{info.name}</h1>
          <p>{info.hint}。先听，再说说它让你想到了什么动作、场景或故事。</p>
        </div>
      </div>

      <div className="instrument-sound-page__panel">
        <div className="instrument-sound-page__panel-heading">
          <div>
            <span className="instrument-sound-page__eyebrow">试听台</span>
            <h2>同一种乐器，也可以走出不同高低</h2>
          </div>
          <button type="button" className="primary" onClick={() => void play()}>
            ▶ 试听示范
          </button>
        </div>
        <div
          className="instrument-sound-page__keys"
          role="group"
          aria-label={`${info.name}音符试听`}
        >
          {DEMO_NOTES.map((note) => (
            <button
              type="button"
              key={note}
              className={activeNote === note ? 'active' : ''}
              onClick={() => void play(note)}
            >
              <strong>{note}</strong>
              <small>听一听</small>
            </button>
          ))}
        </div>
        <p className="instrument-sound-page__live" aria-live="polite">
          {notice}
        </p>
      </div>

      <div className="instrument-sound-page__prompt">
        <span>👂</span>
        <p>
          小观察：它更像<strong>脚步、阳光、风、舞蹈</strong>
          ，还是另一个你熟悉的声音？没有唯一答案。
        </p>
      </div>
    </section>
  )
}
