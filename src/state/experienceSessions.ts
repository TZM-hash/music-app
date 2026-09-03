import type { ExperienceStepId } from '../music/experienceActivities'

export interface ExperienceSession {
  activityId: string
  completedStepIds: ExperienceStepId[]
  startedAt: number
  updatedAt: number
}

const VALID_STEP_IDS: ExperienceStepId[] = ['listen', 'find', 'move', 'play', 'create', 'share']

export function createExperienceSession(activityId: string, startedAt = Date.now()): ExperienceSession {
  return {
    activityId,
    completedStepIds: [],
    startedAt,
    updatedAt: startedAt,
  }
}

export function recordExperienceStep(
  session: ExperienceSession,
  stepId: ExperienceStepId,
  updatedAt = Date.now()
): ExperienceSession {
  if (!VALID_STEP_IDS.includes(stepId) || session.completedStepIds.includes(stepId)) {
    return session
  }
  return {
    ...session,
    completedStepIds: [...session.completedStepIds, stepId],
    updatedAt,
  }
}

export function getExperienceProgress(session: ExperienceSession, totalSteps: number): number {
  if (!Number.isFinite(totalSteps) || totalSteps <= 0) return 0
  return Math.min(1, Math.max(0, session.completedStepIds.length / totalSteps))
}

export function isExperienceComplete(session: ExperienceSession, totalSteps: number): boolean {
  return totalSteps > 0 && session.completedStepIds.length >= totalSteps
}

export function resetExperienceSession(session: ExperienceSession, startedAt = Date.now()): ExperienceSession {
  return createExperienceSession(session.activityId, startedAt)
}

export function canPersistExperience(studentId?: string | null): boolean {
  return Boolean(studentId?.trim())
}

