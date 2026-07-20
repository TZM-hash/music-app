import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureAudio, taikoDON, taikoKA } from '../../music/audioEngine'
import { recordResult, loadProgress, BADGE_INFO } from '../../state/progress'
import { useApp } from '../../state/appState'
import GameResult, { ReviewData } from '../../components/GameResult'
import { hitCombo, resetCombo, getComboColor } from '../../state/combo'
import { celebrate } from '../../components/Celebration'
import { playUI } from '../../music/uiSounds'
import { useMounted, useTimers } from '../../hooks/useTimers'
import '../../components/gameResult.css'
import './echo.css'

const GAME_ID = 'game-echo'

type NType = 'don' | 'ka'

interface EchoNote {
  type: NType
  beat: number
}

interface EchoPattern {
  notes: EchoNote[]
  bpm: number
}

const LEVELS = [
  { level: 1, name: '入门 ★', desc: '2 拍节奏，只有咚', bpm: 80, patterns: [
    { notes: [{ type: 'don' as NType, beat: 0 }, { type: 'don' as NType, beat: 1 }], bpm: 80 },
    { notes: [{ type: 'don' as NType, beat: 0 }, { type: 'don' as NType, beat: 0.5 }, { type: 'don' as NType, beat: 1 }], bpm: 80 },
    { notes: [{ type: 'don' as NType, beat: 0 }, { type: 'don' as NType, beat: 1 }, { type: 'don' as NType, beat: 1.5 }], bpm: 80 },
  ]},
  { level: 2, name: '进阶 ★★', desc: '4 拍节奏，咚+咔', bpm: 90, patterns: [
    { notes: [{ type: 'don' as NType, beat: 0 }, { type: 'ka' as NType, beat: 1 }, { type: 'don' as NType, beat: 2 }, { type: 'ka' as NType, beat: 3 }], bpm: 90 },
    { notes: [{ type: 'don' as NType, beat: 0 }, { type: 'don' as NType, beat: 0.5 }, { type: 'ka' as NType, beat: 1 }, { type: 'don' as NType, beat: 2 }, { type: 'ka' as NType, beat: 2.5 }, { type: 'ka' as NType, beat: 3 }], bpm: 90 },
    { notes: [{ type: 'don' as NType, beat: 0 }, { type: 'ka' as NType, beat: 0.5 }, { type: 'don' as NType, beat: 1 }, { type: 'ka' as NType, beat: 1.5 }, { type: 'don' as NType, beat: 2 }, { type: 'ka' as NType, beat: 3 }], bpm: 90 },
  ]},
  { level: 3, name: '挑战 ★★★', desc: '8 拍节奏，咚+咔+休止', bpm: 100, patterns: [
    { notes: [{ type: 'don' as NType, beat: 0 }, { type: 'ka' as NType, beat: 1 }, { type: 'don' as NType, beat: 2 }, { type: 'ka' as NType, beat: 3 }, { type: 'don' as NType, beat: 4 }, { type: 'ka' as NType, beat: 5 }, { type: 'don' as NType, beat: 6 }, { type: 'ka' as NType, beat: 7 }], bpm: 100 },
    { notes: [{ type: 'don' as NType, beat: 0 }, { type: 'don' as NType, beat: 0.5 }, { type: 'ka' as NType, beat: 1 }, { type: 'don' as NType, beat: 2 }, { type: 'ka' as NType, beat: 3 }, { type: 'don' as NType, beat: 4 }, { type: 'don' as NType, beat: 4.5 }, { type: 'ka' as NType, beat: 5 }, { type: 'don' as NType, beat: 6 }, { type: 'ka' as NType, beat: 7 }], bpm: 100 },
    { notes: [{ type: 'don' as NType, beat: 0 }, { type: 'ka' as NType, beat: 0.5 }, { type: 'don' as NType, beat: 1 }, { type: 'ka' as NType, beat: 2 }, { type: 'don' as NType, beat: 2.5 }, { type: 'ka' as NType, beat: 3 }, { type: 'don' as NType, beat: 4 }, { type: 'ka' as NType, beat: 5 }, { type: 'don' as NType, beat: 6 }, { type: 'ka' as NType, beat: 6.5 }, { type: 'don' as NType, beat: 7 }], bpm: 100 },
  ]},
]

const W_G = 80, W_OK = 150

