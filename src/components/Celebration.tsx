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

/** 全局庆祝函数，任何组件可通过 import { celebrate } 调用 */
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
