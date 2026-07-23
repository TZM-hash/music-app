import { useCallback, useEffect, useRef, useState } from 'react'
import { taikoDON, taikoKA, playNote, startAccompaniment, stopAccompaniment, inferChords } from '../../music/audioEngine'
import { recordResult, loadProgress, BADGE_INFO } from '../../state/progress'
import { useApp } from '../../state/appState'
import { Song } from '../../music/songs'
import SongPicker from '../../components/SongPicker'
import GameResult, { ReviewData } from '../../components/GameResult'
import { hitCombo, resetCombo, getComboColor } from '../../state/combo'
import { celebrate } from '../../components/Celebration'
import { playUI } from '../../music/uiSounds'
import { useTimers } from '../../hooks/useTimers'
import '../../components/gameResult.css'
import './taiko.css'

const GAME_ID = 'game-taiko'
type NType = 'don' | 'ka'
interface Note { id: number; type: NType; big: boolean; time: number; note?: string; hit: boolean; judged: boolean }

const W_G = 60, W_OK = 130, W_MS = 200
const HIT_X = 140, SPEED = 0.42

const DIFFS = [
  { level: 1, name: '简单 ★', gap: 1, kaRate: 0.15, bigRate: 0.05 },
  { level: 2, name: '普通 ★★', gap: 0.75, kaRate: 0.3, bigRate: 0.08 },
  { level: 3, name: '困难 ★★★', gap: 0.5, kaRate: 0.42, bigRate: 0.12 },
]

