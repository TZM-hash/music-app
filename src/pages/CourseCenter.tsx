import { useMemo, useState } from 'react'
import { useApp } from '../state/appState'
import { loadProgress } from '../state/progress'
import { getCurrentStudent } from '../state/students'
import { THEORY_STAGES, TheoryStageId, filterTheoryTopics } from '../music/theoryCatalog'
import { ProgressRing, SpectrumBars } from '../components/Charts'
import '../components/charts.css'
import './course.css'

interface CourseUnit {
  id: TheoryStageId
  icon: string
  title: string
  stage: string
  goal: string
  duration: string
  color: string
  categories: string[]
  outcomes: string[]
}

const COURSES: CourseUnit[] = [
  {
    id: 'primary-lower',
    icon: '🌱',
    title: '小学低段：听见高低长短',
    stage: '小学 1-2 年级 / 启蒙',
    goal: '从听、拍、唱和模仿开始，慢慢形成对高低、长短、强弱和音色的直观感受。',
    duration: '10-15 分钟',
    color: '#2f9e44',
    categories: ['音高与唱名', '节奏与节拍', '民族与音乐场景'],
    outcomes: ['能分辨高低长短强弱', '能跟稳定拍做反应', '能唱出 1-5 的基本唱名'],
  },
  {
    id: 'primary-middle',
    icon: '🧭',
    title: '小学中段：读懂谱面基本信息',
    stage: '小学 3-4 年级 / 基础',
    goal: '把音名、线间、谱号、拍号、速度力度和反复记号变成看得懂、唱得出的音乐线索。',
    duration: '15-20 分钟',
    color: '#f59f00',
    categories: ['音高与唱名', '节奏与节拍', '记谱与读谱', '速度力度与表情', '曲式结构'],
    outcomes: ['能读基本线间关系', '能说明 2/4、3/4、4/4', '能识别 p、f 和反复记号'],
  },
  {
    id: 'primary-upper',
    icon: '🎼',
    title: '小学高段：连接旋律、节奏与调式',
    stage: '小学 5-6 年级 / 提升',
    goal: '理解半音全音、低音谱号、附点切分三连音、五声音阶、音程和乐句呼吸。',
    duration: '20 分钟',
    color: '#d6336c',
    categories: ['音高与唱名', '节奏与节拍', '记谱与读谱', '调式与音阶', '音程与和声', '曲式结构', '创作与编配'],
    outcomes: ['能分析附点和切分', '能听出大小调基础色彩', '能描述问答乐句和旋律线'],
  },
  {
    id: 'junior-basic',
    icon: '🔎',
    title: '初中基础：调号、和声与结构分析',
    stage: '初中 7-8 年级 / 系统',
    goal: '把读谱、调式、音程、和声色彩、表情处理和合奏层次连成可听见的音乐判断。',
    duration: '20-25 分钟',
    color: '#0c8599',
    categories: ['记谱与读谱', '调式与音阶', '音程与和声', '速度力度与表情', '曲式结构', '创作与编配', '民族与音乐场景'],
    outcomes: ['能解释调号和临时记号', '能听辨三和弦色彩', '能说出 AB/ABA 结构'],
  },
  {
    id: 'junior-advanced',
    icon: '🚀',
    title: '初中进阶：表达、转调与创作应用',
    stage: '初中 8-9 年级 / 进阶',
    goal: '尝试移调、复杂节奏、七和弦、终止式、变奏展开和四小节创作，让想法变成作品。',
    duration: '25-30 分钟',
    color: '#7048e8',
    categories: ['音高与唱名', '节奏与节拍', '调式与音阶', '音程与和声', '速度力度与表情', '曲式结构', '创作与编配', '民族与音乐场景'],
    outcomes: ['能解释终止和张力解决', '能做四小节乐句设计', '能用音乐要素完成听赏表达'],
  },
]

