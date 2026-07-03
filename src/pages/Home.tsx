import { Route, useApp } from '../state/appState'
import { BADGE_INFO, loadProgress } from '../state/progress'
import { getCurrentStudent } from '../state/students'
import { classOverview } from '../state/stats'
import { allSongs } from '../music/songLibrary'
import { THEORY_STAGES, THEORY_TOPICS } from '../music/theoryCatalog'
import { ENCYCLOPEDIA_ENTRIES, encyclopediaToReviewQuestions } from '../music/encyclopedia'
import {
  buildDailyChallenge,
  getWeakCategories,
  getWrongAnswers,
  loadReviewBook,
  type ReviewQuestion,
} from '../state/theoryReview'

interface WorkItem {
  route: Route
  label: string
  title: string
  desc: string
  meta: string
}

const WORK_ITEMS: WorkItem[] = [
  {
    route: 'theory',
    label: '核心知识库',
    title: '分级乐理知识库',
    desc: '覆盖小学到初中，按教学类别和学段难度筛选学习。',
    meta: '主功能',
  },
  {
    route: 'course',
    label: '教学组织',
    title: '完整课程路径',
    desc: '按小学低段到初中进阶组织讲解、演示、练习、应用和评价。',
    meta: '适合投屏',
  },
  {
    route: 'training',
    label: '知识练习',
    title: '乐理专项练习',
    desc: '围绕听觉、读谱、音准和节奏反应检验乐理掌握情况。',
    meta: '形成反馈',
  },
  {
    route: 'library',
    label: '谱例素材',
    title: '曲库谱例',
    desc: '用真实旋律观察拍号、音阶、谱号、重复和乐句结构。',
    meta: `${allSongs().length} 首曲目`,
  },
]

const SUPPORT_TOOLS: { route: Route; label: string; desc: string }[] = [
  { route: 'piano', label: '钢琴示范', desc: '演示音高、音阶、音程与和弦' },
  { route: 'mixer', label: '混音创编', desc: '应用节奏、和声、乐句和织体' },
  { route: 'recorder', label: '竖笛指法', desc: '连接识谱、指法和旋律演奏' },
  { route: 'adventure', label: '能力进阶', desc: '查看练习能力成长路径' },
  { route: 'game-ear', label: '听觉练习', desc: '练习音高、音程、和弦听辨' },
  { route: 'game-read', label: '读谱练习', desc: '练习线间、谱号和唱名对应' },
  { route: 'game-sing', label: '视唱练习', desc: '把音阶、旋律和音准结合起来' },
]

