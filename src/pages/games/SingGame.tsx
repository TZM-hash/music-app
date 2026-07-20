import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureAudio } from '../../music/audioEngine'
import { PitchDetector, noteToMidi, freqToNote } from '../../music/pitchDetect'
import { recordResult, loadProgress, BADGE_INFO } from '../../state/progress'
import { useApp } from '../../state/appState'
import { Song } from '../../music/songs'
import SongPicker from '../../components/SongPicker'
import GameResult, { ReviewData } from '../../components/GameResult'
import { playUI } from '../../music/uiSounds'
import { useMounted } from '../../hooks/useTimers'
import '../../components/gameResult.css'
import './sing.css'

const GAME_ID = 'game-sing'

const DIFFS = [
  { level: 1, name: '宽松 · 容错大', tol: 2 }, // 容忍 ±2 半音
  { level: 2, name: '标准', tol: 1 },
  { level: 3, name: '严格 · 音准要求高', tol: 0.6 },
]

// 目标音符（展开后带绝对时间）
interface TargetNote {
  midi: number // 已折叠到中央音区
  startMs: number
  durMs: number
  origNote: string // 原始音名（用于回顾显示）
  hit: number // 该音命中样本数
  total: number // 该音总样本数
  sumDiff: number // 音差累计（带符号：正=偏高，负=偏低）
}

const PPS = 0.12 // px per ms 滚动速度
const HIT_X = 120

