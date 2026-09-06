import { useEffect, useMemo, useState } from 'react'
import { ensureAudio, playNote, stopAllAudio } from '../music/audioEngine'
import {
  getToolFeedback,
  type InstrumentSample,
  type MusicDiscoveryToolNote,
} from '../music/explorationTools'
import './explorationTools.css'

export interface InstrumentExplorerProps {
  samples: InstrumentSample[]
  onNote: (note: MusicDiscoveryToolNote) => void
  onReturn: () => void
}

export default function InstrumentExplorer({ samples, onNote, onReturn }: InstrumentExplorerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    samples.slice(0, 2).map((sample) => sample.id)
  )
  const [family, setFamily] = useState('全部家族')
  const [texture, setTexture] = useState('全部质地')
  const [observation, setObservation] = useState('')
  const [audioUnavailable, setAudioUnavailable] = useState(false)
  const [saveNotice, setSaveNotice] = useState('')

  useEffect(() => () => stopAllAudio(), [])

  const families = useMemo(
    () => ['全部家族', ...new Set(samples.map((sample) => sample.family))],
    [samples]
  )
  const textures = useMemo(
    () => ['全部质地', ...new Set(samples.flatMap((sample) => sample.texture.split('、')))],
    [samples]
  )
  const visibleSamples = samples.filter((sample) => {
    const familyMatch = family === '全部家族' || sample.family === family
    const textureMatch = texture === '全部质地' || sample.texture.includes(texture)
    return familyMatch && textureMatch
  })
  const chosenSamples = selectedIds
    .map((id) => samples.find((sample) => sample.id === id))
    .filter(Boolean) as InstrumentSample[]
  const canSave = Boolean(observation.trim() || chosenSamples.length > 0)
  const feedback = getToolFeedback(
    'instrument',
    chosenSamples.map((sample) => sample.texture)
  )

  const playSample = async (sample: InstrumentSample) => {
    setAudioUnavailable(false)
    try {
      if (!(await ensureAudio())) {
        setAudioUnavailable(true)
        return
      }
      playNote(sample.cue.note, '4n', sample.cue.velocity, sample.cue.patch)
    } catch {
      setAudioUnavailable(true)
    }
  }

  const toggleSample = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(0, 2)
    )
  }

  const saveObservation = () => {
    if (!canSave) return
    onNote({
      toolId: 'instrument',
      observation: observation.trim(),
      evidence: chosenSamples.map((sample) => sample.texture),
    })
    setSaveNotice('我的观察已经保存。')
  }

  return (
    <section className="instrument-explorer" aria-labelledby="instrument-explorer-title">
      <header className="instrument-explorer__header">
        <div>
          <span className="instrument-explorer__eyebrow">概念工具 · 乐器探秘台</span>
          <h1 id="instrument-explorer-title">听见声音的颜色</h1>
          <p>这些是合成音色样本，不是现场录音。选择质地与乐器家族，比较它们怎样发出不同的声音。</p>
        </div>
        <button type="button" className="instrument-explorer__return" onClick={() => onReturn()}>
          回到作品再听
        </button>
      </header>

      <div className="instrument-explorer__controls" aria-label="样本筛选">
        <label>
          乐器家族
          <select value={family} onChange={(event) => setFamily(event.target.value)}>
            {families.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          声音质地
          <select value={texture} onChange={(event) => setTexture(event.target.value)}>
            {textures.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="instrument-explorer__layout">
        <main className="instrument-explorer__samples">
          <div className="instrument-explorer__section-heading">
            <span>样本台</span>
            <small>最多选择两个进行比较</small>
          </div>
          <div className="instrument-explorer__sample-grid">
            {visibleSamples.length === 0 && (
              <p className="instrument-explorer__empty">
                暂时没有符合条件的样本，请换一个家族或质地。
              </p>
            )}
            {visibleSamples.map((sample) => {
              const selected = selectedIds.includes(sample.id)
              return (
                <article
                  className={`instrument-explorer__sample ${selected ? 'selected' : ''}`}
                  key={sample.id}
                >
                  <button
                    type="button"
                    className="instrument-explorer__select"
                    aria-pressed={selected}
                    onClick={() => toggleSample(sample.id)}
                  >
                    {selected ? '已选入比较' : '加入比较'}
                  </button>
                  <span className="instrument-explorer__sample-label">样本</span>
                  <h2>{sample.instrument}</h2>
                  <p>{sample.label}</p>
                  <dl>
                    <div>
                      <dt>质地</dt>
                      <dd>{sample.texture}</dd>
                    </div>
                    <div>
                      <dt>技法</dt>
                      <dd>{sample.technique}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className="instrument-explorer__play"
                    onClick={() => void playSample(sample)}
                  >
                    试听这个样本
                  </button>
                </article>
              )
            })}
          </div>
          <div className="instrument-explorer__comparison" aria-label="两个样本比较">
            {chosenSamples.map((sample, index) => (
              <div key={sample.id}>
                <strong>
                  {index === 0 ? 'A' : 'B'} · {sample.instrument}
                </strong>
                <span>{sample.texture}</span>
                <p>
                  {sample.cue.note} · {sample.technique}
                </p>
              </div>
            ))}
          </div>
          <p className="instrument-explorer__live" aria-live="polite">
            {audioUnavailable
              ? '设备暂时没有发出声音，但仍可以继续比较和保存发现。'
              : chosenSamples.length === 2
                ? 'A / B 已准备好，可以听听两个样本的差别。'
                : '选择样本，听听它的声音颜色。'}
          </p>
        </main>

        <aside className="instrument-explorer__context">
          <h2>文化线索</h2>
          <p>{chosenSamples[0]?.cultureNote ?? '选择一个样本，看看声音和演奏方式之间的联系。'}</p>
          <label className="instrument-explorer__field">
            <span>我的观察</span>
            <textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              maxLength={160}
              placeholder="我听到……"
            />
          </label>
          {feedback && <p className="instrument-explorer__feedback">{feedback}</p>}
          <button
            type="button"
            className="instrument-explorer__save"
            disabled={!canSave}
            onClick={saveObservation}
          >
            保存我的观察
          </button>
          {saveNotice && <p aria-live="polite">{saveNotice}</p>}
        </aside>
      </div>
    </section>
  )
}
