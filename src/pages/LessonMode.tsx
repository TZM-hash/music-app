import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../state/appState'
import { getCurrentStudent } from '../state/students'
import {
  THEORY_CATEGORIES,
  THEORY_STAGES,
  THEORY_TOPICS,
  TheoryStageId,
  TheoryTopic,
  filterTheoryTopics,
  getStageLabel,
} from '../music/theoryCatalog'
import './lesson.css'

type LessonStepId = 'warmup' | 'concept' | 'demo' | 'practice' | 'summary'
type StageChoice = '全部' | TheoryStageId
type CategoryChoice = '全部' | string

const LESSON_STEPS: { id: LessonStepId; title: string; desc: string }[] = [
  { id: 'warmup', title: '听觉开场', desc: '用声音问题把学生带进探索状态。' },
  { id: 'concept', title: '音乐发现', desc: '把关键词放进听、看、拍、唱的体验里。' },
  { id: 'demo', title: '声音实验', desc: '用声音、谱面或乐器工具做对比试玩。' },
  { id: 'practice', title: '互动挑战', desc: '用短小游戏看看学生抓住了什么。' },
  { id: 'summary', title: '分享回顾', desc: '留下观察、表达和下一次探索方向。' },
]

function lessonQuestions(topic: TheoryTopic) {
  return topic.quiz.slice(0, 3)
}

