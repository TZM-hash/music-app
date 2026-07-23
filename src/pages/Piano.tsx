import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildNotes, whiteNotes, KEYBOARD_MAP, SCALES, NoteInfo, transposeNote } from '../music/notes'
import {
  ensureAudio,
  attackNote,
  releaseNote,
  startMetronome,
  stopMetronome,
  setPatch,
  setVolume,
  setSustain,
  setSustainTime,
  playChord,
  preloadPiano,
  onPianoLoad,
  PianoLoadState,
  TonePatch,
  PATCH_INFO,
} from '../music/audioEngine'
import { useApp } from '../state/appState'
import { useMounted, useTimers } from '../hooks/useTimers'
import Visualizer, { useNoteBursts } from '../components/Visualizer'
import AccompanimentToggle from '../components/AccompanimentToggle'
import './piano.css'

// 常用和弦（C大调级数）
const CHORDS: { label: string; root: string; quality: 'maj' | 'min' }[] = [
  { label: 'C', root: 'C3', quality: 'maj' },
  { label: 'Dm', root: 'D3', quality: 'min' },
  { label: 'Em', root: 'E3', quality: 'min' },
  { label: 'F', root: 'F3', quality: 'maj' },
  { label: 'G', root: 'G3', quality: 'maj' },
  { label: 'Am', root: 'A3', quality: 'min' },
]

