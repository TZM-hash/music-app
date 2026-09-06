import { useState } from 'react'
import ExplorationTheater from '../components/ExplorationTheater'
import { getExplorationUnit } from '../music/explorationUnits'
import { getGradeLabel } from '../music/zhejiangCurriculum'
import { getCurrentStudent } from '../state/students'
import { useApp } from '../state/appState'
import type { MusicDiscovery } from '../state/discoveries'
import './lesson.css'

export default function LessonMode() {
  const { navigate, currentStudentId, selectedGrade, explorationUnitId } = useApp()
  const student = getCurrentStudent()
  const effectiveGrade = selectedGrade ?? student?.grade ?? null
  const unit = getExplorationUnit(explorationUnitId ?? 'jasmine')
  const [completeNotice, setCompleteNotice] = useState('')

  const handleComplete = (discovery: MusicDiscovery) => {
    setCompleteNotice(`已保存“${discovery.title}”这张音乐发现卡。`)
  }

  return (
    <div className="lesson-page exploration-lesson-page">
      <section className="lesson-hero card exploration-lesson-hero">
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
          <button type="button" onClick={() => navigate('course')}>
            换一首作品
          </button>
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
