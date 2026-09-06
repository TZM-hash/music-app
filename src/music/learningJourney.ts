import type {
  JourneyStepId,
  ReferenceActivity,
} from './referenceCourseware'

export interface JourneyState {
  activityId: string
  steps: JourneyStepId[]
  stepIndex: number
  completedStepIds: JourneyStepId[]
  heardAudioIds: string[]
  selectedEvidence: string[]
  attempts: number
  status: 'active' | 'complete'
}

export interface JourneySubmitResult {
  next: JourneyState
  stars: number
  score: number
}

export function createJourneyState(activity: ReferenceActivity): JourneyState {
  return {
    activityId: activity.id,
    steps: [...activity.steps],
    stepIndex: 0,
    completedStepIds: [],
    heardAudioIds: [],
    selectedEvidence: [],
    attempts: 0,
    status: 'active',
  }
}

export function completeJourneyStep(state: JourneyState, step: JourneyStepId): JourneyState {
  const expectedStep = state.stepIndex
  if (state.status === 'complete' || state.completedStepIds.includes(step)) return state
  if (step !== state.steps[expectedStep]) return state
  if (step === 'listen' && state.heardAudioIds.length === 0) return state
  const nextStepIndex = Math.min(state.stepIndex + 1, state.steps.length)
  return {
    ...state,
    stepIndex: nextStepIndex,
    completedStepIds: state.steps.slice(0, nextStepIndex),
    status: nextStepIndex >= state.steps.length ? 'complete' : 'active',
  }
}

export function registerJourneyAttempt(state: JourneyState): JourneyState {
  return { ...state, attempts: Math.min(state.attempts + 1, 99) }
}

export function recordJourneyAudio(state: JourneyState, audioId: string): JourneyState {
  const normalized = audioId.trim()
  if (!normalized || state.heardAudioIds.includes(normalized)) return state
  return { ...state, heardAudioIds: [...state.heardAudioIds, normalized].slice(0, 8) }
}

export function selectJourneyEvidence(state: JourneyState, evidence: string): JourneyState {
  const normalized = evidence.trim()
  if (!normalized || state.selectedEvidence.includes(normalized)) return state
  return { ...state, selectedEvidence: [...state.selectedEvidence, normalized].slice(0, 8) }
}

export function submitJourney(state: JourneyState, activity: ReferenceActivity): JourneySubmitResult {
  if (state.stepIndex < activity.steps.length || state.status !== 'complete') {
    return { next: state, stars: 0, score: 0 }
  }

  const retryPenalty = Math.min(2, Math.floor(state.attempts / Math.max(activity.steps.length, 1)))
  const stars = Math.max(1, 3 - retryPenalty)
  const score = Math.max(0, Math.min(100, stars * 30 + (state.selectedEvidence.length > 0 ? 10 : 0)))
  return { next: state, stars, score }
}
