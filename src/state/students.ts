// 班级与学生数据层：名册、按学生的练习会话、成就
import { removeStudentProgress } from './progress'
import { removeStudentReviewBook } from './theoryReview'
import { removeStudentCreativeWorks } from './creativeWorks'
import { removeStudentDiscoveries } from './discoveries'
import type { PrimaryGrade, Semester } from '../music/zhejiangCurriculum'

const ROSTER_KEY = 'music-edu-roster-v1'
const SESSIONS_KEY = 'music-edu-sessions-v1'
const CURRENT_KEY = 'music-edu-current-student-v1'
const DEFAULT_CLASS_NAME = '一班'

function normalizeClassName(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : DEFAULT_CLASS_NAME
}

export interface Student {
  id: string
  name: string
  avatar: string // emoji
  createdAt: number
  /** 浙江人音版小学教材定位；旧名册可能没有这两个字段 */
  grade?: PrimaryGrade
  semester?: Semester
  /** 班级名称；旧名册没有该字段时按一班兼容 */
  className?: string
}

export interface StudentCurriculumProfile {
  grade?: PrimaryGrade
  semester?: Semester
  className?: string
}

// 一次游戏练习会话
export interface Session {
  id: string
  studentId: string
  gameId: string // 'game-ear' | 'game-taiko' 等
  songId?: string
  level: number
  score: number
  stars: number
  accuracy: number // 0..1
  /** 逻辑时间戳（自增序号，避免使用 Date.now） */
  seq: number
}

const AVATARS = ['🦁', '🐯', '🐼', '🦊', '🐰', '🐨', '🐸', '🐵', '🦄', '🐢', '🐧', '🐙']

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

// —— 名册 ——
const ROSTER_INIT_KEY = 'music-edu-roster-initialized-v1'

export function loadRoster(): Student[] {
  const list = read<Student[]>(ROSTER_KEY, [])
  // 仅在「从未初始化过」时注入示例学生；老师删光后名册保持为空，不再复活
  if (list.length === 0 && !read<boolean>(ROSTER_INIT_KEY, false)) {
    const demo = seedStudents()
    write(ROSTER_KEY, demo)
    write(ROSTER_INIT_KEY, true)
    return demo
  }
  return list
}

let idCounter = 0
function nextId(prefix: string): string {
  // 基于「现有数据中最大序号 + 自增计数」生成，删除记录后再新增也不会撞号
  idCounter += 1
  return `${prefix}-${maxSeq(prefix) + idCounter}`
}
// 扫描现有 id 中该前缀的最大序号（兼容 stu-seed-N 等旧格式）
function maxSeq(prefix: string): number {
  const re = new RegExp(`^${prefix}-(?:seed-)?(\\d+)$`)
  let max = 0
  const scan = (list: { id: string }[]) => {
    for (const item of list) {
      const m = re.exec(item.id)
      if (m) max = Math.max(max, parseInt(m[1], 10))
    }
  }
  scan(read<Student[]>(ROSTER_KEY, []))
  scan(read<Session[]>(SESSIONS_KEY, []))
  return max
}

function seedStudents(): Student[] {
  const names = ['小明', '小红', '小刚', '小美']
  return names.map((name, i) => ({
    id: `stu-seed-${i + 1}`,
    name,
    avatar: AVATARS[i % AVATARS.length],
    createdAt: i,
    grade: (i % 6) + 1 as PrimaryGrade,
    semester: 1 as Semester,
    className: i < 2 ? '一班' : '二班',
  }))
}

export function addStudent(name: string, avatar?: string, profile?: StudentCurriculumProfile): Student {
  const list = loadRoster()
  const student: Student = {
    id: nextId('stu'),
    name: name.trim() || '新同学',
    avatar: avatar || AVATARS[list.length % AVATARS.length],
    createdAt: list.length,
    // 新同学先落在小学中段，老师可在名册中调整到实际册次。
    grade: profile?.grade ?? 3,
    semester: profile?.semester ?? 1,
    className: normalizeClassName(profile?.className ?? DEFAULT_CLASS_NAME),
  }
  list.push(student)
  write(ROSTER_KEY, list)
  return student
}

function isPrimaryGrade(value: unknown): value is PrimaryGrade {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6
}

function isSemester(value: unknown): value is Semester {
  return value === 1 || value === 2
}

function isClassName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 24
}

export function updateStudentProfile(id: string, profile: StudentCurriculumProfile): Student | null {
  const list = loadRoster()
  const index = list.findIndex((student) => student.id === id)
  if (index < 0) return null

  const current = list[index]
  const next: Student = { ...current }
  if (profile.grade !== undefined && isPrimaryGrade(profile.grade)) next.grade = profile.grade
  if (profile.semester !== undefined && isSemester(profile.semester)) next.semester = profile.semester
  if (profile.className !== undefined && isClassName(profile.className)) next.className = profile.className.trim()
  list[index] = next
  write(ROSTER_KEY, list)
  return next
}

export function removeStudent(id: string): void {
  write(ROSTER_KEY, loadRoster().filter((s) => s.id !== id))
  write(SESSIONS_KEY, loadSessions().filter((s) => s.studentId !== id))
  if (getCurrentStudentId() === id) setCurrentStudentId(null)
  // 级联清理该学生的全部数据：进度、错题本、创意作品，避免残留和备份带回
  removeStudentProgress(id)
  removeStudentReviewBook(id)
  removeStudentCreativeWorks(id)
  removeStudentDiscoveries(id)
}

export function randomAvatar(index: number): string {
  return AVATARS[index % AVATARS.length]
}
export const AVATAR_CHOICES = AVATARS

// —— 当前学生 ——
export function getCurrentStudentId(): string | null {
  return read<string | null>(CURRENT_KEY, null)
}
export function setCurrentStudentId(id: string | null): void {
  write(CURRENT_KEY, id)
}
export function getCurrentStudent(): Student | null {
  const id = getCurrentStudentId()
  if (!id) return null
  return loadRoster().find((s) => s.id === id) ?? null
}

/** 在给定名册中按 id 查找学生；id 为空或未命中时返回 null（纯函数，便于测试与复用） */
export function findStudentById(roster: Student[], id: string | null): Student | null {
  if (!id) return null
  return roster.find((s) => s.id === id) ?? null
}

// —— 会话记录 ——
export function loadSessions(): Session[] {
  return read<Session[]>(SESSIONS_KEY, [])
}

export function addSession(s: Omit<Session, 'id' | 'seq'>): Session {
  const all = loadSessions()
  // 取现有最大 seq + 1，删除会话后再新增也不会撞号
  const seq = all.reduce((max, x) => Math.max(max, x.seq), 0) + 1
  const session: Session = { ...s, id: `sess-${seq}`, seq }
  all.push(session)
  write(SESSIONS_KEY, all)
  return session
}

export function sessionsOf(studentId: string): Session[] {
  return loadSessions().filter((s) => s.studentId === studentId)
}
