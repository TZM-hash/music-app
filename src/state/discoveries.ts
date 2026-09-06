import type { PrimaryGrade, Semester } from '../music/zhejiangCurriculum'
import type { ExplorationPath } from '../music/explorationUnits'
import { normalizeToolNotes, type MusicDiscoveryToolNote } from '../music/explorationTools'

export type DiscoverySource = 'textbook' | 'extension'

export interface MusicDiscovery {
  id: string
  studentId: string | null
  topicId: string
  title: string
  statement: string
  source: DiscoverySource
  grade?: PrimaryGrade
  semester?: Semester
  unitId?: string
  unitTitle?: string
  path?: ExplorationPath
  firstFeeling?: string
  evidence?: string[]
  concepts?: string[]
  cultureOpened?: boolean
  relistenChoice?: string
  relistenReflection?: string
  toolNotes?: MusicDiscoveryToolNote[]
  tags: string[]
  createdAt: number
}

export interface MusicDiscoveryDraft {
  studentId?: string | null
  topicId: string
  title: string
  statement: string
  source?: DiscoverySource
  grade?: PrimaryGrade
  semester?: Semester
  unitId?: string
  unitTitle?: string
  path?: ExplorationPath
  firstFeeling?: string
  evidence?: string[]
  concepts?: string[]
  cultureOpened?: boolean
  relistenChoice?: string
  relistenReflection?: string
  toolNotes?: MusicDiscoveryToolNote[]
  tags?: string[]
}

export interface DiscoverySummary {
  total: number
  latest: MusicDiscovery[]
  headline: string
}

export const DISCOVERY_STORE_KEY = 'music-edu-discoveries-v1'
const MAX_DISCOVERIES = 60

function readAll(): MusicDiscovery[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(DISCOVERY_STORE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is MusicDiscovery => {
      return Boolean(
        item &&
        typeof item.id === 'string' &&
        typeof item.topicId === 'string' &&
        typeof item.title === 'string' &&
        typeof item.statement === 'string' &&
        typeof item.createdAt === 'number'
      )
    })
  } catch {
    return []
  }
}

function writeAll(list: MusicDiscovery[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(DISCOVERY_STORE_KEY, JSON.stringify(list))
  } catch {
    /* ignore storage quota/private mode errors */
  }
}

function nextSequence(list: MusicDiscovery[]): number {
  let max = 0
  for (const item of list) {
    const match = /^discovery-\d+-(\d+)$/.exec(item.id)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return max + 1
}

function sortLatest(list: MusicDiscovery[]): MusicDiscovery[] {
  return [...list].sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id))
}

export function createMusicDiscovery(
  draft: MusicDiscoveryDraft,
  createdAt = Date.now(),
  sequence = 0
): MusicDiscovery {
  return {
    id: `discovery-${createdAt}-${sequence}`,
    studentId: draft.studentId ?? null,
    topicId: draft.topicId,
    title: draft.title.trim() || '我的音乐发现',
    statement: draft.statement.trim().slice(0, 160),
    source: draft.source ?? 'textbook',
    ...(draft.grade !== undefined ? { grade: draft.grade } : {}),
    ...(draft.semester !== undefined ? { semester: draft.semester } : {}),
    ...(draft.unitId ? { unitId: draft.unitId } : {}),
    ...(draft.unitTitle ? { unitTitle: draft.unitTitle } : {}),
    ...(draft.path ? { path: draft.path } : {}),
    ...(draft.firstFeeling ? { firstFeeling: draft.firstFeeling.trim().slice(0, 40) } : {}),
    evidence: Array.from(new Set((draft.evidence ?? []).filter(Boolean))).slice(0, 8),
    concepts: Array.from(new Set((draft.concepts ?? []).filter(Boolean))).slice(0, 8),
    ...(draft.cultureOpened !== undefined ? { cultureOpened: draft.cultureOpened === true } : {}),
    ...(draft.relistenChoice ? { relistenChoice: draft.relistenChoice } : {}),
    ...(draft.relistenReflection
      ? { relistenReflection: draft.relistenReflection.trim().slice(0, 160) }
      : {}),
    ...(draft.toolNotes !== undefined ? { toolNotes: normalizeToolNotes(draft.toolNotes) } : {}),
    tags: Array.from(new Set((draft.tags ?? []).filter(Boolean))).slice(0, 8),
    createdAt,
  }
}

export function addMusicDiscoveryToList(
  existing: MusicDiscovery[],
  discovery: MusicDiscovery,
  limit = MAX_DISCOVERIES
): MusicDiscovery[] {
  return sortLatest([discovery, ...existing.filter((item) => item.id !== discovery.id)]).slice(
    0,
    limit
  )
}

export function saveMusicDiscovery(
  draft: MusicDiscoveryDraft,
  createdAt = Date.now()
): MusicDiscovery {
  const existing = readAll()
  const discovery = createMusicDiscovery(draft, createdAt, nextSequence(existing))
  writeAll(addMusicDiscoveryToList(existing, discovery))
  return discovery
}

export function loadMusicDiscoveries(studentId?: string | null): MusicDiscovery[] {
  const list = sortLatest(readAll())
  if (studentId === undefined) return list
  return list.filter((item) => item.studentId === (studentId ?? null))
}

export function buildDiscoverySummary(
  discoveries: MusicDiscovery[],
  latestLimit = 3
): DiscoverySummary {
  const latest = sortLatest(discoveries).slice(0, latestLimit)
  const total = discoveries.length
  return {
    total,
    latest,
    headline:
      total === 0
        ? '完成一张探索卡，留下第一条音乐发现。'
        : `已经留下 ${total} 条音乐发现，继续把听到的变化说出来。`,
  }
}

export function removeStudentDiscoveries(studentId: string): void {
  writeAll(readAll().filter((item) => item.studentId !== studentId))
}
