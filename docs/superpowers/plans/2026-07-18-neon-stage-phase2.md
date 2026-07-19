# 霓虹舞台 Phase 2：庆祝引擎 + 游戏特效 + 木琴乐器 + 连击系统 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 添加全局庆祝引擎（canvas 粒子系统）、游戏内连击/判定特效增强、结算页动画升级、新增木琴乐器页面。

**Architecture:** Celebration.tsx 全局 canvas 覆盖层挂在 App 根部，连击状态管理在 combo.ts，木琴复用钢琴的 attack/release 逻辑。

**Tech Stack:** React 18, TypeScript, Tone.js, Canvas 2D, 纯 CSS 动画

## Global Constraints

- 保持单文件构建，零新 npm 依赖
- Canvas 粒子非活动时完全停止渲染（零开销）
- 所有动画只用 `transform` + `opacity`
- 支持 `prefers-reduced-motion`
- UI 音效只在开启时触发

---

### Task 1: 庆祝引擎 Celebration.tsx

**Files:**
- Create: `src/components/Celebration.tsx`
- Create: `src/components/celebration.css`
- Modify: `src/App.tsx`（挂载 Celebration 层）

**Interfaces:**
- Consumes: 无
- Produces: `celebrate(level: 'small' | 'medium' | 'large' | 'epic', x?: number, y?: number)` 全局函数，挂在 `window.__celebrate` 上供任何组件调用

- [ ] **Step 1: 创建 `src/components/Celebration.tsx`**

