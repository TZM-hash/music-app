import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useApp } from '../state/appState'
import { ensureAudio, playNote } from '../music/audioEngine'
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
import { DemoControl, getDemoScene } from '../music/theoryDemos'
import { loadReviewBook, recordReviewAnswer, saveReviewBook } from '../state/theoryReview'
import './theory.css'

type CategoryFilter = '全部' | string
type StageFilter = '全部' | TheoryStageId

export default function Theory() {
  const { navigate, theoryFocus, currentStudentId, mode } = useApp()
  const [category, setCategory] = useState<CategoryFilter>('全部')
  const [stage, setStage] = useState<StageFilter>('全部')
  const [activeId, setActiveId] = useState(THEORY_TOPICS[0].id)
  const [activeDemoValue, setActiveDemoValue] = useState('')

  const filtered = useMemo(
    () =>
      filterTheoryTopics({
        category: category === '全部' ? undefined : category,
        stage: stage === '全部' ? undefined : stage,
      }),
    [category, stage]
  )
  const active = filtered.find((t) => t.id === activeId) ?? filtered[0] ?? THEORY_TOPICS[0]
  const demoScene = getDemoScene(active.demo.kind)
  const activeControl =
    demoScene.controls.find((control) => control.value === activeDemoValue) ?? demoScene.controls[0]

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((topic) => topic.id === activeId)) {
      setActiveId(filtered[0].id)
    }
  }, [activeId, filtered])

  useEffect(() => {
    if (!theoryFocus) return
    const nextCategory = theoryFocus.category ?? '全部'
    const nextStage = theoryFocus.stage ?? '全部'
    const focusedTopics = filterTheoryTopics({
      category: theoryFocus.category,
      stage: theoryFocus.stage,
    })
    const nextTopic =
      (theoryFocus.topicId && focusedTopics.find((topic) => topic.id === theoryFocus.topicId)) ||
      focusedTopics[0]

    setCategory(nextCategory)
    setStage(nextStage)
    if (nextTopic) setActiveId(nextTopic.id)
  }, [theoryFocus])

  useEffect(() => {
    setActiveDemoValue(getDemoScene(active.demo.kind).controls[0].value)
  }, [active.id, active.demo.kind])

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
              </div>
              <button className="demo-play" onClick={() => playDemo(active.demo.kind, activeControl)}>
                ▶ 听演示
              </button>
            </div>

            <DetailedExplanation topic={active} />

            <TheoryDemoLab
              topic={active}
              activeValue={activeControl.value}
              onChange={setActiveDemoValue}
            />

            <div className="point-grid">
              {active.keyPoints.map((p, i) => (
                <div key={p} className="point-card">
                  <span>{i + 1}</span>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="apply-panel quiz-panel card">
            <span className="theory-kicker">本知识点题目</span>
            <h3>{active.title}课堂小测</h3>
            <p>先看左侧讲解，再用这组题确认学生是否抓住了核心概念和听辨依据。</p>
            <MiniQuiz
              key={active.id}
              topic={active}
              studentId={currentStudentId ?? 'anonymous'}
              recordEnabled={mode !== 'lecture'}
            />
            <div className="application-links">
              <span className="theory-kicker">课堂应用</span>
              <h4>{active.demo.title}</h4>
              <p>{active.demo.caption}</p>
              <div className="action-list">
                {active.actions.map((a) => (
                  <button key={a.label} onClick={() => navigate(a.route)}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}

function DetailedExplanation({ topic }: { topic: TheoryTopic }) {
  const stageLabel = getStageLabel(topic.stage)
  const keywordTones = ['a', 'b', 'c', 'd'] as const

  return (
    <div className="topic-explanation">
      <div className="explain-copy">
        <p>
          本节课讲的是 <Keyword tone="a">{topic.title}</Keyword>。它属于
          <Keyword tone="b">{topic.category}</Keyword> 中的 {stageLabel} 内容，学生需要先理解：
          {topic.concept}
        </p>
        <p>
          讲解时可以先抓住 <Keyword tone="c">{topic.subtitle}</Keyword> 这个入口，再把抽象概念落到
          <Keyword tone="d">听觉变化</Keyword>、<Keyword tone="a">视觉符号</Keyword> 和
          <Keyword tone="b">课堂动作</Keyword> 上。这样学生不只是记住名称，而是能说出“我听到了什么、我看到了什么、为什么这样判断”。
        </p>
        <p>
          教师可以用下方演示先做对比，再让学生用自己的话复述。复述时优先使用这些关键词：
          {topic.keyPoints.map((point, index) => (
            <Keyword key={point} tone={keywordTones[index % keywordTones.length]}>
              {point}
            </Keyword>
          ))}
        </p>
      </div>
    </div>
  )
}

function Keyword({
  tone,
  children,
}: {
  tone: 'a' | 'b' | 'c' | 'd'
  children: ReactNode
}) {
  return <mark className={`keyword keyword-${tone}`}>{children}</mark>
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

function TheoryDemoLab({
  topic,
  activeValue,
  onChange,
}: {
  topic: TheoryTopic
  activeValue: string
  onChange: (value: string) => void
}) {
  const scene = getDemoScene(topic.demo.kind)
  const activeControl = scene.controls.find((control) => control.value === activeValue) ?? scene.controls[0]

  return (
    <div className="theory-demo-lab">
      <div className="demo-control-head">
        <div>
          <b>{scene.title}</b>
          <p>{scene.prompt}</p>
        </div>
        <span>{activeControl.detail}</span>
      </div>
      <div className="demo-control-row">
        {scene.controls.map((control) => (
          <button
            key={control.value}
            className={control.value === activeControl.value ? 'on' : ''}
            onClick={() => onChange(control.value)}
          >
            <b>{control.label}</b>
            <small>{control.detail}</small>
          </button>
        ))}
      </div>
      <DemoView topic={topic} control={activeControl} />
      <div className="demo-observations">
        {scene.observations.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  )
}

function DemoView({ topic, control }: { topic: TheoryTopic; control: DemoControl }) {
  const kind = topic.demo.kind
  return (
    <div className={`lab-demo ${kind}`}>
      {kind === 'pitch' && <KeyboardDemo active={control.notes.map(noteName)} />}
      {kind === 'duration' && <DurationDemo control={control} />}
      {kind === 'meter' && <MeterDemo control={control} />}
      {kind === 'staff' && <StaffDemo control={control} />}
      {kind === 'jianpu' && <JianpuDemo control={control} />}
      {kind === 'scale' && <ScaleDemo control={control} />}
      {kind === 'interval' && <IntervalDemo control={control} />}
      {kind === 'chord' && <ChordDemo control={control} />}
      {kind === 'tempo' && <TempoDemo active={control.value} />}
      {kind === 'dynamics' && <DynamicsDemo active={control.value} />}
      {kind === 'articulation' && <ArticulationDemo active={control.value} />}
      {kind === 'repeat' && <RepeatDemo control={control} />}
      {kind === 'form' && <FormDemo control={control} />}
    </div>
  )
}

function noteName(note: string) {
  return note.replace(/[0-9]/g, '').replace('#', '♯')
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

function DurationDemo({ control }: { control: DemoControl }) {
  const symbols = control.symbols ?? ['♩']
  return (
    <div className="duration-demo">
      {symbols.map((symbol, i) => (
        <div key={`${symbol}${i}`} className={i === 0 ? 'active' : ''}>
          <b>{symbol}</b>
          <span>{control.label}</span>
          <small>{control.detail}</small>
        </div>
      ))}
    </div>
  )
}

function MeterDemo({ control }: { control: DemoControl }) {
  const beats = control.beats ?? ['1', '2', '3', '4']
  const accent = control.accentPattern ?? [1, 0, 0.6, 0]
  return (
    <div className="meter-demo">
      {beats.map((n, i) => (
        <span key={n} className={accent[i] === 1 ? 'strong' : accent[i] ? 'medium' : ''}>{n}</span>
      ))}
      <p>{control.detail}</p>
    </div>
  )
}

function StaffDemo({ control }: { control: DemoControl }) {
  const positions: Record<string, [number, number]> = {
    C: [130, 110],
    D: [165, 101],
    E: [200, 92],
    F: [235, 83],
    G: [270, 74],
    A: [305, 65],
    B: [340, 56],
  }
  const notes = control.notes.map(noteName)
  return (
    <svg className="staff-demo" viewBox="0 0 420 150">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="28" x2="390" y1={38 + i * 18} y2={38 + i * 18} />
      ))}
      <text x="42" y="105" className="clef">𝄞</text>
      {notes.map((label, index) => {
        const [x, y] = positions[label] ?? [150 + index * 48, 92 - index * 8]
        return (
        <g key={label}>
          <ellipse cx={Number(x)} cy={Number(y)} rx="13" ry="9" transform={`rotate(-20 ${x} ${y})`} />
          <text x={Number(x)} y="135">{label}</text>
        </g>
        )
      })}
    </svg>
  )
}

function JianpuDemo({ control }: { control: DemoControl }) {
  const symbols = control.symbols ?? ['1', '2', '3', '4', '5', '6', '7']
  return (
    <div className="jianpu-demo">
      {symbols.map((n, i) => (
        <span key={n}>
          <b>{n}</b>
          <small>{['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'][Number(n) - 1] ?? control.notes[i]}</small>
        </span>
      ))}
    </div>
  )
}

function ScaleDemo({ control }: { control: DemoControl }) {
  return (
    <div className="scale-demo">
      {control.notes.map((n, i) => (
        <span key={`${n}${i}`} style={{ height: 36 + i * 8 }}>
          {noteName(n)}
        </span>
      ))}
    </div>
  )
}

function IntervalDemo({ control }: { control: DemoControl }) {
  return (
    <div className="interval-demo">
      <KeyboardDemo active={control.notes.map(noteName)} />
      <div className="interval-line">{control.detail}</div>
    </div>
  )
}

function ChordDemo({ control }: { control: DemoControl }) {
  return (
    <div className="chord-demo">
      <KeyboardDemo active={control.notes.map(noteName)} />
      <div className="chord-label">{control.detail}</div>
    </div>
  )
}

function TempoDemo({ active }: { active: string }) {
  return (
    <div className="tempo-demo">
      <div className={active === 'slow' ? 'active' : ''}><b>慢速</b><span>60 BPM</span></div>
      <div className={active === 'medium' ? 'active' : ''}><b>中速</b><span>100 BPM</span></div>
      <div className={active === 'fast' ? 'active' : ''}><b>快速</b><span>140 BPM</span></div>
    </div>
  )
}

function DynamicsDemo({ active }: { active: string }) {
  return (
    <div className="dynamics-demo">
      {[
        ['soft', 'p'],
        ['medium', 'mf'],
        ['strong', 'f'],
        ['crescendo', '<'],
      ].map(([key, d], i) => (
        <span key={key} className={active === key ? 'active' : ''} style={{ fontSize: 24 + i * 9 }}>{d}</span>
      ))}
    </div>
  )
}

function ArticulationDemo({ active }: { active: string }) {
  return (
    <div className="articulation-demo">
      <div className={active === 'legato' ? 'active' : ''}><b>连音</b><span>do - re - mi</span></div>
      <div className={active === 'staccato' ? 'active' : ''}><b>跳音</b><span>do · re · mi</span></div>
      <div className={active === 'accent' ? 'active' : ''}><b>重音</b><span>&gt; do re mi</span></div>
    </div>
  )
}

function RepeatDemo({ control }: { control: DemoControl }) {
  const symbols = control.symbols ?? ['A', 'A', 'B']
  return (
    <div className="repeat-demo">
      {symbols.map((symbol, index) => (
        <span key={`${symbol}${index}`}>{symbol}</span>
      ))}
      <small>{control.detail}</small>
    </div>
  )
}

function FormDemo({ control }: { control: DemoControl }) {
  const symbols = control.symbols ?? ['A', 'B', 'A']
  return (
    <div className="form-demo">
      {symbols.map((symbol, index) => (
        <span key={`${symbol}${index}`}>{symbol}</span>
      ))}
      <small>{control.detail}</small>
    </div>
  )
}

function MiniQuiz({
  topic,
  studentId,
  recordEnabled,
}: {
  topic: TheoryTopic
  studentId: string
  recordEnabled: boolean
}) {
  const [pickedByQuestion, setPickedByQuestion] = useState<Record<number, number>>({})
  const [quizPage, setQuizPage] = useState(0)
  const questionsPerPage = 3
  const pageCount = Math.ceil(topic.quiz.length / questionsPerPage)
  const visibleQuestions = topic.quiz.slice(
    quizPage * questionsPerPage,
    quizPage * questionsPerPage + questionsPerPage
  )
  const answeredCount = Object.keys(pickedByQuestion).length
  const correctCount = topic.quiz.reduce(
    (total, q, questionIndex) => total + (pickedByQuestion[questionIndex] === q.answer ? 1 : 0),
    0
  )

  const choose = async (questionIndex: number, selectedAnswer: number) => {
    if (pickedByQuestion[questionIndex] !== undefined) return
    const q = topic.quiz[questionIndex]
    const ok = selectedAnswer === q.answer
    const nextPicked = { ...pickedByQuestion, [questionIndex]: selectedAnswer }
    setPickedByQuestion(nextPicked)

    if (recordEnabled) {
      const book = loadReviewBook(studentId)
      saveReviewBook(
        recordReviewAnswer(book, {
          source: 'theory',
          itemId: topic.id,
          itemTitle: topic.title,
          category: topic.category,
          stage: topic.stage,
          question: q.q,
          options: q.options,
          correctAnswer: q.answer,
          selectedAnswer,
          explanation: topic.concept,
          timestamp: Date.now(),
        })
      )
    }

    await ensureAudio()
    playNote(ok ? 'C5' : 'F3', '8n')

    if (recordEnabled && Object.keys(nextPicked).length === topic.quiz.length) {
      const finalCorrect = topic.quiz.reduce(
        (total, item, itemIndex) => total + (nextPicked[itemIndex] === item.answer ? 1 : 0),
        0
      )
      const acc = finalCorrect / topic.quiz.length
      recordResult(`theory-${topic.id}`, 1, acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : 1, finalCorrect * 100, { accuracy: acc })
    }
  }

  return (
    <div className="mini-quiz">
      <div className="quiz-summary">
        <div>
          <h4>本知识点小测</h4>
          <p>每组 3 题，适合边讲边点答。</p>
        </div>
        <strong>{correctCount}/{topic.quiz.length}</strong>
      </div>
      <div className="quiz-grid">
        {visibleQuestions.map((q, localIndex) => {
          const questionIndex = quizPage * questionsPerPage + localIndex
          const picked = pickedByQuestion[questionIndex]
          return (
            <div key={q.q} className="quiz-card">
              <span>第 {questionIndex + 1} 题</span>
              <h5>{q.q}</h5>
              <div className="quiz-options">
                {q.options.map((opt, optionIndex) => {
                  const answered = picked !== undefined
                  const cls = answered
                    ? optionIndex === q.answer
                      ? 'right'
                      : optionIndex === picked
                        ? 'wrong'
                        : ''
                    : ''
                  return (
                    <button
                      key={`${q.q}-${opt}`}
                      className={cls}
                      disabled={answered}
                      onClick={() => choose(questionIndex, optionIndex)}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {pageCount > 1 && (
        <div className="quiz-pager">
          <button disabled={quizPage === 0} onClick={() => setQuizPage((page) => Math.max(0, page - 1))}>
            上一组
          </button>
          <span>{quizPage + 1}/{pageCount}</span>
          <button
            disabled={quizPage >= pageCount - 1}
            onClick={() => setQuizPage((page) => Math.min(pageCount - 1, page + 1))}
          >
            下一组
          </button>
        </div>
      )}
    </div>
  )
}

async function playDemo(kind: DemoKind, control: DemoControl) {
  await ensureAudio()
  const later = (ms: number, fn: () => void) => window.setTimeout(fn, ms)

  if (kind === 'chord') {
    control.notes.forEach((note) => playNote(note, '2n', control.value === 'dominant7' ? 0.55 : 0.65))
    return
  }

  if (kind === 'tempo') {
    const gap = control.value === 'slow' ? 620 : control.value === 'fast' ? 260 : 390
    control.notes.forEach((note, i) => later(i * gap, () => playNote(note, '16n')))
    return
  }

  if (kind === 'dynamics') {
    if (control.value === 'crescendo') {
      ;[0.3, 0.55, 0.9].forEach((volume, i) => later(i * 360, () => playNote('C4', '8n', volume)))
    } else {
      playNote('C4', '4n', control.value === 'soft' ? 0.3 : control.value === 'strong' ? 0.95 : 0.62)
    }
    return
  }

  if (kind === 'articulation') {
    control.notes.forEach((note, i) => {
      const duration = control.value === 'staccato' ? '16n' : '4n'
      const volume = control.value === 'accent' && i === 0 ? 0.95 : 0.62
      later(i * (control.value === 'staccato' ? 230 : 410), () => playNote(note, duration, volume))
    })
    return
  }

  if (kind === 'meter') {
    const accent = control.accentPattern ?? []
    control.notes.forEach((note, i) => later(i * 360, () => playNote(note, '16n', accent[i] ? 0.9 : 0.45)))
    return
  }

  if (kind === 'duration') {
    control.notes.forEach((note, i) => later(i * 520, () => playNote(note, i === 0 ? '4n' : '8n')))
    return
  }

  if (kind === 'interval') {
    control.notes.forEach((note, i) => later(i * 520, () => playNote(note, '4n')))
    later(1180, () => control.notes.forEach((note) => playNote(note, '2n', 0.55)))
    return
  }

  if (kind === 'repeat' || kind === 'form') {
    control.notes.forEach((note, i) => later(i * 250, () => playNote(note, '8n')))
    return
  }

  control.notes.forEach((note, i) => later(i * 280, () => playNote(note, '8n')))
}
