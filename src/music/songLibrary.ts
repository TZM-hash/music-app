// 曲库聚合：内置 + 自定义曲目的读写
import { BUILTIN_SONGS, Song, SongCategory, MelodyNote } from './songs'

const CUSTOM_KEY = 'music-edu-custom-songs-v1'

const VALID_CATEGORIES: SongCategory[] = ['nursery', 'classic', 'folk', 'festival', 'custom']

/** 校验并修复一条曲目数据；坏到无法修复的返回 null（防止脏数据让选曲页白屏） */
function sanitizeSong(raw: unknown): Song | null {
  if (typeof raw !== 'object' || raw === null) return null
  const s = raw as Partial<Song>
  if (typeof s.id !== 'string' || !s.id) return null
  if (typeof s.title !== 'string' || !s.title) return null
  if (!Array.isArray(s.melody)) return null
  const melody: MelodyNote[] = []
  for (const m of s.melody) {
    if (typeof m !== 'object' || m === null) continue
    const note = (m as MelodyNote).note
    const beats = Number((m as MelodyNote).beats)
    if (note === 'rest' || (typeof note === 'string' && /^[A-G]#?-?\d$/.test(note))) {
      if (Number.isFinite(beats) && beats > 0) melody.push({ note, beats })
    }
  }
  if (melody.length === 0) return null
  return {
    id: s.id,
    title: s.title,
    category: VALID_CATEGORIES.includes(s.category as SongCategory) ? (s.category as SongCategory) : 'custom',
    level: typeof s.level === 'number' && s.level >= 1 && s.level <= 5 ? s.level : 1,
    bpm: typeof s.bpm === 'number' && s.bpm > 0 ? s.bpm : 100,
    beatsPerBar: typeof s.beatsPerBar === 'number' && s.beatsPerBar > 0 ? s.beatsPerBar : 4,
    melody,
    custom: true,
    desc: typeof s.desc === 'string' ? s.desc : undefined,
    lyrics: typeof s.lyrics === 'string' ? s.lyrics : undefined,
    chords: Array.isArray(s.chords) ? (s.chords as Song['chords']) : undefined,
    relatedTopics: Array.isArray(s.relatedTopics) ? (s.relatedTopics as string[]) : undefined,
  }
}

export function loadCustomSongs(): Song[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(sanitizeSong).filter((s): s is Song => s !== null)
  } catch {
    return []
  }
}

function saveCustomSongs(songs: Song[]): void {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(songs))
  } catch {
    /* 存储满/隐私模式时静默失败，不崩溃 */
  }
}

export function allSongs(): Song[] {
  return [...BUILTIN_SONGS, ...loadCustomSongs()]
}

export function getSong(id: string): Song | undefined {
  return allSongs().find((s) => s.id === id)
}

/** 保存/更新一首自定义曲目，返回其 id */
export function upsertCustomSong(song: Song): string {
  const list = loadCustomSongs()
  const idx = list.findIndex((s) => s.id === song.id)
  if (idx >= 0) list[idx] = song
  else list.push(song)
  saveCustomSongs(list)
  return song.id
}

export function deleteCustomSong(id: string): void {
  saveCustomSongs(loadCustomSongs().filter((s) => s.id !== id))
}

/** 生成一个基于计数的新 id（不依赖随机数） */
export function newSongId(): string {
  const list = loadCustomSongs()
  let max = 0
  for (const s of list) {
    const m = /^custom-(\d+)$/.exec(s.id)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `custom-${max + 1}`
}

// 简谱数字 → C 大调音名
const JIANPU_TO_LETTER: Record<string, string> = {
  '1': 'C', '2': 'D', '3': 'E', '4': 'F', '5': 'G', '6': 'A', '7': 'B',
}

/**
 * 解析简谱文本为旋律。规则（尽量宽松，方便老师直接粘贴）：
 * - 1-7 为音符，0 为休止符
 * - 数字后加 . 表示升八度(高音点)，加 , 表示降八度(低音点)
 * - 数字后加 - 表示时值加倍(每个 - 多一拍)，加 _ (下划线)表示八分音符
 *   （混合写法如 1_- 视为非法时值，跳过并提示，避免静默生成 2.5 拍）
 * - 空格/换行分隔，其它字符忽略
 * 例："1 2 3 3 | 5 5 3- | 1 1 1 1"
 */
export function parseJianpu(text: string): MelodyNote[] {
  const melody: MelodyNote[] = []
  const tokens = text.replace(/[|｜]/g, ' ').split(/\s+/).filter(Boolean)
  for (const tok of tokens) {
    const m = /^([0-7])([.,]*)([-_]*)$/.exec(tok)
    if (!m) continue
    const digit = m[1]
    const octaveMarks = m[2]
    const durMarks = m[3]
    if (digit === '0') {
      melody.push({ note: 'rest', beats: 1 })
      continue
    }
    // 八分和增时线混用（如 1_-）语义矛盾，跳过该音符而不是生成奇怪时值
    if (durMarks.includes('_') && durMarks.includes('-')) continue
    const letter = JIANPU_TO_LETTER[digit]
    let octave = 4
    for (const c of octaveMarks) {
      if (c === '.') octave += 1
      else if (c === ',') octave -= 1
    }
    let beats = 1
    if (durMarks.includes('_')) beats = 0.5
    beats += (durMarks.match(/-/g)?.length ?? 0) // 每个 - 加一拍
    melody.push({ note: `${letter}${octave}`, beats })
  }
  return melody
}

