import { useState } from 'react'
import { ensureAudio, playNote, stopAllAudio } from '../../music/audioEngine'
import type { JourneyStepId, ReferenceActivity } from '../../music/referenceCourseware'
import { useTimers } from '../../hooks/useTimers'

interface VoiceFormActivityProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}

const FORMS = [
  { id: 'unison', label: '齐唱', hint: '大家同时开始、唱同一条旋律' },
  { id: 'chorus', label: '合唱', hint: '不同声部一起形成层次' },
  { id: 'round', label: '轮唱', hint: '同一旋律错开进入' },
]

export default function VoiceFormActivity({ onEvidence, onStepComplete }: VoiceFormActivityProps) {
  const [selected, setSelected] = useState('')
  const [notice, setNotice] = useState('先试听示例，再注意谁先进入、谁和谁同时进行。')
  const { later } = useTimers()

  const listenExample = async (id: string) => {
    setSelected(id)
    stopAllAudio()
    try {
      if (!(await ensureAudio())) {
        setNotice('设备暂时没有发出声音，但仍可以根据进入顺序判断。')
        return
      }
      if (id === 'unison') playNote('C4', '2n', 0.72)
      if (id === 'chorus') {
        playNote('C4', '2n', 0.6)
        playNote('E4', '2n', 0.6)
      }
      if (id === 'round') {
        playNote('C4', '2n', 0.7)
        later(() => playNote('C4', '2n', 0.54), 260)
      }
      setNotice(`正在试听${FORMS.find((form) => form.id === id)?.label ?? '示例'}。`)
    } catch {
      setNotice('设备暂时没有发出声音，但仍可以根据进入顺序判断。')
    }
  }

  const saveForm = () => {
    const form = FORMS.find((item) => item.id === selected)
    if (!form) {
      setNotice('先选择一个演唱形式。')
      return
    }
    onEvidence(form.label)
    onStepComplete('try')
    setNotice(`你注意到了：${form.hint}。`)
  }

  return (
    <section className="reference-activity" aria-labelledby="voice-form-title">
      <span className="reference-activity__eyebrow">演唱方式</span>
      <h2 id="voice-form-title">大家是怎样一起唱的？</h2>
      <div className="reference-activity__choices">
        {FORMS.map((form) => (
          <button
            type="button"
            className={selected === form.id ? 'selected' : ''}
            aria-pressed={selected === form.id}
            key={form.id}
            onClick={() => void listenExample(form.id)}
          >
            <strong>{form.label}</strong>
            <small>{form.hint}</small>
          </button>
        ))}
      </div>
      <button type="button" className="primary" onClick={saveForm}>
        保存我的判断
      </button>
      <p className="reference-activity__live" aria-live="polite">
        {notice}
      </p>
    </section>
  )
}
