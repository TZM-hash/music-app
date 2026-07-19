// 班级与学生数据层：名册、按学生的练习会话、成就
const ROSTER_KEY = 'music-edu-roster-v1'
const SESSIONS_KEY = 'music-edu-sessions-v1'
const CURRENT_KEY = 'music-edu-current-student-v1'

export interface Student {
  id: string
  name: string
  avatar: string // emoji
  createdAt: number
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
export function loadRoster(): Student[] {
  const list = read<Student[]>(ROSTER_KEY, [])
  if (list.length === 0) {
    // 首次使用，注入几个示例学生方便体验
    const demo = seedStudents()
    write(ROSTER_KEY, demo)
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
  }))
}

export function addStudent(name: string, avatar?: string): Student {
  const list = loadRoster()
  const student: Student = {
    id: nextId('stu'),
    name: name.trim() || '新同学',
    avatar: avatar || AVATARS[list.length % AVATARS.length],
    createdAt: list.length,
  }
  list.push(student)
  write(ROSTER_KEY, list)
  return student
}

export function removeStudent(id: string): void {
  write(ROSTER_KEY, loadRoster().filter((s) => s.id !== id))
  write(SESSIONS_KEY, loadSessions().filter((s) => s.studentId !== id))
  if (getCurrentStudentId() === id) setCurrentStudentId(null)
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
