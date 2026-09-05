import type { PrimaryGrade } from '../music/zhejiangCurriculum'

/** 顶部全局筛选可用的班级；名册中出现的自定义班级会在此基础上追加。 */
export const DEFAULT_CLASS_OPTIONS = ['一班', '二班', '三班', '四班', '五班', '六班'] as const
export const DEFAULT_CLASS_NAME = DEFAULT_CLASS_OPTIONS[0]

export interface LearningScope {
  grade: PrimaryGrade | null
  className: string | null
}

export interface ScopeStudent {
  grade?: PrimaryGrade
  className?: string
}

export function normalizeClassName(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return DEFAULT_CLASS_NAME
  return value.trim()
}

export function matchesLearningScope(student: ScopeStudent, scope: LearningScope): boolean {
  if (scope.grade !== null && student.grade !== scope.grade) return false
  if (scope.className !== null && normalizeClassName(student.className) !== scope.className) return false
  return true
}

export function classOptionsForRoster(
  roster: ScopeStudent[],
  grade: PrimaryGrade | null = null
): string[] {
  const options = new Set<string>(DEFAULT_CLASS_OPTIONS)
  for (const student of roster) {
    if (grade !== null && student.grade !== grade) continue
    options.add(normalizeClassName(student.className))
  }
  return Array.from(options)
}

export function parseGradeSelection(value: string | number | null | undefined): PrimaryGrade | null {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return parsed >= 1 && parsed <= 6 && Number.isInteger(parsed) ? parsed as PrimaryGrade : null
}
