import { useEffect, useRef, useState } from 'react'

/** 数字滚动：从 0 缓动到目标值（ease-out cubic），挂载时播放一次 */
export default function CountUp({ target, duration = 700 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) {
      setValue(target)
      return
    }
    hasAnimated.current = true
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])

  return <span>{value}</span>
}
