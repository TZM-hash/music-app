import { useMemo, useState } from 'react'
import { Route, useApp } from '../state/appState'
import { getCurrentStudent } from '../state/students'
import { THEORY_STAGES, TheoryStageId, filterTheoryTopics } from '../music/theoryCatalog'
import './course.css'

interface LessonStep {
  title: string
  detail: string
  route?: Route
  action?: string
}

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
  steps: LessonStep[]
}

const COURSES: CourseUnit[] = [
  {
    id: 'primary-lower',
    icon: '🌱',
    title: '小学低段：听见高低长短',
    stage: '小学 1-2 年级 / 启蒙',
    goal: '建立声音四要素、稳定拍、唱名数字和基础乐器音色的直观经验。',
    duration: '10-15 分钟',
    color: '#2f9e44',
    categories: ['音高与唱名', '节奏与节拍', '民族与课堂常识'],
    outcomes: ['能分辨高低长短强弱', '能跟稳定拍做反应', '能唱出 1-5 的基本唱名'],
    steps: [
      { title: '概念唤醒', detail: '从声音的高低、长短、强弱、音色开始，让学生用身体动作回应。', route: 'theory', action: '打开分级知识库' },
      { title: '可视化演示', detail: '用键盘和节奏点展示左低右高、一拍半拍、休止仍要数拍。', route: 'piano', action: '钢琴示范' },
      { title: '课堂练习', detail: '进入节奏反应或听觉辨识，用短题确认学生是否能听出差别。', route: 'training', action: '选择专项练习' },
      { title: '素材验证', detail: '从曲库选熟悉儿歌，找出重复音、高低走向和稳定拍。', route: 'library', action: '查看谱例' },
      { title: '评价建议', detail: '用“能否稳定拍手、能否说出高低变化、能否唱出 do re mi”作为本阶段评价。' },
    ],
  },
  {
    id: 'primary-middle',
    icon: '🧭',
    title: '小学中段：读懂谱面基本信息',
    stage: '小学 3-4 年级 / 基础',
    goal: '掌握音名、五线谱线间、高音谱号、常见拍号、速度力度和反复记号。',
    duration: '15-20 分钟',
    color: '#f59f00',
    categories: ['音高与唱名', '节奏与节拍', '记谱与读谱', '速度力度与表情', '曲式结构'],
    outcomes: ['能读基本线间关系', '能说明 2/4、3/4、4/4', '能识别 p、f 和反复记号'],
    steps: [
      { title: '知识讲解', detail: '按类别筛选小学中段，依次讲音名、线间、高音谱号和常见拍号。', route: 'theory', action: '筛选小学中段' },
      { title: '谱面观察', detail: '从曲库打开短曲，先找谱号、拍号、小节线，再读旋律方向。', route: 'library', action: '打开曲库' },
      { title: '读谱练习', detail: '进入读谱训练，让学生把谱面位置和唱名数字对应起来。', route: 'game-read', action: '开始读谱' },
      { title: '表现处理', detail: '用速度、力度、反复记号让同一旋律产生不同表达。', route: 'piano', action: '声音演示' },
      { title: '评价建议', detail: '检查学生能否独立说出谱号、拍号、小节线、强弱和反复位置。' },
    ],
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
    steps: [
      { title: '概念串联', detail: '用小学高段筛选，把半音全音、附点、切分、五声音阶和问答乐句放在同一节课中串联。', route: 'theory', action: '查看高段知识' },
      { title: '节奏拆解', detail: '先慢速拆附点、切分、三连音，再进入节奏反应训练。', route: 'game-taiko', action: '节奏训练' },
      { title: '音阶听唱', detail: '用钢琴演示 C 大调、五声音阶和大小调色彩，再让学生跟唱短句。', route: 'piano', action: '钢琴演示' },
      { title: '短句创作', detail: '在混音器或钢琴上设计一个四拍动机，尝试重复或变化。', route: 'mixer', action: '创编应用' },
      { title: '评价建议', detail: '让学生说出节奏难点、旋律方向、调式色彩和句尾收束感。' },
    ],
  },
  {
    id: 'junior-basic',
    icon: '🔎',
    title: '初中基础：调号、和声与结构分析',
    stage: '初中 7-8 年级 / 系统',
    goal: '把读谱、调式、音程、三和弦、表情术语、二段体三段体和合奏声部联系起来。',
    duration: '20-25 分钟',
    color: '#0c8599',
    categories: ['记谱与读谱', '调式与音阶', '音程与和声', '速度力度与表情', '曲式结构', '创作与编配', '民族与课堂常识'],
    outcomes: ['能解释调号和临时记号', '能听辨三和弦色彩', '能说出 AB/ABA 结构'],
    steps: [
      { title: '读谱总览', detail: '先看谱号、调号、拍号和速度，再进入旋律、节奏、和声分析。', route: 'theory', action: '筛选初中基础' },
      { title: '和声演示', detail: '用键盘听协和/不协和、大小三和弦和转位，建立张力感。', route: 'piano', action: '和声演示' },
      { title: '听辨验证', detail: '进入听觉辨识训练，检查音程和和弦是否能真正听出来。', route: 'game-ear', action: '听辨训练' },
      { title: '结构分析', detail: '从曲库找二段体或三段体，标出主题、对比和再现。', route: 'library', action: '分析谱例' },
      { title: '评价建议', detail: '用“能否从谱面信息推断演唱演奏处理”作为本阶段核心评价。' },
    ],
  },
  {
    id: 'junior-advanced',
    icon: '🚀',
    title: '初中进阶：表达、转调与创作应用',
    stage: '初中 8-9 年级 / 进阶',
    goal: '学习移调、复杂节奏、七和弦、终止式、变奏展开、四小节写作和听赏分析。',
    duration: '25-30 分钟',
    color: '#7048e8',
    categories: ['音高与唱名', '节奏与节拍', '调式与音阶', '音程与和声', '速度力度与表情', '曲式结构', '创作与编配', '民族与课堂常识'],
    outcomes: ['能解释终止和张力解决', '能做四小节乐句设计', '能用音乐要素完成听赏表达'],
    steps: [
      { title: '高级概念', detail: '按初中进阶筛选，讲移调、复合节奏、七和弦、终止式和变奏展开。', route: 'theory', action: '查看进阶知识' },
      { title: '声音验证', detail: '用钢琴听七和弦和终止式的张力，再比较不同调式色彩。', route: 'piano', action: '听和声' },
      { title: '创作任务', detail: '在混音器里完成四小节乐句：明确动机、节奏、和声支撑和句尾收束。', route: 'mixer', action: '开始创作' },
      { title: '展示反馈', detail: '用速度、力度、音色、节奏、旋律、结构这些词汇评价作品。', route: 'library', action: '参考谱例' },
      { title: '评价建议', detail: '评价重点放在“能否说明为什么这样写、这样听、这样处理”。' },
    ],
  },
]

