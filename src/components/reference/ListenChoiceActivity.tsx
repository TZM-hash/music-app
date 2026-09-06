import { useState } from 'react'
import { ensureAudio, playNote, stopAllAudio } from '../../music/audioEngine'
import type { JourneyStepId, ReferenceActivity } from '../../music/referenceCourseware'

interface ListenChoiceActivityProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}

const OPTIONS = ['听起来更轻松', '听起来更有力量', '声音停留更久']

export default function ListenChoiceActivity({
  activity,
  onEvidence,
  onStepComplete,
}: ListenChoiceActivityProps) {
  const [selected, setSelected] = useState('')
  const [preview, setPreview] = useState('')
  const [notice, setNotice] = useState('先试听候选，再确认自己的观察。')

  const previewOption = async (option: string) => {
    stopAllAudio()
    setPreview(option)
    try {
      if (!(await ensureAudio())) {
        setNotice('设备暂时没有发出声音，但仍可以根据提示继续观察。')
        return
      }
      playNote(option.includes('力量') ? 'C4' : option.includes('久') ? 'G4' : 'E4', '2n', 0.72)
      setNotice(`正在试听“${option}”，可以反复比较。`)
    } catch {
      setNotice('设备暂时没有发出声音，但仍可以根据提示继续观察。')
    }
  }

  const confirmChoice = () => {
    if (!selected) {
      setNotice('先选择一个你听到的线索。')
      return
    }
    onEvidence(selected)
    onStepComplete('try')
    setNotice(activity.feedback.correct)
  }

  return (
    <section className="reference-activity" aria-labelledby="listen-choice-title">
      <span className="reference-activity__eyebrow">先听再说</span>
      <h2 id="listen-choice-title">哪一个线索最接近你的听感？</h2>
      <div className="reference-activity__choices">
        {OPTIONS.map((option) => (
          <button
            type="button"
            key={option}
            className={selected === option ? 'selected' : ''}
            aria-pressed={selected === option}
            onClick={() => {
              setSelected(option)
              void previewOption(option)
            }}
          >
            {option}
            <small>{preview === option ? '试听中' : '点击试听'}</small>
          </button>
        ))}
      </div>
      <div className="reference-activity__actions">
        <button type="button" className="primary" onClick={confirmChoice}>
          确定我的观察
        </button>
        <button type="button" onClick={() => void previewOption(selected || OPTIONS[0])}>
          再听一次
        </button>
      </div>
      <p className="reference-activity__live" aria-live="polite">
        {notice}
      </p>
    </section>
  )
}
