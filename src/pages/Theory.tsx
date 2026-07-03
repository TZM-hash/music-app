import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../state/appState'
import { ensureAudio, playChord, playNote } from '../music/audioEngine'
import { recordResult } from '../state/progress'
import {
  DemoKind,
  THEORY_CATEGORIES,
  THEORY_STAGES,
  THEORY_TOPICS,
  TheoryStageId,
  TheoryTopic,
  filterTheoryTopics,
  getStageLabel,
} from '../music/theoryCatalog'
import './theory.css'

type CategoryFilter = '全部' | string
type StageFilter = '全部' | TheoryStageId

export default function Theory() {
  const { navigate } = useApp()
  const [category, setCategory] = useState<CategoryFilter>('全部')
  const [stage, setStage] = useState<StageFilter>('全部')
  const [activeId, setActiveId] = useState(THEORY_TOPICS[0].id)

  const filtered = useMemo(
    () =>
      filterTheoryTopics({
        category: category === '全部' ? undefined : category,
        stage: stage === '全部' ? undefined : stage,
      }),
    [category, stage]
  )
  const active = filtered.find((t) => t.id === activeId) ?? filtered[0] ?? THEORY_TOPICS[0]

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((topic) => topic.id === activeId)) {
      setActiveId(filtered[0].id)
    }
  }, [activeId, filtered])

  const clearFilters = () => {
    setCategory('全部')
    setStage('全部')
    setActiveId(THEORY_TOPICS[0].id)
  }

  return (
    <div className="theory-lab">
      <section className="theory-lab-head card">
        <div>
          <span className="theory-kicker">互动乐理实验室</span>
          <h2>小学到初中的分级乐理知识库</h2>
          <p>按教学类别和学段难度选择知识点，每个知识点都包含概念、可视化演示、声音示范、课堂应用和即时小测。</p>
        </div>
        <div className="theory-count">
          <b>{filtered.length}</b>
          <small>当前 / 共 {THEORY_TOPICS.length}</small>
        </div>
      </section>

      <div className="theory-layout">
        <aside className="theory-nav card">
          <FilterGroup
            title="教学类别"
            value={category}
            options={['全部', ...THEORY_CATEGORIES]}
            onChange={(next) => setCategory(next)}
          />
          <FilterGroup
            title="学段难度"
            value={stage}
            options={['全部', ...THEORY_STAGES.map((item) => item.id)]}
            getLabel={(value) => (value === '全部' ? '全部' : getStageLabel(value as TheoryStageId))}
            onChange={(next) => setStage(next as StageFilter)}
          />

          <div className="topic-list">
            {filtered.length === 0 && (
              <div className="topic-empty">
                <b>没有匹配知识点</b>
                <button onClick={clearFilters}>清除筛选</button>
              </div>
            )}
            {filtered.map((topic) => (
              <button
                key={topic.id}
                className={topic.id === active.id ? 'on' : ''}
                onClick={() => setActiveId(topic.id)}
              >
                <b>{topic.title}</b>
                <small>{topic.level} · {getStageLabel(topic.stage)} · {topic.subtitle}</small>
              </button>
            ))}
          </div>
        </aside>

        <main className="theory-main">
          <section className="topic-panel card">
            <div className="topic-title">
              <div>
                <span>{active.category} · {getStageLabel(active.stage)} · {active.level}</span>
                <h2>{active.title}</h2>
                <p>{active.concept}</p>
              </div>
              <button className="demo-play" onClick={() => playDemo(active.demo.kind)}>
                ▶ 听演示
              </button>
            </div>

            <DemoView topic={active} />

            <div className="point-grid">
              {active.keyPoints.map((p, i) => (
                <div key={p} className="point-card">
                  <span>{i + 1}</span>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="apply-panel card">
            <span className="theory-kicker">课堂应用</span>
            <h3>{active.demo.title}</h3>
            <p>{active.demo.caption}</p>
            <div className="action-list">
              {active.actions.map((a) => (
                <button key={a.label} onClick={() => navigate(a.route)}>
                  {a.label}
                </button>
              ))}
            </div>
            <MiniQuiz key={active.id} topic={active} />
          </aside>
        </main>
      </div>
    </div>
  )
}

function FilterGroup({
  title,
  value,
  options,
  getLabel = (item) => item,
  onChange,
}: {
  title: string
  value: string
  options: string[]
  getLabel?: (item: string) => string
  onChange: (value: string) => void
}) {
  return (
    <div className="theory-filter-group">
      <div className="side-group-title">{title}</div>
      <div className="theory-cats">
        {options.map((option) => (
          <button key={option} className={value === option ? 'on' : ''} onClick={() => onChange(option)}>
            {getLabel(option)}
          </button>
        ))}
      </div>
    </div>
  )
}

function DemoView({ topic }: { topic: TheoryTopic }) {
  const kind = topic.demo.kind
  return (
    <div className={`lab-demo ${kind}`}>
      {kind === 'pitch' && <KeyboardDemo active={['C', 'D', 'E', 'F', 'G', 'A', 'B']} />}
      {kind === 'duration' && <DurationDemo />}
      {kind === 'meter' && <MeterDemo />}
      {kind === 'staff' && <StaffDemo />}
      {kind === 'jianpu' && <JianpuDemo />}
      {kind === 'scale' && <ScaleDemo />}
      {kind === 'interval' && <IntervalDemo />}
      {kind === 'chord' && <ChordDemo />}
      {kind === 'tempo' && <TempoDemo />}
      {kind === 'dynamics' && <DynamicsDemo />}
      {kind === 'articulation' && <ArticulationDemo />}
      {kind === 'repeat' && <RepeatDemo />}
      {kind === 'form' && <FormDemo />}
    </div>
  )
}

function KeyboardDemo({ active }: { active: string[] }) {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const solfege = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti']
  return (
    <div className="lab-keyboard">
      {notes.map((n, i) => (
        <div key={n} className={`lab-key ${active.includes(n) ? 'active' : ''}`}>
          <b>{i + 1}</b>
          <span>{n}</span>
          <small>{solfege[i]}</small>
        </div>
      ))}
    </div>
  )
}

function DurationDemo() {
  return (
    <div className="duration-demo">
      {[
        ['𝅝', '全音符', '4 拍'],
        ['𝅗𝅥', '二分音符', '2 拍'],
        ['♩', '四分音符', '1 拍'],
        ['♪', '八分音符', '半拍'],
      ].map(([symbol, name, beats]) => (
        <div key={name}>
          <b>{symbol}</b>
          <span>{name}</span>
          <small>{beats}</small>
        </div>
      ))}
    </div>
  )
}

function MeterDemo() {
  return (
    <div className="meter-demo">
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={n === 1 ? 'strong' : ''}>{n}</span>
      ))}
      <p>强 弱 次强 弱</p>
    </div>
  )
}

