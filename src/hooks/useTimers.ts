// 统一生命周期工具：解决"切页/卸载后定时器、异步回调仍在执行"的系统性问题
//
// 1. useTimers() —— 组件级定时器注册表
//    用 later(fn, ms) 替代裸 setTimeout：组件卸载时自动全部清理，
//    回调即使已触发也会先检查卸载标志，不会在已卸载组件上 setState。
//
// 2. useMounted() —— 卸载标志 ref
//    在 await 之后检查 mounted.current，为 false 就直接 return，
//    避免异步操作（ensureAudio/getUserMedia 等）完成后在已卸载组件上继续执行。
import { useCallback, useEffect, useRef } from 'react'

export function useTimers() {
  const timers = useRef<Set<number>>(new Set())
  const alive = useRef(true)

  useEffect(() => {
    // React StrictMode 在开发环境会模拟一次“卸载后重新挂载”；
    // 重新挂载时必须恢复可用状态，否则后续登记的计时器会被永久跳过。
    alive.current = true
    const timerSet = timers.current
    return () => {
      alive.current = false
      timerSet.forEach((id) => window.clearTimeout(id))
      timerSet.clear()
    }
  }, [])

  const later = useCallback((fn: () => void, ms: number): number => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      if (alive.current) fn()
    }, ms)
    timers.current.add(id)
    return id
  }, [])

  const cancel = useCallback((id: number) => {
    timers.current.delete(id)
    window.clearTimeout(id)
  }, [])

  return { later, cancel }
}

export function useMounted() {
  const mounted = useRef(true)
  useEffect(() => {
    // 与 useTimers 一样，兼容 StrictMode 的开发期重新挂载模拟。
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  return mounted
}
