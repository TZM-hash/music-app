import { useCallback, useMemo, useState, useRef } from 'react'
import { buildNotes, whiteNotes, NoteInfo, transposeNote } from '../../music/notes'
import { ensureAudio, playNote, playChord } from '../../music/audioEngine'
import { recordResult, loadProgress, BADGE_INFO } from '../../state/progress'
import { useApp } from '../../state/appState'
import GameResult from '../../components/GameResult'
import { useTimers } from '../../hooks/useTimers'
import '../../components/gameResult.css'
import './ear.css'

const GAME_ID = 'game-ear'
const ROUNDS = 8

type Mode = 'single' | 'interval' | 'chord'
const MODES: { mode: Mode; name: string; icon: string; desc: string }[] = [
  { mode: 'single', name: '单音', icon: '🎵', desc: '听一个音，找出对应的琴键' },
  { mode: 'interval', name: '音程', icon: '📏', desc: '听两个音，判断音程大小' },
  { mode: 'chord', name: '和弦', icon: '🎶', desc: '听一个和弦，判断大调还是小调' },
]

const LEVELS = [
  { level: 1, name: '简单', octaves: 1, showNames: true },
  { level: 2, name: '普通', octaves: 1, showNames: false },
  { level: 3, name: '困难', octaves: 2, showNames: false },
]

// 音程名称（半音数 -> 名称）
const INTERVALS: Record<number, string> = {
  1: '小二度',
  2: '大二度',
  3: '小三度',
  4: '大三度',
  5: '纯四度',
  7: '纯五度',
  8: '小六度',
  9: '大六度',
  11: '大七度',
  12: '纯八度',
}
const INTERVAL_STEPS = [1, 2, 3, 4, 5, 7, 8, 9, 11, 12]

