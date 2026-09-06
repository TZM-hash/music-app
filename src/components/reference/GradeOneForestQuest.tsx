import { useMemo, useState } from 'react'
import ReferenceActivityStage from './ReferenceActivityStage'
import {
  GRADE_ONE_ACTIVITIES,
  GRADE_ONE_FOREST_QUEST,
} from '../../music/referenceLessons/gradeOneUpper'
import type { ReferenceActivity } from '../../music/referenceCourseware'

export interface GradeOneForestQuestProps {
  activities?: ReferenceActivity[]
  completedActivityIds?: string[]
  onComplete?: (activityId: string) => void
}

export default function GradeOneForestQuest({
  activities = GRADE_ONE_ACTIVITIES,
  completedActivityIds = [],
  onComplete,
}: GradeOneForestQuestProps) {
  const [activeStageId, setActiveStageId] = useState(GRADE_ONE_FOREST_QUEST[0].id)
  const [evidence, setEvidence] = useState<string[]>([])
  const [observation, setObservation] = useState('')
  const [celebration, setCelebration] = useState('')
  const activeStage =
    GRADE_ONE_FOREST_QUEST.find((stage) => stage.id === activeStageId) ?? GRADE_ONE_FOREST_QUEST[0]
  const activeActivity = useMemo(
    () => activities.find((activity) => activity.id === activeStage.activityId) ?? activities[0],
    [activeStage.activityId, activities]
  )

  if (!activeActivity) return <p>还没有可开始的森林活动。</p>

  const chooseStage = (stageId: string) => {
    setActiveStageId(stageId)
    setEvidence([])
    setObservation('')
    setCelebration('')
  }

  return (
    <section className="grade-one-forest-quest" aria-labelledby="grade-one-forest-title">
      <header className="grade-one-forest-quest__header">
        <div>
          <span className="reference-activity__eyebrow">一年级上册 · 森林地图</span>
          <h1 id="grade-one-forest-title">森林乐器大冒险</h1>
          <p>{activeStage.story}</p>
        </div>
        <div className="grade-one-forest-quest__reward" aria-label="森林星星进度">
          <strong>{completedActivityIds.length}</strong>
          <span>/ {GRADE_ONE_FOREST_QUEST.length} 颗星</span>
        </div>
      </header>
      <nav className="grade-one-forest-quest__map" aria-label="森林关卡地图">
        {GRADE_ONE_FOREST_QUEST.map((stage, index) => {
          const complete = completedActivityIds.includes(stage.activityId)
          return (
            <button
              type="button"
              className={stage.id === activeStage.id ? 'active' : complete ? 'complete' : ''}
              key={stage.id}
              onClick={() => chooseStage(stage.id)}
            >
              <span>{complete ? '★' : index + 1}</span>
              {stage.label}
            </button>
          )
        })}
      </nav>
      <div className="grade-one-forest-quest__stage">
        <ReferenceActivityStage
          activity={activeActivity}
          onEvidence={(value) => setEvidence((current) => Array.from(new Set([...current, value])))}
          onObservation={setObservation}
          onStepComplete={(step) => {
            if (step !== 'try' && step !== 'reflect') return
            onComplete?.(activeActivity.id)
            setCelebration('这一关完成了！森林又亮起一颗星。')
          }}
        />
        <aside className="grade-one-forest-quest__reflection">
          <span>我的发现</span>
          <p>{evidence.length > 0 ? evidence.join(' · ') : '完成操作后，这里会留下你的听觉线索。'}</p>
          {observation && <small>{observation}</small>}
          {celebration && <strong aria-live="polite">{celebration}</strong>}
        </aside>
      </div>
    </section>
  )
}
