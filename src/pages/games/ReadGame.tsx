import { useCallback, useState, useRef } from 'react'
import { ensureAudio, playNote } from '../../music/audioEngine'
import { recordResult, loadProgress, BADGE_INFO } from '../../state/progress'
import { useApp } from '../../state/appState'
import GameResult, { ReviewData } from '../../components/GameResult'
import '../../components/gameResult.css'
import './read.css'

const GAME_ID = 'game-read'
const ROUNDS = 10

// 高音谱号可选音域
const TREBLE_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5']
// 低音谱号可选音域
const BASS_NOTES = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4']

const NAME_CN: Record<string, string> = { C: 'do', D: 're', E: 'mi', F: 'fa', G: 'sol', A: 'la', B: 'ti' }
const JIANPU: Record<string, string> = { C: '1', D: '2', E: '3', F: '4', G: '5', A: '6', B: '7' }

const LETTER_STEP: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }
function diatonicStep(note: string): number {
  const m = /^([A-G])(-?\d)$/.exec(note)
  if (!m) return 0
  return parseInt(m[2], 10) * 7 + LETTER_STEP[m[1]]
}

const LEVELS = [
  { level: 1, name: '高音谱号', clef: 'treble' as const, showName: true },
  { level: 2, name: '高音谱号(不提示)', clef: 'treble' as const, showName: false },
  { level: 3, name: '低音谱号', clef: 'bass' as const, showName: false },
]

