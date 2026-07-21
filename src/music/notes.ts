// 音乐基础数据：音名、唱名、颜色映射、频率等

export interface NoteInfo {
  /** 科学音高记号，如 C4 */
  note: string
  /** 音名，如 C */
  name: string
  /** 唱名，如 do */
  solfege: string
  /** 简谱数字，如 1 */
  jianpu: string
  /** 是否黑键 */
  isBlack: boolean
  /** 该音对应的可视化颜色 */
  color: string
}

// 每个音级对应的颜色（借鉴 Boomwhackers 音管配色，孩子熟悉且区分度高）
export const PITCH_COLORS: Record<string, string> = {
  C: '#E53935', // 红
  'C#': '#EF6C00',
  D: '#FB8C00', // 橙
  'D#': '#F9A825',
  E: '#FDD835', // 黄
  F: '#7CB342', // 绿
  'F#': '#26A69A',
  G: '#00ACC1', // 青
  'G#': '#1E88E5',
  A: '#3949AB', // 蓝
  'A#': '#5E35B1',
  B: '#8E24AA', // 紫
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** 十二平均律音名表（C 起始）。全项目半音计算的唯一来源，勿在别处再写一份。 */
export const PITCH_CLASSES: readonly string[] = NAMES
const SOLFEGE: Record<string, string> = {
  C: 'do',
  'C#': 'di',
  D: 're',
  'D#': 'ri',
  E: 'mi',
  F: 'fa',
  'F#': 'fi',
  G: 'sol',
  'G#': 'si',
  A: 'la',
  'A#': 'li',
  B: 'ti',
}
const JIANPU: Record<string, string> = {
  C: '1',
  'C#': '#1',
  D: '2',
  'D#': '#2',
  E: '3',
  F: '4',
  'F#': '#4',
  G: '5',
  'G#': '#5',
  A: '6',
  'A#': '#6',
  B: '7',
}

/** 生成从 startOctave 起、共 octaves 个八度的所有音（含黑键） */
export function buildNotes(startOctave = 4, octaves = 2): NoteInfo[] {
  const result: NoteInfo[] = []
  for (let o = 0; o < octaves; o++) {
    for (const name of NAMES) {
      const octave = startOctave + o
      result.push({
        note: `${name}${octave}`,
        name,
        solfege: SOLFEGE[name],
        jianpu: JIANPU[name],
        isBlack: name.includes('#'),
        color: PITCH_COLORS[name],
      })
    }
  }
  return result
}

/** 只取白键 */
export function whiteNotes(notes: NoteInfo[]): NoteInfo[] {
  return notes.filter((n) => !n.isBlack)
}

// 音阶高亮：音名集合（不含八度），用于钢琴上高亮某调式音阶
export const SCALES: Record<string, { name: string; notes: string[] }> = {
  none: { name: '关闭', notes: [] },
  cmajor: { name: 'C大调', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  gmajor: { name: 'G大调', notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] },
  aminor: { name: 'a小调', notes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  pentatonic: { name: '五声音阶(宫)', notes: ['C', 'D', 'E', 'G', 'A'] },
}

/** 音符按半音移调（支持跨八度，如 B4 + 1 = C5）。解析失败原样返回。 */
export function transposeNote(note: string, semis: number): string {
  const m = /^([A-G]#?)(-?\d)$/.exec(note)
  if (!m) return note
  const idx = NAMES.indexOf(m[1])
  if (idx < 0) return note
  const total = idx + semis
  const oct = parseInt(m[2], 10) + Math.floor(total / 12)
  return `${NAMES[((total % 12) + 12) % 12]}${oct}`
}
/** 三和弦组成音（大三 maj / 小三 min）。root 形如 C4；解析失败返回空数组。 */
export function chordNotes(root: string, quality: 'maj' | 'min'): string[] {
  const m = /^([A-G]#?)(-?\d)$/.exec(root)
  if (!m) return []
  const idx = NAMES.indexOf(m[1])
  if (idx < 0) return []
  const octave = parseInt(m[2], 10)
  const at = (semi: number) =>
    `${NAMES[(idx + semi) % 12]}${octave + Math.floor((idx + semi) / 12)}`
  return [root, at(quality === 'maj' ? 4 : 3), at(7)]
}

export const KEYBOARD_MAP: Record<string, string> = {
  a: 'C4',
  w: 'C#4',
  s: 'D4',
  e: 'D#4',
  d: 'E4',
  f: 'F4',
  t: 'F#4',
  g: 'G4',
  y: 'G#4',
  h: 'A4',
  u: 'A#4',
  j: 'B4',
  k: 'C5',
  o: 'C#5',
  l: 'D5',
  p: 'D#5',
  ';': 'E5',
}