```tsx
import { useEffect, useRef, useCallback } from 'react'
import './celebration.css'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  shape: 'circle' | 'star' | 'ribbon' | 'rect'
  rotation: number
  rotSpeed: number
  gravity: number
  drag: number
}

type Level = 'small' | 'medium' | 'large' | 'epic'

const COLORS = ['#22e5ff', '#ff4fa3', '#ffd60a', '#a06bff', '#3dffc0', '#ff8c42']
const GOLD_COLORS = ['#ffd60a', '#ffed4a', '#fff3b0', '#ffb800']

let spawnFn: ((level: Level, x?: number, y?: number) => void) | null = null

/** 全局庆祝函数，任何组件可通过 window.__celebrate 调用 */
export function celebrate(level: Level, x?: number, y?: number): void {
  spawnFn?.(level, x, y)
}

export default function Celebration() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const rafId = useRef(0)
  const running = useRef(false)

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }, [])

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [resize])

  const spawn = useCallback((level: Level, cx?: number, cy?: number) => {
    const W = window.innerWidth
    const H = window.innerHeight
    const x = cx ?? W / 2
    const y = cy ?? H / 2
    const newParticles: Particle[] = []

    const make = (overrides: Partial<Particle>): Particle => ({
      x, y, vx: 0, vy: 0, life: 0, maxLife: 60,
      size: 4, color: COLORS[0], shape: 'circle',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      gravity: 0.15, drag: 0.98,
      ...overrides,
    })

    switch (level) {
      case 'small': {
        // 彩色小星星簇（12 颗）
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5
          const speed = 2 + Math.random() * 3
          newParticles.push(make({
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            maxLife: 40 + Math.random() * 20,
            size: 2 + Math.random() * 3,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            shape: 'star',
            gravity: 0.05,
          }))
        }
        break
      }
      case 'medium': {
        // 星星拖尾从底部飞入（8 颗）
        for (let i = 0; i < 8; i++) {
          newParticles.push(make({
            x: x + (Math.random() - 0.5) * 200,
            y: H + 10,
            vx: (Math.random() - 0.5) * 2,
            vy: -(6 + Math.random() * 4),
            maxLife: 80 + Math.random() * 40,
            size: 3 + Math.random() * 4,
            color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
            shape: 'star',
            gravity: -0.02,
          }))
        }
        break
      }
      case 'large': {
        // 彩带飘落（40 条）+ 金粒子雨（30 颗）
        for (let i = 0; i < 40; i++) {
          newParticles.push(make({
            x: Math.random() * W,
            y: -20 - Math.random() * 100,
            vx: (Math.random() - 0.5) * 3,
            vy: 1 + Math.random() * 2,
            maxLife: 120 + Math.random() * 60,
            size: 3 + Math.random() * 5,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            shape: 'ribbon',
            gravity: 0.02,
            drag: 0.995,
          }))
        }
        for (let i = 0; i < 30; i++) {
          newParticles.push(make({
            x: Math.random() * W,
            y: -10 - Math.random() * 50,
            vx: (Math.random() - 0.5) * 2,
            vy: 2 + Math.random() * 3,
            maxLife: 90 + Math.random() * 40,
            size: 2 + Math.random() * 3,
            color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
            shape: 'circle',
            gravity: 0.03,
          }))
        }
        break
      }
      case 'epic': {
        // 全屏烟花（200+ 粒子）
        for (let burst = 0; burst < 5; burst++) {
          const bx = W * (0.15 + burst * 0.175) + (Math.random() - 0.5) * 60
          const by = H * (0.2 + Math.random() * 0.3)
          const count = 40 + Math.floor(Math.random() * 20)
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
            const speed = 3 + Math.random() * 5
            newParticles.push(make({
              x: bx, y: by,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              maxLife: 60 + Math.random() * 40,
              size: 2 + Math.random() * 4,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              shape: Math.random() > 0.5 ? 'star' : 'circle',
              gravity: 0.08,
              drag: 0.96,
            }))
          }
        }
        break
      }
    }

    particles.current.push(...newParticles)
    if (!running.current) {
      running.current = true
      rafId.current = requestAnimationFrame(tick)
    }
  }, [])

  const tick = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.current = particles.current.filter((p) => p.life < p.maxLife)

    for (const p of particles.current) {
      p.life++
      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.vx *= p.drag
      p.vy *= p.drag
      p.rotation += p.rotSpeed

      const alpha = 1 - p.life / p.maxLife
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color

      switch (p.shape) {
        case 'circle':
          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.fill()
          break
        case 'star': {
          const s = p.size
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            const a = (Math.PI * 2 * i) / 5 - Math.PI / 2
            const a2 = a + Math.PI / 5
            ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s)
            ctx.lineTo(Math.cos(a2) * s * 0.4, Math.sin(a2) * s * 0.4)
          }
          ctx.closePath()
          ctx.fill()
          break
        }
        case 'ribbon':
          ctx.fillRect(-p.size / 2, -p.size * 2, p.size, p.size * 4)
          break
        case 'rect':
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
          break
      }

      // 发光效果
      if (p.shape === 'star') {
        ctx.shadowColor = p.color
        ctx.shadowBlur = p.size * 3
        ctx.fill()
      }

      ctx.restore()
    }

    if (particles.current.length > 0) {
      rafId.current = requestAnimationFrame(tick)
    } else {
      running.current = false
    }
  }, [])

  useEffect(() => {
    spawnFn = spawn
    // 挂到 window 供全局调用
    ;(window as any).__celebrate = celebrate
    return () => {
      spawnFn = null
      delete (window as any).__celebrate
      cancelAnimationFrame(rafId.current)
    }
  }, [spawn])

  return (
    <canvas
      ref={canvasRef}
      className="celebration-canvas"
      aria-hidden="true"
    />
  )
}
```

- [ ] **Step 2: 创建 `src/components/celebration.css`**

```css
.celebration-canvas {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .celebration-canvas {
    display: none;
  }
}
```

- [ ] **Step 3: 在 App.tsx 挂载 Celebration**

Modify `src/App.tsx`：

在 import 区域添加：
```tsx
import Celebration from './components/Celebration'
```

在 `Shell` 组件的 return 中，`</div>` 关闭标签前添加：
```tsx
      <Celebration />
```

（放在最外层 div 内，确保覆盖所有内容）

