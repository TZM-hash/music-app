import { getEvidenceVariant, getSongFragment, type ExplorationCue } from './explorationAudio'

export type ExplorationToolId = 'microscope' | 'instrument' | 'rhythm'

export interface ExplorationToolReference {
  id: ExplorationToolId
  stage: 'evidence' | 'concept' | 'relisten'
  title: string
  question: string
  evidenceLabels: string[]
}

export interface InstrumentSample {
  id: string
  label: string
  instrument: string
  family: string
  texture: string
  technique: string
  cultureNote: string
  cue: ExplorationCue
}

export interface RhythmPatternStep {
  beats: number
  label: string
  accent?: boolean
}

export interface RhythmPattern {
  bpm: number
  beatsPerBar: number
  steps: RhythmPatternStep[]
  movementWords: string[]
}

export interface MusicDiscoveryToolNote {
  toolId: ExplorationToolId
  observation: string
  evidence: string[]
}

export const EXPLORATION_TOOL_CATALOG: ExplorationToolReference[] = [
  {
    id: 'microscope',
    stage: 'evidence',
    title: '音乐显微镜',
    question: '我说音乐变了，具体是哪里变了？',
    evidenceLabels: ['更连贯', '更跳跃', '旋律更平稳', '音与音之间走得更近'],
  },
  {
    id: 'instrument',
    stage: 'concept',
    title: '乐器探秘台',
    question: '我听到的声音为什么有这样的颜色？',
    evidenceLabels: ['清脆', '柔和', '明亮', '厚重', '颗粒感'],
  },
  {
    id: 'rhythm',
    stage: 'relisten',
    title: '节奏与动作工作台',
    question: '音乐怎样让我想走、跳、摇或停？',
    evidenceLabels: ['稳定拍', '停顿', '重音', '动作靠近拍点'],
  },
]

export const JASMINE_MICROSCOPE_CUES: ExplorationCue[] = getEvidenceVariant('jasmine', 'flowing')

export const JASMINE_INSTRUMENT_SAMPLES: InstrumentSample[] = [
  {
    id: 'jasmine-pipa',
    label: '清脆的弹拨样本',
    instrument: '琵琶',
    family: '弹拨乐器',
    texture: '清脆、颗粒感',
    technique: '拨弦',
    cultureNote: '弹拨乐器常用清晰的音头描画旋律轮廓。',
    cue: getSongFragment('jasmine', 0, 1)[0],
  },
  {
    id: 'jasmine-erhu',
    label: '柔和的拉弦样本',
    instrument: '二胡',
    family: '拉弦乐器',
    texture: '柔和、连贯',
    technique: '拉弦',
    cultureNote: '拉弦乐器可以把相邻音之间的线条连得更柔和。',
    cue: { ...getSongFragment('jasmine', 1, 2)[0], patch: 'strings' },
  },
]

export const JASMINE_RHYTHM_PATTERN: RhythmPattern = {
  bpm: 88,
  beatsPerBar: 4,
  steps: [
    { beats: 1, label: '稳稳走', accent: true },
    { beats: 1, label: '向前走' },
    { beats: 1, label: '轻轻停' },
    { beats: 1, label: '再出发' },
  ],
  movementWords: ['走', '跳', '摇', '停', '推', '拉'],
}

const TOOL_IDS: ExplorationToolId[] = ['microscope', 'instrument', 'rhythm']

function isToolId(value: unknown): value is ExplorationToolId {
  return typeof value === 'string' && TOOL_IDS.includes(value as ExplorationToolId)
}

export function getToolFeedback(toolId: ExplorationToolId | string, evidence: string[]): string {
  const labels = evidence.filter(
    (label): label is string => typeof label === 'string' && Boolean(label.trim())
  )
  if (!isToolId(toolId) || labels.length === 0) return ''
  const clue = labels.slice(0, 2).join('、')
  if (toolId === 'microscope') return `你注意到了${clue}，可以回到这段旋律再听听变化发生在哪里。`
  if (toolId === 'instrument') return `你记录了${clue}的声音颜色，可以比较两个样本的音头和延续。`
  return `你记录了${clue}，可以继续感受动作和稳定拍之间的距离。`
}

export function normalizeToolNotes(value: unknown): MusicDiscoveryToolNote[] | undefined {
  if (!Array.isArray(value)) return undefined
  const notes: MusicDiscoveryToolNote[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const candidate = item as { toolId?: unknown; observation?: unknown; evidence?: unknown }
    if (!isToolId(candidate.toolId) || typeof candidate.observation !== 'string') continue
    const observation = candidate.observation.trim().slice(0, 160)
    if (!observation) continue
    const evidence = Array.isArray(candidate.evidence)
      ? Array.from(
          new Set(
            candidate.evidence
              .filter((label): label is string => typeof label === 'string')
              .map((label) => label.trim())
              .filter(Boolean)
          )
        ).slice(0, 4)
      : []
    notes.push({ toolId: candidate.toolId, observation, evidence })
    if (notes.length === 3) break
  }
  return notes
}