function StaffDemo() {
  return (
    <svg className="staff-demo" viewBox="0 0 420 150">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="28" x2="390" y1={38 + i * 18} y2={38 + i * 18} />
      ))}
      <text x="42" y="105" className="clef">𝄞</text>
      {[
        [150, 110, 'C'],
        [205, 92, 'E'],
        [260, 74, 'G'],
        [315, 56, 'B'],
      ].map(([x, y, label]) => (
        <g key={label}>
          <ellipse cx={Number(x)} cy={Number(y)} rx="13" ry="9" transform={`rotate(-20 ${x} ${y})`} />
          <text x={Number(x)} y="135">{label}</text>
        </g>
      ))}
    </svg>
  )
}

function JianpuDemo() {
  return (
    <div className="jianpu-demo">
      {['1', '2', '3', '4', '5', '6', '7'].map((n, i) => (
        <span key={n}>
          <b>{n}</b>
          <small>{['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'][i]}</small>
        </span>
      ))}
    </div>
  )
}

function ScaleDemo() {
  return (
    <div className="scale-demo">
      {['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'].map((n, i) => (
        <span key={`${n}${i}`} style={{ height: 36 + i * 8 }}>
          {n}
        </span>
      ))}
    </div>
  )
}

function IntervalDemo() {
  return (
    <div className="interval-demo">
      <KeyboardDemo active={['C', 'G']} />
      <div className="interval-line">C 到 G：五度</div>
    </div>
  )
}

function ChordDemo() {
  return (
    <div className="chord-demo">
      <KeyboardDemo active={['C', 'E', 'G']} />
      <div className="chord-label">C - E - G：C 大三和弦</div>
    </div>
  )
}

function TempoDemo() {
  return (
    <div className="tempo-demo">
      <div><b>慢速</b><span>60 BPM</span></div>
      <div><b>中速</b><span>100 BPM</span></div>
      <div><b>快速</b><span>140 BPM</span></div>
    </div>
  )
}

function DynamicsDemo() {
  return (
    <div className="dynamics-demo">
      {['p', 'mp', 'mf', 'f'].map((d, i) => (
        <span key={d} style={{ fontSize: 24 + i * 9 }}>{d}</span>
      ))}
      <b>&lt;</b>
    </div>
  )
}