export default function LessonMode() {
  const { navigate, openTheory, mode, lessonStage } = useApp()
  const student = getCurrentStudent()
  const [stage, setStage] = useState<StageChoice>(lessonStage ?? 'primary-lower')
  const [category, setCategory] = useState<CategoryChoice>('全部')
  const [topicId, setTopicId] = useState(THEORY_TOPICS[0].id)
  const [stepIndex, setStepIndex] = useState(0)
  const [completed, setCompleted] = useState<Record<LessonStepId, boolean>>({
    warmup: false,
    concept: false,
    demo: false,
    practice: false,
    summary: false,
  })
  const [answers, setAnswers] = useState<Record<number, number>>({})

  // 从学段总览跳转过来时（lessonStage），把顶部 tab 落到该学段
  useEffect(() => {
    if (lessonStage) setStage(lessonStage)
  }, [lessonStage])

  const filteredTopics = useMemo(
    () =>
      filterTheoryTopics({
        stage: stage === '全部' ? undefined : stage,
        category: category === '全部' ? undefined : category,
      }),
    [category, stage]
  )
  const activeTopic = filteredTopics.find((topic) => topic.id === topicId) ?? filteredTopics[0] ?? THEORY_TOPICS[0]
  const activeStep = LESSON_STEPS[stepIndex]
  const questions = lessonQuestions(activeTopic)
  const correctCount = questions.reduce(
    (total, question, index) => total + (answers[index] === question.answer ? 1 : 0),
    0
  )
  const completedCount = LESSON_STEPS.filter((step) => completed[step.id]).length
  const progress = Math.round((completedCount / LESSON_STEPS.length) * 100)

  useEffect(() => {
    if (filteredTopics.length > 0 && !filteredTopics.some((topic) => topic.id === topicId)) {
      setTopicId(filteredTopics[0].id)
    }
  }, [filteredTopics, topicId])

  useEffect(() => {
    setAnswers({})
    setStepIndex(0)
    setCompleted({
      warmup: false,
      concept: false,
      demo: false,
      practice: false,
      summary: false,
    })
  }, [activeTopic.id])

  const markCurrentDone = () => {
    setCompleted((next) => ({ ...next, [activeStep.id]: true }))
    setStepIndex((index) => Math.min(index + 1, LESSON_STEPS.length - 1))
  }

  const goToTopic = () =>
    openTheory({
      topicId: activeTopic.id,
      stage: activeTopic.stage,
      category: activeTopic.category,
    })

  const primaryAction = activeTopic.actions[0]

  return (
    <div className="lesson-page">
      <section className="lesson-hero card">
        <div>
          <span className="lesson-kicker">数字化课时流程</span>
          <h2>开始一节互动音乐课</h2>
          <p>
            把一个音乐发现组织成完整体验：先听见，再试玩，再挑战，最后把感受说出来或创作出来。
            适合投屏互动，也适合老师快速备课。
          </p>
        </div>
        <div className="lesson-progress-card">
          <b>{progress}%</b>
          <span>本节课探索度</span>
          <small>{mode === 'lecture' ? '投屏模式不记录学生档案' : student ? `${student.name} 探索中` : '匿名体验'}</small>
        </div>
      </section>

      {/* 学段切换：作为学习主轴的顶部入口，从学段总览跳来时自动落到对应学段 */}
      <div className="lesson-stage-tabs" role="tablist" aria-label="学段选择">
        <button
          className={stage === '全部' ? 'on' : ''}
          onClick={() => setStage('全部')}
          role="tab"
          aria-selected={stage === '全部'}
        >
          全部
        </button>
        {THEORY_STAGES.map((item) => (
          <button
            key={item.id}
            className={stage === item.id ? 'on' : ''}
            onClick={() => setStage(item.id)}
            role="tab"
            aria-selected={stage === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="lesson-planner card">
        <div className="lesson-select">
          <label>
            类别
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="全部">全部类别</option>
              {THEORY_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="lesson-topic-select">
            本节课声音主题
            <select value={activeTopic.id} onChange={(event) => setTopicId(event.target.value)}>
              {filteredTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="lesson-topic-brief">
          <span>{activeTopic.category} · {getStageLabel(activeTopic.stage)} · {activeTopic.level}</span>
          <h3>{activeTopic.title}</h3>
          <p>{activeTopic.concept}</p>
        </div>
      </section>

      <div className="lesson-layout">
        <aside className="lesson-steps card">
          {LESSON_STEPS.map((step, index) => (
            <button
              key={step.id}
              className={`${index === stepIndex ? 'on' : ''} ${completed[step.id] ? 'done' : ''}`}
              onClick={() => setStepIndex(index)}
            >
              <span>{index + 1}</span>
              <b>{step.title}</b>
              <small>{step.desc}</small>
            </button>
          ))}
        </aside>

        <main className="lesson-main card">
          <div className="lesson-main-head">
            <div>
              <span className="lesson-kicker">第 {stepIndex + 1} 步 / {LESSON_STEPS.length}</span>
              <h3>{activeStep.title}</h3>
            </div>
            <button onClick={markCurrentDone}>
              {stepIndex === LESSON_STEPS.length - 1 ? '完成本次探索' : '完成并下一步'}
            </button>
          </div>

          {activeStep.id === 'warmup' && (
            <div className="lesson-section">
              <div className="prompt-panel">
                <b>开场问题</b>
                <p>今天我们先听一听、看一看：{activeTopic.subtitle}。学生能不能说出自己听到或看到的变化？</p>
              </div>
              <div className="lesson-card-grid">
                <div>
                  <span>教师动作</span>
                  <p>先播放或示范一个对比，再请学生用自己的话描述差异和感受。</p>
                </div>
                <div>
                  <span>学生回答</span>
                  <p>鼓励学生使用“高低、长短、强弱、音色、方向、结构”等音乐语言，也可以先用动作表达。</p>
                </div>
                <div>
                  <span>观察记录</span>
                  <p>记录学生能不能把“好听”“不一样”继续说成具体听感。</p>
                </div>
              </div>
            </div>
          )}

          {activeStep.id === 'concept' && (
            <div className="lesson-section">
              <div className="concept-copy">
                <p>{activeTopic.concept}</p>
                <div className="lesson-keypoints">
                  {activeTopic.keyPoints.map((point, index) => (
                    <span key={point}>
                      <b>{index + 1}</b>
                      {point}
                    </span>
                  ))}
                </div>
              </div>
              <div className="lesson-actions">
                <button className="primary-action" onClick={goToTopic}>进入探索馆</button>
                <button onClick={() => navigate('course')}>查看学段总览</button>
              </div>
            </div>
          )}

          {activeStep.id === 'demo' && (
            <div className="lesson-section">
              <div className="demo-board">
                <span>{activeTopic.demo.kind}</span>
                <h4>{activeTopic.demo.title}</h4>
                <p>{activeTopic.demo.caption}</p>
              </div>
              <div className="lesson-card-grid">
                <div>
                  <span>演示目标</span>
                  <p>让学生通过对比听到或看到“这个音乐变化为什么会被感受到”。</p>
                </div>
                <div>
                  <span>投屏提示</span>
                  <p>先慢速示范，再让学生用动作或语言复述，最后回到音乐例子里听一遍。</p>
                </div>
              </div>
              <div className="lesson-actions">
                {primaryAction && <button className="primary-action" onClick={() => navigate(primaryAction.route)}>{primaryAction.label}</button>}
                {activeTopic.actions.slice(1).map((action) => (
                  <button key={action.label} onClick={() => navigate(action.route)}>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeStep.id === 'practice' && (
            <div className="lesson-section">
              <div className="quiz-summary lesson-quiz-summary">
                <div>
                  <h4>互动小挑战</h4>
                  <p>先口答、拍一拍或唱一唱，再点击选项，适合老师边玩边记录。</p>
                </div>
                <strong>{correctCount}/{questions.length}</strong>
              </div>
              <div className="lesson-quiz-list">
                {questions.map((question, questionIndex) => {
                  const picked = answers[questionIndex]
                  return (
                    <div key={question.q} className="lesson-quiz-card">
                      <span>第 {questionIndex + 1} 题</span>
                      <h4>{question.q}</h4>
                      <div>
                        {question.options.map((option, optionIndex) => {
                          const answered = picked !== undefined
                          const cls = answered
                            ? optionIndex === question.answer
                              ? 'right'
                              : optionIndex === picked
                                ? 'wrong'
                                : ''
                            : ''
                          return (
                            <button
                              key={option}
                              className={cls}
                              disabled={answered}
                              onClick={() => setAnswers((next) => ({ ...next, [questionIndex]: optionIndex }))}
                            >
                              {option}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="lesson-actions">
                <button onClick={() => setAnswers({})}>重新挑战</button>
                <button className="primary-action" onClick={() => navigate('training')}>去挑战中心</button>
              </div>
            </div>
          )}

          {activeStep.id === 'summary' && (
            <div className="lesson-section">
              <div className="lesson-summary">
                <div>
                  <span>本节课观察点</span>
                  <h4>学生是否能说出自己的音乐感受</h4>
                  <p>重点看学生能否围绕“{activeTopic.subtitle}”说出至少一个清楚的听感、动作或创作想法。</p>
                </div>
                <div>
                  <span>课后再玩</span>
                  <h4>回到发现卡并完成同类挑战</h4>
                  <p>建议再听再玩：{activeTopic.keyPoints.join('、')}。</p>
                </div>
                <div>
                  <span>下节课建议</span>
                  <h4>从同方向相邻发现继续</h4>
                  <p>可以在“{activeTopic.category}”中选择下一个音乐发现，保持体验连续。</p>
                </div>
              </div>
              <div className="lesson-actions">
                <button className="primary-action" onClick={() => navigate('home')}>回到探索台</button>
                <button onClick={goToTopic}>回看发现卡</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