export default function TaikoGame() {
  const { navigate } = useApp()
  const [difficulty, setDifficulty] = useState(2)
  const [phase, setPhase] = useState<'pick' | 'play' | 'result'>('pick')
  const [song, setSong] = useState<Song | null>(null)
  const [score, setScore] = useState(0); const [combo, setCombo] = useState(0)
  const [soul, setSoul] = useState(0); const [judge, setJudge] = useState<{ t: string; c: string } | null>(null)
  const [result, setResult] = useState<{ score: number; stars: number; isNewBest: boolean; newBadges: { icon: string; name: string }[]; review: ReviewData } | null>(null)
  const [countdown, setCountdown] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const notes = useRef<Note[]>([]); const raf = useRef(0)
  const startAt = useRef(0)
  const st = useRef({ score: 0, combo: 0, maxC: 0, great: 0, good: 0, miss: 0, soul: 0 })
  const hitFlash = useRef(0)
  const countdownTimer = useRef<number | null>(null)
  const judgeTimer = useRef<number | null>(null)
  const cfg = DIFFS[difficulty - 1]
  // 统一登记定时器，组件卸载时全部清理且回调带卸载保护
  const { later } = useTimers()

  const buildChart = useCallback((s: Song): Note[] => {
    const spb = 60 / s.bpm; const step = spb * cfg.gap * 1000; const lead = 1600
    const out: Note[] = []; let id = 0
    const mel = s.melody.filter((n) => n.note !== 'rest')
    const cnt = Math.max(24, mel.length)
    for (let i = 0; i < cnt; i++) {
      const m = mel[i % mel.length]
      const high = parseInt(m.note.slice(-1), 10) >= 5 || m.note.includes('#')
      let type: NType = high ? 'ka' : 'don'
      // ka/big 用随机而非固定公式：每次生成的谱面不同，学生靠背板无法通关
      if (Math.random() < cfg.kaRate) type = type === 'don' ? 'ka' : 'don'
      out.push({ id: id++, type, big: Math.random() < cfg.bigRate, time: lead + i * step, note: m.note, hit: false, judged: false })
    }
    return out
  }, [cfg])

  const finish = useCallback(() => {
    cancelAnimationFrame(raf.current)
    stopAccompaniment()
    const s = st.current; const total = notes.current.length
    const acc = total === 0 ? 0 : (s.great + s.good * 0.5) / total
    const cleared = s.soul >= 50
    if (cleared) {
      celebrate('large')
      playUI('fanfare')
    }
    const stars = !cleared ? (acc >= 0.3 ? 1 : 0) : acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : 1
    const r = recordResult(GAME_ID, difficulty, stars, s.score, { accuracy: acc, songId: song?.id })
    const hitPct = total === 0 ? 0 : Math.round(((s.great + s.good) / total) * 100)
    let advice: string
    if (!cleared) advice = '魂值没过半，先跟着节奏稳稳敲，别追求快。'
    else if (s.miss > s.great) advice = '漏敲有点多，看准音符到判定圈中心再敲。'
    else if (hitPct >= 90) advice = '节奏感很棒！可以挑战更高难度了。'
    else advice = '打得不错，多练几遍「良」判定会更多。'
    setResult({
      score: s.score, stars, isNewBest: r.isNewBest,
      newBadges: r.newBadges.map((b) => BADGE_INFO[b]).filter(Boolean),
      review: {
        stats: [
          { label: '良', value: `${s.great}` },
          { label: '可', value: `${s.good}` },
          { label: '不可/漏', value: `${s.miss}` },
          { label: '最大连击', value: `${s.maxC}` },
        ],
        advice,
      },
    })
    setPhase('result')
  }, [difficulty, song])

  const startPlay = useCallback((s: Song) => {
    notes.current = buildChart(s); st.current = { score: 0, combo: 0, maxC: 0, great: 0, good: 0, miss: 0, soul: 0 }
    setScore(0); setCombo(0); setSoul(0); setResult(null); setSong(s)
    resetCombo()
    playUI('countdown')
    if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current)
    let c = 3; setCountdown(3)
    countdownTimer.current = window.setInterval(() => {
      c--
      if (c <= 0) {
        if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current)
        countdownTimer.current = null
        setCountdown(0); setPhase('play'); startAt.current = performance.now()
        startAccompaniment(s.bpm, s.chords ?? inferChords(s.melody, s.beatsPerBar))
      } else setCountdown(c)
    }, 700)
  }, [buildChart])

  useEffect(() => {
    if (phase !== 'play') return
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight }
    resize(); window.addEventListener('resize', resize)
    const loop = () => {
      const now = performance.now() - startAt.current; const W = canvas.width; const H = canvas.height; const laneY = H / 2
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(30,30,50,0.15)'; ctx.fillRect(0, laneY - 46, W, 92)
      // 判定圈
      const ringR = 40
      ctx.beginPath(); ctx.arc(HIT_X, laneY, ringR, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke()
      if (hitFlash.current > 0) { ctx.beginPath(); ctx.arc(HIT_X, laneY, ringR + hitFlash.current * 20, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,220,100,${hitFlash.current * 0.4})`; ctx.fill(); hitFlash.current -= 0.06 }
      for (const n of notes.current) {
        if (n.hit) continue; const x = HIT_X + (n.time - now) * SPEED
        if (x < -40 || x > W + 40) { if (!n.judged && n.time - now < -W_MS) { n.judged = true; st.current.miss++; st.current.combo = 0; st.current.soul = Math.max(0, st.current.soul - 3); setCombo(0); resetCombo() } continue }
        const r = n.big ? 30 : 22
        ctx.beginPath(); ctx.arc(x, laneY, r, 0, Math.PI * 2)
        ctx.fillStyle = n.type === 'don' ? '#f25050' : '#5aa0f0'; ctx.fill()
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke()
        if (n.big) { ctx.beginPath(); ctx.arc(x, laneY, r + 5, 0, Math.PI * 2); ctx.strokeStyle = '#fff8'; ctx.lineWidth = 2; ctx.stroke() }
      }
      const last = notes.current[notes.current.length - 1]
      if (last && now > last.time + W_MS + 400) { finish(); return }
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', resize) }
  }, [phase, finish])

  const hit = useCallback((type: NType) => {
    if (phase !== 'play') return
    type === 'don' ? taikoDON() : taikoKA()
    const now = performance.now() - startAt.current
    let best: Note | null = null; let bestD = Infinity
    for (const n of notes.current) { if (n.hit || n.judged) continue; const d = Math.abs(n.time - now); if (d < bestD) { bestD = d; best = n } }
    if (!best || bestD > W_MS || best.type !== type) return
    best.hit = true; best.judged = true; const s = st.current; const mult = best.big ? 2 : 1
    hitFlash.current = 1
    if (bestD <= W_G) { s.great++; s.combo++; s.score += (300 + s.combo * 8) * mult; s.soul = Math.min(100, s.soul + 6); setJudge({ t: '良', c: 'great' }); hitCombo() }
    else if (bestD <= W_OK) { s.good++; s.combo++; s.score += (150 + s.combo * 4) * mult; s.soul = Math.min(100, s.soul + 3); setJudge({ t: '可', c: 'good' }); hitCombo() }
    else { s.combo = 0; s.soul = Math.max(0, s.soul - 2); setJudge({ t: '不可', c: 'miss' }); resetCombo() }
    s.maxC = Math.max(s.maxC, s.combo); setScore(s.score); setCombo(s.combo); setSoul(s.soul)
    if (best.note) playNote(best.note, '16n')
    if (judgeTimer.current !== null) window.clearTimeout(judgeTimer.current)
    judgeTimer.current = later(() => { judgeTimer.current = null; setJudge(null) }, 300)
  }, [phase, later])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return; const k = e.key.toLowerCase()
      if (k === 'f' || k === ' ' || k === 'd') { e.preventDefault(); hit('don') }
      else if (k === 'j' || k === 'k') { e.preventDefault(); hit('ka') }
    }
    window.addEventListener('keydown', down); return () => window.removeEventListener('keydown', down)
  }, [hit])

  useEffect(() => () => {
    stopAccompaniment()
    resetCombo() // 清掉全局连击，避免残留到下一个游戏
    if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current)
    if (judgeTimer.current !== null) window.clearTimeout(judgeTimer.current)
  }, [])

  const best = loadProgress().bestScores[GAME_ID] ?? 0

  if (phase === 'pick') return (
    <SongPicker title="🥁 咚咔鼓手" intro="音符从右滚来，红色「咚」(左/空格) 敲鼓面，蓝色「咔」(右) 敲鼓边。带背景伴奏，魂值过半即过关！" difficulties={DIFFS.map((d) => ({ level: d.level, name: d.name }))} difficulty={difficulty} onDifficulty={setDifficulty} initialSongId={null} best={best} onStart={startPlay} />
  )

  return (<div className="game-wrap">
    <div className="game-hud">
      <div className="hud-item">{score}<small>得分</small></div>
      <div className="hud-item" style={{ color: combo >= 20 ? getComboColor('rainbow') : combo >= 10 ? getComboColor('gold') : combo >= 5 ? getComboColor('fire') : undefined }}>{combo}<small>连击</small></div>
      {phase === 'play' && <div className="soul-gauge"><div className="soul-track"><div className={`soul-fill ${soul >= 50 ? 'cleared' : ''}`} style={{ width: `${soul}%` }} /><span className="soul-mark" /></div><span className="soul-label">{soul >= 50 ? '🔥 过关' : '魂'}</span></div>}
      <div className="rh-song">🎵 {song?.title}</div>
    </div>
    {countdown > 0 && <div className="taiko-countdown"><div className="count-num">{countdown}</div></div>}
    {phase === 'play' && <div className="taiko-stage">
      {judge && <div className={`taiko-judge ${judge.c}`}>{judge.t}</div>}
      {combo >= 5 && <div className="taiko-combo" style={{ color: combo >= 20 ? getComboColor('rainbow') : combo >= 10 ? getComboColor('gold') : getComboColor('fire'), textShadow: `0 0 20px ${combo >= 20 ? getComboColor('rainbow') : combo >= 10 ? getComboColor('gold') : getComboColor('fire')}` }}>{combo}🔥</div>}
      <canvas ref={canvasRef} className="taiko-canvas" aria-label="节奏轨道：音符滚向判定圈" />
      <div className="taiko-2keys">
        <button className="key-don" aria-label="咚（F 或 空格）" onPointerDown={() => hit('don')}><span>🥁 咚</span><small>F / 空格</small></button>
        <button className="key-ka" aria-label="咔（J 或 K）" onPointerDown={() => hit('ka')}><span>🥁 咔</span><small>J / K</small></button>
      </div>
    </div>}
    {result && <GameResult gameId={GAME_ID} score={result.score} stars={result.stars} bestScore={best} isNewBest={result.isNewBest} newBadges={result.newBadges} review={result.review} onRetry={() => song && startPlay(song)} onContinue={() => navigate('training')} onHome={() => navigate('home')} />}
  </div>)
}
