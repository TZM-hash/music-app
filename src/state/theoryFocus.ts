import type { TheoryStageId } from '../music/theoryCatalog'

export interface TheoryFocus {
  stage?: TheoryStageId
  category?: string
  topicId?: string
}

export interface TheoryFocusTarget {
  stage?: TheoryStageId
  category?: string
  id?: string
}

export function createTheoryFocus(focus: TheoryFocus): TheoryFocus {
  return {
    ...(focus.stage ? { stage: focus.stage } : {}),
    ...(focus.category ? { category: focus.category } : {}),
    ...(focus.topicId ? { topicId: focus.topicId } : {}),
  }
}

export function matchesTheoryFocus(target: TheoryFocusTarget, focus: TheoryFocus | null): boolean {
  if (!focus) return true
  if (focus.stage && target.stage !== focus.stage) return false
  if (focus.category && target.category !== focus.category) return false
  if (focus.topicId && target.id !== focus.topicId) return false
  return true
}
