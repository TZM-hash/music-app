import { useState } from 'react'
import ExplorationTheater from '../components/ExplorationTheater'
import GradeOneForestQuest from '../components/reference/GradeOneForestQuest'
import { EXPLORATION_UNITS, getExplorationUnit } from '../music/explorationUnits'
import { GRADE_ONE_ACTIVITIES } from '../music/referenceLessons/gradeOneUpper'
import { getGradeLabel } from '../music/zhejiangCurriculum'
import { getCurrentStudent } from '../state/students'
import { useApp } from '../state/appState'
import type { MusicDiscovery } from '../state/discoveries'
import './lesson.css'

export default function LessonMode() {
  const { navigate, openExploration, currentStudentId, selectedGrade, explorationUnitId } = useApp()
  const student = getCurrentStudent()
  const effectiveGrade = selectedGrade ?? student?.grade ?? null
  const unit = getExplorationUnit(explorationUnitId ?? 'jasmine')
  const [completeNotice, setCompleteNotice] = useState('')
  const [showGradeOneQuest, setShowGradeOneQuest] = useState(false)
  const [gradeOneCompleted, setGradeOneCompleted] = useState<string[]>([])

  const handleComplete = (discovery: MusicDiscovery) => {
    setCompleteNotice(`已保存“${discovery.title}”这张音乐发现卡。`)
  }

  return (
    <div className="lesson-page exploration-lesson-page">
      <section className="lesson-hero card exploration-lesson-hero">
        <div className="exploration-lesson-title">
          <div>
            <span className="lesson-kicker">今日探索 · 先听见，再找到依据</span>
            <h2>音乐探索剧场</h2>
            <p>
              {unit.question}{' '}
              {effectiveGrade
                ? `当前为${getGradeLabel(effectiveGrade)}支架。`
                : '可以从自己的感受开始。'}
            </p>
          </div>
          <label className="exploration-lesson-picker">
            <span>选择作品</span>
            <select
              aria-label="选择互动课堂作品"
              value={unit.id}
              onChange={(event) => openExploration(event.target.value)}
            >
              {EXPLORATION_UNITS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="lesson-progress-card exploration-lesson-meta">
          <b>{unit.icon}</b>
          <span>{unit.title}</span>
          <small>{student ? `${student.name} 正在探索` : '投屏或匿名体验'}</small>
        </div>
      </section>

      <section className="exploration-lesson-stage card">
        <ExplorationTheater
          unit={unit}
          studentId={currentStudentId}
          grade={effectiveGrade}
          onExit={() => navigate('home')}
          onComplete={handleComplete}
        />
      </section>

      {effectiveGrade === 1 && showGradeOneQuest && (
        <section className="lesson-reference-quest card" aria-labelledby="lesson-reference-quest-title">
          <div>
            <span className="lesson-kicker">一年级上册参考课件</span>
            <h2 id="lesson-reference-quest-title">森林乐器大冒险</h2>
          </div>
          <GradeOneForestQuest
            activities={GRADE_ONE_ACTIVITIES}
            completedActivityIds={gradeOneCompleted}
            onComplete={(activityId) => {
              setGradeOneCompleted((current) =>
                current.includes(activityId) ? current : [...current, activityId]
              )
              setCompleteNotice(`森林活动“${activityId}”已经完成。`)
            }}
          />
        </section>
      )}

      {completeNotice && (
        <p className="lesson-complete-notice" role="status">
          {completeNotice}
        </p>
      )}

      <section className="lesson-support-bar card" aria-label="课堂支持入口">
        <div>
          <span className="lesson-kicker">教师支持</span>
          <strong>想换一种方式继续探索？</strong>
          <small>完成后会留下“我的音乐发现”，再去作品、听觉实验室或音乐线索库延伸。</small>
        </div>
        <div className="lesson-support-actions">
          {effectiveGrade === 1 && (
            <button type="button" onClick={() => setShowGradeOneQuest((current) => !current)}>
              {showGradeOneQuest ? '收起森林地图' : '打开一年级森林地图'}
            </button>
          )}
          <button type="button" onClick={() => navigate('training')}>
            去听觉实验室
          </button>
          <button type="button" onClick={() => navigate('theory')}>
            查看音乐线索
          </button>
        </div>
      </section>
    </div>
  )
}
