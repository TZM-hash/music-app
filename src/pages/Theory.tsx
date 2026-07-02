import { useMemo, useState } from 'react'
import { THEORY_CARDS, QUIZ, TheoryCard, QuizQuestion } from '../music/theory'
import { recordResult, loadProgress } from '../state/progress'
import { ensureAudio, playNote } from '../music/audioEngine'
import './theory.css'

export default function Theory() {
  const [tab, setTab] = useState<'learn' | 'quiz' | 'bank'>('learn')
  const [openCard, setOpenCard] = useState<TheoryCard | null>(null)

  return (
    <div className="theory">
      <div className="theory-tabs">
        <button className={tab === 'learn' ? 'on' : ''} onClick={() => { setTab('learn'); setOpenCard(null) }}>
          📖 知识卡片
        </button>
        <button className={tab === 'quiz' ? 'on' : ''} onClick={() => { setTab('quiz'); setOpenCard(null) }}>
          ✏️ 综合测验
        </button>
        <button className={tab === 'bank' ? 'on' : ''} onClick={() => { setTab('bank'); setOpenCard(null) }}>
          📋 全部题库
        </button>
      </div>

      {tab === 'learn' && !openCard && <CardList onOpen={setOpenCard} />}
      {tab === 'learn' && openCard && <CardDetail card={openCard} onBack={() => setOpenCard(null)} />}
      {tab === 'quiz' && <Quiz id="theory-quiz" questions={QUIZ} sample={12} title="综合测验" />}
      {tab === 'bank' && <FullBank />}
    </div>
  )
}

// 全部题库：按知识点分组列出所有题目
function FullBank() {
  const [openId, setOpenId] = useState<string | null>(THEORY_CARDS[0]?.id ?? null)
  const total = THEORY_CARDS.reduce((n, c) => n + c.quiz.length, 0)
  return (
    <div className="fullbank">
      <div className="qlist-hint card">
        📋 全部知识点共 {total} 道题。点击下面各知识点展开查看题目与答案。
      </div>
      {THEORY_CARDS.map((c) => {
        const open = openId === c.id
        return (
          <div key={c.id} className="bank-group card">
            <button className="bank-group-head" onClick={() => setOpenId(open ? null : c.id)}>
              <span className="bank-group-icon">{c.icon}</span>
              <span className="bank-group-title">{c.title}</span>
              <span className="bank-group-count">{c.quiz.length} 题</span>
              <span className="bank-group-caret">{open ? '▲' : '▼'}</span>
            </button>
            {open && <QuestionList questions={c.quiz} embedded />}
          </div>
        )
      })}
    </div>
  )
}

