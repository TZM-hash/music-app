import { useState } from 'react'
import { Route, useApp } from '../state/appState'
import { BADGE_INFO, loadProgress } from '../state/progress'
import { getCurrentStudent, sessionsOf } from '../state/students'
import { classOverview } from '../state/stats'
import { ROUTE_LABELS } from '../state/navigationHistory'
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

interface EntryItem {
  route: Route
  icon: string
  tone: 'blue' | 'purple' | 'orange' | 'green'
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
    icon: '📖',
    tone: 'blue',
    title: '音乐互动课堂',
    desc: '按一节课的节奏完成听、玩、挑战和回顾。',
  },
  {
    route: 'theory',
    icon: '🎵',
    tone: 'purple',
    title: '音乐探索馆',
    desc: '进入分级发现卡，集中学习音乐概念。',
  },
  {
    route: 'training',
    icon: '🎯',
    tone: 'orange',
    title: '挑战中心',
    desc: '统一进入听感、读谱、跟唱和节奏小游戏。',
  },
  {
    route: 'course',
    icon: '🗺️',
    tone: 'green',
    title: '音乐成长路线',
    desc: '按学段选择一条连续的课堂路线。',
  },
]

const GAME_ROUTE: Record<string, Route> = {
  'game-ear': 'game-ear',
  'game-echo': 'game-echo',
  'game-taiko': 'game-taiko',
  'game-sing': 'game-sing',
  'game-read': 'game-read',
}

const GAME_ICON: Record<string, string> = {
  'game-ear': '👂',
  'game-echo': '🔁',
  'game-taiko': '🥁',
  'game-sing': '🎤',
  'game-read': '🎼',
}