- [ ] **Step 4: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx tsc -b && npx vite build
git add src/components/Celebration.tsx src/components/celebration.css src/App.tsx
git commit -m "feat: global celebration engine with canvas particles"
```

---

### Task 2: 连击系统

**Files:**
- Create: `src/state/combo.ts`

**Interfaces:**
- Consumes: `playUI` from `src/music/uiSounds.ts`, `celebrate` from `src/components/Celebration.tsx`
- Produces: `hitCombo(): { count: number; tier: ComboTier }`、`resetCombo(): void`、`getComboCount(): number`、`ComboTier` type

- [ ] **Step 1: 创建 `src/state/combo.ts`**

```ts
// 跨游戏统一连击系统
import { playUI } from '../music/uiSounds'
import { celebrate } from '../components/Celebration'

export type ComboTier = 'none' | 'fire' | 'gold' | 'rainbow'

let count = 0

export function hitCombo(): { count: number; tier: ComboTier } {
  count++
  const tier = getTier(count)

  // 里程碑触发音效和庆祝
  if (count === 5) {
    playUI('combo')
    celebrate('small')
  } else if (count === 10) {
    playUI('combo')
    celebrate('medium')
  } else if (count > 0 && count % 20 === 0) {
    playUI('combo')
    celebrate('large')
  }

  return { count, tier }
}

export function resetCombo(): void {
  count = 0
}

export function getComboCount(): number {
  return count
}

function getTier(c: number): ComboTier {
  if (c >= 20) return 'rainbow'
  if (c >= 10) return 'gold'
  if (c >= 5) return 'fire'
  return 'none'
}

export function getComboColor(tier: ComboTier): string {
  switch (tier) {
    case 'rainbow': return '#ff4fa3'
    case 'gold': return '#ffd60a'
    case 'fire': return '#ff8c42'
    default: return '#eef2ff'
  }
}
```

- [ ] **Step 2: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx tsc -b && npx vite build
git add src/state/combo.ts
git commit -m "feat: unified combo system with tier milestones"
```

---

### Task 3: 结算页动画升级

**Files:**
- Modify: `src/components/GameResult.tsx`
- Modify: `src/components/gameResult.css`

**Interfaces:**
- Consumes: `celebrate` from Celebration.tsx, `playUI` from uiSounds.ts
- Produces: 星星翻转弹入动画、分数滚动、新纪录烟花

- [ ] **Step 1: 修改 `src/components/GameResult.tsx`**

在文件顶部 import 区域添加：
```tsx
import { useEffect, useRef } from 'react'
import { celebrate } from './Celebration'
import { playUI } from '../music/uiSounds'
```

在 `GameResult` 组件函数体内，最上方添加：

```tsx
const scoreRef = useRef<HTMLDivElement>(null)
const hasCelebrated = useRef(false)

// 分数滚动动画
useEffect(() => {
  const el = scoreRef.current
  if (!el) return
  const target = score
  const duration = 800
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
    el.textContent = `${Math.round(target * eased)} 分`
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}, [score])

// 庆祝触发
useEffect(() => {
  if (hasCelebrated.current) return
  hasCelebrated.current = true
  if (isNewBest) {
    playUI('fanfare')
    celebrate('epic')
  } else if (stars >= 3) {
    playUI('fanfare')
    celebrate('large')
  } else if (stars >= 1) {
    playUI('star')
    celebrate('small')
  }
}, [])
```

将 `<div className="result-score">{score} 分</div>` 替换为：
```tsx
<div className="result-score" ref={scoreRef}>{score} 分</div>
```

- [ ] **Step 2: 修改 `src/components/gameResult.css` 添加星星动画**

在 `.result-stars` 后添加：

