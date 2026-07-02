import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureAudio, playDrum, playNote } from '../../music/audioEngine'
import { recordResult, loadProgress, BADGE_INFO } from '../../state/progress'
import { useApp } from '../../state/appState'
import { Song } from '../../music/songs'
import SongPicker from '../../components/SongPicker'
import GameResult, { ReviewData } from '../../components/GameResult'
import '../../components/gameResult.css'
import './rhythmheaven.css'

const GAME_ID = 'game-rhythm'

const DIFFS = [
  { level: 1, name: '轻松 · 慢速短句', speedMul: 0.8, phraseBeats: 4 },
  { level: 2, name: '普通 · 标准', speedMul: 1, phraseBeats: 4 },
  { level: 3, name: '挑战 · 快速长句', speedMul: 1.25, phraseBeats: 6 },
]

// 一次敲击事件（相对乐句起点的拍数）
interface Tap {
  beat: number
  note?: string
}
interface Phrase {
  taps: Tap[]
  totalBeats: number
}

type Stage = 'pick' | 'listen' | 'play' | 'result'

export default function RhythmHeaven() {
  const { navigate, activeSongId } = useApp()
  const [difficulty, setDifficulty] = useState(2)
  const [stage, setStage] = useState<Stage>('pick')
  const [song, setSong] = useState<Song | null>(null)

  const [phraseIdx, setPhraseIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [feedback, setFeedback] = useState<{ text: string; cls: string } | null>(null)
  const [beatPulse, setBeatPulse] = useState(-1)
  const [charBounce, setCharBounce] = useState(false)
  const [hint, setHint] = useState('')
  const [result, setResult] = useState<null | {
    score: number
    stars: number
    isNewBest: boolean
    newBadges: { icon: string; name: string }[]
    review: ReviewData
  }>(null)

  const phrases = useRef<Phrase[]>([])
  const stat = useRef({ score: 0, combo: 0, maxCombo: 0, good: 0, total: 0 })
  const phraseRows = useRef<{ label: string; got: string; want?: string; ok: boolean }[]>([])
  const bpmRef = useRef(100)
  const playStartRef = useRef(0)
  const expectedTapsRef = useRef<{ time: number; used: boolean }[]>([])
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  // 从曲子生成乐句：把旋律按乐句拍数切段，每个音的起拍作为一次敲击
  const buildPhrases = useCallback((s: Song, phraseBeats: number): Phrase[] => {
    const result: Phrase[] = []
    const melody = s.melody
    let cur: Tap[] = []
    let acc = 0
    for (const n of melody) {
      if (n.note !== 'rest') cur.push({ beat: acc, note: n.note })
      acc += n.beats
      if (acc >= phraseBeats) {
        result.push({ taps: cur, totalBeats: phraseBeats })
        cur = []
        acc = 0
      }
    }
    if (cur.length > 0) result.push({ taps: cur, totalBeats: Math.max(phraseBeats, Math.ceil(acc)) })
    // 至少 4 个乐句，不够则重复
    while (result.length < 4 && result.length > 0) {
      result.push(...result.slice(0, Math.min(result.length, 4 - result.length)))
    }
    return result.slice(0, 8) // 最多 8 句
  }, [])

  const startGame = useCallback(
    async (s: Song) => {
      await ensureAudio()
      const diff = DIFFS[difficulty - 1]
      bpmRef.current = Math.round(s.bpm * diff.speedMul)
      phrases.current = buildPhrases(s, diff.phraseBeats)
      stat.current = { score: 0, combo: 0, maxCombo: 0, good: 0, total: 0 }
      phraseRows.current = []
      setSong(s)
      setScore(0)
      setCombo(0)
      setPhraseIdx(0)
      setResult(null)
      runPhrase(0, s)
    },
    [difficulty, buildPhrases]
  )

  // 播放一个乐句的示范，然后进入玩家跟拍
  const runPhrase = useCallback((idx: number, s: Song) => {
    clearTimers()
    const phrase = phrases.current[idx]
    if (!phrase) {
      endGame(s)
      return
    }
    setPhraseIdx(idx)
    setStage('listen')
    setHint('👂 听机器人拍一遍…')
    const bpm = bpmRef.current
    const spb = (60 / bpm) * 1000

    // 节拍脉冲（整段都跳动）
    const totalBeats = phrase.totalBeats
    for (let b = 0; b < totalBeats; b++) {
      timers.current.push(
        window.setTimeout(() => setBeatPulse(b % 4), b * spb)
      )
    }

    // 示范敲击
    phrase.taps.forEach((tap) => {
      timers.current.push(
        window.setTimeout(() => {
          playDrum('tom')
          if (tap.note) playNote(tap.note, '16n')
          setCharBounce(true)
          window.setTimeout(() => setCharBounce(false), 120)
        }, tap.beat * spb)
      )
    })

    // 示范结束 -> 轮到玩家
    const demoEnd = totalBeats * spb + 400
    timers.current.push(
      window.setTimeout(() => {
        setStage('play')
        setHint('👏 轮到你！跟着节奏拍出来')
        setBeatPulse(-1)
        // 记录期望敲击时间点
        playStartRef.current = performance.now()
        expectedTapsRef.current = phrase.taps.map((t) => ({
          time: t.beat * spb,
          used: false,
        }))
        // 节拍脉冲继续
        for (let b = 0; b < totalBeats; b++) {
          timers.current.push(window.setTimeout(() => setBeatPulse(b % 4), b * spb))
        }
        // 玩家阶段结束 -> 结算该乐句
        timers.current.push(
          window.setTimeout(() => {
            gradePhrase(idx, s)
          }, totalBeats * spb + 600)
        )
      }, demoEnd)
    )
  }, [])

  // 玩家在跟拍阶段敲击
  const tap = useCallback(() => {
    if (stage !== 'play') return
    playDrum('tom')
    setCharBounce(true)
    setTimeout(() => setCharBounce(false), 100)
    const now = performance.now() - playStartRef.current
    // 找最近的未使用期望点
    let best = -1
    let bestDist = Infinity
    expectedTapsRef.current.forEach((e, i) => {
      if (e.used) return
      const d = Math.abs(e.time - now)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    const spb = (60 / bpmRef.current) * 1000
    const goodWin = spb * 0.35
    const okWin = spb * 0.6
    if (best >= 0 && bestDist <= okWin) {
      expectedTapsRef.current[best].used = true
      const s = stat.current
      if (bestDist <= goodWin) {
        s.good++
        s.combo++
        s.score += 100 + s.combo * 10
        setFeedback({ text: '完美!', cls: 'great' })
      } else {
        s.combo++
        s.score += 50
        setFeedback({ text: '不错', cls: 'good' })
      }
      s.maxCombo = Math.max(s.maxCombo, s.combo)
      setScore(s.score)
      setCombo(s.combo)
    } else {
      stat.current.combo = 0
      setCombo(0)
      setFeedback({ text: '偏了', cls: 'miss' })
    }
    setTimeout(() => setFeedback(null), 300)
  }, [stage])

  // 结算乐句
  const gradePhrase = useCallback(
    (idx: number, s: Song) => {
      const expected = expectedTapsRef.current
      const hitCount = expected.filter((e) => e.used).length
      stat.current.total += expected.length
      phraseRows.current.push({
        label: `第 ${idx + 1} 句`,
        got: `拍中 ${hitCount}/${expected.length}`,
        want: hitCount === expected.length ? '' : '全部拍中',
        ok: hitCount === expected.length,
      })
      // 进入下一句
      const next = idx + 1
      if (next >= phrases.current.length) {
        endGame(s)
      } else {
        setHint(hitCount === expected.length ? '🎉 完全正确！下一句' : '继续加油，下一句')
        timers.current.push(window.setTimeout(() => runPhrase(next, s), 900))
      }
    },
    []
  )

  const endGame = useCallback((s: Song) => {
    clearTimers()
    const st = stat.current
    const acc = st.total === 0 ? 0 : st.good / st.total
    const stars = acc >= 0.85 ? 3 : acc >= 0.55 ? 2 : acc >= 0.3 ? 1 : 0
    const r = recordResult(GAME_ID, difficulty, stars, st.score, { accuracy: acc, songId: s.id })
    const perfectPhrases = phraseRows.current.filter((x) => x.ok).length
    const pct = Math.round(acc * 100)
    let advice: string
    if (pct >= 85) advice = '节奏感非常好！试试更快的难度。'
    else if (pct >= 55) advice = '不错，跟着节拍灯的闪动更容易踩准。'
    else advice = '先听清机器人拍的节奏，再照着拍回来，不用急。'
    setStage('result')
    setResult({
      score: st.score,
      stars,
      isNewBest: r.isNewBest,
      newBadges: r.newBadges.map((b) => BADGE_INFO[b]).filter(Boolean),
      review: {
        stats: [
          { label: '完全正确乐句', value: `${perfectPhrases}/${phraseRows.current.length}` },
          { label: '踩准率', value: `${pct}%` },
        ],
        rows: phraseRows.current.slice(),
        advice,
      },
    })
  }, [difficulty])

  // 键盘：空格 / 回车 敲击
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        tap()
      }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [tap])

  useEffect(() => () => clearTimers(), [])

  const best = loadProgress().bestScores[GAME_ID] ?? 0
  const backToPick = () => {
    clearTimers()
    setStage('pick')
    setResult(null)
  }

  if (stage === 'pick') {
    return (
      <SongPicker
        title="🕺 节奏回响"
        intro="机器人先拍一段节奏，你听完照着拍回来！跟上拍子就对了，单键（空格/点击）即可。"
        difficulties={DIFFS.map((d) => ({ level: d.level, name: d.name }))}
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        best={best}
        onStart={startGame}
        initialSongId={activeSongId}
      />
    )
  }

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <div className="hud-item">
          {score}
          <small>得分</small>
        </div>
        <div className="hud-item" style={{ color: combo >= 5 ? '#ff922b' : undefined }}>
          {combo}
          <small>连击</small>
        </div>
        <div className="hud-item">
          {phraseIdx + 1}/{phrases.current.length}
          <small>乐句</small>
        </div>
        <div className="rh-song">🎵 {song?.title}</div>
      </div>

      {stage !== 'result' && (
        <div className="rh-stage">
          <div className={`rh-phase-tag ${stage}`}>
            {stage === 'listen' ? '👂 听示范' : '👏 你来拍'}
          </div>
          <div className="rh-hint">{hint}</div>

          {/* 节拍脉冲灯 */}
          <div className="rh-beats">
            {[0, 1, 2, 3].map((b) => (
              <span key={b} className={`rh-beat ${beatPulse === b ? 'on' : ''}`} />
            ))}
          </div>

          {/* 角色 */}
          <div className={`rh-char ${charBounce ? 'bounce' : ''} ${stage}`}>
            {stage === 'listen' ? '🤖' : '🧑'}
          </div>

          {feedback && <div className={`rh-feedback ${feedback.cls}`}>{feedback.text}</div>}

          {/* 大敲击按钮 */}
          <button
            className={`rh-tap-btn ${stage === 'play' ? 'active' : 'disabled'}`}
            onPointerDown={tap}
          >
            {stage === 'play' ? '拍!' : '听…'}
            <small>空格键 / 点击</small>
          </button>
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
          onRetry={backToPick}
          onHome={() => navigate('home')}
        />
      )}
    </div>
  )
}
