import type { ReferenceCourseSource } from './referenceCourseware'
import { REFERENCE_ACTIVITIES } from './referenceActivityCatalog'

export interface ReferenceAsset {
  id: string
  kind: 'audio' | 'image' | 'video'
  src: string
  alt?: string
  preload: 'none' | 'metadata'
  source: ReferenceCourseSource
}

/**
 * 这里登记的是从参考课件中挑出的、已经复制到 public 的小型素材。
 * 原始 E 盘目录永远不参与运行时路径拼接，避免桌面端部署后失效。
 */
const REFERENCE_ASSETS: ReferenceAsset[] = [
  {
    id: 'g1/forest/clappers',
    kind: 'audio',
    src: '/reference-courseware/g1/instrument-xiangban.mp3',
    alt: '响板示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g1/forest/woodblock',
    kind: 'audio',
    src: '/reference-courseware/g1/instrument-muyu.mp3',
    alt: '木鱼示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g1/forest/bell',
    kind: 'audio',
    src: '/reference-courseware/g1/instrument-pengzhong.mp3',
    alt: '碰钟示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g1/rhythm/x-xx',
    kind: 'audio',
    src: '/reference-courseware/g1/rhythm-quarter.mp3',
    alt: 'X、XX 节奏示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g2/rhythm/note-values',
    kind: 'audio',
    src: '/reference-courseware/g2/rhythm-note-values.mp3',
    alt: '音符时值示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g3/emotion/story-cards',
    kind: 'audio',
    src: '/reference-courseware/g3/emotion-happy.mp3',
    alt: '音乐情绪示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g3/voice/forms',
    kind: 'audio',
    src: '/reference-courseware/g3/voice-chorus.mp3',
    alt: '合唱示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g3/voice/round',
    kind: 'audio',
    src: '/reference-courseware/g3/voice-round.mp3',
    alt: '轮唱示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
]

const ASSETS_BY_ID = new Map(REFERENCE_ASSETS.map((asset) => [asset.id, asset]))

const ACTIVITY_ASSET_IDS: Record<string, string[]> = {
  'g1-clappers-activity': ['g1/forest/clappers'],
  'g1-woodblock-activity': ['g1/forest/woodblock'],
  'g1-bell-activity': ['g1/forest/bell'],
  'g1-x-xx-rhythm-activity': ['g1/rhythm/x-xx'],
  'g2-note-values-activity': ['g2/rhythm/note-values'],
  'g3-music-emotion-activity': ['g3/emotion/story-cards'],
  'g3-unison-chorus-round-activity': ['g3/voice/forms', 'g3/voice/round'],
}

export function getReferenceAsset(id: string): ReferenceAsset | undefined {
  return ASSETS_BY_ID.get(id)
}

export function getActivityAssets(activityId: string): ReferenceAsset[] {
  const activity = REFERENCE_ACTIVITIES.find((item) => item.id === activityId)
  const ids = ACTIVITY_ASSET_IDS[activityId] ?? activity?.assetIds ?? []
  return ids
    .map((id) => getReferenceAsset(id))
    .filter((asset): asset is ReferenceAsset => asset !== undefined)
}
