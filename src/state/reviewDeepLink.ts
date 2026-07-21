import { createTheoryFocus, type TheoryFocus } from './theoryFocus'
import type { TheoryStageId } from '../music/theoryCatalog'

const STAGE_IDS = new Set<TheoryStageId>([
  'primary-lower',
  'primary-middle',
  'primary-upper',
  'junior-basic',
  'junior-advanced',
])

function asStage(stage?: string): TheoryStageId | undefined {
  if (!stage) return undefined
  return STAGE_IDS.has(stage as TheoryStageId) ? (stage as TheoryStageId) : undefined
}

export function focusFromReviewItem(item: {
  source: string
  itemId: string
  category: string
  stage?: string
}): TheoryFocus {
  if (item.source === 'theory') {
    return createTheoryFocus({
      topicId: item.itemId,
      category: item.category || undefined,
      stage: asStage(item.stage),
    })
  }
  // encyclopedia / daily / unknown: never treat itemId as theory topicId
  return createTheoryFocus({
    category: item.category || undefined,
  })
}

export function focusFromWeakCategory(category: string): TheoryFocus {
  return createTheoryFocus({ category })
}

export function focusFromTheoryTopic(topic: {
  id: string
  category: string
  stage?: string
}): TheoryFocus {
  return createTheoryFocus({
    topicId: topic.id,
    category: topic.category || undefined,
    stage: asStage(topic.stage),
  })
}
