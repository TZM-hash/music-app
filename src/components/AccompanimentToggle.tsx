import { useState, useCallback, useEffect, useRef } from 'react'
import { ensureAudio, startAccompaniment, stopAccompaniment, isAccompanimentOn } from '../music/audioEngine'

interface Props {
  bpm: number
  /** 可选：外部触发停止（如游戏结束时） */
  externalStop?: boolean
}

/** 伴奏开关按钮：播放背景和弦垫+贝斯+鼓点的 loop */
export default function AccompanimentToggle({ bpm, externalStop }: Props) {
  const [on, setOn] = useState(false)
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm

  const toggle = useCallback(async () => {
    await ensureAudio()
    if (isAccompanimentOn()) {
      stopAccompaniment()
      setOn(false)
    } else {
      startAccompaniment(bpmRef.current)
      setOn(true)
    }
  }, [])

  // 外部停止信号
  useEffect(() => {
    if (externalStop && on) {
      stopAccompaniment()
      setOn(false)
    }
  }, [externalStop])

  // 卸载时停止
  useEffect(() => () => stopAccompaniment(), [])

  return (
    <button className={`accomp-btn ${on ? 'on' : ''}`} onClick={toggle}>
      {on ? '🎵 伴奏 开' : '🎶 伴奏 关'}
    </button>
  )
}