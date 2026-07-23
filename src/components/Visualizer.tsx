import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'

export interface Burst {
  id: number
  x: number // 0..1 相对位置
  color: string
  label: string
}

/** 管理音符气泡列表：push(x, color, label) 新增一个气泡，约 1 秒后自动移除 */
// eslint-disable-next-line react-refresh/only-export-components -- hook 与组件同文件导出
export function useNoteBursts(lifeMs = 1000) {
  const [bursts, setBursts] = useState<Burst[]>([])
  const nextId = useRef(0)
  // 登记所有未触发的移除定时器，组件卸载时统一清除，避免卸载后 setState
  const timers = useRef<Set<number>>(new Set())
  const push = useCallback(
    (x: number, color: string, label: string) => {
      const id = nextId.current++
      setBursts((list) => [...list, { id, x, color, label }])
      const timer = window.setTimeout(() => {
        timers.current.delete(timer)
        setBursts((list) => list.filter((item) => item.id !== id))
      }, lifeMs)
      timers.current.add(timer)
    },
    [lifeMs]
  )
  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
      timers.current.clear()
    },
    []
  )
  return { bursts, push }
}

// 一个覆盖在乐器上方的可视化层：按键时冒出彩色气泡，弹出并上浮消失
// 钢琴、木琴等乐器共用；气泡动画见 piano.css .viz-bubble（noteFloat）
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
  return (
    <div
      className="viz-bubble"
      style={
        {
          left: `${burst.x * 100}%`,
          background: burst.color,
          boxShadow: `0 0 30px ${burst.color}`,
        } as CSSProperties
      }
    >
      {burst.label}
    </div>
  )
}
