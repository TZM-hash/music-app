import type { TheoryTopic } from './theoryCatalog'
import {
  getCurriculumSourceLabel,
  getGradeLabel,
  PrimaryGrade,
  Semester,
} from './zhejiangCurriculum'

export interface ExplorationRecommendationContext {
  grade?: PrimaryGrade
  semester?: Semester
  completedTopicIds?: string[]
  weakCategories?: string[]
  studentId?: string | null
  dayKey?: string
}

export interface ExplorationRecommendation {
  topic: TheoryTopic
  reason: string
}

function stableHash(value: string): number {
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function scoreTopic(
  topic: TheoryTopic,
  context: ExplorationRecommendationContext,
  completed: Set<string>,
  weakCategories: Set<string>
): number {
  const curriculum = topic.curriculum
  let score = 0
  if (curriculum.source === 'textbook') score += 40
  if (context.grade && curriculum.grades.includes(context.grade)) score += 100
  if (context.semester && curriculum.semester === context.semester) score += 24
  if (!completed.has(topic.id)) score += 35
  if (weakCategories.has(topic.category)) score += 30
  const salt = `${context.dayKey ?? 'today'}:${context.studentId ?? 'anonymous'}:${topic.id}`
  return score * 1000 + (stableHash(salt) % 1000)
}

function rankTopics(
  topics: TheoryTopic[],
  context: ExplorationRecommendationContext,
  completed: Set<string>,
  weakCategories: Set<string>
): TheoryTopic[] {
  return [...topics].sort(
    (a, b) => scoreTopic(b, context, completed, weakCategories) - scoreTopic(a, context, completed, weakCategories)
  )
}

function pickPool(topics: TheoryTopic[], context: ExplorationRecommendationContext): TheoryTopic[] {
  const primary = topics.filter((topic) => topic.curriculum.source === 'textbook')
  if (!context.grade) return primary.length > 0 ? primary : topics

  const gradeTopics = primary.filter((topic) => topic.curriculum.grades.includes(context.grade!))
  if (gradeTopics.length > 0) return gradeTopics

  // 年级没有直接匹配时，回退到同一学段的教材主题。
  const band = context.grade <= 2 ? [1, 2] : context.grade <= 4 ? [3, 4] : [5, 6]
  const bandTopics = primary.filter((topic) => topic.curriculum.grades.some((grade) => band.includes(grade)))
  return bandTopics.length > 0 ? bandTopics : primary.length > 0 ? primary : topics
}

export function recommendExplorationTopic(
  topics: TheoryTopic[],
  context: ExplorationRecommendationContext = {}
): ExplorationRecommendation | null {
  if (topics.length === 0) return null

  const completed = new Set(context.completedTopicIds ?? [])
  const weakCategories = new Set(context.weakCategories ?? [])
  const pool = pickPool(topics, context)
  const ranked = rankTopics(pool, context, completed, weakCategories)
  const next = ranked.find((topic) => !completed.has(topic.id)) ?? ranked[0]
  if (!next) return null

  const curriculum = next.curriculum
  const gradeLabel = context.grade ? getGradeLabel(context.grade) : '小学'
  return {
    topic: next,
    reason: `${gradeLabel} · ${getCurriculumSourceLabel(curriculum.source)} · ${curriculum.unitTitle}`,
  }
}
