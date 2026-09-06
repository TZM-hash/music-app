import type { ExplorationPath, ExplorationStageId } from '../music/explorationUnits'
import type { PrimaryGrade } from '../music/zhejiangCurriculum'

export type RelistenChoice = 'keep' | 'new-clue' | 'change'

export interface ExplorationResponse {
  firstFeelingId?: string
  pathId?: ExplorationPath
  expressionId?: string
  evidenceId?: string
  conceptIds?: string[]
  relistenChoice?: RelistenChoice
  relistenReflection?: string
}

export interface ExplorationSession extends ExplorationResponse {
  unitId: string
  studentId: string | null
  grade: PrimaryGrade | null
  stage: ExplorationStageId
  startedAt: number
  updatedAt: number
  completedAt?: number
}

export const EXPLORATION_SESSION_STORE_KEY = 'music-edu-exploration-sessions-v1'

const STAGES: ExplorationStageId[] = [
  'listen',
  'express',
  'evidence',
  'concept',
  'relisten',
  'reflect',
]
const MAX_ID_LENGTH = 80
const MAX_CONCEPT_IDS = 8
const MAX_REFLECTION_LENGTH = 240

function normalizeStudentId(studentId?: string | null): string | null {
  if (typeof studentId !== 'string') return null
  const normalized = studentId.trim()
  return normalized ? normalized : null
}

function normalizeGrade(grade?: PrimaryGrade | null): PrimaryGrade | null {
  return grade === 1 || grade === 2 || grade === 3 || grade === 4 || grade === 5 || grade === 6
    ? grade
    : null
}

function normalizeString(value: unknown, maxLength = MAX_ID_LENGTH): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().slice(0, maxLength)
  return normalized || undefined
}

function normalizeConceptIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const unique = Array.from(
    new Set(
      value.map((item) => normalizeString(item)).filter((item): item is string => Boolean(item))
    )
  ).slice(0, MAX_CONCEPT_IDS)
  return unique
}

function isStage(value: unknown): value is ExplorationStageId {
  return typeof value === 'string' && STAGES.includes(value as ExplorationStageId)
}

function isRelistenChoice(value: unknown): value is RelistenChoice {
  return value === 'keep' || value === 'new-clue' || value === 'change'
}

