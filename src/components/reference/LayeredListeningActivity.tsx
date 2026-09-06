import { useState } from 'react'
import { ensureAudio, playNote, stopAllAudio } from '../../music/audioEngine'
import type { JourneyStepId, ReferenceActivity } from '../../music/referenceCourseware'

interface LayeredListeningActivityProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}

const LAYERS = [
  { id: 'high', label: '高声部', note: 'G4' },
  { id: 'middle', label: '中声部', note: 'E4' },
  { id: 'low', label: '低声部', note: 'C4' },
]

export default function LayeredListeningActivity({
  activity,
  onEvidence,
  onStepComplete,
}: LayeredListeningActivityProps) {
  const [selected, setSelected] = useState<string[]>(['middle'])
  const [notice, setNotice] = useState('先单独听，再打开另一层，观察声音怎样叠在一起。')

  const toggleLayer = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  const listenLayers = async () => {
    stopAllAudio()
    try {
      if (!(await ensureAudio())) {
        setNotice('设备暂时没有发出声音，但仍可以观察声部开关。')
        return
      }
      const active = LAYERS.filter((layer) => selected.includes(layer.id))
      active.forEach((layer, index) => playNote(layer.note, '2n', 0.62 - index * 0.08))
      const names = active.map((layer) => layer.label).join('、') || '没有打开的声部'
      onEvidence(names)
      onStepComplete('try')
      setNotice(`现在听到：${names}。可以再打开一层比较。`)
    } catch {
      setNotice('设备暂时没有发出声音，但仍可以观察声部开关。')
    }
  }

  return (
    <section className="reference-activity" aria-labelledby="layered-listening-title">
      <span className="reference-activity__eyebrow">声音层次</span>
      <h2 id="layered-listening-title">一层声音，还是几层声音？</h2>
      <div className="reference-activity__choices" aria-label="声部开关">
        {LAYERS.map((layer) => (
          <button
            type="button"
            className={selected.includes(layer.id) ? 'selected' : ''}
            aria-pressed={selected.includes(layer.id)}
            key={layer.id}
            onClick={() => toggleLayer(layer.id)}
          >
            {layer.label}
          </button>
        ))}
      </div>
      <button type="button" className="primary" onClick={() => void listenLayers()}>
        叠加试听
      </button>
      <p className="reference-activity__live" aria-live="polite">
        {notice}
      </p>
      <small>{activity.summary}</small>
    </section>
  )
}
