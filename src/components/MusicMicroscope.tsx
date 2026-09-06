import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getCueDurationMs, type ExplorationCue } from '../music/explorationAudio'
import { ensureAudio, playNote, stopAllAudio } from '../music/audioEngine'
import { getToolFeedback, type MusicDiscoveryToolNote } from '../music/explorationTools'
import './explorationTools.css'

export interface MusicMicroscopeProps {
  cues: ExplorationCue[]
  evidenceLabels: string[]
  onNote: (note: MusicDiscoveryToolNote) => void
  onReturn: () => void
}

type PreviewVariant = 'flowing' | 'jumping'

function durationForBeats(beats: number): string {
  if (beats >= 4) return '1m'
  if (beats >= 2) return '2n'
  if (beats >= 1) return '4n'
  if (beats >= 0.5) return '8n'
  return '16n'
}

function createJumpingCues(cues: ExplorationCue[]): ExplorationCue[] {
  return cues.map((cue, index) => ({
    ...cue,
    note: cue.note.replace(/(\d)$/, (_, octave: string) => String(Math.max(1, Number(octave) + (index % 2 === 0 ? 1 : -1)))),
    beats: index % 2 === 0 ? Math.max(0.5, cue.beats * 0.5) : cue.beats * 1.5,
    velocity: Math.max(0.45, Math.min(1, cue.velocity + (index % 2 === 0 ? 0.1 : -0.08))),
  }))
}

