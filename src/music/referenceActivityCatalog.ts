import {
  REFERENCE_KNOWLEDGE_POINTS,
  type ReferenceActivity,
  type ReferenceActivityKind,
  type ReferenceGrade,
} from './referenceCourseware'

export interface ReferenceActivityFilter {
  grade?: ReferenceGrade
  kind?: ReferenceActivityKind
  knowledgePointId?: string
}

export const REFERENCE_ACTIVITIES: ReferenceActivity[] = [
  {
    id: 'reference-welcome',
    kind: 'listen-and-choose',
    knowledgePointId: 'g1-posture',
    title: '让身体准备好',
    prompt: '先听一听，再选择最适合进入音乐的身体状态。',
    steps: ['hook', 'listen', 'feel', 'try', 'explain', 'reflect'],
    audioIds: [],
    assetIds: [],
    feedback: {
      correct: '你已经找到让身体安静又有准备的状态。',
      retry: '再听一次，注意呼吸和身体是否放松。',
      complete: '身体准备好了，接下来可以让音乐开始说话。',
    },
    summary: '歌唱前，姿势、呼吸和注意力都会帮助我们更好地听见和表达音乐。',
  },
]

export function getReferenceActivities(filter: ReferenceActivityFilter = {}): ReferenceActivity[] {
  const pointById = new Map(REFERENCE_KNOWLEDGE_POINTS.map((point) => [point.id, point]))
  return REFERENCE_ACTIVITIES.filter((activity) => {
    const point = pointById.get(activity.knowledgePointId)
    if (filter.grade !== undefined && point?.grade !== filter.grade) return false
    if (filter.kind !== undefined && activity.kind !== filter.kind) return false
    if (
      filter.knowledgePointId !== undefined &&
      activity.knowledgePointId !== filter.knowledgePointId
    ) {
      return false
    }
    return true
  })
}
