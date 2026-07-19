# 霓虹舞台 Phase 3：节奏复制游戏 + 班级对战 + 每日挑战 + 进度可视化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增节奏复制游戏（Rhythm Echo）、班级对战模式、每日挑战翻牌升级、闯关地图进度可视化。

**Architecture:** EchoGame 复用太鼓的 DON/KA 音色和判定窗口；班级对战复用现有游戏的题目逻辑；每日挑战在首页改造；进度可视化在 AdventureMap 改造。

**Tech Stack:** React 18, TypeScript, Tone.js, Canvas 2D

## Global Constraints

- 保持单文件构建，零新 npm 依赖
- 所有动画只用 `transform` + `opacity`
- 支持 `prefers-reduced-motion`
- 现有功能逻辑不改

---

### Task 1: 节奏复制游戏 EchoGame

**Files:**
- Create: `src/pages/games/EchoGame.tsx`
- Create: `src/pages/games/echo.css`
- Modify: `src/App.tsx`（加路由）
- Modify: `src/state/appState.tsx`（加路由类型）
- Modify: `src/state/navigationHistory.ts`（加路由标签）
- Modify: `src/components/Sidebar.tsx`（加入口）

**Interfaces:**
- Consumes: `ensureAudio`, `taikoDON`, `taikoKA` from audioEngine; `hitCombo`, `resetCombo` from combo.ts; `celebrate` from Celebration.tsx; `playUI` from uiSounds.ts
- Produces: 新路由 `/game-echo`

- [ ] **Step 1: 添加路由类型和标签**

`src/state/appState.tsx` 的 Route type 中添加 `| 'game-echo'`。
`src/state/navigationHistory.ts` 的 ROUTE_LABELS 中添加 `'game-echo': '节奏复制'`。

- [ ] **Step 2: 创建 `src/pages/games/EchoGame.tsx`**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureAudio, taikoDON, taikoKA } from '../../music/audioEngine'
import { recordResult, loadProgress, BADGE_INFO } from '../../state/progress'
import { useApp } from '../../state/appState'
import GameResult, { ReviewData } from '../../components/GameResult'
import { hitCombo, resetCombo, getComboColor } from '../../state/combo'
import { celebrate } from '../../components/Celebration'
import { playUI } from '../../music/uiSounds'
import '../../components/gameResult.css'
import './echo.css'

const GAME_ID = 'game-echo'

type NType = 'don' | 'ka'

