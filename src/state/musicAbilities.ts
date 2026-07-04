export type MusicAbilityId = 'listening' | 'rhythm' | 'reading' | 'singing' | 'creating'
export type MusicAbilityTone = 'good' | 'warn' | 'focus'

export interface MusicAbilitySignal {
  id: MusicAbilityId
  label: string
  value: number
  tone: MusicAbilityTone
  tip: string
}

export interface AbilityReviewRow {
  label: string
  got: string
  want?: string
  ok: boolean
}

export interface AbilityReviewStat {
  label: string
  value: string
}

export interface MusicAbilityInput {
  gameId?: string
  stars: number
  score?: number
  stats?: AbilityReviewStat[]
  rows?: AbilityReviewRow[]
  advice?: string
  creativeActions?: number
}

const ABILITY_META: Record<MusicAbilityId, { label: string; tip: string }> = {
  listening: { label: '听感力', tip: '耳朵正在抓住音高、音色和和声变化。' },
  rhythm: { label: '节奏力', tip: '身体正在找到稳定的拍点和律动。' },
  reading: { label: '读谱力', tip: '谱面位置和唱名正在连成音乐路线。' },
  singing: { label: '演唱音准', tip: '声音正在靠近目标旋律和稳定音。' },
  creating: { label: '创作表达', tip: '你正在把音乐想法变成自己的作品。' },
}

const GAME_TO_ABILITY: Record<string, MusicAbilityId> = {
  'game-ear': 'listening',
  'game-taiko': 'rhythm',
  'game-read': 'reading',
  'game-sing': 'singing',
  mixer: 'creating',
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function accuracyFromRows(rows: AbilityReviewRow[] | undefined, stars: number): number {
  if (rows && rows.length > 0) {
    return rows.filter((row) => row.ok).length / rows.length
  }
  return clamp01(stars / 3)
}

function targetAbility(input: MusicAbilityInput): MusicAbilityId | null {
  if (input.gameId && GAME_TO_ABILITY[input.gameId]) return GAME_TO_ABILITY[input.gameId]
  const text = [
    input.gameId,
    input.advice,
    ...(input.stats ?? []).flatMap((item) => [item.label, item.value]),
    ...(input.rows ?? []).flatMap((item) => [item.label, item.got, item.want ?? '']),
  ].join(' ')

  if (/节奏|拍|律动|命中|连击/.test(text)) return 'rhythm'
  if (/识谱|读谱|谱|音名|线间|唱名/.test(text)) return 'reading'
  if (/唱|音准|偏高|偏低|旋律/.test(text)) return 'singing'
  if (/创|编|作品|动机|混音|四小节/.test(text)) return 'creating'
  if (/听|耳|音程|和弦|音色|音高/.test(text)) return 'listening'
  return null
}

function toneFor(value: number): MusicAbilityTone {
  if (value >= 85) return 'good'
  if (value >= 60) return 'warn'
  return 'focus'
}

export function buildMusicAbilitySignals(input: MusicAbilityInput): MusicAbilitySignal[] {
  const target = targetAbility(input)
  const accuracy = accuracyFromRows(input.rows, input.stars)
  const starBase = clamp01(0.26 + input.stars * 0.14)
  const creativeBoost =
    input.creativeActions && input.creativeActions > 0
      ? clamp01(0.58 + input.creativeActions * 0.12)
      : 0

  return (Object.keys(ABILITY_META) as MusicAbilityId[]).map((id) => {
    const targetScore = target === id ? accuracy : 0
    const creationScore = id === 'creating' ? creativeBoost : 0
    const relatedScore =
      target && target !== id
        ? starBase - (id === 'creating' ? 0.08 : 0.02)
        : starBase
    const value = Math.round(clamp01(Math.max(targetScore, creationScore, relatedScore)) * 100)
    const meta = ABILITY_META[id]
    return {
      id,
      label: meta.label,
      value,
      tone: toneFor(value),
      tip: meta.tip,
    }
  })
}
