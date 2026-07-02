import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureAudio, triggerVoice, VoiceKind, VOICE_INFO, setVolume } from '../music/audioEngine'
import './mixer.css'

const STEPS = 16
const PITCHES = ['C2', 'D2', 'E2', 'G2', 'A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5', 'D5', 'E5']

interface Track {
  id: number
  voice: VoiceKind
  note: string
  steps: boolean[]
  volume: number // dB
  mute: boolean
  solo: boolean
}

let trackSeq = 0
function makeTrack(voice: VoiceKind, steps?: number[]): Track {
  return {
    id: trackSeq++,
    voice,
    note: VOICE_INFO[voice].defaultNote,
    steps: steps ? steps.map(Boolean) : Array(STEPS).fill(false),
    volume: -6,
    mute: false,
    solo: false,
  }
}

// —— 预设节奏型（整套鼓组 + 贝斯）——
interface Preset {
  name: string
  bpm: number
  tracks: { voice: VoiceKind; note?: string; steps: number[] }[]
}
const PRESETS: Preset[] = [
  {
    name: '摇滚 Rock',
    bpm: 110,
    tracks: [
      { voice: 'kick', steps: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0] },
      { voice: 'snare', steps: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
      { voice: 'hihat', steps: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
      { voice: 'bass', note: 'C2', steps: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0] },
    ],
  },
  {
    name: '放克 Funk',
    bpm: 100,
    tracks: [
      { voice: 'kick', steps: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0] },
      { voice: 'snare', steps: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1] },
      { voice: 'hihat', steps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
      { voice: 'clap', steps: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
    ],
  },
  {
    name: '迪斯科 Disco',
    bpm: 120,
    tracks: [
      { voice: 'kick', steps: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] },
      { voice: 'snare', steps: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
      { voice: 'hihat', steps: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0] },
      { voice: 'bass', note: 'C2', steps: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
    ],
  },
  {
    name: '嘻哈 HipHop',
    bpm: 90,
    tracks: [
      { voice: 'kick', steps: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0] },
      { voice: 'snare', steps: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
      { voice: 'hihat', steps: [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0] },
      { voice: 'bass', note: 'C2', steps: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0] },
    ],
  },
  {
    name: '波萨 Bossa',
    bpm: 100,
    tracks: [
      { voice: 'kick', steps: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0] },
      { voice: 'snare', steps: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0] },
      { voice: 'hihat', steps: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
      { voice: 'marimba', note: 'C4', steps: [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0] },
    ],
  },
]

function presetToTracks(p: Preset): Track[] {
  return p.tracks.map((t) => {
    const tr = makeTrack(t.voice, t.steps)
    if (t.note) tr.note = t.note
    return tr
  })
}

const SAVE_KEY = 'music-edu-mixer-projects-v1'
interface SavedProject {
  name: string
  bpm: number
  swing: number
  tracks: { voice: VoiceKind; note: string; steps: boolean[]; volume: number }[]
}
function loadProjects(): SavedProject[] {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]')
  } catch {
    return []
  }
}
function saveProjects(list: SavedProject[]): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(list))
}

// —— 分享码：把作品编码成一段可复制文本（离线可用）——
// 兼容中文名的 base64 编解码
function b64encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}
function b64decode(str: string): string {
  return decodeURIComponent(escape(atob(str)))
}
function encodeShare(p: SavedProject): string {
  // 紧凑格式：steps 压成 0/1 字符串减小体积
  const compact = {
    n: p.name,
    b: p.bpm,
    s: p.swing,
    t: p.tracks.map((t) => ({ v: t.voice, o: t.note, m: t.steps.map((x) => (x ? 1 : 0)).join(''), g: t.volume })),
  }
  return 'YD1:' + b64encode(JSON.stringify(compact))
}
function decodeShare(code: string): SavedProject | null {
  try {
    const raw = code.trim().replace(/^YD1:/, '')
    const c = JSON.parse(b64decode(raw))
    return {
      name: c.n || '导入作品',
      bpm: c.b || 110,
      swing: c.s || 0,
      tracks: c.t.map((t: { v: VoiceKind; o: string; m: string; g: number }) => ({
        voice: t.v,
        note: t.o,
        steps: t.m.split('').map((x: string) => x === '1'),
        volume: t.g ?? -6,
      })),
    }
  } catch {
    return null
  }
}

