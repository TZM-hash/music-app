import type { JourneyStepId, ReferenceActivity } from '../../music/referenceCourseware'
import ListenChoiceActivity from './ListenChoiceActivity'
import InstrumentDetectiveActivity from './InstrumentDetectiveActivity'
import MovementActivity from './MovementActivity'
import ReviewQuestActivity from './ReviewQuestActivity'
import RhythmBuilderActivity from './RhythmBuilderActivity'
import './referenceActivities.css'

export interface ReferenceActivityStageProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}

export default function ReferenceActivityStage(props: ReferenceActivityStageProps) {
  const { activity } = props
  if (activity.kind === 'listen-and-choose') return <ListenChoiceActivity {...props} />
  if (activity.kind === 'instrument-detective') return <InstrumentDetectiveActivity {...props} />
  if (activity.kind === 'meter-movement') return <MovementActivity {...props} />
  if (activity.kind === 'review-quest') return <ReviewQuestActivity {...props} />
  return <RhythmBuilderActivity {...props} />
}
