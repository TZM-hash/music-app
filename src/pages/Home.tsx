import { useMemo, type CSSProperties } from 'react'
import { Route, useApp } from '../state/appState'
import { BADGE_INFO, loadProgress } from '../state/progress'
import { getCurrentStudent } from '../state/students'
import { classOverview } from '../state/stats'
import { ProgressRing, SpectrumBars } from '../components/Charts'
import CountUp from '../components/CountUp'
import '../components/charts.css'
import { filterTheoryTopics, THEORY_TOPICS } from '../music/theoryCatalog'
import { getCurriculumSourceLabel, getGradeLabel, getSemesterLabel } from '../music/zhejiangCurriculum'
import { recommendExplorationTopic } from '../music/explorationRecommendations'
import { encyclopediaToReviewQuestions, filterEncyclopediaEntries } from '../music/encyclopedia'
import { buildCreativePortfolio, loadCreativeWorks, type CreativeWork } from '../state/creativeWorks'
import { buildDiscoverySummary, loadMusicDiscoveries } from '../state/discoveries'
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
import { EXPERIENCE_ACTIVITIES, getRecommendedActivities } from '../music/experienceActivities'

function formatWorkDate(work: CreativeWork): string {
  const date = new Date(work.createdAt)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}/${day}`
}

function todayKey(): string {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function theoryToReviewQuestions(topics: typeof THEORY_TOPICS = THEORY_TOPICS): ReviewQuestion[] {
  return topics.flatMap((topic) =>
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
  const { navigate, mode, openTheory, openExploration, currentStudentId, selectedGrade, selectedClass } = useApp()
  const isLectureMode = mode === 'lecture'

  // 学生切换会更新 App context；这里直接读取当前档案，保证首页推荐和“我的发现”立即跟随切换。
  const student = getCurrentStudent()
  const studentId = currentStudentId
  const effectiveGrade = selectedGrade ?? student?.grade

  const gradeTopics = useMemo(
    () => (effectiveGrade ? filterTheoryTopics({ grade: effectiveGrade }) : THEORY_TOPICS),
    [effectiveGrade]
  )
  const gradeTopicIds = useMemo(() => new Set(gradeTopics.map((topic) => topic.id)), [gradeTopics])
  const gradeEncyclopediaEntries = useMemo(
    () => filterEncyclopediaEntries(effectiveGrade ? { grade: effectiveGrade } : {}),
    [effectiveGrade]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps -- studentId 作为缓存失效键：学生切换时重读进度
  const progress = useMemo(() => loadProgress(), [studentId])
  const overview = useMemo(
    () => classOverview({ grade: effectiveGrade ?? null, className: selectedClass }),
    [effectiveGrade, selectedClass]
  )
  const reviewBook = useMemo(
    () => loadReviewBook(studentId ?? 'anonymous'),
    [studentId]
  )
  const scopedReviewBook = useMemo(() => {
    if (!effectiveGrade) return reviewBook
    const encyclopediaIds = new Set(gradeEncyclopediaEntries.map((entry) => entry.id))
    const records = Object.fromEntries(
      Object.entries(reviewBook.records).filter(([_, record]) =>
        record.source === 'theory'
          ? gradeTopicIds.has(record.itemId)
          : record.source === 'encyclopedia'
            ? encyclopediaIds.has(record.itemId)
            : true
      )
    )
    return { ...reviewBook, records }
  }, [effectiveGrade, gradeEncyclopediaEntries, gradeTopicIds, reviewBook])
  const reviewPool = useMemo(
    () => [...theoryToReviewQuestions(gradeTopics), ...encyclopediaToReviewQuestions(gradeEncyclopediaEntries)],
    [gradeEncyclopediaEntries, gradeTopics]
  )
  const dailyChallenge = useMemo(
    () => buildDailyChallenge(scopedReviewBook, reviewPool, todayKey(), 2),
    [reviewPool, scopedReviewBook]
  )
  const wrongAnswers = useMemo(() => getWrongAnswers(scopedReviewBook).slice(0, 1), [scopedReviewBook])
  const weakCategories = useMemo(() => getWeakCategories(scopedReviewBook).slice(0, 3), [scopedReviewBook])
  const creativeWorks = useMemo(() => loadCreativeWorks(studentId), [studentId])
  const creativePortfolio = useMemo(() => buildCreativePortfolio(creativeWorks), [creativeWorks])
  const creativeWorkCount = creativePortfolio.totalWorks
  const latestWork = creativePortfolio.latestWorks[0]

  const theoryPracticeCount = useMemo(
    () => Array.from(gradeTopicIds).filter((id) => (progress.bestScores[`theory-${id}`] ?? 0) > 0).length,
    [gradeTopicIds, progress]
  )
  const totalStars = useMemo(
    () =>
      Object.values(progress.stars).reduce(
        (sum, levels) => sum + Object.values(levels).reduce((a, b) => a + b, 0),
        0
      ),
    [progress]
  )
  const knowledgeMastery = theoryPracticeCount / Math.max(1, gradeTopics.length)
  const completedTopicIds = useMemo(
    () => Object.keys(progress.bestScores)
      .filter((key) => key.startsWith('theory-') && gradeTopicIds.has(key.slice('theory-'.length)))
      .map((key) => key.slice('theory-'.length)),
    [gradeTopicIds, progress]
  )
  const explorationRecommendation = useMemo(
    () => recommendExplorationTopic(gradeTopics, {
      grade: effectiveGrade,
      semester: student?.semester,
      completedTopicIds,
      weakCategories: weakCategories.map((item) => item.category),
      studentId,
      dayKey: todayKey(),
    }),
    [completedTopicIds, effectiveGrade, gradeTopics, student?.semester, studentId, weakCategories]
  )
  const discoverySummary = useMemo(
    () => {
      const discoveries = loadMusicDiscoveries(studentId)
      const scoped = effectiveGrade
        ? discoveries.filter((item) => item.grade === effectiveGrade || (!item.grade && gradeTopicIds.has(item.topicId)))
        : discoveries
      return buildDiscoverySummary(scoped)
    },
    [effectiveGrade, gradeTopicIds, studentId]
  )
  const experienceActivities = useMemo(
    () => {
      const scoped = getRecommendedActivities(effectiveGrade)
      return scoped.length > 0 ? scoped : EXPERIENCE_ACTIVITIES
    },
    [effectiveGrade]
  )

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
  const growthTrack = useMemo(
    () => [
      { label: '发现', value: gradeTopics.length, tone: 'primary', route: 'theory' as Route },
      { label: '试玩', value: theoryPracticeCount, tone: 'accent', route: 'training' as Route },
      { label: '创作', value: creativeWorkCount, tone: 'primary', route: 'mixer' as Route },
      { label: '记录', value: overview.totalSessions, tone: 'warm', route: 'adventure' as Route },
    ],
    [creativeWorkCount, gradeTopics.length, overview.totalSessions, theoryPracticeCount]
  )

  const recommendation = isLectureMode
    ? '投屏模式会隐藏学生档案和个人记录。可以从一张教材探索卡开始，听一听、试一试，再把发现说出来。'
    : explorationRecommendation
      ? student
        ? `${student.name}，今天从“${explorationRecommendation.topic.title}”开始，听见一个变化，再把它变成自己的声音。`
        : `今天从“${explorationRecommendation.topic.title}”开始，先听见一个变化，再把它变成自己的声音。`
      : '先选择一位学生，系统会按年级推荐对应的人音版探索卡。'

  const continueRoute: Route = !isLectureMode && theoryPracticeCount > 0 ? 'training' : 'lesson'
  const continueLabel = continueRoute === 'training' ? '继续今日探险' : '开始今日探险'
  const recommendationTopic = explorationRecommendation?.topic
  const recommendationCurriculum = recommendationTopic?.curriculum

  return (
    <div className="pro-home music-home">
      <section className="pro-hero card music-hero">
        <div className="hero-copy">
          <span className="pro-kicker">今日探索 · 轻松、动态、可互动的音乐空间</span>
          <h1>继续今天的音乐探索。</h1>
          <p>沿着听、玩、挑战和创作的课堂主线，完成下一步就好。</p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => openExploration('jasmine')}>
              {continueLabel.replace('探险', '探索')}
            </button>
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

            <div className="hero-next-step">
              <span>下一步</span>
              <b>{continueLabel}</b>
            </div>
          </div>
        </div>
      </section>

      <section className="home-playground card" aria-labelledby="home-playground-title">
        <div className="home-playground-copy">
          <span className="pro-kicker">听见 · 动起来 · 留下作品</span>
          <h2 id="home-playground-title">今日音乐探险</h2>
          <p>不用先读完说明，选一个入口，马上让耳朵和身体参与进来。</p>
        </div>
        <div className="home-playground-grid">
          {experienceActivities.map((activity) => (
            <button
              key={activity.id}
              type="button"
              className="home-playground-door"
              style={{ '--door-color': activity.color } as CSSProperties}
              onClick={() => navigate('training')}
            >
              <span aria-hidden="true">{activity.icon}</span>
              <strong>{activity.title}</strong>
              <small>{activity.subtitle}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="pro-recommend card">
        <div>
          <span className="pro-kicker">推荐探索路线</span>
          <h2>探索卡片</h2>
          <p>{recommendation}</p>
          {recommendationCurriculum && (
            <div className="recommend-meta" aria-label="教材对照信息">
              <span>{effectiveGrade ? getGradeLabel(effectiveGrade) : '小学通用'}</span>
              <span>{getSemesterLabel(recommendationCurriculum.semester)}</span>
              <span>{recommendationCurriculum.unitTitle}</span>
              <span>{getCurriculumSourceLabel(recommendationCurriculum.source)}</span>
            </div>
          )}
        </div>
        <div className="pro-actions">
          <button
            className="primary-action"
            onClick={() => openExploration('jasmine')}
          >
            开始探索
          </button>
          <button onClick={() => navigate('course')}>查看学段总览</button>
        </div>
      </section>

      <section className="home-progress-card card" aria-labelledby="home-progress-title">
        <div className="home-progress-head">
          <div>
            <span className="pro-kicker">学习记录</span>
            <h2 id="home-progress-title">本次进度</h2>
            <p>
              {student
                ? `${student.name} 的探索、挑战和创作都集中记录在这里。`
                : '完成一次练习后，探索、挑战和创作进度会自动记录在这里。'}
            </p>
          </div>
          <ProgressRing
            value={knowledgeMastery}
            label="探索完成"
            caption={`${theoryPracticeCount}/${gradeTopics.length}`}
            color="var(--primary)"
            size={96}
          />
        </div>

        <div className="home-progress-stats" aria-label="本次进度统计">
          <div className="home-progress-stat">
            <b><CountUp target={theoryPracticeCount} /></b>
            <span>已探索</span>
          </div>
          <div className="home-progress-stat">
            <b><CountUp target={overview.totalSessions} /></b>
            <span>挑战次数</span>
          </div>
          <div className="home-progress-stat">
            <b><CountUp target={creativeWorkCount} /></b>
            <span>创作作品</span>
          </div>
          <div className="home-progress-stat">
            <b><CountUp target={totalStars} /></b>
            <span>获得星星</span>
          </div>
        </div>

        <div className="home-progress-main">
          <div className="home-progress-spectrum">
            <div className="home-progress-section-head">
              <b>能力概览</b>
              <small>探索 · 挑战 · 创作 · 星数 · 回放</small>
            </div>
            <SpectrumBars values={practiceSignals} compact />
          </div>

          <div className="home-progress-growth">
            <div className="home-progress-section-head">
              <b>成长轨道</b>
              <small>点击节点继续练习</small>
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
        </div>

        <div className="home-progress-badges">
          <div className="home-progress-section-head">
            <b>已获得徽章</b>
            <small>{progress.badges.length > 0 ? `${progress.badges.length} 枚` : '完成挑战后解锁'}</small>
          </div>
          {progress.badges.length > 0 ? (
            <div className="home-progress-badge-list">
              {progress.badges.map((badge) => (
                <div key={badge} className="home-progress-badge" title={BADGE_INFO[badge]?.name ?? badge}>
                  <span aria-hidden="true">{BADGE_INFO[badge]?.icon ?? '★'}</span>
                  <b>{BADGE_INFO[badge]?.name ?? badge}</b>
                </div>
              ))}
            </div>
          ) : (
            <p className="home-progress-empty">还没有徽章，完成一次挑战就会留下第一枚。</p>
          )}
        </div>

        <div className="home-progress-discovery">
          <div className="home-progress-section-head">
            <b>我的发现</b>
            <small>{discoverySummary.total > 0 ? `${discoverySummary.total} 条` : '完成探索后留下'}</small>
          </div>
          {discoverySummary.latest[0] ? (
            <button
              type="button"
              className="home-progress-discovery-item"
              onClick={() => discoverySummary.latest[0].unitId === 'jasmine'
                ? openExploration('jasmine')
                : openTheory({ topicId: discoverySummary.latest[0].topicId })}
            >
              <span>“{discoverySummary.latest[0].statement}”</span>
              <small>{discoverySummary.latest[0].title} · 再听一遍</small>
            </button>
          ) : (
            <p className="home-progress-empty">在探索卡的“说一说”里保存你的第一条音乐发现。</p>
          )}
        </div>
      </section>

      {!isLectureMode && (
        <section className="review-rail card today-task-card" aria-label="今日任务">
          <header className="review-rail-head">
            <div>
              <span className="pro-kicker">今日任务</span>
              <h3>下一步做什么？</h3>
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

      <section className="portfolio-panel card home-recent-work">
        <div className="portfolio-head">
          <div>
            <span className="pro-kicker">最近作品</span>
            <h2>{creativePortfolio.totalWorks > 0 ? '继续你的创作' : '留下第一段灵感'}</h2>
            <p>{creativePortfolio.totalWorks > 0 ? creativePortfolio.headline : '作品详情可以在混音创作中继续编辑。'}</p>
          </div>
          <div className="portfolio-count">
            <b>{creativePortfolio.totalWorks}</b>
            <span>作品</span>
          </div>
        </div>

        <div className="home-recent-work-body">
          {latestWork ? (
            <button
              className="home-recent-work-item"
              onClick={() => navigate(latestWork.source === 'mixer' ? 'mixer' : 'theory')}
            >
              <small>{formatWorkDate(latestWork)}</small>
              <b>{latestWork.title}</b>
              <span>{latestWork.summary}</span>
            </button>
          ) : (
            <p>先做一段四拍小作品，把听到的灵感留下来。</p>
          )}
          <button className="primary-action" onClick={() => navigate('mixer')}>
            {latestWork ? '继续创作' : '去创作'}
          </button>
        </div>
      </section>

    </div>
  )
}
