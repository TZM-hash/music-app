// 游戏化进度：星级、解锁、练习记录，持久化到 localStorage
import { addSession, getCurrentStudentId } from './students'

const KEY = 'music-edu-progress-v1'

export interface GameProgress {
  /** 各游戏各关卡的最高星数：{ [gameId]: { [level]: stars } } */
  stars: Record<string, Record<number, number>>
  /** 各游戏最高分 */
  bestScores: Record<string, number>
  /** 累计练习次数 */
  playCount: number
  /** 获得的成就徽章 id 列表 */
  badges: string[]
}

const empty: GameProgress = { stars: {}, bestScores: {}, playCount: 0, badges: [] }

export function loadProgress(): GameProgress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...empty }
    return { ...empty, ...JSON.parse(raw) }
  } catch {
    return { ...empty }
  }
}

export function saveProgress(p: GameProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* 忽略存储失败 */
  }
}

/** 记录一次游戏结果，返回更新后的进度以及是否刷新纪录 */
export function recordResult(
  gameId: string,
  level: number,
  stars: number,
  score: number,
  extra?: { accuracy?: number; songId?: string }
): { progress: GameProgress; isNewBest: boolean; newBadges: string[] } {
  const p = loadProgress()
  p.playCount += 1

  if (!p.stars[gameId]) p.stars[gameId] = {}
  const prevStars = p.stars[gameId][level] ?? 0
  if (stars > prevStars) p.stars[gameId][level] = stars

  const prevBest = p.bestScores[gameId] ?? 0
  const isNewBest = score > prevBest
  if (isNewBest) p.bestScores[gameId] = score

  // 简单成就判定
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

  saveProgress(p)

  // 若已选择当前学生，记录一条按学生的练习会话
  const studentId = getCurrentStudentId()
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
