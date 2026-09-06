import { useState } from 'react'
import { ensureAudio, playNote } from '../../music/audioEngine'
import type { JourneyStepId, ReferenceActivity } from '../../music/referenceCourseware'

interface SoundDictationActivityProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}

const NOTE_OPTIONS = [
  { label: '1', note: 'C4' },
  { label: '3', note: 'E4' },
  { label: '5', note: 'G4' },
]

export default function SoundDictationActivity({ onEvidence, onStepComplete }: SoundDictationActivityProps) {
  const [sequence, setSequence] = useState<string[]>([])
  const [notice, setNotice] = useState('先听示例，再把听到的音高顺序排出来。')

  const chooseNote = async (label: string, note: string) => {
    setSequence((current) => [...current, label].slice(-4))
    try {
      if (!(await ensureAudio())) {
        setNotice('设备暂时没有发出声音，但仍可以继续排列听到的音。')
        return
      }
      playNote(note, '4n', 0.72)
      setNotice(`加入音 ${label}，继续听下一个位置。`)
    } catch {
      setNotice('设备暂时没有发出声音，但仍可以继续排列听到的音。')
    }
  }

  const submit = () => {
    if (sequence.length === 0) {
      setNotice('先选择至少一个音。')
      return
    }
    const value = sequence.join('—')
    onEvidence(value)
    onStepComplete('try')
    setNotice('谱面线索已经留下，可以回听并修改。')
  }

  return (
    <section className="reference-activity" aria-labelledby="sound-dictation-title">
      <span className="reference-activity__eyebrow">听音记谱</span>
      <h2 id="sound-dictation-title">把声音排成一条旋律</h2>
      <div className="reference-activity__choices" aria-label="唱名选择">
        {NOTE_OPTIONS.map((option) => (
          <button type="button" key={option.label} onClick={() => void chooseNote(option.label, option.note)}>
            音 {option.label}
          </button>
        ))}
      </div>
      <p className="reference-activity__pattern" aria-label="已排列的谱面线索">
        {sequence.length > 0 ? sequence.join(' · ') : '点击音符开始记谱'}
      </p>
      <button type="button" className="primary" onClick={submit}>
        保存这条谱面
      </button>
      <p className="reference-activity__live" aria-live="polite">
        {notice}
      </p>
    </section>
  )
}
