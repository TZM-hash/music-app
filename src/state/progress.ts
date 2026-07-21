// 游戏化进度：按学生隔离保存星级、最高分和徽章。
import { addSession, getCurrentStudentId } from './students'

const LEGACY_KEY = 'music-edu-progress-v1'
const STORE_KEY = 'music-edu-progress-by-student-v1'
const ANONYMOUS_SCOPE = '__anonymous__'

export interface GameProgress {
  /** 各游戏各关卡的最高星数：{ [gameId]: { [level]: stars } } */
  stars: Record<string, Record<number, number>>
  /** 各游戏最高分 */
  bestScores: Record<string, number>
  /** 累计练习次数 */
  playCount: number
  /** 已获得的成就徽章 id 列表 */
  badges: string[]
}

export type ProgressStore = Record<string, GameProgress>

function blankProgress(): GameProgress {
  return { stars: {}, bestScores: {}, playCount: 0, badges: [] }
}

function normalizeProgress(value: Partial<GameProgress> | null | undefined): GameProgress {
  if (!value || typeof value !== 'object') return blankProgress()
  return {
    stars: value.stars && typeof value.stars === 'object' ? value.stars : {},
    bestScores:
      value.bestScores && typeof value.bestScores === 'object' ? value.bestScores : {},
    playCount: Number.isFinite(value.playCount) ? Number(value.playCount) : 0,
    badges: Array.isArray(value.badges) ? value.badges.filter(Boolean) : [],
  }
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function currentScope(studentId = getCurrentStudentId()): string {
  return studentId || ANONYMOUS_SCOPE
}

// —— 内存缓存 ——
// 进度 store 随学生数增长，每次 recordResult/loadProgress 都全量 JSON.parse 浪费明显。
// 缓存「原始字符串 + 解析结果」：localStorage 里的字符串没变就直接复用解析结果；
// 备份导入等外部写入会改变字符串，比较时自动失效，无需手动清缓存。
let cachedRaw: string | null | undefined = undefined // undefined = 尚未加载
let cachedStore: ProgressStore | null = null

export function loadProgressStore(): ProgressStore {
  const raw = readRaw(STORE_KEY)
  if (cachedStore && raw === cachedRaw) return cachedStore

  if (raw) {
    let scoped: Record<string, Partial<GameProgress>> | null = null
    try {
      scoped = JSON.parse(raw) as Record<string, Partial<GameProgress>> | null
    } catch {
      scoped = null
    }
    if (scoped && typeof scoped === 'object') {
      const store: ProgressStore = {}
      for (const [studentId, progress] of Object.entries(scoped)) {
        store[studentId] = normalizeProgress(progress)
      }
      // 新 store 已存在：把历史遗留的 legacy 数据清掉，防止"清空后复活"
      removeLegacyKey()
      cachedRaw = raw
      cachedStore = store
      return store
    }
  }

  // 无新 store：尝试从 legacy 迁移
  let legacy: Partial<GameProgress> | null = null
  try {
    const legacyRaw = localStorage.getItem(LEGACY_KEY)
    legacy = legacyRaw ? (JSON.parse(legacyRaw) as Partial<GameProgress>) : null
  } catch {
    legacy = null
  }
  if (!legacy) {
    cachedRaw = raw
    cachedStore = {}
    return cachedStore
  }

  const migrated = { [ANONYMOUS_SCOPE]: normalizeProgress(legacy) }
  writeJson(STORE_KEY, migrated)
  // 迁移完成后删除 legacy key，避免下次又从旧数据复活
  removeLegacyKey()
  cachedRaw = readRaw(STORE_KEY)
  cachedStore = migrated
  return migrated
}

function removeLegacyKey(): void {
  try {
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* ignore */
  }
}

export function saveProgressStore(store: ProgressStore): boolean {
  const ok = writeJson(STORE_KEY, store)
  if (ok) {
    cachedStore = store
    cachedRaw = readRaw(STORE_KEY)
  }
  return ok
}

export function loadProgress(studentId?: string | null): GameProgress {
  const store = loadProgressStore()
  const scope = currentScope(studentId)
  // 无记录时返回全新对象，避免调用方修改到共享的 empty 常量
  return store[scope] ? normalizeProgress(store[scope]) : blankProgress()
}

export function saveProgress(p: GameProgress, studentId?: string | null): void {
  const store = loadProgressStore()
  store[currentScope(studentId)] = normalizeProgress(p)
  saveProgressStore(store)
}

export function removeStudentProgress(studentId: string): void {
  const store = loadProgressStore()
  delete store[studentId]
  saveProgressStore(store)
}

/** 记录一次游戏结果，返回更新后的进度以及是否刷新纪录 */
export function recordResult(
  gameId: string,
  level: number,
  stars: number,
  score: number,
  extra?: { accuracy?: number; songId?: string }
): { progress: GameProgress; isNewBest: boolean; newBadges: string[] } {
  const studentId = getCurrentStudentId()
  const p = loadProgress(studentId)
  p.playCount += 1

  if (!p.stars[gameId]) p.stars[gameId] = {}
  const prevStars = p.stars[gameId][level] ?? 0
  if (stars > prevStars) p.stars[gameId][level] = stars

  const prevBest = p.bestScores[gameId] ?? 0
  const isNewBest = score > prevBest
  if (isNewBest) p.bestScores[gameId] = score

  const newBadges: string[] = []
  const totalStars = Object.values(p.stars).reduce(
    (sum, levels) => sum + Object.values(levels).reduce((a, b) => a + b, 0),
    0
  )
  const grant = (id: string) => {
    if (!p.badges.includes(id)) {
      p.badges.push(id)
      newBadges.push(id)
    }
  }
  if (p.playCount >= 1) grant('first-play')
  if (stars === 3) grant('perfect')
  if (totalStars >= 10) grant('star-10')
  if (p.playCount >= 20) grant('diligent')

  saveProgress(p, studentId)

  if (studentId) {
    addSession({
      studentId,
      gameId,
      songId: extra?.songId,
      level,
      score,
      stars,
      accuracy: extra?.accuracy ?? (stars >= 3 ? 1 : stars >= 2 ? 0.75 : stars >= 1 ? 0.5 : 0.25),
    })
  }

  return { progress: p, isNewBest, newBadges }
}

export const BADGE_INFO: Record<string, { name: string; icon: string }> = {
  'first-play': { name: '初次登台', icon: '🎵' },
  perfect: { name: '完美演奏', icon: '⭐' },
  'star-10': { name: '十星达人', icon: '🌟' },
  diligent: { name: '勤学不辍', icon: '🏆' },
  composer: { name: '小小作曲家', icon: '✏️' },
}