export default function SingGame() {
  const { navigate } = useApp()
  const [difficulty, setDifficulty] = useState(1)
  const [phase, setPhase] = useState<'pick' | 'perm' | 'play' | 'result'>('pick')
  const [song, setSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [curNote, setCurNote] = useState('')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ score: number; stars: number; isNewBest: boolean; newBadges: { icon: string; name: string }[]; review: ReviewData } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detector = useRef<PitchDetector | null>(null)
  const targets = useRef<TargetNote[]>([])
  const raf = useRef(0)
  const startAt = useRef(0)
  const totalMs = useRef(0)
  const userTrail = useRef<{ t: number; midi: number }[]>([])
  const stat = useRef({ inTune: 0, samples: 0 })
  const midiRange = useRef({ min: 55, max: 72 })

  const cfg = DIFFS[difficulty - 1]
  const mounted = useMounted()

  // 构建目标序列：把旋律折叠到 C4 附近人声舒适音区
  const buildTargets = useCallback((s: Song): TargetNote[] => {
    const spb = 60 / s.bpm
    let t = 0
    const out: TargetNote[] = []
    for (const n of s.melody) {
      const dur = n.beats * spb * 1000
      if (n.note !== 'rest') {
        let midi = noteToMidi(n.note)
        // 折叠到 C4(60)~C5(72) 舒适音区
        while (midi > 72) midi -= 12
        while (midi < 55) midi += 12
        out.push({ midi, startMs: t, durMs: dur, origNote: n.note, hit: 0, total: 0, sumDiff: 0 })
      }
      t += dur
    }
    totalMs.current = t + 1500
    // 计算音域用于纵轴映射（空旋律时给默认音域，避免 Infinity 导致 NaN 渲染崩溃）
    const midis = out.map((o) => o.midi)
    midiRange.current = midis.length > 0
      ? { min: Math.min(...midis) - 3, max: Math.max(...midis) + 3 }
      : { min: 55, max: 72 }
    return out
  }, [])

  const beginPlay = useCallback((s: Song) => {
    targets.current = buildTargets(s)
    userTrail.current = []
    stat.current = { inTune: 0, samples: 0 }
    setScore(0)
    setProgress(0)
    setResult(null)
    setPhase('play')
    startAt.current = performance.now()
  }, [buildTargets])

  const start = useCallback(async (s: Song) => {
    setSong(s)
    setError(null)
    setPhase('perm')
    playUI('countdown')
    try {
      await ensureAudio()
      const det = new PitchDetector()
      await det.start()
      // 权限/音频启动期间用户可能已切页：立刻停掉麦克风并放弃后续 setState
      if (!mounted.current) {
        det.stop()
        return
      }
      detector.current = det
      beginPlay(s)
    } catch (err) {
      if (!mounted.current) return
      setError('无法访问麦克风。请在浏览器允许麦克风权限后重试（也可能是设备没有麦克风）。')
    }
  }, [beginPlay, mounted])

  const finish = useCallback(() => {
    cancelAnimationFrame(raf.current)
    detector.current?.stop()
    detector.current = null
    const s = stat.current
    const acc = s.samples === 0 ? 0 : s.inTune / s.samples
    const stars = acc >= 0.8 ? 3 : acc >= 0.55 ? 2 : acc >= 0.3 ? 1 : 0
    const finalScore = Math.round(acc * 1000)
    const r = recordResult(GAME_ID, difficulty, stars, finalScore, { accuracy: acc, songId: song?.id })

    // 逐音回顾：哪些音唱准了、哪些偏高/偏低
    const NAME_CN: Record<string, string> = { C: 'do', D: 're', E: 'mi', F: 'fa', G: 'sol', A: 'la', B: 'ti' }
    const rows = targets.current.map((tn, i) => {
      const letter = tn.origNote[0]
      const label = `第 ${i + 1} 音 ${NAME_CN[letter] ?? tn.origNote}`
      if (tn.total === 0) {
        return { label, got: '没接到声音', want: '', ok: false }
      }
      const rate = tn.hit / tn.total
      const avgDiff = tn.sumDiff / tn.total
      const ok = rate >= 0.5
      let got: string
      if (ok) got = '唱准了'
      else if (avgDiff > 0.5) got = '偏高了'
      else if (avgDiff < -0.5) got = '偏低了'
      else got = '不太稳'
      return { label, got, want: ok ? '' : '这个音', ok }
    })
    const highs = rows.filter((x) => x.got === '偏高了').length
    const lows = rows.filter((x) => x.got === '偏低了').length
    const pct = Math.round(acc * 100)
    let advice: string
    if (pct >= 80) advice = '唱得很准！可以试试更难的曲子或严格模式。'
    else if (highs > lows) advice = `有 ${highs} 个音偏高了，注意别用力过猛、放松一点。`
    else if (lows > highs) advice = `有 ${lows} 个音偏低了，可以先听示范、把音"够"上去。`
    else advice = '多跟着目标线唱，唱准了两条线就会重合。'

    setPhase('result')
    setResult({
      score: finalScore, stars, isNewBest: r.isNewBest,
      newBadges: r.newBadges.map((b) => BADGE_INFO[b]).filter(Boolean),
      review: {
        stats: [
          { label: '音准', value: `${pct}%` },
          { label: '唱准音数', value: `${rows.filter((x) => x.ok).length}/${rows.length}` },
        ],
        rows,
        advice,
      },
    })
  }, [difficulty, song])

  // 主循环
  useEffect(() => {
    if (phase !== 'play') return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight }
    resize(); window.addEventListener('resize', resize)

    const midiToY = (midi: number, H: number) => {
      const { min, max } = midiRange.current
      return H - ((midi - min) / (max - min)) * (H - 40) - 20
    }

    const loop = () => {
      const now = performance.now() - startAt.current
      const W = canvas.width; const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // 命中竖线
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(HIT_X, 0); ctx.lineTo(HIT_X, H); ctx.stroke()

      // 读麦克风
      let userMidi = -1
      const reading = detector.current?.read()
      if (reading && reading.freq > 0 && reading.clarity > 0.5) {
        const { midi } = freqToNote(reading.freq)
        // 折叠到目标音区
        let m = midi
        while (m > midiRange.current.max) m -= 12
        while (m < midiRange.current.min) m += 12
        userMidi = m
        setCurNote(reading.note)
        userTrail.current.push({ t: now, midi: m })
      }

      // 画目标音条
      for (const tn of targets.current) {
        const x = HIT_X + (tn.startMs - now) * PPS
        const w = tn.durMs * PPS
        if (x + w < 0 || x > W) continue
        const y = midiToY(tn.midi, H)
        // 是否正在命中窗口内
        const active = now >= tn.startMs && now <= tn.startMs + tn.durMs
        ctx.fillStyle = active ? '#5c7cfa' : 'rgba(140,110,247,0.55)'
        ctx.beginPath()
        ctx.roundRect(x, y - 9, Math.max(w, 6), 18, 8)
        ctx.fill()

        // 命中判定（仅在窗口内且有读数时统计）
        if (active && userMidi > 0) {
          stat.current.samples++
          const diff = userMidi - tn.midi
          tn.total++
          tn.sumDiff += diff
          if (Math.abs(diff) <= cfg.tol) {
            stat.current.inTune++
            tn.hit++
          }
        }
      }

      // 画用户音高轨迹
      ctx.strokeStyle = '#51cf66'
      ctx.lineWidth = 3
      ctx.beginPath()
      let started = false
      for (const p of userTrail.current) {
        const x = HIT_X + (p.t - now) * PPS
        if (x < -20) continue
        const y = midiToY(p.midi, H)
        if (!started) { ctx.moveTo(x, y); started = true }
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      // 当前音高点
      if (userMidi > 0) {
        const y = midiToY(userMidi, H)
        ctx.beginPath(); ctx.arc(HIT_X, y, 8, 0, Math.PI * 2)
        ctx.fillStyle = '#51cf66'; ctx.fill()
      }

      // 清理旧轨迹
      userTrail.current = userTrail.current.filter((p) => (now - p.t) * PPS < W)

      // 实时分数/进度：整数值变化才 setState，避免 60fps 无意义重渲染
      const acc = stat.current.samples === 0 ? 0 : stat.current.inTune / stat.current.samples
      const nextScore = Math.round(acc * 1000)
      const nextProgress = Math.min(100, Math.floor((now / totalMs.current) * 100))
      setScore((prev) => (prev === nextScore ? prev : nextScore))
      setProgress((prev) => (prev === nextProgress ? prev : nextProgress))

      if (now > totalMs.current) { finish(); return }
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', resize) }
  }, [phase, cfg, finish])

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current)
      detector.current?.stop()
      detector.current = null
    },
    []
  )

  const best = loadProgress().bestScores[GAME_ID] ?? 0

  if (phase === 'pick') return (
    <SongPicker
      title="🎤 唱歌评分"
      intro="对着麦克风跟唱！绿色是你的声音，紫色是目标音高，唱准了两条线就重合。会打出音准分。"
      difficulties={DIFFS.map((d) => ({ level: d.level, name: d.name }))}
      difficulty={difficulty}
      onDifficulty={setDifficulty}
      minMelody={6}
      best={best}
      onStart={start}
    />
  )

  if (phase === 'perm') return (
    <div className="sing-perm">
      {error ? (
        <>
          <div className="perm-icon">🎙️❌</div>
          <h2>麦克风不可用</h2>
          <p>{error}</p>
          <button className="big-start" onClick={() => setPhase('pick')}>返回选曲</button>
        </>
      ) : (
        <>
          <div className="perm-icon">🎙️</div>
          <h2>正在请求麦克风权限…</h2>
          <p>请在浏览器弹窗中点击「允许」</p>
        </>
      )}
    </div>
  )

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <div className="hud-item">{score}<small>音准分</small></div>
        <div className="hud-item">{curNote || '—'}<small>当前音</small></div>
        <div className="sing-progress">
          <div className="sing-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="rh-song">🎵 {song?.title}</div>
      </div>
      <div className="sing-stage">
        <div className="sing-legend">
          <span className="lg-target">■ 目标音高</span>
          <span className="lg-user">— 你的声音</span>
        </div>
        <canvas ref={canvasRef} className="sing-canvas" />
        <p className="sing-tip">💡 唱不上去的高音会自动帮你折算，放心大声唱！</p>
      </div>
      {result && (
        <GameResult
          gameId={GAME_ID}
          title={result.stars >= 2 ? '唱得真棒！' : '继续练习哦'}
          score={result.score}
          stars={result.stars}
          bestScore={best}
          isNewBest={result.isNewBest}
          newBadges={result.newBadges}
          review={result.review}
          onRetry={() => song && start(song)}
          onContinue={() => navigate('training')}
          onHome={() => navigate('home')}
        />
      )}
    </div>
  )
}
