import type { MusicAbilityId } from './musicAbilities'

export type CreativeWorkSource = 'mixer' | 'theory' | 'library' | 'other'

export interface CreativeWork {
  id: string
  title: string
  source: CreativeWorkSource
  studentId: string | null
  summary: string
  reflection: string
  abilityTags: MusicAbilityId[]
  snapshot: unknown
  createdAt: number
}

export interface CreativeWorkDraft {
  title: string
  source: CreativeWorkSource
  studentId?: string | null
  summary: string
  reflection?: string
  abilityTags?: MusicAbilityId[]
  snapshot: unknown
}

export interface CreativePortfolioChip<T extends string> {
  id: T
  label: string
  count: number
}

export interface CreativePortfolioSourceChip {
  source: CreativeWorkSource
  label: string
  count: number
}

export interface CreativePortfolioSummary {
  totalWorks: number
  featuredWork: CreativeWork | null
  latestWorks: CreativeWork[]
  abilityChips: CreativePortfolioChip<MusicAbilityId>[]
  sourceChips: CreativePortfolioSourceChip[]
  headline: string
}

const STORE_KEY = 'music-edu-creative-works-v1'
const MAX_WORKS = 24

const ABILITY_LABELS: Record<MusicAbilityId, string> = {
  listening: '听感力',
  rhythm: '节奏力',
  reading: '读谱力',
  singing: '演唱音准',
  creating: '创作表达',
}

const SOURCE_LABELS: Record<CreativeWorkSource, string> = {
  mixer: '混音创作',
  theory: '探索发现',
  library: '素材灵感',
  other: '音乐记录',
}

function readAll(): CreativeWork[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(list: CreativeWork[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export function createCreativeWork(
  draft: CreativeWorkDraft,
  createdAt = Date.now(),
  sequence = 0
): CreativeWork {
  return {
    id: `work-${createdAt}-${sequence}`,
    title: draft.title.trim() || '我的音乐作品',
    source: draft.source,
    studentId: draft.studentId ?? null,
    summary: draft.summary,
    reflection: draft.reflection?.trim() ?? '',
    abilityTags: draft.abilityTags && draft.abilityTags.length > 0 ? draft.abilityTags : ['creating'],
    snapshot: draft.snapshot,
    createdAt,
  }
}

export function addCreativeWorkToList(
  existing: CreativeWork[],
  work: CreativeWork,
  limit = MAX_WORKS
): CreativeWork[] {
  return [work, ...existing.filter((item) => item.id !== work.id)].slice(0, limit)
}

export function buildCreativePortfolio(
  works: CreativeWork[],
  latestLimit = 3
): CreativePortfolioSummary {
  const latestWorks = [...works].sort((a, b) => b.createdAt - a.createdAt).slice(0, latestLimit)
  const abilityStats = new Map<MusicAbilityId, { count: number; latestAt: number }>()
  const sourceStats = new Map<CreativeWorkSource, { count: number; latestAt: number }>()

  for (const work of works) {
    const source = sourceStats.get(work.source) ?? { count: 0, latestAt: 0 }
    sourceStats.set(work.source, {
      count: source.count + 1,
      latestAt: Math.max(source.latestAt, work.createdAt),
    })
    for (const ability of work.abilityTags) {
      const stat = abilityStats.get(ability) ?? { count: 0, latestAt: 0 }
      abilityStats.set(ability, {
        count: stat.count + 1,
        latestAt: Math.max(stat.latestAt, work.createdAt),
      })
    }
  }

  const totalWorks = works.length

  return {
    totalWorks,
    featuredWork: latestWorks[0] ?? null,
    latestWorks,
    abilityChips: Array.from(abilityStats, ([id, stat]) => ({
      id,
      label: ABILITY_LABELS[id],
      count: stat.count,
      latestAt: stat.latestAt,
    }))
      .sort((a, b) => b.count - a.count || b.latestAt - a.latestAt)
      .map(({ latestAt: _latestAt, ...chip }) => chip),
    sourceChips: Array.from(sourceStats, ([source, stat]) => ({
      source,
      label: SOURCE_LABELS[source],
      count: stat.count,
      latestAt: stat.latestAt,
    }))
      .sort((a, b) => b.count - a.count || b.latestAt - a.latestAt)
      .map(({ latestAt: _latestAt, ...chip }) => chip),
    headline:
      totalWorks === 0
        ? '从第一段音乐作品开始，把听到的灵感留下来。'
        : `已经留下 ${totalWorks} 个音乐作品，最近的想法可以继续长大。`,
  }
}

export function loadCreativeWorks(studentId?: string | null): CreativeWork[] {
  const list = readAll()
  if (studentId === undefined) return list
  return list.filter((work) => work.studentId === (studentId ?? null))
}

export function saveCreativeWork(draft: CreativeWorkDraft): CreativeWork {
  const all = readAll()
  const work = createCreativeWork(draft, Date.now(), all.length + 1)
  const next = addCreativeWorkToList(all, work)
  writeAll(next)
  return work
}

export function removeCreativeWork(id: string): void {
  writeAll(readAll().filter((work) => work.id !== id))
}