export default function EchoGame() {
  const { navigate } = useApp()
  const [level, setLevel] = useState(1)
  const [phase, setPhase] = useState<'pick' | 'listen' | 'echo' | 'judge' | 'result'>('pick')
  const [pattern, setPattern] = useState<EchoPattern | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [judge, setJudge] = useState<{ t: string; c: string } | null>(null)
  const [playingNote, setPlayingNote] = useState<NType | null>(null)
  const [result, setResult] = useState<{ score: number; stars: number; isNewBest: boolean; newBadges: { icon: string; name: string }[]; review: ReviewData } | null>(null)

  const cfg = LEVELS[level - 1]
  const startAt = useRef(0)
  const echoHits = useRef<{ note: NType; time: number }[]>([])
  // 用 ref 跟踪最新分数/最大连击，避免结算定时器闭包读到旧值
  const scoreRef = useRef(0)
  const maxCombo = useRef(0)
  const totalRounds = 5

  // 统一登记定时器，组件卸载时全部清理（回调内带卸载保护），避免切页后残留
  const { later } = useTimers()
  const mounted = useMounted()

  // 离开页面时重置全局连击，避免残留到下一个游戏
  useEffect(() => () => resetCombo(), [])

  const pickPattern = useCallback((): EchoPattern => {
    const patterns = cfg.patterns
    return patterns[Math.floor(Math.random() * patterns.length)]
  }, [cfg])

  const playPattern = useCallback(async (p: EchoPattern) => {
    await ensureAudio()
    if (!mounted.current) return
    const beatMs = (60 / p.bpm) * 1000
    for (const n of p.notes) {
      later(() => {
        setPlayingNote(n.type)
        if (n.type === 'don') taikoDON()
        else taikoKA()
        later(() => setPlayingNote(null), 200)
      }, n.beat * beatMs)
    }
  }, [later, mounted])

  const startRound = useCallback((p: EchoPattern) => {
    setPattern(p)
    echoHits.current = []
    setPhase('listen')
    playPattern(p)
    const beatMs = (60 / p.bpm) * 1000
    if (p.notes.length === 0) {
      later(() => setPhase('echo'), 800)
      return
    }
    const lastBeat = Math.max(...p.notes.map((n) => n.beat))
    later(() => {
      setPhase('echo')
      startAt.current = performance.now()
    }, (lastBeat + 1) * beatMs + 500)
  }, [playPattern, later])

  const start = useCallback(() => {
    setScore(0)
    scoreRef.current = 0
    maxCombo.current = 0
    setCombo(0)
    setRound(0)
    setResult(null)
    resetCombo()
    playUI('countdown')
    later(() => {
      const p = pickPattern()
      startRound(p)
    }, 1200)
  }, [pickPattern, startRound, later])

  const hit = useCallback((type: NType) => {
    if (phase !== 'echo' || !pattern) return
    const now = performance.now() - startAt.current
    const beatMs = (60 / pattern.bpm) * 1000

    if (type === 'don') taikoDON()
    else taikoKA()

    echoHits.current.push({ note: type, time: now })

    if (echoHits.current.length >= pattern.notes.length) {
      setPhase('judge')
      let correct = 0
      const rows: { label: string; got: string; want?: string; ok: boolean }[] = []

      for (let i = 0; i < pattern.notes.length; i++) {
        const expected = pattern.notes[i]
        const expectedTime = expected.beat * beatMs
        const actual = echoHits.current[i]

        if (!actual) {
          rows.push({ label: `第 ${i + 1} 拍`, got: '未敲', want: expected.type === 'don' ? '咚' : '咔', ok: false })
          continue
        }

        const timeDiff = Math.abs(actual.time - expectedTime)
        const typeMatch = actual.note === expected.type
        const timeOk = timeDiff <= W_OK

        if (typeMatch && timeOk) {
          correct++
          rows.push({ label: `第 ${i + 1} 拍`, got: timeDiff <= W_G ? '良' : '可', ok: true })
        } else if (!typeMatch) {
          rows.push({ label: `第 ${i + 1} 拍`, got: actual.note === 'don' ? '咚' : '咔', want: expected.type === 'don' ? '咚' : '咔', ok: false })
        } else {
          rows.push({ label: `第 ${i + 1} 拍`, got: `${Math.round(timeDiff)}ms 偏差`, ok: false })
        }
      }

      const acc = correct / pattern.notes.length
      const isGood = acc >= 0.7

      if (isGood) {
        const c = hitCombo()
        setCombo(c.count)
        maxCombo.current = Math.max(maxCombo.current, c.count)
        // 本轮得分 = 基础分 + 连击加成，同步到 ref 供结算时使用
        scoreRef.current += Math.round(acc * 200) + c.count * 10
        setScore(scoreRef.current)
        setJudge({ t: acc >= 0.9 ? '完美！' : '不错！', c: 'great' })
      } else {
        resetCombo()
        setCombo(0)
        setJudge({ t: '再听一次', c: 'miss' })
      }

      later(() => {
        setJudge(null)
        const nextRound = round + 1
        if (nextRound >= totalRounds) {
          // 用 ref 中的最新分数结算，与 HUD 显示完全一致
          const finalScore = scoreRef.current
          const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.5 ? 1 : 0
          const r = recordResult(GAME_ID, level, stars, finalScore, { accuracy: acc })
          if (stars >= 2) {
            celebrate('large')
            playUI('fanfare')
          }
          setResult({
            score: finalScore, stars, isNewBest: r.isNewBest,
            newBadges: r.newBadges.map((b) => BADGE_INFO[b]).filter(Boolean),
            review: {
              stats: [
                { label: '本轮正确率', value: `${Math.round(acc * 100)}%` },
                { label: '最大连击', value: `${maxCombo.current}` },
              ],
              rows,
              advice: acc >= 0.9 ? '节奏感很棒！可以挑战更高难度了。' : acc >= 0.7 ? '不错，注意听准每个音符的间隔。' : '先慢速听几遍，跟着拍子轻轻点。',
            },
          })
          setPhase('result')
        } else {
          setRound(nextRound)
          const p = pickPattern()
          startRound(p)
        }
      }, 1500)
    }
  }, [phase, pattern, round, level, pickPattern, startRound, later])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      const k = e.key.toLowerCase()
      if (k === 'f' || k === ' ' || k === 'd') { e.preventDefault(); hit('don') }
      else if (k === 'j' || k === 'k') { e.preventDefault(); hit('ka') }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [hit])

  const best = loadProgress().bestScores[GAME_ID] ?? 0

  if (phase === 'pick') return (
    <div className="game-wrap">
      <div className="start-hint">
        <h2>🥁 节奏复制</h2>
        <p>先听一段节奏，然后跟着敲出来。训练节奏记忆和模仿能力！</p>
        <div className="level-picker">
          {LEVELS.map((l) => (
            <button key={l.level} className={level === l.level ? 'on' : ''} onClick={() => setLevel(l.level)}>
              {l.name}<br /><small>{l.desc}</small>
            </button>
          ))}
        </div>
        <button className="big-start" onClick={start}>开始</button>
      </div>
    </div>
  )

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <div className="hud-item">{score}<small>得分</small></div>
        <div className="hud-item">{round + 1}/{totalRounds}<small>轮次</small></div>
        {combo > 0 && <div className="hud-item" style={{ color: getComboColor(combo >= 20 ? 'rainbow' : combo >= 10 ? 'gold' : combo >= 5 ? 'fire' : 'none') }}>{combo}<small>连击</small></div>}
      </div>

      {judge && <div className={`taiko-judge ${judge.c}`}>{judge.t}</div>}

      <div className="echo-stage">
        {phase === 'listen' && (
          <div className="echo-listen">
            <div className="echo-drum-anim">
              <div className={`echo-drum ${playingNote === 'don' ? 'hit-don' : playingNote === 'ka' ? 'hit-ka' : ''}`}>
                🥁
              </div>
            </div>
            <p>🎧 仔细听...</p>
          </div>
        )}

        {phase === 'echo' && (
          <div className="echo-play">
            <p>👆 跟着敲出来！</p>
            <div className="taiko-2keys">
              <button className="key-don" onPointerDown={() => hit('don')}>
                <span>🥁 咚</span><small>F / 空格</small>
              </button>
              <button className="key-ka" onPointerDown={() => hit('ka')}>
                <span>🥁 咔</span><small>J / K</small>
              </button>
            </div>
          </div>
        )}

        {phase === 'judge' && (
          <div className="echo-judge">
            <p>判定中...</p>
          </div>
        )}
      </div>

      {result && <GameResult gameId={GAME_ID} score={result.score} stars={result.stars} bestScore={best} isNewBest={result.isNewBest} newBadges={result.newBadges} review={result.review} onRetry={start} onContinue={() => navigate('training')} onHome={() => navigate('home')} />}
    </div>
  )
}