export default function CourseCenter() {
  const { navigate, openTheory, mode } = useApp()
  const student = getCurrentStudent()
  const [activeId, setActiveId] = useState<TheoryStageId>('primary-lower')
  const active = useMemo(
    () => COURSES.find((course) => course.id === activeId) ?? COURSES[0],
    [activeId]
  )
  const activeTopics = filterTheoryTopics({ stage: active.id })
  const stageLabel = THEORY_STAGES.find((stage) => stage.id === active.id)?.label ?? active.stage
  const goTheoryForActiveStage = () => openTheory({ stage: active.id })

  return (
    <div className="course-page">
      <section className="course-head card">
        <div>
          <span className="course-kicker">完整乐理课程系统</span>
          <h2>从小学到初中的分级课程路径</h2>
          <p>
            每个学段都连接同一套乐理知识库：先讲概念，再做可视化和声音演示，随后进入练习、谱例和创作应用。
            {mode === 'teacher' ? '适合老师投屏控场。' : '适合学生按阶段推进。'}
          </p>
        </div>
        <div className="course-current">
          <span>{student ? student.avatar : '👤'}</span>
          <b>{student ? student.name : '匿名练习'}</b>
          <small>{student ? '课程练习会进入成长记录' : '匿名成绩不进入班级统计'}</small>
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
            <span>{activeTopics.length} 个知识点</span>
            {active.outcomes.map((outcome) => (
              <span key={outcome}>{outcome}</span>
            ))}
          </div>

          <div className="course-focus">
            {active.categories.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>

          <div className="lesson-flow">
            {active.steps.map((step, index) => (
              <div key={step.title} className="lesson-step">
                <div className="step-index">{index + 1}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
                {step.route && (
                  <button
                    className="step-action"
                    onClick={() => (step.route === 'theory' ? goTheoryForActiveStage() : navigate(step.route!))}
                  >
                    {step.action ?? '开始'}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="lesson-foot">
            <button className="big-start" onClick={() => navigate('lesson')}>
              开始课时模式
            </button>
            <button className="big-start" onClick={goTheoryForActiveStage}>
              进入分级乐理知识库
            </button>
            <button className="lesson-secondary" onClick={() => navigate('training')}>
              去练习中心验证
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