```css
.result-stars span {
  display: inline-block;
  animation: starFlip 0.5s var(--ease-bounce) both;
}
.result-stars span:nth-child(1) { animation-delay: 0.1s; }
.result-stars span:nth-child(2) { animation-delay: 0.3s; }
.result-stars span:nth-child(3) { animation-delay: 0.5s; }

@keyframes starFlip {
  0% { transform: rotateY(90deg) scale(0); opacity: 0; }
  60% { transform: rotateY(-20deg) scale(1.3); opacity: 1; }
  100% { transform: rotateY(0deg) scale(1); opacity: 1; }
}
```

- [ ] **Step 3: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx tsc -b && npx vite build
git add src/components/GameResult.tsx src/components/gameResult.css
git commit -m "feat: animated game result with star flip + score roll + celebration"
```

---

### Task 4: 木琴乐器页面

**Files:**
- Create: `src/pages/Xylophone.tsx`
- Create: `src/pages/xylophone.css`
- Modify: `src/App.tsx`（加路由）
- Modify: `src/components/Sidebar.tsx`（加入口）
- Modify: `src/state/appState.tsx`（加路由类型）
- Modify: `src/state/navigationHistory.ts`（加路由标签）

**Interfaces:**
- Consumes: `ensureAudio`, `attackNote`, `releaseNote`, `playXylophone` from audioEngine
- Produces: 新路由 `/xylophone`

- [ ] **Step 1: 查看现有路由类型和标签**

Read `src/state/appState.tsx` 中的 `Route` type 和 `src/state/navigationHistory.ts` 中的 `ROUTE_LABELS`。

- [ ] **Step 2: 添加路由类型**

在 `src/state/appState.tsx` 的 `Route` type 中，`'recorder'` 后添加 `| 'xylophone'`。

在 `src/state/navigationHistory.ts` 的 `ROUTE_LABELS` 中，`recorder` 后添加 `xylophone: '木琴'`。

（如果 `ROUTE_LABELS` 不在 navigationHistory.ts 中，搜索它的位置）

- [ ] **Step 3: 创建 `src/pages/Xylophone.tsx`**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureAudio, playXylophone } from '../music/audioEngine'
import { useApp } from '../state/appState'
import './xylophone.css'

// 木琴音符：C 大调两个八度
interface XyloNote {
  note: string
  name: string
  jianpu: string
  key: string
  color: string
}

const NOTES: XyloNote[] = [
  { note: 'C4', name: 'C', jianpu: '1', key: 'a', color: '#22e5ff' },
  { note: 'D4', name: 'D', jianpu: '2', key: 's', color: '#3dffc0' },
  { note: 'E4', name: 'E', jianpu: '3', key: 'd', color: '#ffd60a' },
  { note: 'F4', name: 'F', jianpu: '4', key: 'f', color: '#ff4fa3' },
  { note: 'G4', name: 'G', jianpu: '5', key: 'g', color: '#a06bff' },
  { note: 'A4', name: 'A', jianpu: '6', key: 'h', color: '#ff8c42' },
  { note: 'B4', name: 'B', jianpu: '7', key: 'j', color: '#4fc3ff' },
  { note: 'C5', name: 'C', jianpu: '1·', key: 'k', color: '#22e5ff' },
  { note: 'D5', name: 'D', jianpu: '2·', key: 'l', color: '#3dffc0' },
  { note: 'E5', name: 'E', jianpu: '3·', key: ';', color: '#ffd60a' },
]

// 半音（黑键等效）
const SEMI_NOTES: XyloNote[] = [
  { note: 'C#4', name: 'C#', jianpu: '#1', key: 'w', color: '#1ab8cc' },
  { note: 'D#4', name: 'D#', jianpu: '#2', key: 'e', color: '#2cd4a0' },
  { note: 'F#4', name: 'F#', jianpu: '#4', key: 't', color: '#d43d80' },
  { note: 'G#4', name: 'G#', jianpu: '#5', key: 'y', color: '#8055cc' },
  { note: 'A#4', name: 'A#', jianpu: '#6', key: 'u', color: '#cc7035' },
]

export default function Xylophone() {
  const { showNoteNames } = useApp()
  const [active, setActive] = useState<Set<string>>(new Set())
  const [bursts, setBursts] = useState<{ id: number; x: number; color: string; label: string }[]>([])
  const burstId = useRef(0)
  const timers = useRef<Record<string, number>>({})

  const strike = useCallback(async (n: XyloNote) => {
    await ensureAudio()
    playXylophone(n.note)
    setActive((s) => new Set(s).add(n.note))
    window.clearTimeout(timers.current[n.note])
    timers.current[n.note] = window.setTimeout(() => {
      setActive((s) => {
        const next = new Set(s)
        next.delete(n.note)
        return next
      })
    }, 300)

    // 粒子
    const barIndex = NOTES.findIndex((x) => x.note === n.note)
    const xPos = barIndex >= 0 ? (barIndex + 0.5) / NOTES.length : 0.5
    const id = burstId.current++
    setBursts((b) => [...b, { id, x: xPos, color: n.color, label: showNoteNames ? n.jianpu : '' }])
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 900)
  }, [showNoteNames])

  // 键盘映射
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      const all = [...NOTES, ...SEMI_NOTES]
      const n = all.find((x) => x.key === e.key.toLowerCase())
      if (n) {
        e.preventDefault()
        strike(n)
      }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [strike])

  return (
    <div className="instrument-wrap">
      <div className="instrument-toolbar">
        <span className="hint">💡 点击琴条或用键盘 A-L 演奏，W-U 为半音</span>
      </div>

      <div className="xylo-stage">
        {/* 粒子层 */}
        <div className="viz-layer">
          {bursts.map((b) => (
            <XyloBubble key={b.id} burst={b} />
          ))}
        </div>

        {/* 半音条（后排） */}
        <div className="xylo-semi-row">
          {SEMI_NOTES.map((n) => (
            <button
              key={n.note}
              className={`xylo-semi-bar ${active.has(n.note) ? 'active' : ''}`}
              style={{ '--bar-color': n.color } as React.CSSProperties}
              onPointerDown={() => strike(n)}
            >
              {showNoteNames && <small>{n.name}</small>}
            </button>
          ))}
        </div>

        {/* 主琴条 */}
        <div className="xylo-bars">
          {NOTES.map((n) => (
            <button
              key={n.note}
              className={`xylo-bar ${active.has(n.note) ? 'active' : ''}`}
              style={{ '--bar-color': n.color } as React.CSSProperties}
              onPointerDown={() => strike(n)}
            >
              <span className="xylo-bar-label">
                {showNoteNames && <b>{n.jianpu}</b>}
                {showNoteNames && <small>{n.name}</small>}
              </span>
              <span className="rk-key">{n.key.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function XyloBubble({ burst }: { burst: { id: number; x: number; color: string; label: string } }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%, -180px) scale(1.4)'
      el.style.opacity = '0'
    })
  }, [])
  return (
    <div
      ref={ref}
      className="viz-bubble"
      style={{
        left: `${burst.x * 100}%`,
        background: burst.color,
        boxShadow: `0 0 30px ${burst.color}`,
      }}
    >
      {burst.label}
    </div>
  )
}
```

