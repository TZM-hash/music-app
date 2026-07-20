import type { CSSProperties, ReactNode } from 'react'
import { useReveal } from './useReveal'

/** 滚动渐显包装器：进入视口时上浮显现，index 控制 stagger 延迟 */
export default function Reveal({
  children,
  index = 0,
  className = '',
}: {
  children: ReactNode
  index?: number
  className?: string
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`${className} reveal-item ${revealed ? 'revealed' : ''}`.trim()}
      style={{ '--reveal-delay': `${(index % 8) * 40}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
