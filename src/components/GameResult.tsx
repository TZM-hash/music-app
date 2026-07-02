import { useState } from 'react'
import Stars from './Stars'
import './gameResult.css'

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
}

interface Props {
  title?: string
  score: number
  stars: number
  bestScore?: number
  isNewBest?: boolean
  newBadges?: { icon: string; name: string }[]
  review?: ReviewData
  onRetry: () => void
  onHome: () => void
}

export default function GameResult({
  title = '本轮结束',
  score,
  stars,
  bestScore,
  isNewBest,
  newBadges = [],
  review,
  onRetry,
  onHome,
}: Props) {
  const [showReview, setShowReview] = useState(false)
  const wrongRows = review?.rows?.filter((r) => !r.ok) ?? []
  const hasReview = !!review && ((review.rows?.length ?? 0) > 0 || (review.stats?.length ?? 0) > 0)

  return (
    <div className="result-overlay">
      <div className={`result-card ${showReview ? 'wide' : ''}`}>
        {!showReview ? (
          <>
            <h2>{title}</h2>
            <div className="result-stars">
              <Stars count={stars} />
            </div>
            <div className="result-score">{score} 分</div>
            {isNewBest && <div className="new-best">🎉 新纪录！</div>}
            {!isNewBest && bestScore != null && bestScore > 0 && (
              <div className="best-line">最高分 {bestScore}</div>
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
            <div className="result-actions">
              <button className="btn-primary" onClick={onRetry}>
                🔁 再来一次
              </button>
              <button className="btn-ghost" onClick={onHome}>
                🏠 返回首页
              </button>
            </div>
            {hasReview && (
              <button className="review-link" onClick={() => setShowReview(true)}>
                📋 查看本轮回顾{wrongRows.length > 0 ? `（${wrongRows.length} 处待提高）` : ''}
              </button>
            )}
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
                🔁 再练一次
              </button>
              <button className="btn-ghost" onClick={() => setShowReview(false)}>
                ← 返回
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

