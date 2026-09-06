import {
  REFERENCE_KNOWLEDGE_POINTS,
  type ReferenceActivity,
  type ReferenceActivityKind,
  type ReferenceGrade,
} from './referenceCourseware'
import { GRADE_ONE_ACTIVITIES } from './referenceLessons/gradeOneUpper'
import { GRADE_TWO_ACTIVITIES } from './referenceLessons/gradeTwoUpper'

export interface ReferenceActivityFilter {
  grade?: ReferenceGrade
  kind?: ReferenceActivityKind
  knowledgePointId?: string
}

export const REFERENCE_ACTIVITIES: ReferenceActivity[] = [
  ...GRADE_ONE_ACTIVITIES,
  ...GRADE_TWO_ACTIVITIES,
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
