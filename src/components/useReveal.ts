import { useEffect, useRef, useState } from 'react'

/**
 * 滚动渐显：元素进入视口时返回 revealed=true。
 * 配合 .reveal-item / .reveal-item.revealed 使用；
 * stagger 通过 style={{ '--reveal-delay': `${i * 40}ms` }} 传入（见 Reveal 组件）。
 */
export function useReveal<T extends HTMLElement>(threshold = 0.1) {
  const ref = useRef<T | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true)
            observer.disconnect()
          }
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, revealed }
}