function CardList({ onOpen }: { onOpen: (c: TheoryCard) => void }) {
  const progress = loadProgress()
  return (
    <div className="card-grid">
      {THEORY_CARDS.map((c) => {
        const best = progress.bestScores[`theory-${c.id}`] ?? 0
        return (
          <button key={c.id} className="theory-card card" onClick={() => onOpen(c)}>
            <div className="tc-head">
              <span className="tc-icon">{c.icon}</span>
              <h3>{c.title}</h3>
            </div>
            {c.visual && <Visual type={c.visual} />}
            <p className="tc-summary">{c.summary}</p>
            <div className="tc-foot">
              <span className="tc-count">{c.quiz.length} 道练习题</span>
              {best > 0 && <span className="tc-best">最高 {best}</span>}
              <span className="tc-enter">查看 →</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function CardDetail({ card, onBack }: { card: TheoryCard; onBack: () => void }) {
  const [mode, setMode] = useState<'read' | 'quiz' | 'list'>('read')
  return (
    <div className="card-detail">
      <button className="detail-back" onClick={onBack}>← 返回知识列表</button>
      <div className="detail-head card">
        <span className="detail-icon">{card.icon}</span>
        <div>
          <h2>{card.title}</h2>
          <p>{card.summary}</p>
        </div>
      </div>

      <div className="detail-seg">
        <button className={mode === 'read' ? 'on' : ''} onClick={() => setMode('read')}>
          📖 讲解
        </button>
        <button className={mode === 'quiz' ? 'on' : ''} onClick={() => setMode('quiz')}>
          ✏️ 本节测验
        </button>
        <button className={mode === 'list' ? 'on' : ''} onClick={() => setMode('list')}>
          📋 题库浏览（{card.quiz.length} 题）
        </button>
      </div>

      {mode === 'read' && (
        <div className="detail-body card">
          {card.visual && (
            <div className="detail-visual">
              <Visual type={card.visual} />
            </div>
          )}
          {card.body.map((para, i) => (
            <p key={i} className="detail-para">{para}</p>
          ))}
          <button className="big-start" onClick={() => setMode('quiz')}>
            ✏️ 做本节练习题
          </button>
        </div>
      )}

      {mode === 'quiz' && (
        <Quiz id={`theory-${card.id}`} questions={card.quiz} title={`${card.title} · 练习`} sample={8} />
      )}

      {mode === 'list' && <QuestionList questions={card.quiz} />}
    </div>
  )
}

// 题库浏览：直接列出全部题目、正确答案、解析
function QuestionList({ questions, embedded }: { questions: QuizQuestion[]; embedded?: boolean }) {
  return (
    <div className="qlist">
      {!embedded && (
        <div className="qlist-hint card">
          📋 本节共 {questions.length} 道题，下面列出全部题目和答案，方便复习与备课。
        </div>
      )}
      {questions.map((q, i) => (
        <div key={i} className="qlist-item card">
          <div className="qlist-q">
            <span className="qlist-no">{i + 1}</span>
            {q.q}
          </div>
          <div className="qlist-options">
            {q.options.map((opt, oi) => (
              <div key={oi} className={`qlist-opt ${oi === q.answer ? 'correct' : ''}`}>
                <span className="qlist-mark">{oi === q.answer ? '✓' : String.fromCharCode(65 + oi)}</span>
                {opt}
              </div>
            ))}
          </div>
          {q.explain && <div className="qlist-explain">💡 {q.explain}</div>}
        </div>
      ))}
    </div>
  )
}

function Visual({ type }: { type: NonNullable<TheoryCard['visual']> }) {
  if (type === 'staff-lines') {
    return (
      <svg className="tc-visual" viewBox="0 0 200 60">
        {[0, 1, 2, 3, 4].map((l) => (
          <line key={l} x1={10} y1={10 + l * 10} x2={190} y2={10 + l * 10} stroke="var(--text-soft)" />
        ))}
        <text x={12} y={44} fontSize="40" fill="var(--text)">𝄞</text>
        <ellipse cx={120} cy={30} rx={7} ry={5} fill="var(--primary)" transform="rotate(-20 120 30)" />
      </svg>
    )
  }
  if (type === 'note-values') {
    return (
      <div className="tc-notes">
        <span>𝅝<small>4拍</small></span>
        <span>𝅗𝅥<small>2拍</small></span>
        <span>♩<small>1拍</small></span>
        <span>♪<small>½拍</small></span>
      </div>
    )
  }
  if (type === 'time-sig') {
    return (
      <div className="tc-timesig">
        <div className="ts-frac"><b>4</b><b>4</b></div>
        <div className="ts-frac"><b>3</b><b>4</b></div>
        <div className="ts-frac"><b>6</b><b>8</b></div>
      </div>
    )
  }
  if (type === 'dynamics') {
    return (
      <div className="tc-dyn">
        <span>p</span><span>mp</span><span>mf</span><span>f</span>
        <span className="dyn-cresc">&lt;</span>
      </div>
    )
  }
  if (type === 'keyboard') {
    return (
      <div className="tc-keyboard">
        {['1', '2', '3', '4', '5', '6', '7'].map((n, i) => (
          <span key={i} className="tc-key">
            <b>{n}</b>
            <small>{['C', 'D', 'E', 'F', 'G', 'A', 'B'][i]}</small>
          </span>
        ))}
      </div>
    )
  }
  if (type === 'sharp-flat') {
    return (
      <div className="tc-sf">
        <span>♯<small>升</small></span>
        <span>♭<small>降</small></span>
        <span>♮<small>还原</small></span>
      </div>
    )
  }
  return null
}

// 通用测验组件
// 每次进入/重测轮换起点，让抽到的题目不同
let quizRotation = 0

function Quiz({
  id,
  questions,
  title,
  sample,
}: {
  id: string
  questions: QuizQuestion[]
  title: string
  sample?: number
}) {
  const [round, setRound] = useState(0)

  // 抽题：从大题库轮换取样，每次重测换一批
  const quizList = useMemo(() => {
    if (!sample || questions.length <= sample) return questions
    const start = quizRotation % questions.length
    const picked: QuizQuestion[] = []
    for (let i = 0; i < questions.length && picked.length < sample; i++) {
      picked.push(questions[(start + i) % questions.length])
    }
    return picked
    // round 变化时重新取样
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, sample, round])

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  const q = quizList[idx]
  const best = loadProgress().bestScores[id] ?? 0

  const choose = async (i: number) => {
    if (picked !== null) return
    setPicked(i)
    await ensureAudio()
    const right = i === q.answer
    if (right) {
      playNote('C5', '8n')
      setScore((s) => s + 100)
      setCorrect((c) => c + 1)
    } else {
      playNote('F3', '8n')
    }
    setTimeout(() => {
      if (idx + 1 >= quizList.length) {
        const finalCorrect = correct + (right ? 1 : 0)
        const finalScore = score + (right ? 100 : 0)
        const acc = finalCorrect / quizList.length
        const stars = acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : acc >= 0.3 ? 1 : 0
        recordResult(id, 1, stars, finalScore, { accuracy: acc })
        setDone(true)
      } else {
        setIdx(idx + 1)
        setPicked(null)
      }
    }, 1100)
  }

  const restart = () => {
    quizRotation += sample ?? 5 // 轮换到下一批题目
    setIdx(0); setPicked(null); setScore(0); setCorrect(0); setDone(false)
    setRound((r) => r + 1)
  }

  if (done) {
    const acc = correct / quizList.length
    const stars = acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : acc >= 0.3 ? 1 : 0
    return (
      <div className="quiz-done card">
        <div className="quiz-done-stars">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
        <h2>答对 {correct}/{quizList.length} 题</h2>
        <div className="quiz-score">{score} 分</div>
        <button className="big-start" onClick={restart}>🔁 再测一次</button>
      </div>
    )
  }

  return (
    <div className="quiz card">
      <div className="quiz-progress">
        {title} · 第 {idx + 1}/{quizList.length} 题 · 得分 {score} · 历史最高 {best}
      </div>
      <h2 className="quiz-q">{q.q}</h2>
      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = ''
          if (picked !== null) {
            if (i === q.answer) cls = 'right'
            else if (i === picked) cls = 'wrong'
          }
          return (
            <button key={i} className={`quiz-opt ${cls}`} onClick={() => choose(i)} disabled={picked !== null}>
              {opt}
            </button>
          )
        })}
      </div>
      {picked !== null && q.explain && <div className="quiz-explain">💡 {q.explain}</div>}
    </div>
  )
}