// 钢琴偏好持久化（延音开关 / 余音时长）
const PIANO_PREF_KEY = 'music-edu-piano-prefs-v1'
interface PianoPrefs {
  sustainOn: boolean
  sustainSecs: number
}
function loadPianoPrefs(): PianoPrefs {
  try {
    const raw = localStorage.getItem(PIANO_PREF_KEY)
    if (raw) return { sustainOn: false, sustainSecs: 2.5, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { sustainOn: false, sustainSecs: 2.5 }
}
function savePianoPrefs(p: PianoPrefs): void {
  try {
    localStorage.setItem(PIANO_PREF_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

export default function Piano() {
  const { showNoteNames } = useApp()
  const initialPrefs = loadPianoPrefs()
  const [octave, setOctave] = useState(4) // 起始八度（中央 C 区）
  const [octaveSpan, setOctaveSpan] = useState(3) // 显示几个八度
  const [scale, setScale] = useState<keyof typeof SCALES>('none')
  const [patch, setPatchState] = useState<TonePatch>('piano')
  const [volume, setVol] = useState(-6)
  const [metroOn, setMetroOn] = useState(false)
  const [bpm, setBpm] = useState(90)
  const [beatFlash, setBeatFlash] = useState(-1)
  const [sustainOn, setSustainOn] = useState(initialPrefs.sustainOn)
  const [sustainSecs, setSustainSecs] = useState(initialPrefs.sustainSecs)
  const [loadState, setLoadState] = useState<PianoLoadState>('idle')

  const ALL = useMemo(() => buildNotes(octave, octaveSpan), [octave, octaveSpan])
  const WHITES = useMemo(() => whiteNotes(ALL), [ALL])
  // 每个白键右侧的黑键（预计算，避免渲染时 O(n²) 的 ALL.find）
  const blackAfterWhite = useMemo(() => {
    const blackByLeft = new Map<string, NoteInfo>()
    for (const n of ALL) {
      if (n.isBlack) blackByLeft.set(`${n.name[0]}${n.note.slice(-1)}`, n)
    }
    return WHITES.map((w) =>
      w.name === 'E' || w.name === 'B' ? null : blackByLeft.get(`${w.name}${w.note.slice(-1)}`) ?? null
    )
  }, [ALL, WHITES])

  const [active, setActive] = useState<Set<string>>(new Set())
  const activeRef = useRef<Set<string>>(new Set())
  const { bursts, push: pushBurst } = useNoteBursts()
  const recording = useRef<{ note: string; t: number; v: number }[]>([])
  const [isRecording, setIsRecording] = useState(false)
  // 录音状态用 ref 镜像，让 press/release 回调引用稳定（键盘监听 effect 不必反复重注册）
  const isRecordingRef = useRef(false)
  const [hasRecording, setHasRecording] = useState(false)
  const startTime = useRef(0)
  const mounted = useMounted()
  const { later } = useTimers()

  // 进入钢琴页即预加载采样，并订阅加载状态（带卸载保护）
  useEffect(() => {
    ensureAudio().then((ok) => {
      if (ok && mounted.current) preloadPiano()
    })
    return onPianoLoad(setLoadState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 卸载时释放所有还在发声的持续音（避免按住琴键切页后音一直响）
  useEffect(
    () => () => {
      activeRef.current.forEach((n) => releaseNote(n))
    },
    []
  )

  // 应用已保存的延音设置到音频引擎（进页面时恢复）
  useEffect(() => {
    setSustainTime(sustainSecs)
    setSustain(sustainOn)
    // 仅在挂载时应用一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 延音偏好变化时持久化
  useEffect(() => {
    savePianoPrefs({ sustainOn, sustainSecs })
  }, [sustainOn, sustainSecs])

  const scaleNotes = SCALES[scale].notes
  const inScale = (n: NoteInfo) => scaleNotes.length === 0 || scaleNotes.includes(n.name)

  const noteX = useCallback(
    (note: NoteInfo): number => {
      const idx = WHITES.findIndex((w) => w.note === note.note)
      if (idx >= 0) return (idx + 0.5) / WHITES.length
      const leftWhite = WHITES.findIndex(
        (w) => w.note[0] === note.note[0] && w.note.slice(-1) === note.note.slice(-1)
      )
      return leftWhite >= 0 ? (leftWhite + 1) / WHITES.length : 0.5
    },
    [WHITES]
  )

  // 力度：基于按钮高度计算，顶部(靠近鼻)轻=0.45，底部(靠近钢琴师)重=0.95
  const pressWithVel = useCallback(
    (note: NoteInfo, clientY: number, btnEl: HTMLElement) => {
      const rect = btnEl.getBoundingClientRect()
      const relY = clientY - rect.top
      const vel = Math.min(0.95, Math.max(0.45, relY / rect.height))
      ensureAudio().then((ok) => ok && attackNote(note.note, vel))
      activeRef.current.add(note.note)
      setActive((s) => new Set(s).add(note.note))
      pushBurst(noteX(note), note.color, showNoteNames ? note.jianpu : '')
      if (isRecordingRef.current) {
        recording.current.push({ note: note.note, t: performance.now() - startTime.current, v: vel })
      }
    },
    [noteX, showNoteNames, pushBurst]
  )

  // 键盘/回放用的固定力度触发
  const press = useCallback(
    (note: NoteInfo, vel = 0.8) => {
      ensureAudio().then((ok) => ok && attackNote(note.note, vel))
      activeRef.current.add(note.note)
      setActive((s) => new Set(s).add(note.note))
      pushBurst(noteX(note), note.color, showNoteNames ? note.jianpu : '')
      if (isRecordingRef.current) {
        recording.current.push({ note: note.note, t: performance.now() - startTime.current, v: vel })
      }
    },
    [noteX, showNoteNames, pushBurst]
  )

  const release = useCallback((note: NoteInfo) => {
    releaseNote(note.note)
    activeRef.current.delete(note.note)
    setActive((s) => {
      const n = new Set(s)
      n.delete(note.note)
      return n
    })
  }, [])

  // 电脑键盘弹奏（映射固定为 C4 区，随 octave 半音移调，跨八度正确）
  useEffect(() => {
    const shift = (octave - 4) * 12
    // 记录每个物理键按下时实际触发的音符：即便按住期间切换了八度，
    // keyup 也能释放当初按下的那个音，避免残留卡音。
    const pressedByKey = new Map<string, NoteInfo>()
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      const key = e.key.toLowerCase()
      const base = KEYBOARD_MAP[key]
      if (!base) return
      if (pressedByKey.has(key)) return
      const target = transposeNote(base, shift)
      const info = ALL.find((n) => n.note === target)
      if (info) {
        pressedByKey.set(key, info)
        press(info)
      }
    }
    const up = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const info = pressedByKey.get(key)
      if (!info) return
      pressedByKey.delete(key)
      release(info)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      // effect 重建（如切换八度）时，释放此前按住的所有音，避免遗留发声
      pressedByKey.forEach((info) => release(info))
    }
  }, [press, release, octave, ALL])

  // 节拍器
  useEffect(() => {
    if (metroOn) {
      ensureAudio().then((ok) => ok && startMetronome(bpm, (b) => setBeatFlash(b)))
    } else {
      stopMetronome()
      setBeatFlash(-1)
    }
    return () => stopMetronome()
  }, [metroOn, bpm])

  const changePatch = (p: TonePatch) => {
    setPatch(p)
    setPatchState(p)
  }
  const changeVolume = (v: number) => {
    setVolume(v)
    setVol(v)
  }
  const strumChord = async (root: string, quality: 'maj' | 'min') => {
    if (!(await ensureAudio())) return
    playChord(root, quality, '2n')
  }

  const toggleRecord = () => {
    if (isRecording) {
      isRecordingRef.current = false
      setIsRecording(false)
      setHasRecording(recording.current.length > 0)
    } else {
      recording.current = []
      startTime.current = performance.now()
      isRecordingRef.current = true
      setIsRecording(true)
      setHasRecording(false)
    }
  }

  const playback = async () => {
    if (!(await ensureAudio())) return
    if (!mounted.current) return
    recording.current.forEach((ev) => {
      later(() => {
        const info = ALL.find((n) => n.note === ev.note)
        if (info) {
          press(info, ev.v)
          later(() => release(info), 300)
        }
      }, ev.t)
    })
  }

  // 延音踏板：开关式
  const toggleSustain = useCallback(() => {
    setSustainOn((prev) => {
      const next = !prev
      setSustain(next)
      return next
    })
  }, [])

  const changeSustainTime = useCallback((sec: number) => {
    setSustainSecs(sec)
    setSustainTime(sec)
  }, [])

  // 空格键 = 切换延音踏板开关
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        toggleSustain()
      }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [toggleSustain])

  return (
    <div className="instrument-wrap">
      <div className="instrument-toolbar">
        <button className={`rec-btn ${isRecording ? 'on' : ''}`} onClick={toggleRecord}>
          {isRecording ? '⏹ 停止' : '⏺ 录制'}
        </button>
        <button className="rec-btn" onClick={playback} disabled={!hasRecording}>
          ▶ 回放
        </button>

        <div className="ctrl-group">
          <span className="ctrl-label">起始</span>
          <button className="mini-btn" onClick={() => setOctave((o) => Math.max(1, o - 1))}>
            −
          </button>
          <span className="ctrl-val">C{octave}</span>
          <button className="mini-btn" onClick={() => setOctave((o) => Math.min(6, o + 1))}>
            ＋
          </button>
        </div>

        <div className="ctrl-group">
          <span className="ctrl-label">音域</span>
          <button className="mini-btn" onClick={() => setOctaveSpan((s) => Math.max(1, s - 1))}>
            −
          </button>
          <span className="ctrl-val">{octaveSpan}组</span>
          <button className="mini-btn" onClick={() => setOctaveSpan((s) => Math.min(5, s + 1))}>
            ＋
          </button>
        </div>

        <div className="ctrl-group">
          <span className="ctrl-label">音阶高亮</span>
          <select value={scale} onChange={(e) => setScale(e.target.value as keyof typeof SCALES)}>
            {Object.entries(SCALES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ctrl-group">
          <button
            className={`rec-btn ${metroOn ? 'on-accent' : ''}`}
            onClick={() => setMetroOn((v) => !v)}
          >
            🎵 节拍器 {metroOn ? '开' : '关'}
          </button>
          <div className={`beat-dots ${metroOn ? '' : 'dim'}`}>
            {[0, 1, 2, 3].map((b) => (
              <span key={b} className={`beat-dot ${beatFlash === b ? 'on' : ''}`} />
            ))}
          </div>
          <input
            type="range"
            min={40}
            max={200}
            value={bpm}
            aria-label="节拍器速度"
            onChange={(e) => setBpm(Number(e.target.value))}
          />
          <span className="ctrl-val">{bpm}</span>
        </div>
      </div>

      {/* 第二行：音色 · 音量 · 和弦伴奏板 */}
      <div className="instrument-toolbar row2">
        <div className="ctrl-group">
          <span className="ctrl-label">音色</span>
          <div className="patch-picker">
            {(Object.keys(PATCH_INFO) as TonePatch[]).map((p) => (
              <button
                key={p}
                className={`patch-btn ${patch === p ? 'on' : ''}`}
                onClick={() => changePatch(p)}
              >
                {PATCH_INFO[p].icon} {PATCH_INFO[p].name}
              </button>
            ))}
          </div>
        </div>

        <div className="ctrl-group">
          <span className="ctrl-label">🔊 音量</span>
          <input
            type="range"
            min={-30}
            max={0}
            value={volume}
            aria-label="音量"
            onChange={(e) => changeVolume(Number(e.target.value))}
          />
        </div>

        <div className="ctrl-group chord-group">
          <span className="ctrl-label">和弦伴奏</span>
          {CHORDS.map((c) => (
            <button
              key={c.label}
              className="chord-btn"
              onPointerDown={() => strumChord(c.root, c.quality)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="ctrl-group">
          <button
            className={`rec-btn ${sustainOn ? 'on-accent' : ''}`}
            onClick={toggleSustain}
            title="点击开关延音踏板（或按空格键）"
          >
            🦶 延音 {sustainOn ? '开' : '关'}
          </button>
          {sustainOn && (
            <>
              <span className="ctrl-label">余音 {sustainSecs.toFixed(1)}s</span>
              <input
                type="range"
                min={0.5}
                max={6}
                step={0.5}
                value={sustainSecs}
                aria-label="延音余音时长"
                onChange={(e) => changeSustainTime(Number(e.target.value))}
              />
            </>
          )}
        </div>

        <AccompanimentToggle bpm={bpm} />

        <span className={`piano-load ${loadState}`}>
          {loadState === 'loading' && '⏳ 正在加载真实钢琴音色…'}
          {loadState === 'sampled' && '🎹 真实钢琴音色'}
          {loadState === 'fallback' && '🎹 增强合成音色（离线）'}
        </span>
      </div>

      <div className="piano-stage">
        <Visualizer bursts={bursts} />
        <div className="piano" style={{ '--white-count': WHITES.length } as React.CSSProperties}>
          {/* 白键：grid 列布局，每个白键占一列 */}
          {WHITES.map((n, i) => (
            <button
              key={n.note}
              className={`white-key ${active.has(n.note) ? 'active' : ''} ${
                inScale(n) ? '' : 'dim-key'
              } ${scaleNotes.length > 0 && inScale(n) ? 'scale-key' : ''}`}
              style={{ gridColumn: i + 1 }}
              aria-label={`琴键 ${n.name}${n.note.slice(-1)}（简谱 ${n.jianpu}）`}
              onPointerDown={(e) => pressWithVel(n, e.clientY, e.currentTarget)}
              onPointerUp={() => release(n)}
              onPointerLeave={() => active.has(n.note) && release(n)}
            >
              {showNoteNames && (
                <span className="key-label">
                  <b>{n.jianpu}</b>
                  <small>{n.name}</small>
                </span>
              )}
            </button>
          ))}

          {/* 黑键：放在对应白键列的右边缘，跨列显示 */}
          {blackAfterWhite.map((blackAfter, i) => {
            if (!blackAfter || i >= WHITES.length - 1) return null
            return (
              <button
                key={blackAfter.note}
                className={`black-key ${active.has(blackAfter.note) ? 'active' : ''} ${
                  inScale(blackAfter) ? '' : 'dim-key'
                }`}
                style={{ gridColumn: i + 1 }}
                aria-label={`琴键 ${blackAfter.name}${blackAfter.note.slice(-1)}`}
                onPointerDown={(e) => pressWithVel(blackAfter, e.clientY, e.currentTarget)}
                onPointerUp={() => release(blackAfter)}
                onPointerLeave={() => active.has(blackAfter.note) && release(blackAfter)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
