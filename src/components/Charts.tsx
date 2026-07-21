import { useEffect, useState, type CSSProperties } from 'react'
import CountUp from './CountUp'

// 纯 SVG / CSS 图表组件：柱状图、折线图、环形图、雷达图与课堂声谱图（无第三方依赖）

interface BarDatum {
  label: string
  value: number
  color?: string
}

function shortLabel(label: string, max = 4) {
  const text = label.trim()
  if (!text) return '—'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function BarChart({ data, height = 200 }: { data: BarDatum[]; height?: number }) {
  if (data.length === 0) return <div className="chart-empty">暂无数据</div>
  const max = Math.max(1, ...data.map((d) => d.value))
  const W = 420
  const H = 220
  const padL = 12
  const padR = 12
  const padT = 28
  const padB = 42
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const slot = plotW / data.length
  const barW = Math.min(48, Math.max(18, slot * 0.52))
  return (
    <div className="chart-shell" style={{ minHeight: height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="柱状图"
      >
        {[0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padT + plotH * (1 - tick)
          return (
            <line
              key={tick}
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              className="chart-grid"
            />
          )
        })}
        {data.map((d, i) => {
          const h = d.value > 0 ? Math.max(8, (d.value / max) * plotH) : 0
          const x = padL + i * slot + (slot - barW) / 2
          const y = padT + plotH - h
          const label = shortLabel(d.label, 4)
          return (
            <g key={`${d.label}-${i}`}>
              <rect
                className="chart-bar"
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={7}
                fill={d.color ?? 'var(--primary)'}
                style={{ animationDelay: `${i * 55}ms` }}
              />
              {d.value > 0 && (
                <text
                  x={x + barW / 2}
                  y={Math.max(14, y - 8)}
                  className="chart-val"
                  textAnchor="middle"
                >
                  {d.value}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={H - 14}
                className="chart-x"
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function LineChart({
  points,
  height = 180,
}: {
  points: { label: string; value: number }[]
  height?: number
}) {
  if (points.length === 0) return <div className="chart-empty">暂无数据</div>
  const values = points.map((p) => p.value)
  const max = Math.max(1, ...values)
  const min = Math.min(...values)
  // 给纵轴留出空间，避免全高填满变成“一整块蓝”
  const range = Math.max(1, max - Math.min(0, min))
  const top = max + range * 0.18
  const bottom = Math.max(0, min - range * 0.08)
  const span = Math.max(1, top - bottom)

  const W = 420
  const H = 220
  const padL = 16
  const padR = 16
  const padT = 24
  const padB = 42
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const coords = points.map((p, i) => ({
    x: padL + (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2),
    y: padT + plotH - ((p.value - bottom) / span) * plotH,
    label: shortLabel(p.label.replace(/^#/, '段'), 4),
    value: p.value,
  }))
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const baseline = padT + plotH
  const area = `${path} L${coords[coords.length - 1].x.toFixed(1)},${baseline} L${coords[0].x.toFixed(1)},${baseline} Z`
  return (
    <div className="chart-shell" style={{ minHeight: height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="折线图"
      >
        {[0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padT + plotH * (1 - tick)
          return (
            <line
              key={tick}
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              className="chart-grid"
            />
          )
        })}
        <path d={area} className="chart-area" />
        <path
          d={path}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2.8}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="chart-line"
        />
        {coords.map((c, i) => (
          <g key={`${c.label}-${i}`}>
            <circle cx={c.x} cy={c.y} r={4} fill="#fff" stroke="var(--primary)" strokeWidth={2.2} className="chart-dot" />
            {c.value > 0 && (
              <text x={c.x} y={Math.max(14, c.y - 10)} className="chart-val" textAnchor="middle">
                {c.value}
              </text>
            )}
            <text x={c.x} y={H - 14} className="chart-x" textAnchor="middle">
              {c.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export function Donut({
  segments,
  size = 160,
}: {
  segments: { label: string; value: number; color: string }[]
  size?: number
}) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  const r = 40
  const c = 2 * Math.PI * r
  let offset = 0
  // 挂载时各段从 0 画出，依次延迟
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 100 100" width={size} height={size} className="donut">
        {total === 0 && <circle cx={50} cy={50} r={r} fill="none" stroke="var(--bg)" strokeWidth={14} />}
        {segments.map((s, i) => {
          const frac = total === 0 ? 0 : s.value / total
          const dash = frac * c
          const el = (
            <circle
              key={i}
              cx={50}
              cy={50}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={14}
              strokeDasharray={`${drawn ? dash : 0} ${c}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
              className="donut-segment"
              style={{ transitionDelay: `${i * 120}ms` }}
            />
          )
          offset += dash
          return el
        })}
        <text x={50} y={48} textAnchor="middle" className="donut-total">
          <CountUp target={total} />
        </text>
        <text x={50} y={60} textAnchor="middle" className="donut-cap">
          次
        </text>
      </svg>
      <div className="donut-legend">
        {segments.map((s, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            {s.label} <b>{s.value}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Radar({
  axes,
  size = 220,
}: {
  axes: { label: string; value: number }[] // value 0..1
  size?: number
}) {
  const n = axes.length
  if (n === 0) return <div className="chart-empty">暂无数据</div>
  const cx = 50
  const cy = 50
  const R = 38
  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pt = (i: number, radius: number) => {
    const a = angleFor(i)
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]
  }
  const rings = [0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="radar">
      {rings.map((ring, ri) => (
        <polygon
          key={ri}
          points={axes.map((_, i) => pt(i, R * ring).join(',')).join(' ')}
          fill="none"
          stroke="var(--text-soft)"
          strokeOpacity={0.25}
          strokeWidth={0.4}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, R)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--text-soft)" strokeOpacity={0.25} strokeWidth={0.4} />
      })}
      <polygon
        points={axes.map((ax, i) => pt(i, R * ax.value).join(',')).join(' ')}
        fill="var(--accent)"
        fillOpacity={0.35}
        stroke="var(--accent)"
        strokeWidth={0.8}
        className="radar-shape"
      />
      {axes.map((ax, i) => {
        const [x, y] = pt(i, R + 8)
        return (
          <text key={i} x={x} y={y} textAnchor="middle" className="radar-label">
            {ax.label}
          </text>
        )
      })}
    </svg>
  )
}

export function ProgressRing({
  value,
  label,
  caption,
  color = 'var(--primary)',
  size = 118,
}: {
  value: number
  label: string
  caption?: string
  color?: string
  size?: number
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  // SVG 圆环：挂载时从 0 扫描到目标值
  const r = 42
  const c = 2 * Math.PI * r
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const offset = drawn ? c * (1 - pct / 100) : c

  return (
    <div className="progress-ring" style={{ width: size, height: size }} aria-label={`${label} ${pct}%`}>
      <svg viewBox="0 0 100 100" className="progress-ring-svg">
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={9} />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="progress-ring-arc"
        />
      </svg>
      <div className="progress-ring-core">
        <b><CountUp target={pct} />%</b>
        <span>{label}</span>
      </div>
      {caption && <small>{caption}</small>}
    </div>
  )
}

export function SpectrumBars({
  values,
  compact = false,
}: {
  values: { label: string; value: number; color?: string }[]
  compact?: boolean
}) {
  const max = Math.max(1, ...values.map((item) => item.value))

  return (
    <div className={`spectrum-bars ${compact ? 'compact' : ''}`} aria-label="声谱数据条">
      {values.map((item, index) => {
        const height = Math.max(12, Math.round((item.value / max) * 100))
        const style = {
          '--bar-height': `${height}%`,
          '--bar-color': item.color ?? 'var(--primary)',
          animationDelay: `${index * 60}ms`,
        } as CSSProperties
        return (
          <div key={`${item.label}-${index}`} className="spectrum-bar-wrap">
            <span className="spectrum-bar" style={style} title={`${item.label}: ${item.value}`} />
            <small>{item.label}</small>
          </div>
        )
      })}
    </div>
  )
}
