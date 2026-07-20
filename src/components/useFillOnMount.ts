import { useEffect, useState } from 'react'

/** 挂载后延迟一帧返回 true，配合 width transition 实现进度条入场填充动画 */
export function useFillOnMount(): boolean {
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  return filled
}
