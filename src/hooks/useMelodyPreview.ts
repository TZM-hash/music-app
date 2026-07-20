// 旋律试听 Hook：统一管理"播放一段旋律"的定时器
//
// 解决所有试听/播放按钮的两个通病：
// 1. 重复点击导致多段旋律叠加 —— 每次 play 先停掉上一段
// 2. 组件卸载后音符继续响 —— 所有定时器登记在册，卸载即清理
import { useCallback, useEffect, useRef, useState } from 'react'
import { playNote, TonePatch } from '../music/audioEngine'

export interface PreviewNote {
  note: string
  beats: number
}

interface PlayOptions {
  bpm?: number
  velocity?: number
  patch?: TonePatch
  maxNotes?: number
  /** 播放结束（最后一个音符响起）时回调 */
  onEnd?: () => void
}

export function useMelodyPreview() {
  const timers = useRef<Set<number>>(new Set())
  const alive = useRef(true)
  const [playing, setPlaying] = useState(false)

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current.clear()
  }, [])

  useEffect(
    () => () => {
      alive.current = false
      clearTimers()
    },
    [clearTimers]
  )

  /** 停止当前播放（清掉尚未触发的音符；已发声的音符自然衰减） */
  const stop = useCallback(() => {
    clearTimers()
    setPlaying(false)
  }, [clearTimers])

  /** 播放一段旋律。重复调用会先停掉上一段，绝不会叠加。 */
  const play = useCallback(
    (notes: PreviewNote[], opts: PlayOptions = {}) => {
      clearTimers()
      const bpm = opts.bpm ?? 100
      const beatMs = 60000 / bpm
      const seq = notes.slice(0, opts.maxNotes ?? 32)
      if (seq.length === 0) return

      setPlaying(true)
      let t = 0
      seq.forEach((n) => {
        const at = t
        const id = window.setTimeout(() => {
          timers.current.delete(id)
          if (!alive.current) return
          if (n.note !== 'rest') playNote(n.note, '8n', opts.velocity ?? 0.8, opts.patch)
        }, at)
        timers.current.add(id)
        t += n.beats * beatMs
      })
      // 尾音最后一个音符响起的时刻即算播放结束
      const endId = window.setTimeout(() => {
        timers.current.delete(endId)
        if (!alive.current) return
        setPlaying(false)
        opts.onEnd?.()
      }, t)
      timers.current.add(endId)
    },
    [clearTimers]
  )

  return { play, stop, playing }
}