function ArticulationDemo() {
  return (
    <div className="articulation-demo">
      <div><b>连音</b><span>do - re - mi</span></div>
      <div><b>跳音</b><span>do · re · mi</span></div>
    </div>
  )
}

function RepeatDemo() {
  return (
    <div className="repeat-demo">
      <span>A</span><b>→</b><span>A</span><b>→</b><span>B</span>
      <small>主题重复后形成对比</small>
    </div>
  )
}

function FormDemo() {
  return (
    <div className="form-demo">
      <span>A</span><span>B</span><span>A</span>
      <small>熟悉 - 对比 - 再现</small>
    </div>
  )
}

function MiniQuiz({ topic }: { topic: TheoryTopic }) {
  const [picked, setPicked] = useState<number | null>(null)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const q = topic.quiz[index]

  const choose = async (i: number) => {
    if (picked !== null) return
    setPicked(i)
    const ok = i === q.answer
    await ensureAudio()
    playNote(ok ? 'C5' : 'F3', '8n')
    if (ok) setCorrect((c) => c + 1)
    window.setTimeout(() => {
      const next = index + 1
      if (next >= topic.quiz.length) {
        const finalCorrect = correct + (ok ? 1 : 0)
        const acc = finalCorrect / topic.quiz.length
        recordResult(`theory-${topic.id}`, 1, acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : 1, finalCorrect * 100, { accuracy: acc })
        setIndex(0)
        setCorrect(0)
      } else {
        setIndex(next)
      }
      setPicked(null)
    }, 900)
  }

  return (
    <div className="mini-quiz">
      <h4>本知识点小测</h4>
      <p>{q.q}</p>
      <div>
        {q.options.map((opt, i) => {
          const cls = picked == null ? '' : i === q.answer ? 'right' : i === picked ? 'wrong' : ''
          return (
            <button key={opt} className={cls} disabled={picked !== null} onClick={() => choose(i)}>
              {opt}
            </button>
          )
        })}
      </div>
      <small>{index + 1}/{topic.quiz.length}</small>
    </div>
  )
}

async function playDemo(kind: DemoKind) {
  await ensureAudio()
  const later = (ms: number, fn: () => void) => window.setTimeout(fn, ms)
  if (kind === 'pitch' || kind === 'scale' || kind === 'jianpu') {
    ;['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'].forEach((n, i) => {
      later(i * 260, () => playNote(n, '8n'))
    })
    return
  }
  if (kind === 'duration') {
    playNote('C4', '2n')
    later(900, () => playNote('E4', '4n'))
    later(1350, () => playNote('G4', '8n'))
    return
  }
  if (kind === 'meter' || kind === 'tempo') {
    ;[0, 1, 2, 3].forEach((i) => later(i * (kind === 'tempo' ? 280 : 460), () => playNote(i === 0 ? 'C5' : 'C4', '16n')))
    return
  }
  if (kind === 'staff') {
    ;['C4', 'E4', 'G4', 'B4'].forEach((n, i) => later(i * 300, () => playNote(n, '8n')))
    return
  }
  if (kind === 'interval') {
    playNote('C4', '4n')
    later(520, () => playNote('G4', '4n'))
    later(1050, () => playChord('C4', 'maj', '2n'))
    return
  }
  if (kind === 'chord') {
    playChord('C4', 'maj', '2n')
    later(900, () => playChord('A3', 'min', '2n'))
    return
  }
  if (kind === 'dynamics') {
    playNote('C4', '8n', 0.35)
    later(420, () => playNote('C4', '8n', 0.65))
    later(840, () => playNote('C4', '8n', 0.95))
    return
  }
  if (kind === 'articulation') {
    ;['C4', 'D4', 'E4'].forEach((n, i) => later(i * 420, () => playNote(n, '4n')))
    ;['C5', 'D5', 'E5'].forEach((n, i) => later(1500 + i * 220, () => playNote(n, '16n')))
    return
  }
  if (kind === 'repeat') {
    ;['C4', 'E4', 'G4', 'C4', 'E4', 'G4', 'D4', 'F4', 'A4'].forEach((n, i) => later(i * 230, () => playNote(n, '8n')))
    return
  }
  ;['C4', 'D4', 'E4', 'G4', 'A4', 'G4', 'C4', 'D4', 'E4'].forEach((n, i) => later(i * 240, () => playNote(n, '8n')))
}
