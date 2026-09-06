import { useState } from 'react'
import type { JourneyStepId, ReferenceActivity } from '../../music/referenceCourseware'

interface ReviewQuestActivityProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}

const REVIEW_OPTIONS = ['我听到了变化', '我能用动作表现', '我能说出一个概念']

export default function ReviewQuestActivity({ activity, onEvidence, onStepComplete }: ReviewQuestActivityProps) {
  const [selected, setSelected] = useState('')
  const [stars, setStars] = useState(0)
  const [notice, setNotice] = useState('选择一张回顾卡，看看今天留下了什么。')

  const finishReview = () => {
    if (!selected) {
      setNotice('先选择一张回顾卡。')
      return
    }
    const nextStars = selected === REVIEW_OPTIONS[2] ? 3 : 2
    setStars(nextStars)
    onEvidence(selected)
    onStepComplete('reflect')
    setNotice(activity.feedback.complete)
  }

  return (
    <section className="reference-activity" aria-labelledby="review-quest-title">
      <span className="reference-activity__eyebrow">探索总结</span>
      <h2 id="review-quest-title">把今天的发现带回音乐会</h2>
      <div className="reference-activity__choices">
        {REVIEW_OPTIONS.map((option) => (
          <button type="button" className={selected === option ? 'selected' : ''} key={option} onClick={() => setSelected(option)}>
            {option}
          </button>
        ))}
      </div>
      <button type="button" className="primary" onClick={finishReview}>
        完成复习
      </button>
      <p className="reference-activity__stars" aria-label={`获得 ${stars} 星`}>
        {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
      </p>
      <p className="reference-activity__summary">总结：{activity.summary}</p>
      <p className="reference-activity__live" aria-live="polite">
        {notice}
      </p>
    </section>
  )
}
