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

const empty: GameProgress = { stars: {}, bestScores: {}, playCount: 0, badges: [] }

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

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
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

export function loadProgressStore(): ProgressStore {
  const scoped = readJson<Record<string, Partial<GameProgress>> | null>(STORE_KEY, null)
  if (scoped && typeof scoped === 'object') {
    const store: ProgressStore = {}
    for (const [studentId, progress] of Object.entries(scoped)) {
      store[studentId] = normalizeProgress(progress)
    }
    return store
  }

  const legacy = readJson<Partial<GameProgress> | null>(LEGACY_KEY, null)
  if (!legacy) return {}

  const migrated = { [ANONYMOUS_SCOPE]: normalizeProgress(legacy) }
  writeJson(STORE_KEY, migrated)
  return migrated
}

export function saveProgressStore(store: ProgressStore): boolean {
  return writeJson(STORE_KEY, store)
}

export function loadProgress(studentId?: string | null): GameProgress {
  const store = loadProgressStore()
  return normalizeProgress(store[currentScope(studentId)] ?? empty)
}

export function saveProgress(p: GameProgress, studentId?: string | null): void {
  const store = loadProgressStore()
  store[currentScope(studentId)] = normalizeProgress(p)
  writeJson(STORE_KEY, store)
}

export function removeStudentProgress(studentId: string): void {
  const store = loadProgressStore()
  delete store[studentId]
  writeJson(STORE_KEY, store)
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
