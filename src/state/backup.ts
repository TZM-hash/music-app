const BACKUP_APP = 'music-edu-app'
const BACKUP_VERSION = 1

const BACKUP_KEYS = [
  'music-edu-roster-v1',
  'music-edu-sessions-v1',
  'music-edu-progress-v1',
  'music-edu-progress-by-student-v1',
  'music-edu-custom-songs-v1',
  'music-edu-mixer-projects-v1',
  'music-edu-prefs-v1',
  'music-edu-piano-prefs-v1',
  'music-edu-theory-review-v1',
  'music-edu-creative-works-v1',
  'music-edu-ui-sound-v1',
]

interface ClassroomBackup {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  data: Record<string, string | null>
}

export function exportClassroomBackup(): string {
  const data: Record<string, string | null> = {}
  for (const key of BACKUP_KEYS) data[key] = localStorage.getItem(key)
  const backup: ClassroomBackup = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
  return JSON.stringify(backup, null, 2)
}

export function importClassroomBackup(text: string): { ok: boolean; message: string } {
  try {
    const backup = JSON.parse(text) as Partial<ClassroomBackup>
    if (backup.app !== BACKUP_APP || !backup.data || typeof backup.data !== 'object') {
      return { ok: false, message: '这不是有效的乐动课堂备份文件。' }
    }

    for (const key of BACKUP_KEYS) {
      const raw = backup.data[key]
      if (raw == null) {
        localStorage.removeItem(key)
        continue
      }
      JSON.parse(raw)
      localStorage.setItem(key, raw)
    }
    return { ok: true, message: '已导入课堂数据，可以继续选择学生练习。' }
  } catch {
    return { ok: false, message: '导入失败，请确认文件没有被修改或损坏。' }
  }
}