- [ ] **Step 4: 创建 `src/pages/xylophone.css`**

```css
/* 木琴 · 霓虹舞台 */
.xylo-stage {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 0;
  border-radius: var(--radius-lg);
  background: var(--bg-panel);
  border: 1px solid var(--line-neon);
  overflow: hidden;
  padding: 20px 20px 30px;
}

/* 粒子层（复用钢琴 viz 样式） */

/* 半音条（后排） */
.xylo-semi-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding-left: 40px; /* 偏移对位 */
}

.xylo-semi-bar {
  width: 52px;
  height: 80px;
  border-radius: 8px;
  background: linear-gradient(180deg, #0a0e24 0%, #060814 100%);
  border: 1px solid rgba(138, 149, 201, 0.15);
  border-top: none;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  transition: transform 0.1s var(--ease-spring), box-shadow 0.15s ease, background 0.15s;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  color: var(--text-faint);
  font-size: 0.72rem;
  font-weight: 700;
}

.xylo-semi-bar:hover {
  background: linear-gradient(180deg, #121738 0%, #0a0e24 100%);
}

.xylo-semi-bar.active {
  background: var(--bar-color, #22e5ff);
  box-shadow: 0 0 20px var(--bar-color, #22e5ff), 0 0 50px var(--bar-color, #22e5ff);
  transform: scaleY(0.96);
  border-color: transparent;
  color: #060814;
}

/* 主琴条 */
.xylo-bars {
  display: flex;
  gap: 6px;
  align-items: flex-end;
}

.xylo-bar {
  width: 72px;
  border-radius: 10px 10px 12px 12px;
  background: linear-gradient(180deg, #1c2452 0%, #141b42 85%, #0d1230 100%);
  border: 1px solid rgba(138, 149, 201, 0.2);
  border-top: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 14px;
  gap: 4px;
  transition: transform 0.1s var(--ease-spring), box-shadow 0.15s ease, background 0.15s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  position: relative;
}

/* 琴条高度：低音长，高音短（模拟真实木琴） */
.xylo-bar:nth-child(1) { height: 240px; }
.xylo-bar:nth-child(2) { height: 228px; }
.xylo-bar:nth-child(3) { height: 216px; }
.xylo-bar:nth-child(4) { height: 204px; }
.xylo-bar:nth-child(5) { height: 192px; }
.xylo-bar:nth-child(6) { height: 180px; }
.xylo-bar:nth-child(7) { height: 168px; }
.xylo-bar:nth-child(8) { height: 156px; }
.xylo-bar:nth-child(9) { height: 144px; }
.xylo-bar:nth-child(10) { height: 132px; }

.xylo-bar:hover {
  background: linear-gradient(180deg, #242e5e 0%, #1a2249 85%, #101638 100%);
}

.xylo-bar.active {
  background: var(--bar-color, #22e5ff);
  box-shadow: 0 0 20px var(--bar-color, #22e5ff), 0 0 60px var(--bar-color, #22e5ff), inset 0 0 20px rgba(255, 255, 255, 0.15);
  transform: scaleY(0.97) translateY(2px);
  border-color: transparent;
}

.xylo-bar-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  pointer-events: none;
}
.xylo-bar-label b {
  font-size: 1.1rem;
  font-weight: 950;
  color: var(--text);
}
.xylo-bar-label small {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-faint);
}

.xylo-bar.active .xylo-bar-label b,
.xylo-bar.active .xylo-bar-label small {
  color: #060814;
}

.xylo-bar .rk-key {
  font-size: 0.62rem;
  color: var(--text-faint);
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(138, 149, 201, 0.1);
}

.xylo-bar.active .rk-key {
  color: #060814;
  background: rgba(0, 0, 0, 0.15);
}

/* 响应式：触屏加大 */
@media (pointer: coarse) {
  .xylo-bar {
    width: 80px;
  }
  .xylo-bar:nth-child(1) { height: 280px; }
  .xylo-bar:nth-child(10) { height: 160px; }
  .xylo-semi-bar {
    width: 60px;
    height: 100px;
  }
}
```

