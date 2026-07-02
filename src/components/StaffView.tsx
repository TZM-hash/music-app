// 纯 SVG 五线谱 / 简谱渲染（高音谱号，支持时值/升号/附加线/小节线）
import { MelodyNote } from '../music/songs'
import './staff.css'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const JIANPU: Record<string, string> = {
  C: '1', D: '2', E: '3', F: '4', G: '5', A: '6', B: '7',
}

function parseNote(note: string): { midi: number; letter: string; sharp: boolean; octave: number } | null {
  const m = /^([A-G])(#?)(-?\d)$/.exec(note)
  if (!m) return null
  const letter = m[1]
  const sharp = m[2] === '#'
  const octave = parseInt(m[3], 10)
  const idx = NOTE_NAMES.indexOf(letter + m[2])
  const midi = (octave + 1) * 12 + idx
  return { midi, letter, sharp, octave }
}

// 五线谱上"音级位置"：以 E4(谱表最下线)为 0，每个字母台阶 +1（不含升降，升号单独画）
const LETTER_STEP: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }
function diatonicStep(letter: string, octave: number): number {
  return octave * 7 + LETTER_STEP[letter]
}
// E4 作为基准线（高音谱号最下面那条线）
const BASE_STEP = diatonicStep('E', 4)

interface Props {
  melody: MelodyNote[]
  /** 显示模式 */
  mode?: 'staff' | 'jianpu'
  /** 每行最多几个音（超出换行） */
  perLine?: number
  /** 当前高亮的音符索引 */
  highlightIndex?: number
  beatsPerBar?: number
}

export default function StaffView({
  melody,
  mode = 'staff',
  perLine = 16,
  highlightIndex = -1,
  beatsPerBar = 4,
}: Props) {
  if (mode === 'jianpu') {
    return <JianpuView melody={melody} highlightIndex={highlightIndex} beatsPerBar={beatsPerBar} />
  }

  // 布局参数
  const lineGap = 10 // 五线间距
  const staffH = lineGap * 4
  const topPad = 46 // 上方留白（给高附加线）
  const botPad = 40
  const rowH = topPad + staffH + botPad
  const noteSpacing = 40
  const leftPad = 60

  // 分行
  const rows: MelodyNote[][] = []
  for (let i = 0; i < melody.length; i += perLine) rows.push(melody.slice(i, i + perLine))

  const width = leftPad + perLine * noteSpacing + 30

  return (
    <div className="staff-view">
      {rows.map((row, rowIdx) => {
        const rowStartIndex = rowIdx * perLine
        return (
          <svg
            key={rowIdx}
            className="staff-svg"
            viewBox={`0 0 ${width} ${rowH}`}
            preserveAspectRatio="xMinYMid meet"
          >
            {/* 五条线 */}
            {[0, 1, 2, 3, 4].map((l) => {
              const y = topPad + l * lineGap
              return (
                <line
                  key={l}
                  x1={10}
                  y1={y}
                  x2={width - 10}
                  y2={y}
                  className="staff-line"
                />
              )
            })}
            {/* 高音谱号 */}
            <text x={16} y={topPad + staffH - 2} className="clef">
              𝄞
            </text>

            {/* 音符 */}
            {row.map((mn, i) => {
              const x = leftPad + i * noteSpacing
              const globalIdx = rowStartIndex + i
              const hl = globalIdx === highlightIndex
              if (mn.note === 'rest') {
                return (
                  <text key={i} x={x} y={topPad + staffH / 2 + 6} className="rest-glyph">
                    𝄽
                  </text>
                )
              }
              const p = parseNote(mn.note)
              if (!p) return null
              // 该音相对基准线（E4）的台阶数；每台阶 = 半个 lineGap，向上为负
              const step = diatonicStep(p.letter, p.octave) - BASE_STEP
              const y = topPad + staffH - (step * lineGap) / 2
              const filled = mn.beats < 2 // 二分及以上空心
              const stemUp = step < 4
              return (
                <g key={i} className={hl ? 'note-hl' : ''}>
                  {/* 附加线 */}
                  {renderLedgerLines(step, x, topPad, staffH, lineGap)}
                  {/* 升号 */}
                  {p.sharp && (
                    <text x={x - 16} y={y + 5} className="accidental">
                      ♯
                    </text>
                  )}
                  {/* 符头 */}
                  <ellipse
                    cx={x}
                    cy={y}
                    rx={6.5}
                    ry={5}
                    className={`note-head ${filled ? 'filled' : 'hollow'} ${hl ? 'hl' : ''}`}
                    transform={`rotate(-20 ${x} ${y})`}
                  />
                  {/* 符干 */}
                  {mn.beats < 4 && (
                    <line
                      x1={stemUp ? x + 6 : x - 6}
                      y1={y}
                      x2={stemUp ? x + 6 : x - 6}
                      y2={stemUp ? y - 32 : y + 32}
                      className="note-stem"
                    />
                  )}
                  {/* 八分音符符尾 */}
                  {mn.beats <= 0.5 && (
                    <path
                      d={
                        stemUp
                          ? `M ${x + 6} ${y - 32} q 10 6 8 18`
                          : `M ${x - 6} ${y + 32} q 10 -6 8 -18`
                      }
                      className="note-flag"
                    />
                  )}
                  {/* 音名标注 */}
                  <text x={x} y={topPad + staffH + 22} className="note-name-lbl">
                    {p.letter}
                  </text>
                </g>
              )
            })}
          </svg>
        )
      })}
    </div>
  )
}