interface EchoNote {
  type: NType
  beat: number // 在第几拍
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

const W_G = 80, W_OK = 150, W_MS = 250

export default function EchoGame() {
  const { navigate } = useApp()
  const [level, setLevel] = useState(1)
  const [phase, setPhase] = useState<'pick' | 'listen' | 'echo' | 'judge' | 'result'>('pick')
  const [pattern, setPattern] = useState<EchoPattern | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [judge, setJudge] = useState<{ t: string; c: string } | null>(null)
  const [echoHits, setEchoHits] = useState<{ note: NType; time: number }[]>([])
  const [playingNote, setPlayingNote] = useState<NType | null>(null)
  const [result, setResult] = useState<{ score: number; stars: number; isNewBest: boolean; newBadges: { icon: string; name: string }[]; review: ReviewData } | null>(null)

  const cfg = LEVELS[level - 1]
  const startAt = useRef(0)
  const totalRounds = 5

  const pickPattern = useCallback((): EchoPattern => {
    const patterns = cfg.patterns
    return patterns[Math.floor(Math.random() * patterns.length)]
  }, [cfg])

  const playPattern = useCallback(async (p: EchoPattern) => {
    await ensureAudio()
    const beatMs = (60 / p.bpm) * 1000
    for (const n of p.notes) {
      setTimeout(() => {
        setPlayingNote(n.type)
        if (n.type === 'don') taikoDON()
        else taikoKA()
        setTimeout(() => setPlayingNote(null), 200)
      }, n.beat * beatMs)
    }
  }, [])

  const startRound = useCallback((p: EchoPattern) => {
    setPattern(p)
    setEchoHits([])
    setPhase('listen')
    playPattern(p)
    // 播放完毕后进入跟敲阶段
    const beatMs = (60 / p.bpm) * 1000
    const lastBeat = Math.max(...p.notes.map((n) => n.beat))
    setTimeout(() => {
      setPhase('echo')
      startAt.current = performance.now()
    }, (lastBeat + 1) * beatMs + 500)
  }, [playPattern])

  const start = useCallback(() => {
    setScore(0)
    setCombo(0)
    setRound(0)
    setResult(null)
    resetCombo()
    playUI('countdown')
    setTimeout(() => {
      const p = pickPattern()
      startRound(p)
    }, 1200)
  }, [pickPattern, startRound])

  const hit = useCallback((type: NType) => {
    if (phase !== 'echo') return
    const now = performance.now() - startAt.current
    const beatMs = (60 / (pattern?.bpm ?? 90)) * 1000

    if (type === 'don') taikoDON()
    else taikoKA()

    setEchoHits((prev) => [...prev, { note: type, time: now }])

    // 检查是否敲完了
    if (pattern && echoHits.length + 1 >= pattern.notes.length) {
      // 判定
      setPhase('judge')
      let correct = 0
      const rows: { label: string; got: string; want?: string; ok: boolean }[] = []

      for (let i = 0; i < pattern.notes.length; i++) {
        const expected = pattern.notes[i]
        const expectedTime = expected.beat * beatMs
        const actual = echoHits[i] // 可能少敲或多敲

        if (!actual) {
          rows.push({ label: `第 ${i + 1} 拍`, got: '未敲', want: expected.type === 'don' ? '咚' : '咔', ok: false })
          continue
        }

        const timeDiff = Math.abs(actual.time - expectedTime)
        const typeMatch = actual.note === expected.type
        const timeOk = timeDiff <= W_OK

        if (typeMatch && timeOk) {
          correct++
          const isGreat = timeDiff <= W_G
          rows.push({ label: `第 ${i + 1} 拍`, got: isGreat ? '良' : '可', ok: true })
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
        setScore((s) => s + Math.round(acc * 200) + c.count * 10)
        setJudge({ t: acc >= 0.9 ? '完美！' : '不错！', c: 'great' })
      } else {
        resetCombo()
        setCombo(0)
        setJudge({ t: '再听一次', c: 'miss' })
      }

      setTimeout(() => {
        setJudge(null)
        const nextRound = round + 1
        if (nextRound >= totalRounds) {
          // 结算
          const finalScore = score + Math.round(acc * 200)
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
                { label: '最大连击', value: `${combo}` },
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
  }, [phase, pattern, echoHits, round, score, combo, level, pickPattern, startRound])

  // 键盘
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
```

- [ ] **Step 3: 创建 `src/pages/games/echo.css`**

```css
/* 节奏复制 · 清爽深色 */
.echo-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 24px;
  min-height: 0;
}

.echo-listen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.echo-drum-anim {
  display: grid;
  place-items: center;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(35, 42, 82, 0.5);
  border: 3px solid var(--line);
}

.echo-drum {
  font-size: 4rem;
  transition: transform 0.1s var(--ease-spring), filter 0.1s;
}

.echo-drum.hit-don {
  transform: scale(1.3);
  filter: drop-shadow(0 0 20px rgba(242, 80, 80, 0.5));
}

.echo-drum.hit-ka {
  transform: scale(1.3);
  filter: drop-shadow(0 0 20px rgba(90, 160, 240, 0.5));
}

.echo-listen p,
.echo-play p,
.echo-judge p {
  font-size: 1.3rem;
  color: var(--text-soft);
  font-weight: 700;
}

.echo-play {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.echo-judge {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 4: 修改 `src/App.tsx` 添加路由**

import: `import EchoGame from './pages/games/EchoGame'`
路由: `{route === 'game-echo' && <EchoGame />}`

- [ ] **Step 5: 修改 `src/components/Sidebar.tsx` 加入口**

在"挑战中心"组的 items 中添加：
```tsx
      { route: 'game-echo', icon: '复', label: '节奏复制', hint: '听节奏跟着敲' },
```

- [ ] **Step 6: 验证构建 + Commit**

---

### Task 2: 班级对战模式

**Files:**
- Create: `src/state/teamBattle.ts`
- Create: `src/pages/TeamBattle.tsx`
- Create: `src/pages/teambattle.css`
- Modify: `src/App.tsx`（加路由）
- Modify: `src/state/appState.tsx`（加路由类型）
- Modify: `src/state/navigationHistory.ts`（加路由标签）
- Modify: `src/components/Sidebar.tsx`（加入口，teacher only）

**Interfaces:**
- Consumes: `celebrate` from Celebration.tsx, `playUI` from uiSounds.ts
- Produces: 新路由 `/battle`

- [ ] **Step 1: 创建 `src/state/teamBattle.ts`**

```ts
// 班级对战状态
export interface TeamState {
  name: string
  score: number
  color: string
}

export interface BattleState {
  left: TeamState
  right: TeamState
  round: number
  totalRounds: number
  active: boolean
}

let state: BattleState = {
  left: { name: '蓝队', score: 0, color: '#4dd0e8' },
  right: { name: '红队', score: 0, color: '#e06078' },
  round: 0,
  totalRounds: 10,
  active: false,
}

export function getBattleState(): BattleState {
  return { ...state }
}

export function startBattle(totalRounds = 10): void {
  state = {
    left: { name: '蓝队', score: 0, color: '#4dd0e8' },
    right: { name: '红队', score: 0, color: '#e06078' },
    round: 0,
    totalRounds,
    active: true,
  }
}

export function scoreTeam(side: 'left' | 'right', points: number): void {
  if (side === 'left') state.left.score += points
  else state.right.score += points
}

export function nextRound(): boolean {
  state.round++
  return state.round < state.totalRounds
}

export function endBattle(): 'left' | 'right' | 'tie' {
  state.active = false
  if (state.left.score > state.right.score) return 'left'
  if (state.right.score > state.left.score) return 'right'
  return 'tie'
}

export function resetBattle(): void {
  state.active = false
  state.left.score = 0
  state.right.score = 0
  state.round = 0
}
```

- [ ] **Step 2: 创建 `src/pages/TeamBattle.tsx`**

```tsx
import { useState, useCallback } from 'react'
import { getBattleState, startBattle, scoreTeam, nextRound, endBattle, resetBattle } from '../state/teamBattle'
import { celebrate } from '../components/Celebration'
import { playUI } from '../music/uiSounds'
import './teambattle.css'

const QUESTIONS = [
  { q: '🎵 听音辨高低', desc: '老师弹两个音，学生判断第二个音更高还是更低' },
  { q: '🥁 节奏模仿', desc: '老师拍一段节奏，学生跟着拍' },
  { q: '🎼 识谱抢答', desc: '老师指五线谱上的一个音，学生抢答音名' },
  { q: '🎤 跟唱挑战', desc: '老师唱一句旋律，学生跟着唱' },
  { q: '🎹 琴键找音', desc: '老师说一个音名，学生在钢琴上找到并弹出来' },
  { q: '🥁 咚咚咔咔', desc: '听到"咚"拍手，听到"咔"跺脚' },
  { q: '🎵 乐器猜猜', desc: '老师描述一种乐器的声音，学生猜是什么乐器' },
  { q: '🎼 音符接龙', desc: '轮流唱出 do-re-mi-fa-sol-la-ti，不能重复' },
  { q: '🎤 音量控制', desc: '老师唱一个音，学生用更大/更小的音量跟唱' },
  { q: '🎹 和弦辨听', desc: '老师弹一个和弦，学生判断是大调（明亮）还是小调（忧伤）' },
]

export default function TeamBattle() {
  const [battle, setBattle] = useState(getBattleState())
  const [questionIdx, setQuestionIdx] = useState(0)
  const [showWinner, setShowWinner] = useState(false)
  const [winner, setWinner] = useState<'left' | 'right' | 'tie' | null>(null)

  const start = useCallback(() => {
    startBattle(QUESTIONS.length)
    setBattle(getBattleState())
    setQuestionIdx(0)
    setShowWinner(false)
    setWinner(null)
    playUI('countdown')
  }, [])

  const score = useCallback((side: 'left' | 'right') => {
    scoreTeam(side, 10)
    playUI('correct')
    setBattle(getBattleState())
  }, [])

  const next = useCallback(() => {
    const hasMore = nextRound()
    setBattle(getBattleState())
    if (hasMore) {
      setQuestionIdx((i) => (i + 1) % QUESTIONS.length)
    } else {
      const w = endBattle()
      setWinner(w)
      setShowWinner(true)
      if (w !== 'tie') {
        celebrate('epic')
        playUI('fanfare')
      }
    }
  }, [])

  const reset = useCallback(() => {
    resetBattle()
    setBattle(getBattleState())
    setShowWinner(false)
    setWinner(null)
    setQuestionIdx(0)
  }, [])

  const currentQ = QUESTIONS[questionIdx]
  const totalScore = battle.left.score + battle.right.score
  const leftPct = totalScore === 0 ? 50 : (battle.left.score / totalScore) * 100

  if (!battle.active && !showWinner) {
    return (
      <div className="battle-wrap">
        <div className="battle-start">
          <h2>⚔️ 班级对战</h2>
          <p>把全班分成两组，轮流答题/演奏，大屏实时显示比分。适合课堂互动！</p>
          <button className="big-start" onClick={start}>开始对战国</button>
        </div>
      </div>
    )
  }

  if (showWinner) {
    const winnerName = winner === 'left' ? battle.left.name : winner === 'right' ? battle.right.name : '平局'
    const winnerColor = winner === 'left' ? battle.left.color : winner === 'right' ? battle.right.color : '#eef2ff'
    return (
      <div className="battle-wrap">
        <div className="battle-winner">
          <div className="winner-crown">👑</div>
          <h2 style={{ color: winnerColor }}>{winnerName === '平局' ? '势均力敌！' : `${winnerName} 获胜！`}</h2>
          <div className="winner-score">
            <span style={{ color: battle.left.color }}>{battle.left.score}</span>
            <span> : </span>
            <span style={{ color: battle.right.color }}>{battle.right.score}</span>
          </div>
          <button className="big-start" onClick={reset}>再来一局</button>
        </div>
      </div>
    )
  }

  return (
    <div className="battle-wrap">
      {/* 比分条 */}
      <div className="battle-scorebar">
        <div className="team-score left" style={{ width: `${leftPct}%` }}>
          <span className="team-name">{battle.left.name}</span>
          <span className="team-points">{battle.left.score}</span>
        </div>
        <div className="battle-vs">VS</div>
        <div className="team-score right" style={{ width: `${100 - leftPct}%` }}>
          <span className="team-points">{battle.right.score}</span>
          <span className="team-name">{battle.right.name}</span>
        </div>
      </div>

      {/* 当前题目 */}
      <div className="battle-question">
        <div className="battle-round">第 {battle.round + 1} 题 / 共 {battle.totalRounds} 题</div>
        <h3>{currentQ.q}</h3>
        <p>{currentQ.desc}</p>
      </div>

      {/* 记分按钮 */}
      <div className="battle-actions">
        <button className="battle-btn left" onClick={() => score('left')}>
          +10 {battle.left.name}
        </button>
        <button className="battle-btn skip" onClick={next}>
          跳过 →
        </button>
        <button className="battle-btn right" onClick={() => score('right')}>
          +10 {battle.right.name}
        </button>
      </div>

      {/* 结束按钮 */}
      <button className="battle-end" onClick={next}>
        {battle.round + 1 >= battle.totalRounds ? '结束对战' : '下一题'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: 创建 `src/pages/teambattle.css`**

```css
/* 班级对战 · 清爽深色 */
.battle-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
  padding: 20px;
}

.battle-start {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
}

.battle-start h2 {
  font-size: 2.4rem;
  color: var(--neon-cyan);
}

.battle-start p {
  color: var(--text-soft);
  max-width: 480px;
  font-size: 1.1rem;
  line-height: 1.6;
}

/* 比分条 */
.battle-scorebar {
  display: flex;
  align-items: center;
  height: 60px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--line);
  background: var(--bg-panel);
}

.team-score {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
  transition: width 0.5s var(--ease-smooth);
  min-width: 80px;
}

.team-score.left {
  background: linear-gradient(90deg, rgba(77, 208, 232, 0.3), rgba(77, 208, 232, 0.15));
}

.team-score.right {
  background: linear-gradient(90deg, rgba(224, 96, 120, 0.15), rgba(224, 96, 120, 0.3));
}

.team-name {
  font-weight: 900;
  font-size: 1.1rem;
}

.team-points {
  font-size: 1.8rem;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
}

.battle-vs {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--bg-raised);
  border: 3px solid var(--line);
  font-weight: 950;
  font-size: 1.2rem;
  color: var(--text-soft);
  flex-shrink: 0;
  z-index: 2;
  margin: 0 -10px;
}

/* 题目区 */
.battle-question {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  padding: 24px;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  border: 1px solid var(--line);
}

.battle-round {
  font-size: 0.9rem;
  color: var(--text-faint);
  font-weight: 700;
}

.battle-question h3 {
  font-size: 2rem;
  color: var(--text);
}

.battle-question p {
  font-size: 1.1rem;
  color: var(--text-soft);
  max-width: 500px;
  line-height: 1.6;
}

/* 记分按钮 */
.battle-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.battle-btn {
  min-height: 64px;
  padding: 16px 32px;
  border-radius: var(--radius);
  font-size: 1.2rem;
  font-weight: 900;
  border: 3px solid;
  cursor: pointer;
  transition: transform 0.1s var(--ease-spring), box-shadow 0.15s;
}

.battle-btn.left {
  border-color: #4dd0e8;
  background: rgba(77, 208, 232, 0.15);
  color: #4dd0e8;
}
.battle-btn.left:hover {
  box-shadow: 0 0 20px rgba(77, 208, 232, 0.3);
}

.battle-btn.right {
  border-color: #e06078;
  background: rgba(224, 96, 120, 0.15);
  color: #e06078;
}
.battle-btn.right:hover {
  box-shadow: 0 0 20px rgba(224, 96, 120, 0.3);
}

.battle-btn.skip {
  border-color: var(--line);
  background: var(--bg-panel);
  color: var(--text-soft);
}

.battle-btn:active {
  transform: scale(0.95);
}

.battle-end {
  align-self: center;
  min-height: 44px;
  padding: 10px 24px;
  border-radius: var(--radius);
  background: var(--bg-panel);
  border: 1px solid var(--line);
  color: var(--text-soft);
  font-weight: 700;
}

/* 胜利页 */
.battle-winner {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
}

.winner-crown {
  font-size: 4rem;
  animation: crownBounce 1s var(--ease-bounce) infinite;
}

@keyframes crownBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.battle-winner h2 {
  font-size: 2.4rem;
}

.winner-score {
  font-size: 3rem;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 4: 添加路由和入口**

`src/state/appState.tsx` Route type 添加 `| 'battle'`。
`src/state/navigationHistory.ts` ROUTE_LABELS 添加 `battle: '班级对战'`。
`src/App.tsx` 添加 `{mode === 'teacher' && route === 'battle' && <TeamBattle />}`。
`src/components/Sidebar.tsx` 在"班级陪伴"组添加 `{ route: 'battle', icon: '⚔', label: '班级对战', hint: '分组互动竞赛' }`。

- [ ] **Step 5: 验证构建 + Commit**

---

### Task 3: 每日挑战翻牌

**Files:**
- Modify: `src/pages/Home.tsx`（改造每日挑战区）

**Interfaces:**
- Consumes: 现有 `buildDailyChallenge`、`todayKey`
- Produces: 翻牌式每日挑战 UI

- [ ] **Step 1: 修改 Home.tsx 每日挑战部分**

将 `{!isLectureMode && (<section className="review-home card">...)` 中的"今日挑战"区域替换为翻牌式：

```tsx
{/* 今日挑战 · 翻牌式 */}
<div className="review-block daily">
  <span className="pro-kicker">今日挑战</span>
  <h3>{dailyChallenge.length} 个混合小挑战</h3>
  <DailyCards items={dailyChallenge} onGo={() => navigate('training')} />
</div>
```

在 Home.tsx 文件底部添加 DailyCards 组件：

```tsx
function DailyCards({ items, onGo }: { items: { id: string; itemTitle: string; category: string; question: string }[]; onGo: () => void }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set())

  const toggle = (i: number) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="daily-cards">
      {items.map((item, i) => (
        <button
          key={item.id}
          className={`daily-card ${flipped.has(i) ? 'flipped' : ''}`}
          onClick={() => { toggle(i); if (!flipped.has(i)) setTimeout(onGo, 600) }}
        >
          {!flipped.has(i) ? (
            <div className="daily-card-back">
              <span className="daily-card-icon">🎵</span>
              <span className="daily-card-label">挑战 {i + 1}</span>
            </div>
          ) : (
            <div className="daily-card-front">
              <b>{item.itemTitle}</b>
              <small>{item.category}</small>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
```

（需要在文件顶部添加 `useState` 的 import —— 如果还没有的话）

- [ ] **Step 2: 在 index.css 添加翻牌样式**

```css
/* 每日挑战翻牌 */
.daily-cards {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.daily-card {
  width: 120px;
  height: 100px;
  border-radius: var(--radius);
  border: 2px solid var(--line);
  background: rgba(35, 42, 82, 0.5);
  cursor: pointer;
  perspective: 600px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.daily-card:hover {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 10px rgba(77, 208, 232, 0.15);
}

.daily-card-back,
.daily-card-front {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 100%;
  padding: 8px;
}

.daily-card-icon {
  font-size: 1.8rem;
}

.daily-card-label {
  font-size: 0.78rem;
  color: var(--text-soft);
  font-weight: 700;
}

.daily-card-front b {
  font-size: 0.82rem;
  color: var(--neon-cyan);
  font-weight: 800;
  text-align: center;
}

.daily-card-front small {
  font-size: 0.72rem;
  color: var(--text-faint);
}

.daily-card.flipped {
  border-color: var(--neon-cyan);
  background: rgba(77, 208, 232, 0.08);
}
```

- [ ] **Step 3: 验证构建 + Commit**

---

### Task 4: 闯关地图进度可视化

**Files:**
- Modify: `src/pages/AdventureMap.tsx`
- Modify: `src/pages/course.css`（添加岛屿动画样式）

**Interfaces:**
- Consumes: 现有 questStats 逻辑
- Produces: 岛屿浮动动画 + 进度光环 + 路径连接

- [ ] **Step 1: 修改 course.css 添加岛屿动画**

```css
/* 闯关岛 · 进度可视化 */
.station {
  animation: islandFloat 3s ease-in-out infinite;
}
.station:nth-child(2n) {
  animation-delay: 0.5s;
}
.station:nth-child(3n) {
  animation-delay: 1s;
}

@keyframes islandFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.station.done {
  outline: 3px solid rgba(232, 200, 80, 0.4);
  box-shadow: 0 0 20px rgba(232, 200, 80, 0.15);
}

.station.active {
  outline: 3px solid rgba(77, 208, 232, 0.4);
  box-shadow: 0 0 20px rgba(77, 208, 232, 0.15);
  animation: islandFloat 3s ease-in-out infinite, activePulse 2s ease-in-out infinite;
}

@keyframes activePulse {
  0%, 100% { box-shadow: 0 0 20px rgba(77, 208, 232, 0.15); }
  50% { box-shadow: 0 0 30px rgba(77, 208, 232, 0.3); }
}

.station.locked {
  opacity: 0.4;
  filter: grayscale(0.5);
}

.station.locked .station-icon {
  filter: grayscale(0.8);
}

/* 进度条发光 */
.station-progress span {
  box-shadow: 0 0 6px currentColor;
}
```

- [ ] **Step 2: 验证构建 + Commit**

---

### Task 5: 全局构建验证

- [ ] **Step 1: TypeScript 编译检查**
- [ ] **Step 2: 构建检查**
- [ ] **Step 3: 最终 Commit**
