// 统计分析：为数据看板计算各类聚合指标
import { loadRoster, loadSessions, sessionsOf, Session, Student } from './students'

export const GAME_META: Record<string, { name: string; icon: string; skill: string }> = {
  'game-taiko': { name: '咚咔鼓手', icon: '🥁', skill: '律动' },
  'game-sing': { name: '唱歌评分', icon: '🎤', skill: '演唱' },
  'game-ear': { name: '听音辨调', icon: '👂', skill: '音准' },
  'game-read': { name: '识谱训练', icon: '🎼', skill: '识谱' },
}

export interface StudentStat {
  student: Student
  totalSessions: number
  totalStars: number
  avgAccuracy: number
  bestScore: number
  /** 各游戏平均正确率，用于雷达图 */
  skillByGame: Record<string, number>
}

export function studentStat(studentId: string): StudentStat | null {
  const roster = loadRoster()
  const student = roster.find((s) => s.id === studentId)
  if (!student) return null
  const sessions = sessionsOf(studentId)
  return buildStat(student, sessions)
}

function buildStat(student: Student, sessions: Session[]): StudentStat {
  const totalSessions = sessions.length
  const totalStars = sessions.reduce((a, s) => a + s.stars, 0)
  const avgAccuracy =
    totalSessions === 0 ? 0 : sessions.reduce((a, s) => a + s.accuracy, 0) / totalSessions
  const bestScore = sessions.reduce((a, s) => Math.max(a, s.score), 0)

  const skillByGame: Record<string, number> = {}
  for (const gameId of Object.keys(GAME_META)) {
    const gs = sessions.filter((s) => s.gameId === gameId)
    skillByGame[gameId] =
      gs.length === 0 ? 0 : gs.reduce((a, s) => a + s.accuracy, 0) / gs.length
  }
  return { student, totalSessions, totalStars, avgAccuracy, bestScore, skillByGame }
}

/** 全班统计（按总星数排序，用于排行榜） */
export function classStats(): StudentStat[] {
  const roster = loadRoster()
  const sessions = loadSessions()
  return roster
    .map((stu) => buildStat(stu, sessions.filter((s) => s.studentId === stu.id)))
    .sort((a, b) => b.totalStars - a.totalStars || b.bestScore - a.bestScore)
}

export interface ClassOverview {
  studentCount: number
  totalSessions: number
  totalStars: number
  avgAccuracy: number
  /** 各游戏被玩的次数 */
  sessionsByGame: Record<string, number>
  /** 练习趋势：按会话序号分桶的累计次数 */
  trend: { label: string; count: number }[]
}

export function classOverview(): ClassOverview {
  const roster = loadRoster()
  const sessions = loadSessions()
  const totalStars = sessions.reduce((a, s) => a + s.stars, 0)
  const avgAccuracy =
    sessions.length === 0 ? 0 : sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length

  const sessionsByGame: Record<string, number> = {}
  for (const g of Object.keys(GAME_META)) {
    sessionsByGame[g] = sessions.filter((s) => s.gameId === g).length
  }

  // 趋势：把会话按序分成最多 8 段
  const buckets = 8
  const trend: { label: string; count: number }[] = []
  if (sessions.length > 0) {
    const per = Math.max(1, Math.ceil(sessions.length / buckets))
    for (let i = 0; i < sessions.length; i += per) {
      const slice = sessions.slice(i, i + per)
      trend.push({ label: `#${i + 1}`, count: slice.length })
    }
  }

  return {
    studentCount: roster.length,
    totalSessions: sessions.length,
    totalStars,
    avgAccuracy,
    sessionsByGame,
    trend,
  }
}
