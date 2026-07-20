import { useEffect, useState, useCallback } from 'react'
import { ensureAudio, attackNote, releaseNote } from '../music/audioEngine'
import { useApp } from '../state/appState'
import './recorder.css'

// 高音竖笛 C 大调音阶的简化指法（true=按住该孔）
// 孔位：拇指孔(T) + 前 7 孔（0=最上/背面下第1孔 ... ）
interface Fingering {
  note: string
  name: string
  jianpu: string
  key: string
  // 拇指 + 6 个前孔（简化为 7 个位置）true=按住
  holes: boolean[]
  thumb: boolean
}

// 简化指法表（教学近似，不追求演奏级精确）
const FINGERINGS: Fingering[] = [
  { note: 'C5', name: 'C', jianpu: '1', key: 'a', thumb: true, holes: [true, true, true, true, true, true, true] },
  { note: 'D5', name: 'D', jianpu: '2', key: 's', thumb: true, holes: [true, true, true, true, true, true, false] },
  { note: 'E5', name: 'E', jianpu: '3', key: 'd', thumb: true, holes: [true, true, true, true, true, false, false] },
  { note: 'F5', name: 'F', jianpu: '4', key: 'f', thumb: true, holes: [true, true, true, true, false, false, false] },
  { note: 'G5', name: 'G', jianpu: '5', key: 'g', thumb: true, holes: [true, true, true, false, false, false, false] },
  { note: 'A5', name: 'A', jianpu: '6', key: 'h', thumb: true, holes: [true, true, false, false, false, false, false] },
  { note: 'B5', name: 'B', jianpu: '7', key: 'j', thumb: true, holes: [true, false, false, false, false, false, false] },
  { note: 'C6', name: 'C', jianpu: '1·', key: 'k', thumb: false, holes: [false, true, false, false, false, false, false] },
]

export default function Recorder() {
  const { showNoteNames } = useApp()
  const [current, setCurrent] = useState<Fingering | null>(null)

  const play = useCallback(async (f: Fingering) => {
    await ensureAudio()
    attackNote(f.note, 0.85, 'organ') // 用管风琴音色近似竖笛（局部，不改全局）
    setCurrent(f)
  }, [])

  const stop = useCallback((f: Fingering) => {
    releaseNote(f.note, 'organ')
    setCurrent((c) => (c?.note === f.note ? null : c))
  }, [])

  // 卸载时释放可能仍在保持的持续音（按住按键切页时不残留）
  useEffect(
    () => () => {
      FINGERINGS.forEach((f) => releaseNote(f.note, 'organ'))
    },
    []
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      const f = FINGERINGS.find((x) => x.key === e.key.toLowerCase())
      if (f) {
        e.preventDefault()
        play(f)
      }
    }
    const up = (e: KeyboardEvent) => {
      const f = FINGERINGS.find((x) => x.key === e.key.toLowerCase())
      if (f) stop(f)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [play, stop])

  const shown = current ?? FINGERINGS[0]

  return (
    <div className="instrument-wrap">
      <div className="instrument-toolbar">
        <span className="hint">💡 按住音符按钮吹奏（键盘 A S D F G H J K），右侧显示对应指法图。</span>
      </div>

      <div className="recorder-stage">
        {/* 左：音符按钮 */}
        <div className="recorder-keys">
          {FINGERINGS.map((f) => (
            <button
              key={f.note}
              className={`recorder-key ${current?.note === f.note ? 'on' : ''}`}
              onPointerDown={() => play(f)}
              onPointerUp={() => stop(f)}
              onPointerLeave={() => current?.note === f.note && stop(f)}
            >
              <b>{f.jianpu}</b>
              {showNoteNames && <small>{f.name}</small>}
              <span className="rk-key">{f.key.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* 右：指法图 */}
        <div className="fingering card">
          <div className="fingering-title">
            指法图：{shown.name}（{shown.jianpu}）
          </div>
          <div className="recorder-body">
            {/* 吹口 */}
            <div className="recorder-mouth" />
            {/* 拇指孔 */}
            <div className={`hole thumb ${shown.thumb ? 'pressed' : ''}`}>
              <span>拇指</span>
            </div>
            {/* 前孔 */}
            {shown.holes.map((pressed, i) => (
              <div key={i} className={`hole front ${pressed ? 'pressed' : ''}`}>
                <span>{i + 1}</span>
              </div>
            ))}
            {/* 笛尾 */}
            <div className="recorder-foot" />
          </div>
          <div className="fingering-legend">
            <span><span className="legend-dot pressed" /> 按住</span>
            <span><span className="legend-dot" /> 松开</span>
          </div>
        </div>
      </div>
    </div>
  )
}