function todayKey(): string {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function theoryToReviewQuestions(): ReviewQuestion[] {
  return THEORY_TOPICS.flatMap((topic) =>
    topic.quiz.slice(0, 2).map((q, index) => ({
      id: `theory:${topic.id}:${index}`,
      source: 'theory',
      itemId: topic.id,
      itemTitle: topic.title,
      category: topic.category,
      stage: topic.stage,
      question: q.q,
      options: q.options,
      correctAnswer: q.answer,
      explanation: topic.concept,
    }))
  )
}

export default function Home() {
  const { navigate, mode } = useApp()
  const isLectureMode = mode === 'lecture'
  const progress = loadProgress()
  const student = getCurrentStudent()
  const overview = classOverview()
  const reviewBook = loadReviewBook(student?.id ?? 'anonymous')
  const wrongAnswers = getWrongAnswers(reviewBook).slice(0, 1)
  const weakCategories = getWeakCategories(reviewBook).slice(0, 3)
  const dailyChallenge = buildDailyChallenge(
    reviewBook,
    [...theoryToReviewQuestions(), ...encyclopediaToReviewQuestions()],
    todayKey(),
    2
  )
  const theoryPracticeCount = Object.keys(progress.bestScores).filter((key) =>
    key.startsWith('theory-')
  ).length

  const recommendation = isLectureMode
    ? '讲解模式已隐藏学生档案、错题本和个人练习记录。建议从分级乐理知识库进入知识点，配合课程路径、曲库谱例和音乐百科进行投屏讲解。'
    : student
    ? theoryPracticeCount > 0
      ? `${student.name} 已完成 ${theoryPracticeCount} 个乐理知识点练习，建议按学段筛选继续学习并用谱例验证。`
      : `${student.name} 还没有乐理练习记录，建议先进入分级乐理知识库，从“小学低段”开始。`
    : '当前为匿名学习。若要形成乐理学习档案，请先在学生档案中选择学生。'

  return (
    <div className="pro-home theory-home">
      <section className="pro-hero card">
        <div>
          <span className="pro-kicker">小学到初中的乐理知识教授与练习</span>
          <h1>乐理课堂</h1>
          <p>
            以完整分级乐理知识库为主线，通过可视化、声音演示、课程路径和即时练习帮助学生理解音乐概念。
            乐器、混音器、曲库和游戏都作为教学支撑工具。
          </p>
        </div>
        <div className="pro-student">
          <span>{isLectureMode ? '🖥️' : student ? student.avatar : '👤'}</span>
          <b>{isLectureMode ? '讲解上课模式' : student ? student.name : '未选择学生'}</b>
          <small>{isLectureMode ? '不记录学生错题与练习档案' : student ? '乐理练习进入个人档案' : '匿名学习不计入班级统计'}</small>
          <button onClick={() => navigate(isLectureMode ? 'theory' : mode === 'teacher' ? 'class' : 'theory')}>
            {isLectureMode ? '进入讲解知识库' : mode === 'teacher' ? '选择学生' : '开始分级学习'}
          </button>
        </div>
      </section>

      <section className="pro-recommend card">
        <div>
          <span className="pro-kicker">推荐学习路径</span>
          <p>{recommendation}</p>
        </div>
        <div className="pro-actions">
          <button className="primary-action" onClick={() => navigate('theory')}>
            进入分级乐理知识库
          </button>
          <button onClick={() => navigate('course')}>查看完整课程路径</button>
        </div>
      </section>

      {!isLectureMode && <section className="review-home card">
        <div className="review-block daily">
          <span className="pro-kicker">今日挑战</span>
          <h3>{dailyChallenge.length} 道混合复习题</h3>
          <div className="review-list compact">
            {dailyChallenge.map((item) => (
              <button key={item.id} onClick={() => navigate(item.source === 'encyclopedia' ? 'library' : 'theory')}>
                <b>{item.itemTitle}</b>
                <small>{item.category} · {item.question}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="review-block">
          <span className="pro-kicker">错题本</span>
          <h3>{wrongAnswers.length > 0 ? `${wrongAnswers.length} 个待巩固` : '暂无待处理错题'}</h3>
          <div className="review-list">
            {wrongAnswers.length === 0 ? (
              <button onClick={() => navigate('theory')}>
                <b>去完成一次小测</b>
                <small>答题后这里会出现需要回看的知识点</small>
              </button>
            ) : (
              wrongAnswers.map((item) => (
                <button key={item.id} onClick={() => navigate(item.source === 'encyclopedia' ? 'library' : 'theory')}>
                  <b>{item.itemTitle}</b>
                  <small>
                    {item.options[item.lastSelectedAnswer ?? -1] ?? '未选择'} → {item.options[item.correctAnswer]}
                  </small>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="review-block weak">
          <span className="pro-kicker">薄弱分类</span>
          <h3>{weakCategories.length > 0 ? '优先回看这些方向' : '完成小测后生成'}</h3>
          <div className="weak-chip-row">
            {weakCategories.length === 0 ? (
              <button onClick={() => navigate('theory')}>开始乐理小测</button>
            ) : (
              weakCategories.map((item) => (
                <button key={item.category} onClick={() => navigate('theory')}>
                  {item.category} <b>{Math.round(item.accuracy * 100)}%</b>
                </button>
              ))
            )}
          </div>
        </div>
      </section>}

      <section className="pro-status">
        <div className="pro-kpi card">
          <b>{THEORY_TOPICS.length}</b>
          <span>乐理知识点</span>
        </div>
        <div className="pro-kpi card">
          <b>{THEORY_STAGES.length}</b>
          <span>学段难度</span>
        </div>
        <div className="pro-kpi card">
          <b>{isLectureMode ? allSongs().length : theoryPracticeCount}</b>
          <span>{isLectureMode ? '曲库谱例' : '已练知识点'}</span>
        </div>
        <div className="pro-kpi card">
          <b>{isLectureMode ? ENCYCLOPEDIA_ENTRIES.length : overview.totalSessions}</b>
          <span>{isLectureMode ? '百科条目' : '训练记录'}</span>
        </div>
      </section>

      <section className="work-grid">
        {WORK_ITEMS.map((item) => (
          <button key={item.route} className="work-card card" onClick={() => navigate(item.route)}>
            <small>{item.label}</small>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
            <span>{item.meta}</span>
          </button>
        ))}
      </section>

      <section className="quick-tools card">
        <div>
          <span className="pro-kicker">乐理演示辅助</span>
          <p>这些功能从主导航中精简出来，主要服务乐理知识的听觉化、可视化、创编和练习验证。</p>
        </div>
        <div>
          {SUPPORT_TOOLS.map((tool) => (
            <button key={tool.route} onClick={() => navigate(tool.route)} title={tool.desc}>
              {tool.label}
            </button>
          ))}
        </div>
      </section>

      {progress.badges.length > 0 && (
        <section className="badge-shelf compact">
          {progress.badges.map((b) => (
            <div key={b} className="card badge-tile">
              <div style={{ fontSize: '1.8rem' }}>{BADGE_INFO[b]?.icon ?? '🏅'}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {BADGE_INFO[b]?.name ?? b}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