function isPrimaryGrade(value: unknown): value is PrimaryGrade {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function canPersist(studentId?: string | null): studentId is string {
  return Boolean(normalizeStudentId(studentId))
}

function completeIfReady(session: ExplorationSession, completedAt: number): ExplorationSession {
  if (session.stage !== 'reflect' || !session.relistenChoice || session.completedAt !== undefined) {
    return session
  }
  return { ...session, completedAt }
}

export function createExplorationSession(
  unitId: string,
  studentId?: string | null,
  grade?: PrimaryGrade | null,
  startedAt = Date.now()
): ExplorationSession {
  return {
    unitId: normalizeString(unitId) ?? '',
    studentId: normalizeStudentId(studentId),
    grade: normalizeGrade(grade),
    stage: 'listen',
    startedAt,
    updatedAt: startedAt,
  }
}

export function updateExplorationSession(
  session: ExplorationSession,
  response: ExplorationResponse,
  updatedAt = Date.now()
): ExplorationSession {
  const next: ExplorationSession = { ...session, updatedAt }
  const firstFeelingId = normalizeString(response.firstFeelingId)
  const expressionId = normalizeString(response.expressionId)
  const evidenceId = normalizeString(response.evidenceId)
  const relistenReflection = normalizeString(response.relistenReflection, MAX_REFLECTION_LENGTH)
  const conceptIds = normalizeConceptIds(response.conceptIds)

  if (firstFeelingId !== undefined) next.firstFeelingId = firstFeelingId
  if (
    response.pathId === 'emotion' ||
    response.pathId === 'movement' ||
    response.pathId === 'story' ||
    response.pathId === 'culture'
  ) {
    if (next.pathId !== response.pathId) delete next.expressionId
    next.pathId = response.pathId
  }
  if (expressionId !== undefined) next.expressionId = expressionId
  if (evidenceId !== undefined) next.evidenceId = evidenceId
  if (conceptIds !== undefined) next.conceptIds = conceptIds
  if (isRelistenChoice(response.relistenChoice)) next.relistenChoice = response.relistenChoice
  if (relistenReflection !== undefined) next.relistenReflection = relistenReflection

  return completeIfReady(next, updatedAt)
}

export function advanceExplorationStage(
  session: ExplorationSession,
  stage: ExplorationStageId,
  updatedAt = Date.now()
): ExplorationSession {
  const currentIndex = STAGES.indexOf(session.stage)
  const nextIndex = STAGES.indexOf(stage)
  if (currentIndex < 0 || nextIndex !== currentIndex + 1) return session

  return completeIfReady({ ...session, stage, updatedAt }, updatedAt)
}

export function getExplorationProgress(session: ExplorationSession): number {
  if (isExplorationComplete(session)) return 1
  const stageIndex = STAGES.indexOf(session.stage)
  return stageIndex < 0 ? 0 : Math.min(1, Math.max(0, stageIndex / STAGES.length))
}

export function isExplorationComplete(session: ExplorationSession): boolean {
  return session.stage === 'reflect' && Number.isFinite(session.completedAt)
}

function readSessions(): ExplorationSession[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(EXPLORATION_SESSION_STORE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed
          .map(parseSession)
          .filter((session): session is ExplorationSession => session !== null)
      : []
  } catch {
    return []
  }
}

function parseSession(value: unknown): ExplorationSession | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const unitId = normalizeString(record.unitId)
  const studentId = normalizeStudentId(
    typeof record.studentId === 'string' ? record.studentId : null
  )
  if (!unitId || !studentId || !isStage(record.stage) || !isTimestamp(record.updatedAt)) return null

  const startedAt = isTimestamp(record.startedAt) ? record.startedAt : record.updatedAt
  const session: ExplorationSession = {
    unitId,
    studentId,
    grade: isPrimaryGrade(record.grade) ? record.grade : null,
    stage: record.stage,
    startedAt,
    updatedAt: record.updatedAt,
  }
  const response = updateExplorationSession(
    session,
    record as ExplorationResponse,
    session.updatedAt
  )
  if (isTimestamp(record.completedAt) && response.stage === 'reflect' && response.relistenChoice) {
    response.completedAt = record.completedAt
  }
  return response
}

function writeSessions(sessions: ExplorationSession[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(EXPLORATION_SESSION_STORE_KEY, JSON.stringify(sessions))
  } catch {
    // Storage can be disabled or full; in-memory callers keep their session state.
  }
}

export function loadExplorationSession(
  studentId: string | null | undefined,
  unitId: string
): ExplorationSession | null {
  const normalizedStudentId = normalizeStudentId(studentId)
  const normalizedUnitId = normalizeString(unitId)
  if (!normalizedStudentId || !normalizedUnitId) return null
  return (
    readSessions().find(
      (session) => session.studentId === normalizedStudentId && session.unitId === normalizedUnitId
    ) ?? null
  )
}

export function saveExplorationSession(session: ExplorationSession): void {
  const studentId = normalizeStudentId(session.studentId)
  const unitId = normalizeString(session.unitId)
  if (!studentId || !unitId || !canPersist(studentId)) return

  const normalized = parseSession({ ...session, studentId, unitId })
  if (!normalized) return
  const sessions = readSessions().filter(
    (item) => item.studentId !== studentId || item.unitId !== unitId
  )
  writeSessions([...sessions, normalized])
}

export function clearExplorationSession(
  studentId: string | null | undefined,
  unitId: string
): void {
  const normalizedStudentId = normalizeStudentId(studentId)
  const normalizedUnitId = normalizeString(unitId)
  if (!normalizedStudentId || !normalizedUnitId) return
  writeSessions(
    readSessions().filter(
      (session) => session.studentId !== normalizedStudentId || session.unitId !== normalizedUnitId
    )
  )
}
