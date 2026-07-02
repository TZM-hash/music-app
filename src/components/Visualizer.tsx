import { useEffect, useRef } from 'react'

export interface Burst {
  id: number
  x: number // 0..1 相对位置
  color: string
  label: string
}

// 一个覆盖在乐器上方的可视化层：按键时冒出彩色气泡/涟漪并上浮消失
export default function Visualizer({ bursts }: { bursts: Burst[] }) {
  return (
    <div className="viz-layer">
      {bursts.map((b) => (
        <BubbleView key={b.id} burst={b} />
      ))}
    </div>
  )
}

function BubbleView({ burst }: { burst: Burst }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%, -220px) scale(1.6)'
      el.style.opacity = '0'
    })
  }, [])
  return (
    <div
      ref={ref}
      className="viz-bubble"
      style={{
        left: `${burst.x * 100}%`,
        background: burst.color,
        boxShadow: `0 0 30px ${burst.color}`,
      }}
    >
      {burst.label}
    </div>
  )
}