export default function MusicMicroscope({ cues, evidenceLabels, onNote, onReturn }: MusicMicroscopeProps) {
  const [previewVariant, setPreviewVariant] = useState<PreviewVariant>('flowing')
  const [markedCueIndex, setMarkedCueIndex] = useState(0)
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([])
  const [observation, setObservation] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUnavailable, setAudioUnavailable] = useState(false)
  const [saveNotice, setSaveNotice] = useState('')
  const tokenRef = useRef(0)

  const flowing = useMemo(() => cues, [cues])
  const jumping = useMemo(() => createJumpingCues(cues), [cues])
  const activeCues = previewVariant === 'flowing' ? flowing : jumping
  const feedback = getToolFeedback('microscope', selectedEvidence)
  const canSave = Boolean(observation.trim() || selectedEvidence.length > 0)

  useEffect(() => {
    tokenRef.current += 1
    stopAllAudio()
    setIsPlaying(false)
    return () => {
      tokenRef.current += 1
      stopAllAudio()
    }
  }, [])

  const stopPlayback = useCallback(() => {
    tokenRef.current += 1
    stopAllAudio()
    setIsPlaying(false)
  }, [])

  const playPreview = useCallback(async (variant: PreviewVariant) => {
    stopAllAudio()
    const token = tokenRef.current + 1
    tokenRef.current = token
    setPreviewVariant(variant)
    setIsPlaying(true)
    setAudioUnavailable(false)
    const sequence = (variant === 'flowing' ? flowing : jumping).slice(markedCueIndex)
    try {
      const ready = await ensureAudio()
      if (!ready) {
        if (tokenRef.current === token) {
          setAudioUnavailable(true)
          setIsPlaying(false)
        }
        return
      }
      for (const cue of sequence) {
        if (tokenRef.current !== token) return
        playNote(cue.note, durationForBeats(cue.beats), cue.velocity, cue.patch)
        await new Promise<void>((resolve) => window.setTimeout(resolve, getCueDurationMs(cue, 72)))
      }
      if (tokenRef.current === token) setIsPlaying(false)
    } catch {
      if (tokenRef.current === token) {
        setAudioUnavailable(true)
        setIsPlaying(false)
      }
    }
  }, [flowing, jumping, markedCueIndex])

  const toggleEvidence = (label: string) => {
    setSelectedEvidence((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label].slice(0, 4)
    )
  }

  const saveObservation = () => {
    if (!canSave) return
    onNote({ toolId: 'microscope', observation: observation.trim(), evidence: selectedEvidence })
    setSaveNotice('我的观察已经保存。')
  }

  return (
    <section className="music-microscope" aria-labelledby="music-microscope-title">
      <header className="music-microscope__header">
        <div>
          <span className="music-microscope__eyebrow">证据工具 · 音乐显微镜</span>
          <h1 id="music-microscope-title">把“变了”听得更清楚</h1>
          <p>选择一段旋律，比较它的流动和跳跃，再留下你真正听到的线索。</p>
        </div>
        <button type="button" className="music-microscope__return" onClick={() => onReturn()}>回到作品再听</button>
      </header>

      <div className="music-microscope__body">
        <aside className="music-microscope__timeline" aria-label="片段时间线">
          <div className="music-microscope__section-heading">
            <span>片段时间线</span>
            <small>{cues.length} 个音符</small>
          </div>
          <div className="music-microscope__cue-list">
            {cues.map((cue, index) => (
              <button
                type="button"
                key={`${cue.note}-${index}`}
                className={index === markedCueIndex ? 'marked' : ''}
                aria-pressed={index === markedCueIndex}
                onClick={() => {
                  if (isPlaying) stopPlayback()
                  setMarkedCueIndex(index)
                }}
              >
                <strong>{index + 1}</strong>
                <span>{cue.note}</span>
                <small>{cue.beats} 拍</small>
              </button>
            ))}
          </div>
          <p className="music-microscope__hint">点击音符，标记变化发生的位置。</p>
        </aside>

        <main className="music-microscope__preview">
          <div className="music-microscope__section-heading">
            <span>A / B 试听</span>
            <small>从第 {Math.min(markedCueIndex + 1, Math.max(cues.length, 1))} 个音符开始</small>
          </div>
          <div className="music-microscope__comparison">
            {(['flowing', 'jumping'] as PreviewVariant[]).map((variant) => (
              <article className={`music-microscope__comparison-card ${previewVariant === variant ? 'active' : ''}`} key={variant}>
                <div>
                  <span className="music-microscope__variant">{variant === 'flowing' ? 'A' : 'B'}</span>
                  <h2>{variant === 'flowing' ? '流动版' : '跳跃版'}</h2>
                </div>
                <p>{variant === 'flowing' ? '音与音之间更连贯，线条向前流动。' : '音与音之间的距离更明显，轮廓上下跳动。'}</p>
                <button type="button" onClick={() => (isPlaying && previewVariant === variant ? stopPlayback() : void playPreview(variant))}>
                  {isPlaying && previewVariant === variant ? '停止试听' : '试听这一版'}
                </button>
              </article>
            ))}
          </div>
          <div className="music-microscope__wave" aria-label="片段变化标记">
            {activeCues.map((cue, index) => <span key={`${cue.note}-${index}`} className={index === markedCueIndex ? 'marked' : ''} style={{ height: `${28 + cue.velocity * 48}%` }} />)}
          </div>
          <p className="music-microscope__live" aria-live="polite">
            {audioUnavailable ? '设备暂时没有发出声音，但仍可以继续选择、比较和保存发现。' : isPlaying ? '正在播放你标记的片段。' : '选择 A 或 B，听听变化发生在哪里。'}
          </p>
        </main>

        <aside className="music-microscope__observation">
          <div className="music-microscope__section-heading"><span>我的观察</span><small>最多选择 4 条</small></div>
          <div className="music-microscope__evidence-list">
            {evidenceLabels.map((label) => (
              <button type="button" key={label} aria-pressed={selectedEvidence.includes(label)} className={selectedEvidence.includes(label) ? 'selected' : ''} onClick={() => toggleEvidence(label)}>{label}</button>
            ))}
          </div>
          <label className="music-microscope__field">
            <span>我听到……</span>
            <textarea value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="写下你的听见" maxLength={160} />
          </label>
          {feedback && <p className="music-microscope__feedback">{feedback}</p>}
          <button type="button" className="music-microscope__save" disabled={!canSave} onClick={saveObservation}>保存我的观察</button>
          {saveNotice && <p className="music-microscope__notice" aria-live="polite">{saveNotice}</p>}
        </aside>
      </div>
    </section>
  )
}
