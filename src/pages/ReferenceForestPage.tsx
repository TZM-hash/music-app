import { useState } from 'react'
import { useApp } from '../state/appState'
import GradeOneForestQuest from '../components/reference/GradeOneForestQuest'
import { GRADE_ONE_ACTIVITIES } from '../music/referenceLessons/gradeOneUpper'
import './referenceForest.css'

export default function ReferenceForestPage() {
  const { navigate } = useApp()
  const [completedActivityIds, setCompletedActivityIds] = useState<string[]>([])

  const handleComplete = (activityId: string) => {
    setCompletedActivityIds((current) =>
      current.includes(activityId) ? current : [...current, activityId]
    )
  }

  return (
    <div className="reference-forest-page presentation-page">
      <section className="reference-forest-card card" aria-labelledby="reference-forest-page-title">
        <div className="reference-forest-card__intro">
          <div>
            <span className="reference-forest-card__eyebrow">一年级上册 · 独立游戏页</span>
            <h2 id="reference-forest-page-title">从首页直接进入森林探险</h2>
            <p>跟着森林地图，先听一听、动一动，再说出你发现的乐器和声音线索。</p>
          </div>
          <button type="button" onClick={() => navigate('training')}>
            返回玩乐中心
          </button>
        </div>
        <GradeOneForestQuest
          activities={GRADE_ONE_ACTIVITIES}
          completedActivityIds={completedActivityIds}
          onComplete={handleComplete}
        />
      </section>
    </div>
  )
}