- [ ] **Step 5: 修改 `src/App.tsx` 添加路由**

在 import 区域添加：
```tsx
import Xylophone from './pages/Xylophone'
```

在路由渲染区域，`{route === 'recorder' && <Recorder />}` 后添加：
```tsx
          {route === 'xylophone' && <Xylophone />}
```

- [ ] **Step 6: 修改 `src/components/Sidebar.tsx` 加入口**

在"创作工具"组的 `items` 数组中，`recorder` 后添加：
```tsx
      { route: 'xylophone', icon: '木', label: '木琴', hint: '清脆打击旋律' },
```

- [ ] **Step 7: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx tsc -b && npx vite build
git add src/pages/Xylophone.tsx src/pages/xylophone.css src/App.tsx src/components/Sidebar.tsx src/state/appState.tsx src/state/navigationHistory.ts
git commit -m "feat: xylophone instrument with neon bars"
```

---

### Task 5: 太鼓游戏特效增强

**Files:**
- Modify: `src/pages/games/TaikoGame.tsx`
- Modify: `src/pages/games/taiko.css`

**Interfaces:**
- Consumes: `hitCombo`, `resetCombo` from combo.ts, `celebrate` from Celebration.tsx, `playUI` from uiSounds.ts
- Produces: 太鼓游戏连击显示 + 判定粒子

- [ ] **Step 1: 修改 TaikoGame.tsx**

在 import 区域添加：
```tsx
import { hitCombo, resetCombo, getComboCount, getComboColor } from '../../state/combo'
import { celebrate } from '../../components/Celebration'
import { playUI } from '../../music/uiSounds'
```

在 `startPlay` 函数开头添加：
```tsx
resetCombo()
```

在 `hit` 函数中，判定为"良"或"可"时：
```tsx
// 在 setJudge 调用后添加
if (bestD <= W_OK) {
  const combo = hitCombo()
  // 触发里程碑庆祝已由 hitCombo 内部处理
}
```

判定为"不可"或漏掉时：
```tsx
resetCombo()
```

在 finish 函数中，通关时：
```tsx
if (cleared) {
  celebrate('large')
  playUI('fanfare')
}
```

在渲染中，combo 显示改为使用 combo.ts 的颜色：
```tsx
{combo > 0 && (
  <div className="taiko-combo" style={{ color: getComboColor(getComboCount() >= 20 ? 'rainbow' : getComboCount() >= 10 ? 'gold' : getComboCount() >= 5 ? 'fire' : 'none') }}>
    {combo}
  </div>
)}
```

- [ ] **Step 2: 修改 taiko.css 连击样式**

在 `.taiko-combo` 后添加：

```css
.taiko-combo {
  text-shadow: 0 0 20px currentColor;
  transition: color 0.3s, text-shadow 0.3s;
}
```

- [ ] **Step 3: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx tsc -b && npx vite build
git add src/pages/games/TaikoGame.tsx src/pages/games/taiko.css
git commit -m "feat: taiko combo display with tier colors + celebration"
```

