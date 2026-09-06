import { useState } from 'react'
import type { JourneyStepId, ReferenceActivity } from '../../music/referenceCourseware'

interface MovementActivityProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}

const MOVEMENTS = ['轻轻走', '大步走', '摇摆', '停住']
const DYNAMICS = ['强', '弱', '渐强', '渐弱']

export default function MovementActivity({ onEvidence, onStepComplete }: MovementActivityProps) {
  const [movement, setMovement] = useState('轻轻走')
  const [dynamic, setDynamic] = useState('弱')
  const [notice, setNotice] = useState('选择最接近音乐的动作和力度，不存在唯一正确的感觉。')

  const saveFeeling = () => {
    const value = `${movement} · ${dynamic}`
    onEvidence(value)
    onStepComplete('try')
    setNotice(`你用“${value}”表达了自己的音乐感受。`)
  }

  return (
    <section className="reference-activity" aria-labelledby="movement-activity-title">
      <span className="reference-activity__eyebrow">身体会听见</span>
      <h2 id="movement-activity-title">如果音乐变成动作和情绪，你会怎么做？</h2>
      <h3>动作</h3>
      <div className="reference-activity__choices">
        {MOVEMENTS.map((value) => (
          <button type="button" className={movement === value ? 'selected' : ''} key={value} onClick={() => setMovement(value)}>
            {value}
          </button>
        ))}
      </div>
      <h3>力度</h3>
      <div className="reference-activity__choices">
        {DYNAMICS.map((value) => (
          <button type="button" className={dynamic === value ? 'selected' : ''} key={value} onClick={() => setDynamic(value)}>
            {value}
          </button>
        ))}
      </div>
      <button type="button" className="primary" onClick={saveFeeling}>
        保存我的动作感受
      </button>
      <p className="reference-activity__live" aria-live="polite">
        {notice}
      </p>
    </section>
  )
}
