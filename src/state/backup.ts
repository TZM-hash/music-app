const BACKUP_APP = 'music-edu-app'
const BACKUP_VERSION = 1

const BACKUP_KEYS = [
  'music-edu-roster-v1',
  'music-edu-roster-initialized-v1',
  'music-edu-current-student-v1',
  'music-edu-sessions-v1',
  'music-edu-progress-v1',
  'music-edu-progress-by-student-v1',
  'music-edu-custom-songs-v1',
  'music-edu-mixer-projects-v1',
  'music-edu-prefs-v1',
  'music-edu-piano-prefs-v1',
  'music-edu-theory-review-v1',
  'music-edu-creative-works-v1',
  'music-edu-discoveries-v1',
  'music-edu-ui-sound-v1',
]

interface ClassroomBackup {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  data: Record<string, string | null>
}

export function exportClassroomBackup(): string {
  try {
    const data: Record<string, string | null> = {}
    for (const key of BACKUP_KEYS) data[key] = localStorage.getItem(key)
    const backup: ClassroomBackup = {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    }
    return JSON.stringify(backup, null, 2)
  } catch {
    // 隐私模式 / 存储被禁用 / 配额满时不让页面崩溃，返回一个空备份并说明
    return JSON.stringify(
      {
        app: BACKUP_APP,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        data: {},
        note: '浏览器禁止访问本地存储，导出内容为空。请检查浏览器隐私设置。',
      },
      null,
      2
    )
  }
}

// 每个备份 key 期望的数据形状：'array' | 'object' | 'any'（any 仅做 JSON 语法校验）
const KEY_SHAPES: Record<string, 'array' | 'object' | 'any'> = {
  'music-edu-roster-v1': 'array',
  // 「名册已初始化」标志与「当前学生」都是原始 JSON 值（布尔 / 字符串或 null），只做语法校验
  'music-edu-roster-initialized-v1': 'any',
  'music-edu-current-student-v1': 'any',
  'music-edu-sessions-v1': 'array',
  'music-edu-progress-v1': 'object',
  'music-edu-progress-by-student-v1': 'object',
  'music-edu-custom-songs-v1': 'array',
  'music-edu-mixer-projects-v1': 'array',
  'music-edu-prefs-v1': 'object',
  'music-edu-piano-prefs-v1': 'object',
  'music-edu-theory-review-v1': 'object',
  'music-edu-creative-works-v1': 'array',
  'music-edu-discoveries-v1': 'array',
  'music-edu-ui-sound-v1': 'any',
}

function shapeOk(key: string, raw: string): boolean {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return false
  }
  const shape = KEY_SHAPES[key] ?? 'any'
  if (shape === 'array') return Array.isArray(parsed)
  if (shape === 'object') return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
  return true
}

export function importClassroomBackup(text: string): { ok: boolean; message: string } {
  try {
    const backup = JSON.parse(text) as Partial<ClassroomBackup>
    if (backup.app !== BACKUP_APP || !backup.data || typeof backup.data !== 'object') {
      return { ok: false, message: '这不是有效的乐动课堂备份文件。' }
    }
    if (typeof backup.version !== 'number' || backup.version > BACKUP_VERSION) {
      return { ok: false, message: '备份文件版本较新，请升级应用后再导入。' }
    }

    // 先整体校验，再统一写入：避免导入一半失败留下半新半旧的数据
    const staged: [string, string | null][] = []
    let skipped = 0
    for (const key of BACKUP_KEYS) {
      const raw = backup.data[key]
      if (raw == null) {
        staged.push([key, null])
        continue
      }
      if (!shapeOk(key, raw)) {
        skipped++
        continue
      }
      staged.push([key, raw])
    }
    for (const [key, raw] of staged) {
      if (raw == null) localStorage.removeItem(key)
      else localStorage.setItem(key, raw)
    }
    return {
      ok: true,
      message: skipped > 0
        ? `已导入课堂数据（有 ${skipped} 项数据格式异常被跳过，不影响使用）。`
        : '已导入课堂数据，可以继续选择学生练习。',
    }
  } catch {
    return { ok: false, message: '导入失败，请确认文件没有被修改或损坏。' }
  }
}