export default function ReadGame() {
  const { navigate } = useApp()
  const [level, setLevel] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [target, setTarget] = useState<string>('C4')
  const [locked, setLocked] = useState(false)
  const [fb, setFb] = useState<Record<string, 'right' | 'wrong'>>({})
  const [result, setResult] = useState<{ score: number; stars: number; isNewBest: boolean; newBadges: { icon: string; name: string }[]; review: ReviewData } | null>(null)
  const reviewRows = useRef<{ label: string; got: string; want?: string; ok: boolean }[]>([])

  const cfg = LEVELS[level - 1]
  const pool = cfg.clef === 'treble' ? TREBLE_NOTES : BASS_NOTES

  const pick = useCallback(() => {
    const t = pool[Math.floor(Math.random() * pool.length)]
    setTarget(t)
    ensureAudio().then(() => setTimeout(() => playNote(t, '4n'), 150))
  }, [pool])

  const start = useCallback(async () => {
    await ensureAudio()
    setPlaying(true); setRound(0); setScore(0); setCorrect(0); setFb({}); setLocked(false); setResult(null)
    reviewRows.current = []
    pick()
  }, [pick])

  const choose = useCallback((letter: string) => {
    if (locked || !playing) return
    const targetLetter = target[0]
    const isRight = letter === targetLetter
    setLocked(true)
    const ns = isRight ? score + 100 : score
    const nc = isRight ? correct + 1 : correct
    setScore(ns); setCorrect(nc)
    if (isRight) setFb({ [letter]: 'right' })
    else setFb({ [letter]: 'wrong', [targetLetter]: 'right' })
    reviewRows.current.push({
      label: `第 ${round + 1} 题（${target}）`,
      got: `${NAME_CN[letter]}`,
      want: `${NAME_CN[targetLetter]}`,
      ok: isRight,
    })
    playNote(target, '4n')
    setTimeout(() => {
      setFb({}); setLocked(false)
      const next = round + 1
      if (next >= ROUNDS) {
        const acc = nc / ROUNDS
        const stars = acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : acc >= 0.3 ? 1 : 0
        const r = recordResult(GAME_ID, level, stars, ns, { accuracy: acc })
        setPlaying(false)
        const pct = Math.round(acc * 100)
        const advice =
          pct >= 90 ? '识谱很熟练！可以挑战低音谱号了。'
            : pct >= 60 ? '不错，多记住每条线和间对应的音。'
              : '别急，先用「高音谱号(提示)」难度熟悉音名位置。'
        setResult({
          score: ns, stars, isNewBest: r.isNewBest,
          newBadges: r.newBadges.map((b) => BADGE_INFO[b]).filter(Boolean),
          review: {
            stats: [
              { label: '答对', value: `${nc}/${ROUNDS}` },
              { label: '正确率', value: `${pct}%` },
            ],
            rows: reviewRows.current.slice(),
            advice,
          },
        })
      } else {
        setRound(next); pick()
      }
    }, 1000)
  }, [locked, playing, target, score, correct, round, level, pick])

  const best = loadProgress().bestScores[GAME_ID] ?? 0

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <div className="hud-item">{score}<small>得分</small></div>
        {playing && <div className="hud-item">{round + 1}/{ROUNDS}<small>题目</small></div>}
        {!playing && (
          <div className="level-picker" style={{ marginLeft: 'auto' }}>
            {LEVELS.map((l) => (
              <button key={l.level} className={level === l.level ? 'on' : ''} onClick={() => setLevel(l.level)}>
                {l.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {!playing && !result && (
        <div className="start-hint">
          <h2>🎼 识谱训练</h2>
          <p>五线谱上会出现一个音符，判断它是哪个音（do re mi…）。共 {ROUNDS} 题，看谱选音名。</p>
          <p>最高分：{best}</p>
          <button className="big-start" onClick={start}>▶ 开始</button>
        </div>
      )}

      {playing && (
        <div className="read-stage">
          <SingleNoteStaff note={target} clef={cfg.clef} />
          <div className="read-options">
            {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((letter) => (
              <button
                key={letter}
                className={`read-opt ${fb[letter] ?? ''}`}
                onClick={() => choose(letter)}
              >
                <b>{JIANPU[letter]}</b>
                <small>{NAME_CN[letter]}</small>
                {cfg.showName && <span className="opt-letter">{letter}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <GameResult
          score={result.score}
          stars={result.stars}
          bestScore={best}
          isNewBest={result.isNewBest}
          newBadges={result.newBadges}
          review={result.review}
          onRetry={start}
          onHome={() => navigate('home')}
        />
      )}
    </div>
  )
}

// 单音符五线谱
function SingleNoteStaff({ note, clef }: { note: string; clef: 'treble' | 'bass' }) {
  const lineGap = 16
  const staffH = lineGap * 4
  const topPad = 70
  const H = topPad + staffH + 70
  const W = 300
  const cx = W / 2

  // 基准：高音谱号最下线=E4，低音谱号最下线=G2
  const baseStep = clef === 'treble' ? diatonicStep('E4') : diatonicStep('G2')
  const step = diatonicStep(note) - baseStep
  const y = topPad + staffH - (step * lineGap) / 2

  const ledgers = []
  if (step < 0) for (let s = -2; s >= step; s -= 2) ledgers.push(topPad + staffH - (s * lineGap) / 2)
  if (step > 8) for (let s = 10; s <= step; s += 2) ledgers.push(topPad + staffH - (s * lineGap) / 2)

  return (
    <svg className="single-staff" viewBox={`0 0 ${W} ${H}`}>
      {[0, 1, 2, 3, 4].map((l) => (
        <line key={l} x1={30} y1={topPad + l * lineGap} x2={W - 30} y2={topPad + l * lineGap} className="staff-line" />
      ))}
      <text x={40} y={topPad + staffH + (clef === 'treble' ? -2 : -14)} className="clef-big">
        {clef === 'treble' ? '𝄞' : '𝄢'}
      </text>
      {ledgers.map((ly, i) => (
        <line key={i} x1={cx - 18} y1={ly} x2={cx + 18} y2={ly} className="ledger" />
      ))}
      <ellipse cx={cx} cy={y} rx={11} ry={8} className="note-head filled" transform={`rotate(-20 ${cx} ${y})`} />
      {/* 符干 */}
      <line
        x1={step < 4 ? cx + 11 : cx - 11}
        y1={y}
        x2={step < 4 ? cx + 11 : cx - 11}
        y2={step < 4 ? y - 52 : y + 52}
        className="note-stem"
      />
    </svg>
  )
}
