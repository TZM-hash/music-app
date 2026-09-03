import { useState, useEffect, useMemo, useRef } from 'react'
import Stars from './Stars'
import { buildMusicAbilitySignals } from '../state/musicAbilities'
import { celebrate } from './Celebration'
import { playUI } from '../music/uiSounds'
import PagePager, { type PagePagerItem } from './PagePager'
import { getPageSlice } from './presentation'
import './gameResult.css'

const REVIEW_ROW_PAGE_SIZE = 5
const REVIEW_PAGES: readonly PagePagerItem[] = [
  { id: 'summary', label: '结果概览', hint: '查看本轮成绩、徽章和下一步建议' },
  { id: 'ability', label: '能力反馈', hint: '查看音乐能力诊断与练习建议' },
  { id: 'questions', label: '逐题回顾', hint: '逐题查看答案与待提高之处' },
]

export interface ReviewRow {
  /** 左侧标签，如题目、乐句序号、音名 */
  label: string
  /** 学生的答案/表现 */
  got: string
  /** 正确答案/目标（答对时可省略） */
  want?: string
  ok: boolean
}

export interface ReviewData {
  /** 概要指标，如 正确率、命中数 */
  stats?: { label: string; value: string }[]
  /** 逐条明细 */
  rows?: ReviewRow[]
  /** 一句话建议 */
  advice?: string
  /** 专项能力诊断 */
  diagnosis?: { label: string; value: string; tone?: 'good' | 'warn' | 'focus' }[]
}

interface Props {
  title?: string
  score: number
  stars: number
  bestScore?: number
  gameId?: string
  isNewBest?: boolean
  newBadges?: { icon: string; name: string }[]
  review?: ReviewData
  onRetry: () => void
  onHome: () => void
  onContinue?: () => void
  continueLabel?: string
}