function renderLedgerLines(step: number, x: number, topPad: number, staffH: number, lineGap: number) {
  const lines = []
  // 谱表下方（step<0，偶数台阶在线上）
  if (step < 0) {
    for (let s = -2; s >= step; s -= 2) {
      const y = topPad + staffH - (s * lineGap) / 2
      lines.push(<line key={`d${s}`} x1={x - 10} y1={y} x2={x + 10} y2={y} className="ledger" />)
    }
  }
  // 谱表上方（step>8）
  if (step > 8) {
    for (let s = 10; s <= step; s += 2) {
      const y = topPad + staffH - (s * lineGap) / 2
      lines.push(<line key={`u${s}`} x1={x - 10} y1={y} x2={x + 10} y2={y} className="ledger" />)
    }
  }
  return lines
}

// 简谱视图
function JianpuView({
  melody,
  highlightIndex,
  beatsPerBar,
}: {
  melody: MelodyNote[]
  highlightIndex: number
  beatsPerBar: number
}) {
  let beatAcc = 0
  return (
    <div className="jianpu-view">
      {melody.map((mn, i) => {
        const p = mn.note === 'rest' ? null : parseNote(mn.note)
        const num = mn.note === 'rest' ? '0' : p ? JIANPU[p.letter] ?? '?' : '?'
        // 高低八度点
        const octDots = p ? p.octave - 4 : 0
        // 小节线
        const before = beatAcc
        beatAcc += mn.beats
        const showBar = Math.floor(before / beatsPerBar) !== Math.floor((beatAcc - 0.001) / beatsPerBar) && i < melody.length - 1
        return (
          <span key={i} className="jianpu-cell-wrap">
            <span className={`jianpu-cell ${i === highlightIndex ? 'hl' : ''}`}>
              {p?.sharp && <sup className="jp-sharp">♯</sup>}
              <span className="jp-num">
                {octDots > 0 && <span className="jp-dot-top">{'·'.repeat(octDots)}</span>}
                {num}
                {octDots < 0 && <span className="jp-dot-bot">{'·'.repeat(-octDots)}</span>}
              </span>
              {mn.beats >= 2 && <span className="jp-dash">—</span>}
              {mn.beats <= 0.5 && <span className="jp-underline" />}
            </span>
            {showBar && <span className="jianpu-bar">|</span>}
          </span>
        )
      })}
    </div>
  )
}