export default function CourseCenter() {
  const { openTheory, openLesson, mode } = useApp()
  const student = getCurrentStudent()
  const [activeId, setActiveId] = useState<TheoryStageId>('primary-lower')
  const active = useMemo(
    () => COURSES.find((course) => course.id === activeId) ?? COURSES[0],
    [activeId]
  )
  const activeTopics = filterTheoryTopics({ stage: active.id })
  const stageLabel = THEORY_STAGES.find((stage) => stage.id === active.id)?.label ?? active.stage
  const progress = loadProgress()
  const completedTopics = activeTopics.filter((topic) => (progress.bestScores[`theory-${topic.id}`] ?? 0) > 0).length
  const categorySignals = active.categories.map((category) => ({
    label: category.slice(0, 2),
    value: activeTopics.filter((topic) => topic.category === category).length,
    color: active.color,
  }))
  const goTheoryForActiveStage = () => openTheory({ stage: active.id })
  const goLessonForActiveStage = () => openLesson(active.id)

  return (
    <div className="course-page">
      <section className="course-head card">
        <div>
          <span className="course-kicker">学段总览</span>
          <h2>各学段音乐学习目标与进度</h2>
          <p>
            查看从小学到初中每个学段的目标、产出与发现卡覆盖进度。选定一个学段后，
            直接进入对应学段的互动课堂开始上课。
            {mode === 'teacher' ? '适合老师按学段备课与投屏。' : '适合学生按阶段了解自己学到哪里。'}
          </p>
        </div>
        <div className="course-current">
          <span>{student ? student.avatar : '👤'}</span>
          <b>{student ? student.name : '匿名练习'}</b>
          <small>{student ? '探索挑战会进入成长记录' : '匿名成绩不进入班级观察'}</small>
        </div>
      </section>

      <div className="course-layout">
        <div className="course-list">
          {COURSES.map((course) => (
            <button
              key={course.id}
              className={`course-tab card ${course.id === active.id ? 'on' : ''}`}
              onClick={() => setActiveId(course.id)}
              style={{ borderColor: course.id === active.id ? course.color : undefined }}
            >
              <span className="course-icon" style={{ background: course.color }}>
                {course.icon}
              </span>
              <span>
                <b>{course.title}</b>
                <small>{course.stage} · {course.duration}</small>
              </span>
            </button>
          ))}
        </div>

        <section className="lesson-board card">
          <div className="lesson-title">
            <span className="course-icon big" style={{ background: active.color }}>
              {active.icon}
            </span>
            <div>
              <h2>{active.title}</h2>
              <p>{active.goal}</p>
            </div>
          </div>

          <div className="outcome-row">
            <span>{stageLabel}</span>
            <span>{activeTopics.length} 张发现卡</span>
            {active.outcomes.map((outcome) => (
              <span key={outcome}>{outcome}</span>
            ))}
          </div>

          <div className="course-focus">
            {active.categories.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>

          <div className="course-lab-strip">
            <ProgressRing
              value={completedTopics / Math.max(1, activeTopics.length)}
              label="阶段进度"
              caption={`${completedTopics}/${activeTopics.length}`}
              color={active.color}
              size={106}
            />
            <div className="course-spectrum-block">
              <b>探索方向声谱</b>
              <SpectrumBars values={categorySignals} compact />
            </div>
            <div className="course-node-preview">
              {active.outcomes.slice(0, 4).map((outcome, index) => (
                <span key={outcome}>
                  <b>{index + 1}</b>
                  {outcome}
                </span>
              ))}
            </div>
          </div>

          <div className="course-goal-block">
            <div>
              <span className="course-kicker">本学段产出</span>
              <p>{active.outcomes.join(' · ')}</p>
            </div>
            <small className="course-duration">建议时长：{active.duration}</small>
          </div>

          <div className="lesson-foot">
            <button className="big-start" onClick={goLessonForActiveStage}>
              进入这个学段的课堂
            </button>
            <button className="lesson-secondary" onClick={goTheoryForActiveStage}>
              进入音乐探索馆
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