export default function GameResult({
  title = '本轮结束',
  score,
  stars,
  bestScore,
  gameId,
  isNewBest,
  newBadges = [],
  review,
  onRetry,
  onHome,
  onContinue,
  continueLabel = '回到挑战中心',
}: Props) {
  const [showReview, setShowReview] = useState(false)
  const [reviewPage, setReviewPage] = useState(0)
  const [reviewRowsPage, setReviewRowsPage] = useState(0)
  const [isDesktopPresentation, setIsDesktopPresentation] = useState(
    () => typeof window === 'undefined' || window.innerWidth > 900,
  )
  const [animatedScore, setAnimatedScore] = useState(score)
  const hasCelebrated = useRef('')
  const wrongRows = review?.rows?.filter((r) => !r.ok) ?? []
  const hasReview = !!review && ((review.rows?.length ?? 0) > 0 || (review.stats?.length ?? 0) > 0)
  const diagnosis = buildDiagnosis(stars, review)
  const reviewRowsPageData = useMemo(
    () => getPageSlice(review?.rows ?? [], reviewRowsPage, REVIEW_ROW_PAGE_SIZE),
    [review, reviewRowsPage],
  )
  const reviewRowsPagerItems = useMemo<readonly PagePagerItem[]>(
    () => Array.from({ length: reviewRowsPageData.pageCount }, (_, index) => ({
      id: `review-rows-page-${index}`,
      label: `${index + 1}`,
      hint: `第 ${index + 1} 页逐题回顾`,
    })),
    [reviewRowsPageData.pageCount],
  )
  const abilitySignals = buildMusicAbilitySignals({
    gameId,
    stars,
    score,
    stats: review?.stats,
    rows: review?.rows,
    advice: review?.advice,
  })

  useEffect(() => {
    if (reviewRowsPageData.pageIndex !== reviewRowsPage) setReviewRowsPage(reviewRowsPageData.pageIndex)
  }, [reviewRowsPage, reviewRowsPageData.pageIndex])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)')
    const update = () => setIsDesktopPresentation(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // 分数滚动动画
  useEffect(() => {
    const target = score
    const duration = 800
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimatedScore(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [score])

  // 庆祝触发：以“本局成绩签名”为 key，原地重开一局（score/stars/isNewBest 变化）时会重新庆祝
  useEffect(() => {
    const signature = `${score}|${stars}|${isNewBest ? 1 : 0}`
    if (hasCelebrated.current === signature) return
    hasCelebrated.current = signature
    if (isNewBest) {
      playUI('fanfare')
      celebrate('epic')
    } else if (stars >= 3) {
      playUI('fanfare')
      celebrate('large')
    } else if (stars >= 1) {
      playUI('star')
      celebrate('small')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="result-overlay">
      <div className={`result-card ${showReview ? 'wide' : ''}`}>
        {!showReview ? (
          <>
            <h2>{title}</h2>
            <div className="result-stars">
              <Stars count={stars} />
            </div>
            <div className="result-score">{animatedScore} 分</div>
            {isNewBest && <div className="new-best">🎉 新纪录！</div>}
            {!isNewBest && bestScore != null && bestScore > 0 && (
              <div className="best-line">最高分 {bestScore}</div>
            )}
            {review?.advice && <div className="result-advice">💬 {review.advice}</div>}
            {diagnosis.length > 0 && (
              <div className="diagnosis-mini">
                {diagnosis.slice(0, 2).map((d) => (
                  <span key={d.label} className={d.tone ?? 'good'}>
                    <b>{d.label}</b>{d.value}
                  </span>
                ))}
              </div>
            )}
            <div className="ability-mini" aria-label="音乐能力反馈">
              {abilitySignals.map((ability) => (
                <span key={ability.id} className={ability.tone}>
                  <i style={{ height: `${Math.max(16, ability.value)}%` }} />
                  <b>{ability.label}</b>
                  <small>{ability.value}</small>
                </span>
              ))}
            </div>
            {newBadges.length > 0 && (
              <div className="badge-row">
                {newBadges.map((b) => (
                  <div key={b.name} className="badge-pop">
                    <span>{b.icon}</span>
                    <small>{b.name}</small>
                  </div>
                ))}
              </div>
            )}
            <div className="result-actions">
              <button className="btn-primary" onClick={onRetry}>
                再练一次
              </button>
              {onContinue && (
                <button className="btn-secondary" onClick={onContinue}>
                  {continueLabel}
                </button>
              )}
              <button className="btn-ghost" onClick={onHome}>回首页</button>
            </div>
            {hasReview && (
              <button
                className="review-link"
                onClick={() => {
                  setReviewPage(0)
                  setReviewRowsPage(0)
                  setShowReview(true)
                }}
              >
                📋 查看本轮回顾{wrongRows.length > 0 ? `（${wrongRows.length} 处待提高）` : ''}
              </button>
            )}
          </>
        ) : isDesktopPresentation ? (
          <>
            <h2>📋 本轮回顾</h2>
            <PagePager
              items={REVIEW_PAGES}
              activeIndex={reviewPage}
              onChange={setReviewPage}
              ariaLabel="本轮回顾分页"
              compact
              className="result-review-pager"
            />
            <div className="result-review-pages" data-result-page={reviewPage}>
              <section className="result-review-page" data-result-page-index="0">
                <div className="result-review-scoreline">
                  <div>
                    <small>本轮得分</small>
                    <b>{score} 分</b>
                  </div>
                  <div>
                    <small>星级</small>
                    <span className="result-review-stars"><Stars count={stars} /></span>
                  </div>
                  {isNewBest && <div className="result-review-best">🎉 新纪录！</div>}
                  {!isNewBest && bestScore != null && bestScore > 0 && (
                    <div className="result-review-best">最高分 {bestScore}</div>
                  )}
                </div>
                {review?.stats && review.stats.length > 0 && (
                  <div className="review-stats">
                    {review.stats.map((s) => (
                      <div key={s.label} className="review-stat">
                        <b>{s.value}</b>
                        <small>{s.label}</small>
                      </div>
                    ))}
                  </div>
                )}
                {review?.advice && <div className="result-advice">💬 {review.advice}</div>}
                {newBadges.length > 0 && (
                  <div className="badge-row">
                    {newBadges.map((b) => (
                      <div key={b.name} className="badge-pop">
                        <span>{b.icon}</span>
                        <small>{b.name}</small>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="result-review-page" data-result-page-index="1">
                {diagnosis.length > 0 && (
                  <div className="diagnosis-panel">
                    {diagnosis.map((d) => (
                      <div key={d.label} className={`diagnosis-card ${d.tone ?? 'good'}`}>
                        <small>{d.label}</small>
                        <b>{d.value}</b>
                      </div>
                    ))}
                  </div>
                )}
                <div className="ability-panel">
                  {abilitySignals.map((ability) => (
                    <div key={ability.id} className={`ability-card ${ability.tone}`}>
                      <div>
                        <small>{ability.label}</small>
                        <b>{ability.value}</b>
                      </div>
                      <span>
                        <i style={{ width: `${ability.value}%` }} />
                      </span>
                      <p>{ability.tip}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="result-review-page result-review-questions" data-result-page-index="2">
                {reviewRowsPageData.items.length > 0 ? (
                  <div className="review-list">
                    {reviewRowsPageData.items.map((r, i) => (
                      <div key={i} className={`review-row ${r.ok ? 'ok' : 'bad'}`}>
                        <span className="rr-mark">{r.ok ? '✓' : '✗'}</span>
                        <span className="rr-label">{r.label}</span>
                        <span className="rr-got">{r.got}</span>
                        {!r.ok && r.want && <span className="rr-want">应为 {r.want}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="result-review-empty">本轮没有逐题明细，继续保持探索！</div>
                )}
                {reviewRowsPageData.pageCount > 1 && (
                  <PagePager
                    items={reviewRowsPagerItems}
                    activeIndex={reviewRowsPageData.pageIndex}
                    onChange={setReviewRowsPage}
                    ariaLabel="逐题回顾分页"
                    compact
                    showTabs={false}
                    className="result-row-pager"
                  />
                )}
              </section>
            </div>
            <div className="result-actions">
              <button className="btn-primary" onClick={onRetry}>
                再练一次
              </button>
              {onContinue && (
                <button className="btn-secondary" onClick={onContinue}>
                  {continueLabel}
                </button>
              )}
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowReview(false)
                  setReviewPage(0)
                  setReviewRowsPage(0)
                }}
              >
                返回成绩
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>📋 本轮回顾</h2>
            {review?.stats && review.stats.length > 0 && (
              <div className="review-stats">
                {review.stats.map((s) => (
                  <div key={s.label} className="review-stat">
                    <b>{s.value}</b>
                    <small>{s.label}</small>
                  </div>
                ))}
              </div>
            )}
            {review?.advice && <div className="result-advice">💬 {review.advice}</div>}
            {diagnosis.length > 0 && (
              <div className="diagnosis-panel">
                {diagnosis.map((d) => (
                  <div key={d.label} className={`diagnosis-card ${d.tone ?? 'good'}`}>
                    <small>{d.label}</small>
                    <b>{d.value}</b>
                  </div>
                ))}
              </div>
            )}
            <div className="ability-panel">
              {abilitySignals.map((ability) => (
                <div key={ability.id} className={`ability-card ${ability.tone}`}>
                  <div>
                    <small>{ability.label}</small>
                    <b>{ability.value}</b>
                  </div>
                  <span>
                    <i style={{ width: `${ability.value}%` }} />
                  </span>
                  <p>{ability.tip}</p>
                </div>
              ))}
            </div>
            {review?.rows && review.rows.length > 0 && (
              <div className="review-list">
                {review.rows.map((r, i) => (
                  <div key={i} className={`review-row ${r.ok ? 'ok' : 'bad'}`}>
                    <span className="rr-mark">{r.ok ? '✓' : '✗'}</span>
                    <span className="rr-label">{r.label}</span>
                    <span className="rr-got">{r.got}</span>
                    {!r.ok && r.want && <span className="rr-want">应为 {r.want}</span>}
                  </div>
                ))}
              </div>
            )}
            <div className="result-actions">
              <button className="btn-primary" onClick={onRetry}>
                再练一次
              </button>
              {onContinue && (
                <button className="btn-secondary" onClick={onContinue}>
                  {continueLabel}
                </button>
              )}
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowReview(false)
                  setReviewPage(0)
                  setReviewRowsPage(0)
                }}
              >
                返回成绩
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function buildDiagnosis(stars: number, review?: ReviewData): NonNullable<ReviewData['diagnosis']> {
  if (review?.diagnosis && review.diagnosis.length > 0) return review.diagnosis
  if (!review) return []

  const rows = review.rows ?? []
  const wrong = rows.filter((r) => !r.ok).length
  const total = rows.length
  const accuracy = total > 0 ? Math.round(((total - wrong) / total) * 100) : null
  const stats = review.stats ?? []

  const out: NonNullable<ReviewData['diagnosis']> = []
  if (accuracy != null) {
    out.push({
      label: '准确性',
      value: accuracy >= 85 ? '很稳定' : accuracy >= 60 ? '快抓住了' : '适合再玩一次',
      tone: accuracy >= 85 ? 'good' : accuracy >= 60 ? 'warn' : 'focus',
    })
  } else if (stars >= 0) {
    out.push({
      label: '完成度',
      value: stars >= 3 ? '很亮眼' : stars >= 2 ? '有进步' : '再试一次',
      tone: stars >= 3 ? 'good' : stars >= 2 ? 'warn' : 'focus',
    })
  }

  if (wrong > 0 && total > 0) {
    out.push({
      label: '易错点',
      value: wrong <= 2 ? '少量细节' : wrong <= total / 2 ? '局部不稳' : '适合回放',
      tone: wrong <= 2 ? 'warn' : 'focus',
    })
  } else if (total > 0) {
    out.push({ label: '稳定性', value: '全项通过', tone: 'good' })
  }

  const statText = stats.map((s) => `${s.label}${s.value}`).join(' ')
  const next =
    /音准|唱|偏高|偏低/.test(statText + (review.advice ?? ''))
      ? '分句慢速跟唱'
      : /节奏|拍|命中|踏准/.test(statText + (review.advice ?? ''))
        ? '慢速跟节拍器'
        : /识谱|音名|正确/.test(statText + (review.advice ?? ''))
          ? '音位回放挑战'
          : '降低难度再玩'
  out.push({ label: '下一步', value: next, tone: stars >= 2 ? 'good' : 'warn' })

  return out
}
