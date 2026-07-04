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
  { id: 'warmup', title: '课前导入', desc: '用问题和听觉线索把学生带入主题。' },
  { id: 'concept', title: '概念讲解', desc: '讲清核心概念、关键词和判断依据。' },
  { id: 'demo', title: '可视化演示', desc: '用声音、谱面或乐器工具做对比演示。' },
  { id: 'practice', title: '课堂练习', desc: '用短题确认学生是否真正理解。' },
  { id: 'summary', title: '课堂小结', desc: '沉淀观察点和课后复习任务。' },
]

function lessonQuestions(topic: TheoryTopic) {
  return topic.quiz.slice(0, 3)
}

export default function LessonMode() {
  const { navigate, openTheory, mode } = useApp()
  const student = getCurrentStudent()
  const [stage, setStage] = useState<StageChoice>('primary-lower')
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
  const answeredCount = Object.keys(answers).length
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
          <h2>开始上课</h2>
          <p>
            把一个乐理知识点组织成完整课堂：导入、讲解、演示、练习和小结。第一版使用本地知识库与课堂小测，
            适合投屏讲解和日常备课。
          </p>
        </div>
        <div className="lesson-progress-card">
          <b>{progress}%</b>
          <span>本节课完成度</span>
          <small>{mode === 'lecture' ? '讲解模式不记录学生档案' : student ? `${student.name} 课堂中` : '匿名课堂'}</small>
        </div>
      </section>

      <section className="lesson-planner card">
        <div className="lesson-select">
          <label>
            学段
            <select value={stage} onChange={(event) => setStage(event.target.value as StageChoice)}>
              <option value="全部">全部学段</option>
              {THEORY_STAGES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
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
            本节课主题
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
              {stepIndex === LESSON_STEPS.length - 1 ? '完成本节课' : '完成并下一步'}
            </button>
          </div>

          {activeStep.id === 'warmup' && (
            <div className="lesson-section">
              <div className="prompt-panel">
                <b>导入问题</b>
                <p>今天我们先听一听、看一看：{activeTopic.subtitle}。学生能不能说出自己听到或看到的变化？</p>
              </div>
              <div className="lesson-card-grid">
                <div>
                  <span>教师动作</span>
                  <p>先播放或示范一个对比，再请学生用自己的话描述差异。</p>
                </div>
                <div>
                  <span>学生回答</span>
                  <p>鼓励学生使用“高低、长短、强弱、音色、方向、结构”等音乐语言。</p>
                </div>
                <div>
                  <span>观察记录</span>
                  <p>记录学生是否能说出明确依据，而不是只回答“好听”或“不一样”。</p>
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
                <button className="primary-action" onClick={goToTopic}>进入知识库讲解</button>
                <button onClick={() => navigate('course')}>查看课程路径</button>
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
                  <p>让学生通过对比听到或看到“为什么这个知识点成立”。</p>
                </div>
                <div>
                  <span>投屏提示</span>
                  <p>先慢速示范，再让学生复述判断依据，最后回到音乐例子中验证。</p>
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
                  <h4>课堂小测</h4>
                  <p>先口答再点击选项，适合老师边问边记录。</p>
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
                <button onClick={() => setAnswers({})}>重置小测</button>
                <button className="primary-action" onClick={() => navigate('training')}>去练习中心</button>
              </div>
            </div>
          )}

          {activeStep.id === 'summary' && (
            <div className="lesson-section">
              <div className="lesson-summary">
                <div>
                  <span>本节课观察点</span>
                  <h4>学生是否能说明判断依据</h4>
                  <p>重点看学生能否围绕“{activeTopic.subtitle}”说出至少一个清楚依据。</p>
                </div>
                <div>
                  <span>课后复习</span>
                  <h4>回看知识点并完成同类练习</h4>
                  <p>建议复习：{activeTopic.keyPoints.join('、')}。</p>
                </div>
                <div>
                  <span>下节课建议</span>
                  <h4>从同类别相邻知识点继续</h4>
                  <p>可以在“{activeTopic.category}”中选择下一个知识点，保持概念连续。</p>
                </div>
              </div>
              <div className="lesson-actions">
                <button className="primary-action" onClick={() => navigate('home')}>回到工作台</button>
                <button onClick={goToTopic}>回看知识点</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