export default function EarGame() {
  const { navigate } = useApp()
  const [mode, setMode] = useState<Mode>('single')
  const [level, setLevel] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [locked, setLocked] = useState(false)
  const [result, setResult] = useState<null | {
    score: number
    stars: number
    isNewBest: boolean
    newBadges: { icon: string; name: string }[]
    review: import('../../components/GameResult').ReviewData
  }>(null)

  // 单音模式
  const [target, setTarget] = useState<NoteInfo | null>(null)
  const [feedback, setFeedback] = useState<Record<string, 'right' | 'wrong'>>({})
  // 音程/和弦模式
  const [question, setQuestion] = useState<{ answer: string; options: string[]; play: () => void } | null>(null)
  const [choiceFb, setChoiceFb] = useState<Record<string, 'right' | 'wrong'>>({})
  const reviewRows = useRef<{ label: string; got: string; want?: string; ok: boolean }[]>([])

  const cfg = LEVELS[level - 1]
  const keys = useMemo(() => whiteNotes(buildNotes(4, cfg.octaves)), [cfg.octaves])

  // 统一登记定时器，组件卸载时全部清理且回调带卸载保护，避免切页后残留发声/setState
  const { later } = useTimers()

  const pickTarget = useCallback(() => {
    if (mode === 'single') {
      const t = keys[Math.floor(Math.random() * keys.length)]
      setTarget(t)
      later(() => playNote(t.note, '2n'), 200)
    } else if (mode === 'interval') {
      const base = keys[Math.floor(Math.random() * Math.max(1, keys.length - 4))]
      const semis = INTERVAL_STEPS[Math.floor(Math.random() * INTERVAL_STEPS.length)]
      const second = transposeNote(base.note, semis)
      const answer = INTERVALS[semis]
      // 选项：正确答案 + 3 个干扰
      const others = INTERVAL_STEPS.map((s) => INTERVALS[s]).filter((n) => n !== answer)
      const opts = shuffle([answer, ...pickN(others, 3)])
      const play = () => {
        playNote(base.note, '4n')
        later(() => playNote(second, '4n'), 550)
      }
      setQuestion({ answer, options: opts, play })
      later(play, 200)
    } else {
      // chord
      const base = keys[Math.floor(Math.random() * Math.max(1, keys.length - 4))]
      const quality: 'maj' | 'min' = Math.random() < 0.5 ? 'maj' : 'min'
      const answer = quality === 'maj' ? '大调（明亮）' : '小调（忧伤）'
      const play = () => playChord(base.note, quality, '2n')
      setQuestion({ answer, options: ['大调（明亮）', '小调（忧伤）'], play })
      later(play, 200)
    }
  }, [mode, keys, later])

  const start = useCallback(async () => {
    await ensureAudio()
    setPlaying(true)
    setRound(0)
    setScore(0)
    setCorrect(0)
    setFeedback({})
    setChoiceFb({})
    setLocked(false)
    setResult(null)
    reviewRows.current = []
    pickTarget()
  }, [pickTarget])

  const replay = useCallback(async () => {
    await ensureAudio()
    if (mode === 'single' && target) playNote(target.note, '2n')
    else if (question) question.play()
  }, [mode, target, question])

  const advance = useCallback(
    (nextScore: number, nextCorrect: number) => {
      later(() => {
        const next = round + 1
        setFeedback({})
        setChoiceFb({})
        setLocked(false)
        if (next >= ROUNDS) {
          const acc = nextCorrect / ROUNDS
          const stars = acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : acc >= 0.3 ? 1 : 0
          const r = recordResult(GAME_ID, level, stars, nextScore, { accuracy: acc })
          setPlaying(false)
          const pct = Math.round(acc * 100)
          const advice =
            pct >= 90 ? '耳朵很灵！继续挑战更难的音程和和弦。'
              : pct >= 60 ? '不错，多听几遍再作答会更准。'
                : '别急，先用「简单」难度多练单音辨认。'
          setResult({
            score: nextScore,
            stars,
            isNewBest: r.isNewBest,
            newBadges: r.newBadges.map((b) => BADGE_INFO[b]).filter(Boolean),
            review: {
              stats: [
                { label: '正确', value: `${nextCorrect}/${ROUNDS}` },
                { label: '正确率', value: `${pct}%` },
              ],
              rows: reviewRows.current.slice(),
              advice,
            },
          })
        } else {
          setRound(next)
          pickTarget()
        }
      }, 1100)
    },
    [round, level, pickTarget, later]
  )

  // 单音作答
  const chooseKey = useCallback(
    (n: NoteInfo) => {
      if (locked || !target || !playing) return
      playNote(n.note, '4n')
      const isRight = n.note === target.note
      setLocked(true)
      const ns = isRight ? score + 100 : score
      const nc = isRight ? correct + 1 : correct
      if (isRight) setFeedback({ [n.note]: 'right' })
      else setFeedback({ [n.note]: 'wrong', [target.note]: 'right' })
      reviewRows.current.push({
        label: `第 ${round + 1} 题`,
        got: n.name,
        want: target.name,
        ok: isRight,
      })
      setScore(ns)
      setCorrect(nc)
      advance(ns, nc)
    },
    [locked, target, playing, score, correct, advance, round]
  )

  // 选项作答（音程/和弦）
  const chooseOption = useCallback(
    (opt: string) => {
      if (locked || !question || !playing) return
      const isRight = opt === question.answer
      setLocked(true)
      const ns = isRight ? score + 100 : score
      const nc = isRight ? correct + 1 : correct
      if (isRight) setChoiceFb({ [opt]: 'right' })
      else setChoiceFb({ [opt]: 'wrong', [question.answer]: 'right' })
      reviewRows.current.push({
        label: `第 ${round + 1} 题`,
        got: opt,
        want: question.answer,
        ok: isRight,
      })
      setScore(ns)
      setCorrect(nc)
      advance(ns, nc)
    },
    [locked, question, playing, score, correct, advance, round]
  )

  const best = loadProgress().bestScores[GAME_ID] ?? 0
  const modeInfo = MODES.find((m) => m.mode === mode)!

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <div className="hud-item">
          {score}
          <small>得分</small>
        </div>
        {playing && (
          <div className="hud-item">
            {round + 1}/{ROUNDS}
            <small>题目</small>
          </div>
        )}
        {!playing && (
          <div className="level-picker" style={{ marginLeft: 'auto' }}>
            {LEVELS.map((l) => (
              <button
                key={l.level}
                className={level === l.level ? 'on' : ''}
                onClick={() => setLevel(l.level)}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {!playing && !result && (
        <div className="start-hint">
          <h2>👂 听音辨调</h2>
          <div className="mode-picker">
            {MODES.map((m) => (
              <button
                key={m.mode}
                className={`mode-btn ${mode === m.mode ? 'on' : ''}`}
                onClick={() => setMode(m.mode)}
              >
                <span className="mode-icon">{m.icon}</span>
                <b>{m.name}</b>
                <small>{m.desc}</small>
              </button>
            ))}
          </div>
          <p>共 {ROUNDS} 题，听不清可以点「再听一次」。最高分：{best}</p>
          <button className="big-start" onClick={start}>
            ▶ 开始游戏
          </button>
        </div>
      )}

      {playing && (
        <div className="ear-stage">
          <div className="ear-mode-tag">
            {modeInfo.icon} {modeInfo.name}模式
          </div>
          <button className="replay-btn" onClick={replay}>
            🔊 再听一次
          </button>

          {mode === 'single' && (
            <div className="ear-keys">
              {keys.map((n, idx) => {
                const fb = feedback[n.note]
                return (
                  <button
                    key={n.note}
                    className={`ear-key ${fb ?? ''}`}
                    aria-label={cfg.showNames ? `琴键 ${n.name}${n.note.slice(-1)}` : `第 ${idx + 1} 个选项`}
                    onClick={() => chooseKey(n)}
                  >
                    {cfg.showNames ? (
                      <span>
                        <b>{n.jianpu}</b>
                        <small>{n.name}</small>
                      </span>
                    ) : (
                      <span style={{ opacity: 0.3 }}>?</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {mode !== 'single' && question && (
            <div className="ear-options">
              {question.options.map((opt) => {
                const fb = choiceFb[opt]
                return (
                  <button
                    key={opt}
                    className={`ear-option ${fb ?? ''}`}
                    onClick={() => chooseOption(opt)}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {result && (
        <GameResult
          gameId={GAME_ID}
          score={result.score}
          stars={result.stars}
          bestScore={best}
          isNewBest={result.isNewBest}
          newBadges={result.newBadges}
          review={result.review}
          onRetry={start}
          onContinue={() => navigate('training')}
          onHome={() => navigate('home')}
        />
      )}
    </div>
  )
}

// 工具
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}