export default function Mixer() {
  const [tracks, setTracks] = useState<Track[]>(() => presetToTracks(PRESETS[0]))
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpm] = useState(110)
  const [swing, setSwing] = useState(0) // 0..0.5 摇摆量
  const [master, setMaster] = useState(-6)
  const [curStep, setCurStep] = useState(-1)
  const [projects, setProjects] = useState<SavedProject[]>(() => loadProjects())
  const [shareCode, setShareCode] = useState<string | null>(null) // 导出弹窗内容
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [copied, setCopied] = useState(false)
  const tracksRef = useRef(tracks)
  const swingRef = useRef(swing)
  const stopRef = useRef<(() => void) | null>(null)
  tracksRef.current = tracks
  swingRef.current = swing

  const anySolo = tracks.some((t) => t.solo)

  const stop = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    setPlaying(false)
    setCurStep(-1)
  }, [])

  const togglePlay = async () => {
    await ensureAudio()
    if (playing) { stop(); return }
    let step = 0
    let timer = 0
    const schedule = () => {
      const base = (60 / bpm / 4) * 1000
      // 摇摆：偶数步稍长、奇数步稍短
      const isOff = step % 2 === 1
      const sw = swingRef.current
      const interval = isOff ? base * (1 - sw) : base * (1 + sw)
      const ts = tracksRef.current
      const soloOn = ts.some((t) => t.solo)
      for (const t of ts) {
        const audible = soloOn ? t.solo : !t.mute
        if (audible && t.steps[step]) triggerVoice(t.voice, t.note, t.volume)
      }
      setCurStep(step)
      step = (step + 1) % STEPS
      timer = window.setTimeout(schedule, interval)
    }
    schedule()
    stopRef.current = () => window.clearTimeout(timer)
    setPlaying(true)
  }

  useEffect(() => () => stopRef.current?.(), [])

  // 主音量
  useEffect(() => {
    setVolume(master)
  }, [master])

  const toggleStep = (tid: number, step: number) => {
    setTracks((ts) => ts.map((t) => {
      if (t.id !== tid) return t
      const steps = [...t.steps]
      steps[step] = !steps[step]
      return { ...t, steps }
    }))
  }
  const updateTrack = (tid: number, patch: Partial<Track>) => {
    setTracks((ts) => ts.map((t) => (t.id === tid ? { ...t, ...patch } : t)))
  }
  const changeVoice = (tid: number, voice: VoiceKind) => {
    updateTrack(tid, { voice, note: VOICE_INFO[voice].defaultNote })
  }
  const addTrack = () => setTracks((ts) => [...ts, makeTrack('piano')])
  const removeTrack = (tid: number) => setTracks((ts) => ts.filter((t) => t.id !== tid))
  const clearTrack = (tid: number) =>
    setTracks((ts) => ts.map((t) => (t.id === tid ? { ...t, steps: Array(STEPS).fill(false) } : t)))
  const clearAll = () => setTracks((ts) => ts.map((t) => ({ ...t, steps: Array(STEPS).fill(false) })))

  const applyPreset = (p: Preset) => {
    setTracks(presetToTracks(p))
    setBpm(p.bpm)
  }

  // 随机填充：给每条轨道生成一段有规律的随机节奏（用序号驱动，保证可玩）
  const randomize = () => {
    setTracks((ts) => ts.map((t, ti) => {
      const density = t.voice === 'hihat' ? 0.5 : t.voice === 'kick' ? 0.28 : 0.22
      const steps = Array.from({ length: STEPS }, (_, i) => {
        const seed = (i * 7 + ti * 13 + Math.floor(Math.random() * 100)) % 100
        return seed < density * 100
      })
      return { ...t, steps }
    }))
  }

  const preview = async (t: Track) => {
    await ensureAudio()
    triggerVoice(t.voice, t.note, t.volume)
  }

  const saveCurrent = () => {
    const name = prompt('给作品起个名字：', `我的作品 ${projects.length + 1}`)
    if (!name) return
    const proj: SavedProject = {
      name,
      bpm,
      swing,
      tracks: tracks.map((t) => ({ voice: t.voice, note: t.note, steps: t.steps, volume: t.volume })),
    }
    const list = [...projects, proj]
    saveProjects(list)
    setProjects(list)
  }
  const loadProject = (p: SavedProject) => {
    setTracks(p.tracks.map((t) => {
      const tr = makeTrack(t.voice, t.steps.map((s) => (s ? 1 : 0)))
      tr.note = t.note
      tr.volume = t.volume
      return tr
    }))
    setBpm(p.bpm)
    setSwing(p.swing ?? 0)
  }
  const deleteProject = (idx: number) => {
    const list = projects.filter((_, i) => i !== idx)
    saveProjects(list)
    setProjects(list)
  }

  // 当前作品对象
  const currentProject = (name = '我的作品'): SavedProject => ({
    name,
    bpm,
    swing,
    tracks: tracks.map((t) => ({ voice: t.voice, note: t.note, steps: t.steps, volume: t.volume })),
  })

  // 导出分享码
  const exportShare = () => {
    setShareCode(encodeShare(currentProject()))
    setCopied(false)
  }
  const copyShare = async () => {
    if (!shareCode) return
    try {
      await navigator.clipboard.writeText(shareCode)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  // 导出 JSON 文件
  const exportFile = () => {
    const blob = new Blob([JSON.stringify(currentProject('乐动混音作品'), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '乐动混音作品.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  // 从分享码/文本导入
  const doImport = () => {
    const p = decodeShare(importText)
    if (p) {
      loadProject(p)
      setImportOpen(false)
      setImportText('')
    } else {
      alert('分享码无法识别，请检查是否复制完整。')
    }
  }
  // 从 JSON 文件导入
  const importFromFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const c = JSON.parse(String(reader.result))
        loadProject(c as SavedProject)
        setImportOpen(false)
      } catch {
        alert('文件格式不正确。')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="mixer">
      {/* 走带控制条 */}
      <div className="mix-transport card">
        <button className={`mix-play ${playing ? 'on' : ''}`} onClick={togglePlay}>
          {playing ? '⏹ 停止' : '▶ 播放'}
        </button>
        <div className="mix-tempo">
          <span>速度 {bpm}</span>
          <input type="range" min={60} max={180} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
        </div>
        <div className="mix-tempo">
          <span>摇摆 {Math.round(swing * 100)}%</span>
          <input type="range" min={0} max={0.5} step={0.05} value={swing} onChange={(e) => setSwing(Number(e.target.value))} />
        </div>
        <div className="mix-tempo">
          <span>🔊 主音量</span>
          <input type="range" min={-30} max={0} value={master} onChange={(e) => setMaster(Number(e.target.value))} />
        </div>
      </div>

      {/* 预设 + 操作 */}
      <div className="mix-toolbar2 card">
        <span className="mix-toolbar-label">🎵 节奏型：</span>
        {PRESETS.map((p) => (
          <button key={p.name} className="preset-chip" onClick={() => applyPreset(p)}>
            {p.name}
          </button>
        ))}
        <div className="mix-spacer" />
        <button className="mix-btn" onClick={randomize}>🎲 随机</button>
        <button className="mix-btn" onClick={addTrack}>➕ 加轨</button>
        <button className="mix-btn" onClick={clearAll}>🧹 清空</button>
        <button className="mix-btn primary" onClick={saveCurrent}>💾 保存</button>
        <button className="mix-btn" onClick={exportShare}>🔗 分享码</button>
        <button className="mix-btn" onClick={exportFile}>⬇️ 导出文件</button>
        <button className="mix-btn" onClick={() => { setImportOpen(true); setImportText('') }}>📥 导入</button>
      </div>

      {/* 已保存作品 */}
      {projects.length > 0 && (
        <div className="mix-projects card">
          <span className="mix-toolbar-label">📁 我的作品：</span>
          {projects.map((p, i) => (
            <span key={i} className="proj-chip">
              <button className="proj-load" onClick={() => loadProject(p)}>{p.name}</button>
              <button className="proj-del" onClick={() => deleteProject(i)}>✕</button>
            </span>
          ))}
        </div>
      )}

      {/* 步进标尺 */}
      <div className="mix-ruler">
        <div className="mix-track-head-spacer" />
        <div className="mix-steps-ruler">
          {Array.from({ length: STEPS }).map((_, i) => (
            <span key={i} className={`ruler-tick ${i % 4 === 0 ? 'beat' : ''} ${curStep === i ? 'cur' : ''}`}>
              {i % 4 === 0 ? i / 4 + 1 : ''}
            </span>
          ))}
        </div>
      </div>

      {/* 音轨 */}
      <div className="mix-tracks">
        {tracks.map((t) => {
          const info = VOICE_INFO[t.voice]
          const dimmed = anySolo && !t.solo
          return (
            <div key={t.id} className={`mix-track ${dimmed ? 'dimmed' : ''}`}>
              <div className="mix-track-head">
                <button className="track-voice-icon" onClick={() => preview(t)} title="试听">
                  {info.icon}
                </button>
                <select
                  className="track-voice-sel"
                  value={t.voice}
                  onChange={(e) => changeVoice(t.id, e.target.value as VoiceKind)}
                >
                  {(Object.keys(VOICE_INFO) as VoiceKind[]).map((v) => (
                    <option key={v} value={v}>{VOICE_INFO[v].icon} {VOICE_INFO[v].name}</option>
                  ))}
                </select>
                {info.pitched && (
                  <select
                    className="track-note-sel"
                    value={t.note}
                    onChange={(e) => updateTrack(t.id, { note: e.target.value })}
                  >
                    {PITCHES.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                )}
                <div className="track-mini-actions">
                  <button className={`mini-toggle ${t.mute ? 'on-mute' : ''}`} onClick={() => updateTrack(t.id, { mute: !t.mute })} title="静音">M</button>
                  <button className={`mini-toggle ${t.solo ? 'on-solo' : ''}`} onClick={() => updateTrack(t.id, { solo: !t.solo })} title="独奏">S</button>
                  <input className="track-vol" type="range" min={-24} max={0} value={t.volume} onChange={(e) => updateTrack(t.id, { volume: Number(e.target.value) })} title="音量" />
                  <button className="mini-toggle" onClick={() => clearTrack(t.id)} title="清空该轨">⌫</button>
                  <button className="mini-toggle del" onClick={() => removeTrack(t.id)} title="删除该轨">✕</button>
                </div>
              </div>

              <div className="mix-steps">
                {t.steps.map((on, step) => (
                  <button
                    key={step}
                    className={`mix-cell ${on ? 'on' : ''} ${step % 4 === 0 ? 'beat' : ''} ${curStep === step ? 'cur' : ''}`}
                    onClick={() => toggleStep(t.id, step)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 分享码导出弹窗 */}
      {shareCode !== null && (
        <div className="mix-modal-overlay" onClick={() => setShareCode(null)}>
          <div className="mix-modal card" onClick={(e) => e.stopPropagation()}>
            <h3>🔗 分享码</h3>
            <p className="mix-modal-hint">复制下面的分享码发给同学或老师，对方用「📥 导入」粘贴即可打开你的作品。</p>
            <textarea className="mix-share-text" readOnly value={shareCode} rows={4} onFocus={(e) => e.target.select()} />
            <div className="mix-modal-actions">
              <button className="mix-btn primary" onClick={copyShare}>
                {copied ? '✓ 已复制' : '📋 复制分享码'}
              </button>
              <button className="mix-btn" onClick={() => setShareCode(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 导入弹窗 */}
      {importOpen && (
        <div className="mix-modal-overlay" onClick={() => setImportOpen(false)}>
          <div className="mix-modal card" onClick={(e) => e.stopPropagation()}>
            <h3>📥 导入作品</h3>
            <p className="mix-modal-hint">粘贴分享码，或选择之前导出的 .json 文件。</p>
            <textarea
              className="mix-share-text"
              placeholder="在此粘贴分享码（以 YD1: 开头）"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={4}
            />
            <div className="mix-modal-actions">
              <label className="mix-btn file-label">
                📁 选择文件
                <input
                  type="file"
                  accept="application/json,.json"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])}
                />
              </label>
              <button className="mix-btn primary" onClick={doImport} disabled={!importText.trim()}>
                导入
              </button>
              <button className="mix-btn" onClick={() => setImportOpen(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
