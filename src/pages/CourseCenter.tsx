import { useMemo, useState } from 'react'
import { Route, useApp } from '../state/appState'
import { loadProgress } from '../state/progress'
import { getCurrentStudent } from '../state/students'
import { THEORY_STAGES, TheoryStageId, filterTheoryTopics } from '../music/theoryCatalog'
import { ProgressRing, SpectrumBars } from '../components/Charts'
import '../components/charts.css'
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
    goal: '从听、拍、唱和模仿开始，慢慢形成对高低、长短、强弱和音色的直观感受。',
    duration: '10-15 分钟',
    color: '#2f9e44',
    categories: ['音高与唱名', '节奏与节拍', '民族与音乐场景'],
    outcomes: ['能分辨高低长短强弱', '能跟稳定拍做反应', '能唱出 1-5 的基本唱名'],
    steps: [
      { title: '声音唤醒', detail: '从高低、长短、强弱、音色开始，让学生用手势、脚步或表情回应。', route: 'theory', action: '打开探索馆' },
      { title: '试玩演示', detail: '用键盘和节奏点感受左低右高、一拍半拍、休止也要心里数拍。', route: 'piano', action: '钢琴探索' },
      { title: '游戏挑战', detail: '进入节奏反应或听感挑战，用短小游戏看看学生听到了哪些差别。', route: 'training', action: '选择挑战' },
      { title: '旋律寻宝', detail: '从素材库选熟悉儿歌，找出重复音、高低走向和稳定拍。', route: 'library', action: '查看素材' },
      { title: '观察提示', detail: '关注学生能否稳定拍手、说出高低变化、唱出 do re mi。' },
    ],
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
    steps: [
      { title: '线索发现', detail: '按小学中段筛选，让学生依次发现音名、线间、高音谱号和常见拍号。', route: 'theory', action: '筛选小学中段' },
      { title: '谱面观察', detail: '从素材库打开短曲，先找谱号、拍号、小节线，再读旋律方向。', route: 'library', action: '打开素材库' },
      { title: '读谱闯关', detail: '进入读谱闯关，让学生把谱面位置和唱名数字对应起来。', route: 'game-read', action: '开始读谱' },
      { title: '表现处理', detail: '用速度、力度、反复记号让同一旋律产生不同表达。', route: 'piano', action: '声音演示' },
      { title: '观察提示', detail: '看学生能否自己指出谱号、拍号、小节线、强弱和反复位置。' },
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
      { title: '声音串联', detail: '把半音全音、附点、切分、五声音阶和问答乐句放进同一段音乐体验里。', route: 'theory', action: '查看高段探索' },
      { title: '节奏拆解', detail: '先慢速玩附点、切分、三连音，再进入节奏反应挑战。', route: 'game-taiko', action: '节奏挑战' },
      { title: '音阶听唱', detail: '用钢琴听 C 大调、五声音阶和大小调色彩，再让学生跟唱短句。', route: 'piano', action: '钢琴探索' },
      { title: '短句创作', detail: '在混音器或钢琴上设计一个四拍动机，尝试重复或变化。', route: 'mixer', action: '创编应用' },
      { title: '分享提示', detail: '请学生说出节奏哪里最有趣、旋律怎么走、句尾有没有回家的感觉。' },
    ],
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
    steps: [
      { title: '谱面寻路', detail: '先看谱号、调号、拍号和速度，再听旋律、节奏与和声怎样互相配合。', route: 'theory', action: '筛选初中基础' },
      { title: '和声调色', detail: '用键盘听协和/不协和、大小三和弦和转位，感受稳定与张力。', route: 'piano', action: '和声试玩' },
      { title: '听感挑战', detail: '进入听感挑战，看看音程和和弦是否已经能被耳朵抓住。', route: 'game-ear', action: '听感挑战' },
      { title: '结构探路', detail: '从素材库找二段体或三段体，标出熟悉、变化和回来的地方。', route: 'library', action: '分析旋律' },
      { title: '表达提示', detail: '关注学生能否从谱面线索推断演唱演奏时该怎么处理。' },
    ],
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
    steps: [
      { title: '进阶探索', detail: '按初中进阶筛选，玩移调、复合节奏、七和弦、终止式和变奏展开。', route: 'theory', action: '查看进阶探索' },
      { title: '声音实验', detail: '用钢琴听七和弦和终止式的张力，再比较不同调式色彩。', route: 'piano', action: '听和声' },
      { title: '创作任务', detail: '在混音器里完成四小节乐句：明确动机、节奏、和声支撑和句尾收束。', route: 'mixer', action: '开始创作' },
      { title: '作品分享', detail: '用速度、力度、音色、节奏、旋律、结构这些线索聊一聊作品。', route: 'library', action: '参考素材' },
      { title: '表达提示', detail: '重点看学生能否说明为什么这样写、这样听、这样处理。' },
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
  const progress = loadProgress()
  const completedTopics = activeTopics.filter((topic) => (progress.bestScores[`theory-${topic.id}`] ?? 0) > 0).length
  const categorySignals = active.categories.map((category) => ({
    label: category.slice(0, 2),
    value: activeTopics.filter((topic) => topic.category === category).length,
    color: active.color,
  }))
  const goTheoryForActiveStage = () => openTheory({ stage: active.id })

  return (
    <div className="course-page">
      <section className="course-head card">
        <div>
          <span className="course-kicker">音乐成长路线</span>
          <h2>从小学到初中的互动探索地图</h2>
          <p>
            每个阶段都连接同一套音乐探索馆：先听见变化，再做声音演示，随后进入游戏挑战、素材旋律和创作应用。
            {mode === 'teacher' ? '适合老师投屏带着玩。' : '适合学生按阶段闯关。'}
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
              {active.steps.slice(0, 4).map((step, index) => (
                <span key={step.title}>
                  <b>{index + 1}</b>
                  {step.title}
                </span>
              ))}
            </div>
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
              开始互动课堂
            </button>
            <button className="big-start" onClick={goTheoryForActiveStage}>
              进入音乐探索馆
            </button>
            <button className="lesson-secondary" onClick={() => navigate('training')}>
              去挑战中心
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
