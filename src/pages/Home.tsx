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
    route: 'lesson',
    label: '课堂流程',
    title: '课时模式',
    desc: '把导入、讲解、演示、练习和小结串成一节完整课堂。',
    meta: '开始上课',
  },
  {
    route: 'theory',
    label: '核心知识',
    title: '乐理知识库',
    desc: '按学段、类别和难度筛选知识点，配合可视化演示理解概念。',
    meta: '分级学习',
  },
  {
    route: 'course',
    label: '教学组织',
    title: '课程路径',
    desc: '从小学低段到初中进阶，组织讲解、练习、应用和评价。',
    meta: '适合投屏',
  },
  {
    route: 'training',
    label: '专项练习',
    title: '练习中心',
    desc: '围绕听觉、识谱、音准和节奏反应检验掌握情况。',
    meta: '即时反馈',
  },
  {
    route: 'library',
    label: '素材库',
    title: '曲库谱例',
    desc: '用真实旋律观察拍号、音阶、调号、重复和乐句结构。',
    meta: `${allSongs().length} 首曲目`,
  },
]

const SUPPORT_TOOLS: { route: Route; label: string; desc: string }[] = [
  { route: 'piano', label: '钢琴示范', desc: '演示音高、音阶、音程与和弦' },
  { route: 'mixer', label: '混音创编', desc: '应用节奏、和声、乐句和织体' },
  { route: 'recorder', label: '竖笛指法', desc: '连接识谱、指法和旋律演奏' },
  { route: 'adventure', label: '能力进阶', desc: '查看练习能力成长路径' },
  { route: 'game-ear', label: '听觉训练', desc: '练习音高、音程、和弦听辨' },
  { route: 'game-read', label: '识谱训练', desc: '练习线间、谱号和唱名对应' },
  { route: 'game-sing', label: '视唱训练', desc: '把音阶、旋律和音准结合起来' },
]

function todayKey(): string {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function theoryToReviewQuestions(): ReviewQuestion[] {
  return THEORY_TOPICS.flatMap((topic) =>
    topic.quiz.slice(0, 2).map((question, index) => ({
      id: `theory:${topic.id}:${index}`,
      source: 'theory',
      itemId: topic.id,
      itemTitle: topic.title,
      category: topic.category,
      stage: topic.stage,
      question: question.q,
      options: question.options,
      correctAnswer: question.answer,
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
    ? '讲解模式会隐藏学生档案和个人练习记录。建议从乐理知识库进入知识点，再配合课程路径、曲库谱例和音乐百科投屏讲解。'
    : student
    ? theoryPracticeCount > 0
      ? `${student.name} 已完成 ${theoryPracticeCount} 个乐理知识点练习，建议继续按学段推进，并用谱例验证概念。`
      : `${student.name} 还没有乐理练习记录，建议从小学低段的知识点开始，先建立稳定的节拍和音高感。`
    : '当前是匿名体验。选择学生后，练习记录、错题本和班级统计会自动归档。'

  return (
    <div className="pro-home music-home">
      <section className="pro-hero card music-hero">
        <div className="hero-copy">
          <span className="pro-kicker">轻松、动态、可互动的音乐学习空间</span>
          <h1>让乐理课像演奏一样有节奏。</h1>
          <p>
            以分级乐理知识库为主线，把声音演示、课堂流程、曲库谱例和即时练习放在同一个清爽工作台里。
            老师可以投屏讲解，学生也可以直接进入练习和闯关。
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => navigate('lesson')}>
              开始一节课
            </button>
            <button onClick={() => navigate('theory')}>进入知识库</button>
          </div>
        </div>

        <div className="hero-stage" aria-label="音乐互动状态">
          <div className="hero-console">
            <div className="hero-console-head">
              <span>LIVE CLASS</span>
              <b>{isLectureMode ? '投屏讲解中' : student ? `${student.name} 的练习台` : '访客体验'}</b>
            </div>

            <div className="hero-wave" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>

            <div className="hero-status-grid">
              <span>
                <b>{THEORY_TOPICS.length}</b>
                乐理知识
              </span>
              <span>
                <b>{allSongs().length}</b>
                谱例素材
              </span>
              <span>
                <b>{dailyChallenge.length}</b>
                今日挑战
              </span>
            </div>

            <div className="hero-note-strip" aria-hidden="true">
              <span>Do</span>
              <span>Re</span>
              <span>Mi</span>
              <span>Sol</span>
              <span>La</span>
            </div>
          </div>
        </div>
      </section>

      <section className="pro-recommend card">
        <div>
          <span className="pro-kicker">推荐学习路径</span>
          <p>{recommendation}</p>
        </div>
        <div className="pro-actions">
          <button className="primary-action" onClick={() => navigate('lesson')}>
            开始上课
          </button>
          <button onClick={() => navigate('course')}>查看课程路径</button>
          <button onClick={() => navigate('training')}>进入练习中心</button>
        </div>
      </section>

      {!isLectureMode && (
        <section className="review-home card">
          <div className="review-block daily">
            <span className="pro-kicker">今日挑战</span>
            <h3>{dailyChallenge.length} 道混合复习题</h3>
            <div className="review-list compact">
              {dailyChallenge.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.source === 'encyclopedia' ? 'library' : 'theory')}
                >
                  <b>{item.itemTitle}</b>
                  <small>
                    {item.category} · {item.question}
                  </small>
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
                  <b>完成一次小测</b>
                  <small>答题后这里会显示需要回看的知识点</small>
                </button>
              ) : (
                wrongAnswers.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.source === 'encyclopedia' ? 'library' : 'theory')}
                  >
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
        </section>
      )}

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
          <span className="pro-kicker">互动演示工具</span>
          <p>把声音、节拍、谱例和游戏练习接到同一套课堂节奏里，适合讲解中随时切换。</p>
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
          {progress.badges.map((badge) => (
            <div key={badge} className="card badge-tile">
              <div style={{ fontSize: '1.8rem' }}>{BADGE_INFO[badge]?.icon ?? '★'}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {BADGE_INFO[badge]?.name ?? badge}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
