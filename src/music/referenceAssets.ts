import type { ReferenceCourseSource } from './referenceCourseware'
import { REFERENCE_ACTIVITIES } from './referenceActivityCatalog'
import clappersAudio from './reference-courseware/g1/instrument-xiangban.mp3'
import woodblockAudio from './reference-courseware/g1/instrument-muyu.mp3'
import bellAudio from './reference-courseware/g1/instrument-pengzhong.mp3'
import quarterRhythmAudio from './reference-courseware/g1/rhythm-quarter.mp3'
import noteValuesAudio from './reference-courseware/g2/rhythm-note-values.mp3'
import emotionHappyAudio from './reference-courseware/g3/emotion-happy.mp3'
import chorusAudio from './reference-courseware/g3/voice-chorus.mp3'
import roundAudio from './reference-courseware/g3/voice-round.mp3'

export interface ReferenceAsset {
  id: string
  kind: 'audio' | 'image' | 'video'
  src: string
  alt?: string
  preload: 'none' | 'metadata'
  source: ReferenceCourseSource
}

/**
 * 这里登记的是从参考课件中挑出的、已经复制到源码目录的小型素材。
 * 通过 import 接入后，Vite 会在单文件构建时内联为 data URL，直接双击也能播放。
 */
const REFERENCE_ASSETS: ReferenceAsset[] = [
  {
    id: 'g1/forest/clappers',
    kind: 'audio',
    src: clappersAudio,
    alt: '响板示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g1/forest/woodblock',
    kind: 'audio',
    src: woodblockAudio,
    alt: '木鱼示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g1/forest/bell',
    kind: 'audio',
    src: bellAudio,
    alt: '碰钟示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g1/rhythm/x-xx',
    kind: 'audio',
    src: quarterRhythmAudio,
    alt: 'X、XX 节奏示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g2/rhythm/note-values',
    kind: 'audio',
    src: noteValuesAudio,
    alt: '音符时值示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g3/emotion/story-cards',
    kind: 'audio',
    src: emotionHappyAudio,
    alt: '音乐情绪示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g3/voice/forms',
    kind: 'audio',
    src: chorusAudio,
    alt: '合唱示例声音',
    preload: 'none',
    source: 'renyin-reference',
  },
  {
    id: 'g3/voice/round',
    kind: 'audio',
    src: roundAudio,
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
