// 曲库聚合：内置 + 自定义曲目的读写
import { BUILTIN_SONGS, Song, MelodyNote } from './songs'

const CUSTOM_KEY = 'music-edu-custom-songs-v1'

export function loadCustomSongs(): Song[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Song[]
  } catch {
    return []
  }
}

function saveCustomSongs(songs: Song[]): void {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(songs))
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

