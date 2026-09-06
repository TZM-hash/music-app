import { type KeyboardEvent } from 'react'
import { clampPageIndex } from './presentation'

export interface PagePagerItem {
  id: string
  label: string
  hint?: string
}

interface PagePagerProps {
  items: readonly PagePagerItem[]
  activeIndex: number
  onChange: (index: number) => void
  ariaLabel?: string
  className?: string
  compact?: boolean
  showTabs?: boolean
}

function Chevron({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d={direction === 'prev' ? 'm12.5 4-5 6 5 6' : 'm7.5 4 5 6-5 6'} />
    </svg>
  )
}

export default function PagePager({
  items,
  activeIndex,
  onChange,
  ariaLabel = '展示页面切换',
  className = '',
  compact = false,
  showTabs = true,
}: PagePagerProps) {
  if (items.length === 0) return null

  const safeIndex = clampPageIndex(activeIndex, items.length)
  const move = (offset: number) => onChange(clampPageIndex(safeIndex + offset, items.length))

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      move(1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      move(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      onChange(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      onChange(items.length - 1)
    }
  }

  return (
    <nav
      className={`page-pager ${compact ? 'page-pager-compact' : ''} ${className}`.trim()}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="page-pager-arrow"
        aria-label="上一页"
        onClick={() => move(-1)}
        disabled={safeIndex === 0}
      >
        <Chevron direction="prev" />
      </button>

      {showTabs && (
        <div className="page-pager-tabs" role="tablist" aria-label={ariaLabel}>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={safeIndex === index}
              aria-current={safeIndex === index ? 'page' : undefined}
              className={`page-pager-tab ${safeIndex === index ? 'active' : ''}`}
              onClick={() => onChange(index)}
              title={item.hint}
            >
              <span>{index + 1}</span>
              <b>{item.label}</b>
            </button>
          ))}
        </div>
      )}

      <span className="page-pager-status" aria-live="polite">
        第 {safeIndex + 1} / {items.length} 页
      </span>

      <button
        type="button"
        className="page-pager-arrow"
        aria-label="下一页"
        onClick={() => move(1)}
        disabled={safeIndex === items.length - 1}
      >
        <Chevron direction="next" />
      </button>
    </nav>
  )
}
