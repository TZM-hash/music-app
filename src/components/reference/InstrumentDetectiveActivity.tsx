import { useState } from 'react'
import { ensureAudio, playNote, stopAllAudio } from '../../music/audioEngine'
import type { JourneyStepId, ReferenceActivity } from '../../music/referenceCourseware'

interface InstrumentDetectiveActivityProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}

const SAMPLES = [
  { id: 'sample-a', name: '木鱼', texture: '清脆、短促', culture: '敲击让节奏像脚步一样清楚。' },
  { id: 'sample-b', name: '碰钟', texture: '明亮、延续', culture: '声音会在空气中多停留一会儿。' },
  { id: 'sample-c', name: '钢琴', texture: '有层次、可连贯', culture: '琴键让不同音高可以快速连接。' },
]

export default function InstrumentDetectiveActivity({
  activity,
  onEvidence,
  onStepComplete,
  onObservation,
}: InstrumentDetectiveActivityProps) {
  const [selected, setSelected] = useState('')
  const [compare, setCompare] = useState<string[]>([])
  const [notice, setNotice] = useState('每个声音都是示例声音，先听质地，再猜乐器。')

  const playSample = async (id: string) => {
    stopAllAudio()
    const sample = SAMPLES.find((item) => item.id === id)
    if (!sample) return
    setSelected(id)
    try {
      if (!(await ensureAudio())) {
        setNotice('设备暂时没有发出声音，但仍可以比较示例声音。')
        return
      }
      playNote(id === 'sample-a' ? 'C4' : id === 'sample-b' ? 'G4' : 'E4', id === 'sample-b' ? '2n' : '4n', 0.72)
      setNotice(`${sample.name}：${sample.texture}。这是示例声音，不是现场录音。`)
    } catch {
      setNotice('设备暂时没有发出声音，但仍可以比较示例声音。')
    }
  }

  const toggleCompare = (id: string) => {
    setCompare((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-2)
    )
  }

  const saveObservation = () => {
    const sample = SAMPLES.find((item) => item.id === selected)
    if (!sample) {
      setNotice('先选择一个乐器样本。')
      return
    }
    onEvidence(sample.name)
    onObservation(`${sample.name}：${sample.texture}`)
    onStepComplete('try')
    setNotice(`${activity.feedback.correct} ${sample.culture}`)
  }

  return (
    <section className="reference-activity" aria-labelledby="instrument-detective-title">
      <span className="reference-activity__eyebrow">耳朵侦探</span>
      <h2 id="instrument-detective-title">你听到哪一种声音颜色？</h2>
      <div className="reference-activity__sample-grid">
        {SAMPLES.map((sample, index) => (
          <article className={selected === sample.id ? 'selected' : ''} key={sample.id}>
            <span>{index === 0 ? 'A' : index === 1 ? 'B' : 'C'}</span>
            <h3>{sample.name}</h3>
            <p>{sample.texture}</p>
            <button type="button" onClick={() => void playSample(sample.id)}>
              试听示例声音
            </button>
            <button type="button" onClick={() => toggleCompare(sample.id)}>
              {compare.includes(sample.id) ? '已加入比较' : '加入 A/B 比较'}
            </button>
          </article>
        ))}
      </div>
      <p className="reference-activity__culture">文化线索：{SAMPLES.find((item) => item.id === selected)?.culture ?? '先选择一个声音，看看演奏方式怎样影响音色。'}</p>
      <button type="button" className="primary" onClick={saveObservation}>
        保存我的听感
      </button>
      <p className="reference-activity__live" aria-live="polite">
        {notice}
      </p>
    </section>
  )
}