---

### Task 6: 倒计时音效接入

**Files:**
- Modify: `src/pages/games/TaikoGame.tsx`
- Modify: `src/pages/games/SingGame.tsx`

**Interfaces:**
- Consumes: `playUI` from uiSounds.ts
- Produces: 倒计时 3-2-1 鼓点音效

- [ ] **Step 1: 在 TaikoGame.tsx 的 startPlay 中添加倒计时音效**

在 `startPlay` 函数中，`let c = 3; setCountdown(3)` 后添加：
```tsx
playUI('countdown')
```

- [ ] **Step 2: 在 SingGame.tsx 的 start 中添加倒计时音效**

在 `start` 函数中，`setPhase('perm')` 后添加：
```tsx
playUI('countdown')
```

- [ ] **Step 3: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx tsc -b && npx vite build
git add src/pages/games/TaikoGame.tsx src/pages/games/SingGame.tsx
git commit -m "feat: countdown sound effects in games"
```

---

### Task 7: 全局构建验证

**Files:**
- 所有已修改文件

- [ ] **Step 1: TypeScript 编译检查**

Run: `cd D:\AI\music-app && npx tsc -b`
Expected: 无类型错误

- [ ] **Step 2: 构建检查**

Run: `cd D:\AI\music-app && npx vite build`
Expected: 构建成功

- [ ] **Step 3: 最终 Commit**

```bash
git add -A
git commit -m "feat: Phase 2 complete — celebration engine + combo + xylophone"
```