function greetingOf(hour: number): string {
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

function todayLine(): string {
  const now = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
  return `${now.getMonth() + 1} 月 ${now.getDate()} 日 · 星期${week}`
}

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
  const creativeWorks = loadCreativeWorks(student?.id ?? null)
  const creativePortfolio = buildCreativePortfolio(creativeWorks)
  const creativeWorkCount = creativePortfolio.totalWorks
  const totalStars = Object.values(progress.stars).reduce(
    (sum, levels) => sum + Object.values(levels).reduce((a, b) => a + b, 0),
    0
  )
  const knowledgeMastery = theoryPracticeCount / Math.max(1, THEORY_TOPICS.length)
  const practiceSignals = [
    { label: '探索', value: theoryPracticeCount, color: 'var(--primary)' },
    { label: '挑战', value: overview.totalSessions, color: 'var(--accent)' },
    { label: '创作', value: creativeWorkCount, color: 'var(--primary-2)' },
    { label: '星数', value: totalStars, color: 'var(--accent-2)' },
    { label: '回放', value: wrongAnswers.length, color: 'var(--danger)' },
  ]
  const lessonFlow = [
    { label: '听见', detail: '用声音打开好奇心', route: 'lesson' as Route },
    { label: '发现', detail: '进入音乐探索馆', route: 'theory' as Route },
    { label: '体验', detail: '用键盘或节奏试玩', route: 'piano' as Route },
    { label: '挑战', detail: '进入游戏反馈', route: 'training' as Route },
  ]
  const growthTrack = [
    { label: '发现', value: THEORY_TOPICS.length, tone: 'primary', route: 'theory' as Route },
    { label: '试玩', value: theoryPracticeCount, tone: 'accent', route: 'training' as Route },
    { label: '创作', value: creativeWorkCount, tone: 'primary', route: 'mixer' as Route },
    { label: '记录', value: overview.totalSessions, tone: 'warm', route: 'adventure' as Route },
  ]

  const recommendation = isLectureMode
    ? '投屏模式会隐藏学生档案和个人记录。建议从音乐探索馆选一个声音发现，再配合成长路线、素材库和互动挑战一起体验。'
    : student
    ? theoryPracticeCount > 0
      ? `${student.name} 已点亮 ${theoryPracticeCount} 个音乐发现，建议继续按路线闯关，并用真实旋律听一听、改一改。`
      : `${student.name} 还没有探索记录，建议先从节拍和音高的小关卡开始，建立稳定的音乐感受。`
    : '当前是匿名体验。选择学生后，挑战记录、回放点和班级观察会自动归档。'

  const lastSession = student ? [...sessionsOf(student.id)].sort((a, b) => b.seq - a.seq)[0] : undefined
  const lastRoute = lastSession ? GAME_ROUTE[lastSession.gameId] : undefined
  const lastStars = lastSession ? progress.stars[lastSession.gameId]?.[lastSession.level] ?? 0 : 0
  const lastBest = lastSession ? progress.bestScores[lastSession.gameId] ?? 0 : 0

  return (
    <div className="pro-home">
      <section className="home-greet">
        <div>
          <span className="home-greet-date">{todayLine()}</span>
          <h1>
            {isLectureMode ? '互动投屏中 📽️' : student ? `${greetingOf(new Date().getHours())}，${student.name} 👋` : '欢迎来到乐动课堂 👋'}
          </h1>
          <p>{recommendation}</p>
        </div>
        <div className="home-greet-actions">
          <button className="primary-action" onClick={() => navigate('lesson')}>
            开始互动课
          </button>
          <button onClick={() => navigate('theory')}>进入探索馆</button>
        </div>
      </section>

      <section className="home-entry-grid">
        {MAIN_ENTRIES.map((item) => (
          <button key={item.route} className={`card home-entry-card ${item.tone}`} onClick={() => navigate(item.route)}>
            <span className="home-entry-icon">{item.icon}</span>
            <span className="home-entry-copy">
              <b>{item.title}</b>
              <small>{item.desc}</small>
            </span>
            <span className="home-entry-arrow" aria-hidden="true">›</span>
          </button>
        ))}
      </section>

      {!isLectureMode && (
        <section className="home-continue card">
          <div className="home-continue-head">
            <span className="pro-kicker">继续上次</span>
            <h3>{lastSession && lastRoute ? '从上次停下的地方接着玩' : '开始第一次挑战'}</h3>
          </div>
          {lastSession && lastRoute ? (
            <button className="home-continue-row" onClick={() => navigate(lastRoute)}>
              <span className="home-continue-icon">{GAME_ICON[lastSession.gameId] ?? '🎮'}</span>
              <span className="home-continue-info">
                <b>{ROUTE_LABELS[lastRoute]}</b>
                <small>第 {lastSession.level} 关 · 最高分 {lastBest}</small>
              </span>
              <span className="home-continue-stars">
                {[1, 2, 3].map((s) => (
                  <i key={s} className={s <= lastStars ? 'on' : ''}>★</i>
                ))}
              </span>
              <span className="home-continue-go">继续 ›</span>
            </button>
          ) : (
            <button className="home-continue-row empty" onClick={() => navigate('training')}>
              <span className="home-continue-icon">🎮</span>
              <span className="home-continue-info">
                <b>还没有练习记录</b>
                <small>去挑战中心完成第一关，这里会帮你记住进度</small>
              </span>
              <span className="home-continue-go">去挑战 ›</span>
            </button>
          )}
        </section>
      )}

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
        <section className="review-home card">
          <div className="review-block daily">
            <span className="pro-kicker">今日挑战</span>
            <h3>{dailyChallenge.length} 个混合小挑战</h3>
            <DailyCards items={dailyChallenge} onGo={() => navigate('training')} />
          </div>
          <div className="review-block">
            <span className="pro-kicker">回放点</span>
            <h3>{wrongAnswers.length > 0 ? `${wrongAnswers.length} 个可以再试` : '暂无需要回放'}</h3>
            <div className="review-list">
              {wrongAnswers.length === 0 ? (
                <button onClick={() => navigate('theory')}>
                  <b>完成一次挑战</b>
                  <small>挑战后这里会显示值得再听再玩的地方</small>
                </button>
              ) : (
                wrongAnswers.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate('training')}
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
            <span className="pro-kicker">再探索方向</span>
            <h3>{weakCategories.length > 0 ? '优先回到这些声音方向' : '完成挑战后生成'}</h3>
            <div className="weak-chip-row">
              {weakCategories.length === 0 ? (
                <button onClick={() => navigate('training')}>进入挑战中心</button>
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

function DailyCards({ items, onGo }: { items: { id?: string; itemTitle: string; category: string; question: string }[]; onGo: () => void }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set())

  const toggle = (i: number) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="daily-cards">
      {items.map((item, i) => (
        <button
          key={item.id}
          className={`daily-card ${flipped.has(i) ? 'flipped' : ''}`}
          onClick={() => { toggle(i); if (!flipped.has(i)) setTimeout(onGo, 600) }}
        >
          {!flipped.has(i) ? (
            <div className="daily-card-back">
              <span className="daily-card-icon">🎵</span>
              <span className="daily-card-label">挑战 {i + 1}</span>
            </div>
          ) : (
            <div className="daily-card-front">
              <b>{item.itemTitle}</b>
              <small>{item.category}</small>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
