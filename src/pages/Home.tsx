import { useMemo } from 'react'
import { Route, useApp } from '../state/appState'
import { BADGE_INFO, loadProgress } from '../state/progress'
import { getCurrentStudent } from '../state/students'
import { classOverview } from '../state/stats'
import { ProgressRing, SpectrumBars } from '../components/Charts'
import CountUp from '../components/CountUp'
import '../components/charts.css'
import { allSongs } from '../music/songLibrary'
import { THEORY_STAGES, THEORY_TOPICS } from '../music/theoryCatalog'
import { ENCYCLOPEDIA_ENTRIES, encyclopediaToReviewQuestions } from '../music/encyclopedia'
import { buildCreativePortfolio, loadCreativeWorks, type CreativeWork } from '../state/creativeWorks'
import {
  buildDailyChallenge,
  getWeakCategories,
  getWrongAnswers,
  loadReviewBook,
  type ReviewQuestion,
} from '../state/theoryReview'
import {
  focusFromReviewItem,
  focusFromWeakCategory,
} from '../state/reviewDeepLink'

interface EntryItem {
  route: Route
  title: string
  desc: string
}

function formatWorkDate(work: CreativeWork): string {
  const date = new Date(work.createdAt)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}/${day}`
}

const MAIN_ENTRIES: EntryItem[] = [
  {
    route: 'lesson',
    title: '音乐互动课堂',
    desc: '按一节课的节奏完成听、玩、挑战和回顾。',
  },
  {
    route: 'theory',
    title: '音乐探索馆',
    desc: '进入分级发现卡，集中学习音乐概念。',
  },
  {
    route: 'course',
    title: '学段总览',
    desc: '查看各学段目标与覆盖进度。',
  },
  {
    route: 'training',
    title: '挑战中心',
    desc: '统一进入听感、读谱、跟唱和节奏小游戏。',
  },
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
  const { navigate, mode, openTheory } = useApp()
  const isLectureMode = mode === 'lecture'

  // 学生维度 + 投屏模式决定全部派生数据，按它们缓存，避免每次 render 都全量读 localStorage / 重算
  const student = useMemo(() => getCurrentStudent(), []) // 学生切换通过外部导航触发本组件重挂载/重渲染，这里只读一次
  const studentId = student?.id ?? null

  // eslint-disable-next-line react-hooks/exhaustive-deps -- studentId 作为缓存失效键：学生切换时重读进度
  const progress = useMemo(() => loadProgress(), [studentId])
  const overview = useMemo(() => classOverview(), [])
  const reviewBook = useMemo(
    () => loadReviewBook(studentId ?? 'anonymous'),
    [studentId]
  )
  const reviewPool = useMemo(
    () => [...theoryToReviewQuestions(), ...encyclopediaToReviewQuestions()],
    []
  )
  const dailyChallenge = useMemo(
    () => buildDailyChallenge(reviewBook, reviewPool, todayKey(), 2),
    [reviewBook, reviewPool]
  )
  const wrongAnswers = useMemo(() => getWrongAnswers(reviewBook).slice(0, 1), [reviewBook])
  const weakCategories = useMemo(() => getWeakCategories(reviewBook).slice(0, 3), [reviewBook])
  const creativeWorks = useMemo(() => loadCreativeWorks(studentId), [studentId])
  const creativePortfolio = useMemo(() => buildCreativePortfolio(creativeWorks), [creativeWorks])
  const creativeWorkCount = creativePortfolio.totalWorks

  const theoryPracticeCount = useMemo(
    () => Object.keys(progress.bestScores).filter((key) => key.startsWith('theory-')).length,
    [progress]
  )
  const totalStars = useMemo(
    () =>
      Object.values(progress.stars).reduce(
        (sum, levels) => sum + Object.values(levels).reduce((a, b) => a + b, 0),
        0
      ),
    [progress]
  )
  const knowledgeMastery = theoryPracticeCount / Math.max(1, THEORY_TOPICS.length)

  const practiceSignals = useMemo(
    () => [
      { label: '探索', value: theoryPracticeCount, color: 'var(--primary)' },
      { label: '挑战', value: overview.totalSessions, color: 'var(--accent)' },
      { label: '创作', value: creativeWorkCount, color: 'var(--primary-2)' },
      { label: '星数', value: totalStars, color: 'var(--accent-2)' },
      { label: '回放', value: wrongAnswers.length, color: 'var(--danger)' },
    ],
    [theoryPracticeCount, overview.totalSessions, creativeWorkCount, totalStars, wrongAnswers.length]
  )
  const lessonFlow = useMemo(
    () => [
      { label: '听见', detail: '用声音打开好奇心', route: 'lesson' as Route },
      { label: '发现', detail: '进入音乐探索馆', route: 'theory' as Route },
      { label: '体验', detail: '用键盘或节奏试玩', route: 'piano' as Route },
      { label: '挑战', detail: '进入游戏反馈', route: 'training' as Route },
    ],
    []
  )
  const growthTrack = useMemo(
    () => [
      { label: '发现', value: THEORY_TOPICS.length, tone: 'primary', route: 'theory' as Route },
      { label: '试玩', value: theoryPracticeCount, tone: 'accent', route: 'training' as Route },
      { label: '创作', value: creativeWorkCount, tone: 'primary', route: 'mixer' as Route },
      { label: '记录', value: overview.totalSessions, tone: 'warm', route: 'adventure' as Route },
    ],
    [theoryPracticeCount, creativeWorkCount, overview.totalSessions]
  )

  const recommendation = isLectureMode
    ? '投屏模式会隐藏学生档案和个人记录。建议从音乐探索馆选一个声音发现，再配合学段总览、素材库和互动挑战一起体验。'
    : student
    ? theoryPracticeCount > 0
      ? `${student.name} 已点亮 ${theoryPracticeCount} 个音乐发现，建议继续按路线闯关，并用真实旋律听一听、改一改。`
      : `${student.name} 还没有探索记录，建议先从节拍和音高的小关卡开始，建立稳定的音乐感受。`
    : '当前是匿名体验。选择学生后，挑战记录、回放点和班级观察会自动归档。'

  return (
    <div className="pro-home music-home">
      <section className="pro-hero card music-hero">
        <div className="hero-copy">
          <span className="pro-kicker">轻松、动态、可互动的音乐探索空间</span>
          <h1>让音乐课从“听见好玩”开始。</h1>
          <p>
            以音乐探索馆为主线，把声音试玩、互动课堂、素材旋律、游戏挑战和创作工具放在同一个空间里。
            学生在听、玩、唱、拍和创作中产生兴趣，也自然长出音乐感知和表达能力。
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => navigate('lesson')}>
              开始互动课
            </button>
            <button onClick={() => navigate('theory')}>进入探索馆</button>
          </div>
        </div>

        <div className="hero-stage" aria-label="音乐互动状态">
          <div className="hero-console">
            <div className="hero-console-head">
              <span>LIVE CLASS</span>
              <b>{isLectureMode ? '互动投屏中' : student ? `${student.name} 的探索台` : '访客体验'}</b>
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
                音乐发现
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
          <span className="pro-kicker">推荐探索路线</span>
          <p>{recommendation}</p>
        </div>
        <div className="pro-actions">
          <button className="primary-action" onClick={() => navigate('lesson')}>
            开始探索
          </button>
          <button onClick={() => navigate('course')}>查看学段总览</button>
          <button onClick={() => navigate('training')}>进入挑战中心</button>
        </div>
      </section>

      <section className="home-lab-grid">
        <div className="home-lab-panel card spectrum-panel">
          <div>
            <span className="pro-kicker">探索声谱</span>
            <h3>今天该看哪些信号</h3>
          <p>把探索、挑战、作品和回放点放在同一张声谱里，方便老师判断下一步从哪里开始。</p>
          </div>
          <SpectrumBars values={practiceSignals} compact />
        </div>

        <div className="home-lab-panel card command-panel">
          <div className="command-panel-head">
            <div>
              <span className="pro-kicker">互动指挥台</span>
              <h3>一节课的四段体验</h3>
            </div>
            <ProgressRing value={knowledgeMastery} label="探索进度" caption="本机记录" color="var(--primary)" size={104} />
          </div>
          <div className="lesson-flow-mini">
            {lessonFlow.map((step, index) => (
              <button key={step.label} onClick={() => navigate(step.route)}>
                <span>{index + 1}</span>
                <b>{step.label}</b>
                <small>{step.detail}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="home-lab-panel card growth-panel">
          <div>
            <span className="pro-kicker">成长轨道</span>
            <h3>{student ? `${student.name} 的能力节点` : '匿名能力节点'}</h3>
            <p>用节点记录听感、节奏、读谱、演唱和创作的每一次小进步。</p>
          </div>
          <div className="growth-track-mini">
            {growthTrack.map((node) => (
              <button key={node.label} className={`growth-node ${node.tone}`} onClick={() => navigate(node.route)}>
                <b>{node.value}</b>
                <span>{node.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {!isLectureMode && (
        <section className="review-rail card" aria-label="今日挑战与回放">
          <header className="review-rail-head">
            <div>
              <span className="pro-kicker">今日练习</span>
              <h3>挑战 · 回放 · 再探索</h3>
            </div>
            <button type="button" className="review-rail-link" onClick={() => navigate('training')}>
              进入挑战中心
            </button>
          </header>

          <div className="review-rail-body">
            <section className="review-rail-block">
              <div className="review-rail-title">
                <span>今日挑战</span>
                <b>{dailyChallenge.length}</b>
              </div>
              <div className="daily-rail">
                {dailyChallenge.length === 0 ? (
                  <button type="button" className="daily-rail-empty" onClick={() => navigate('training')}>
                    <strong>暂无今日挑战</strong>
                    <small>进入挑战中心开始练习</small>
                  </button>
                ) : (
                  dailyChallenge.map((item, index) => (
                    <button
                      key={item.id ?? `${item.itemTitle}-${index}`}
                      type="button"
                      className="daily-rail-item"
                      onClick={() => openTheory(focusFromReviewItem(item))}
                    >
                      <span className="daily-rail-index" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="daily-rail-copy">
                        <strong>{item.itemTitle}</strong>
                        <small>{item.category}</small>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="review-rail-block">
              <div className="review-rail-title">
                <span>回放点</span>
                <b>{wrongAnswers.length}</b>
              </div>
              <div className="review-rail-list">
                {wrongAnswers.length === 0 ? (
                  <button type="button" onClick={() => openTheory()}>
                    <strong>暂无需要回放</strong>
                    <small>完成挑战后会显示值得再听的地方</small>
                  </button>
                ) : (
                  wrongAnswers.map((item) => (
                    <button key={item.id} type="button" onClick={() => openTheory(focusFromReviewItem(item))}>
                      <strong>{item.itemTitle}</strong>
                      <small>
                        {item.options[item.lastSelectedAnswer ?? -1] ?? '未选择'} →{' '}
                        {item.options[item.correctAnswer]}
                      </small>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="review-rail-block">
              <div className="review-rail-title">
                <span>再探索方向</span>
                <b>{weakCategories.length}</b>
              </div>
              <div className="review-rail-chips">
                {weakCategories.length === 0 ? (
                  <button type="button" onClick={() => navigate('training')}>
                    完成挑战后生成
                  </button>
                ) : (
                  weakCategories.map((item) => (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => openTheory(focusFromWeakCategory(item.category))}
                    >
                      {item.category}
                      <em>{Math.round(item.accuracy * 100)}%</em>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>
      )}

      <section className="pro-status">
        <div className="pro-kpi card">
          <b><CountUp target={THEORY_TOPICS.length} /></b>
          <span>音乐发现卡</span>
        </div>
        <div className="pro-kpi card">
          <b><CountUp target={THEORY_STAGES.length} /></b>
          <span>成长阶段</span>
        </div>
        <div className="pro-kpi card">
          <b><CountUp target={isLectureMode ? allSongs().length : theoryPracticeCount} /></b>
          <span>{isLectureMode ? '素材旋律' : '已玩发现'}</span>
        </div>
        <div className="pro-kpi card">
          <b><CountUp target={isLectureMode ? ENCYCLOPEDIA_ENTRIES.length : overview.totalSessions} /></b>
          <span>{isLectureMode ? '音乐故事' : '挑战记录'}</span>
        </div>
        <div className="pro-kpi card">
          <b><CountUp target={creativeWorkCount} /></b>
          <span>创作作品</span>
        </div>
      </section>

      <section className="portfolio-panel card">
        <div className="portfolio-head">
          <div>
            <span className="pro-kicker">我的音乐作品集</span>
            <h2>把每一次灵感留下来</h2>
            <p>{creativePortfolio.headline}</p>
          </div>
          <div className="portfolio-count">
            <b>{creativePortfolio.totalWorks}</b>
            <span>作品</span>
          </div>
        </div>

        {creativePortfolio.totalWorks === 0 ? (
          <div className="portfolio-empty">
            <p>先做一段四拍小作品，也可以从探索馆听到的声音变化开始改编。</p>
            <div>
              <button className="primary-action" onClick={() => navigate('mixer')}>
                去创作
              </button>
              <button onClick={() => navigate('theory')}>
                找灵感
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="portfolio-chip-row">
              {creativePortfolio.abilityChips.slice(0, 4).map((chip) => (
                <span key={chip.id}>{chip.label} · {chip.count}</span>
              ))}
              {creativePortfolio.sourceChips.slice(0, 3).map((chip) => (
                <span key={chip.source}>{chip.label} · {chip.count}</span>
              ))}
            </div>
            <div className="portfolio-work-list">
              {creativePortfolio.latestWorks.map((work) => (
                <button key={work.id} onClick={() => navigate(work.source === 'mixer' ? 'mixer' : 'theory')}>
                  <small>{formatWorkDate(work)}</small>
                  <b>{work.title}</b>
                  <p>{work.summary}</p>
                  {work.reflection && <span>{work.reflection}</span>}
                </button>
              ))}
            </div>
            <div className="portfolio-actions">
              <button className="primary-action" onClick={() => navigate('mixer')}>
                继续创作
              </button>
              <button onClick={() => navigate('theory')}>
                继续探索
              </button>
            </div>
          </>
        )}
      </section>

      <section className="home-entry-panel card">
        <div className="home-entry-head">
          <span className="pro-kicker">课堂主线</span>
          <h2>先选一条清晰路径</h2>
          <p>首页只保留课堂推进需要的主入口；演示、创作和素材工具统一从左侧栏进入。</p>
        </div>
        <div className="home-entry-groups">
          <div className="home-entry-group primary">
            {MAIN_ENTRIES.map((item) => (
              <button key={item.route} onClick={() => navigate(item.route)}>
                <span>{item.title}</span>
                <small>{item.desc}</small>
              </button>
            ))}
          </div>
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
