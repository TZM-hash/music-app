import type { CSSProperties } from 'react'

// 纯 SVG / CSS 图表组件：柱状图、折线图、环形图、雷达图与课堂声谱图（无第三方依赖）

interface BarDatum {
  label: string
  value: number
  color?: string
}

export function BarChart({ data, height = 200 }: { data: BarDatum[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const barW = 100 / (data.length * 1.6)
  const gap = barW * 0.6
  const chartH = height / 2
  return (
    <svg viewBox={`0 0 100 ${chartH}`} className="chart" preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((tick) => (
        <line
          key={tick}
          x1={0}
          x2={100}
          y1={chartH - 8 - tick * (chartH - 14)}
          y2={chartH - 8 - tick * (chartH - 14)}
          className="chart-grid"
        />
      ))}
      {data.map((d, i) => {
        const h = (d.value / max) * (chartH - 14)
        const x = i * (barW + gap) + gap
        const y = chartH - h - 8
        return (
          <g key={i}>
            <rect
              className="chart-bar"
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={1.2}
              fill={d.color ?? 'var(--primary)'}
              style={{ animationDelay: `${i * 55}ms` }}
            />
            <text x={x + barW / 2} y={chartH - 1} className="chart-x" textAnchor="middle">
              {d.label}
            </text>
            <text x={x + barW / 2} y={y - 1.5} className="chart-val" textAnchor="middle">
              {d.value}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function LineChart({
  points,
  height = 160,
}: {
  points: { label: string; value: number }[]
  height?: number
}) {
  if (points.length === 0) return <div className="chart-empty">暂无数据</div>
  const max = Math.max(1, ...points.map((p) => p.value))
  const stepX = points.length > 1 ? 100 / (points.length - 1) : 100
  const H = height / 2
  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: H - 10 - (p.value / max) * (H - 18),
    label: p.label,
    value: p.value,
  }))
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ')
  const area = `${path} L100,${H - 6} L0,${H - 6} Z`
  return (
    <svg viewBox={`0 0 100 ${H}`} className="chart" preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((tick) => (
        <line
          key={tick}
          x1={0}
          x2={100}
          y1={H - 10 - tick * (H - 18)}
          y2={H - 10 - tick * (H - 18)}
          className="chart-grid"
        />
      ))}
      <path d={area} fill="var(--primary)" opacity={0.15} className="chart-area" />
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth={1.2} className="chart-line" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={1.6} fill="var(--primary)" className="chart-dot" />
          <text x={c.x} y={H - 1} className="chart-x" textAnchor="middle">
            {c.label}
          </text>
        </g>
      ))}
    </svg>
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
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
              className="donut-segment"
            />
          )
          offset += dash
          return el
        })}
        <text x={50} y={48} textAnchor="middle" className="donut-total">
          {total}
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
  const style = {
    '--ring-value': `${pct * 3.6}deg`,
    '--ring-color': color,
    width: size,
    height: size,
  } as CSSProperties

  return (
    <div className="progress-ring" style={style} aria-label={`${label} ${pct}%`}>
      <div className="progress-ring-core">
        <b>{pct}%</b>
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
