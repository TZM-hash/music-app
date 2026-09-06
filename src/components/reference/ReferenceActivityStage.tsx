import { useMemo, useState } from 'react'
import { getActivityAssets, type ReferenceAsset } from '../../music/referenceAssets'
import type { JourneyStepId, ReferenceActivity } from '../../music/referenceCourseware'
import ListenChoiceActivity from './ListenChoiceActivity'
import InstrumentDetectiveActivity from './InstrumentDetectiveActivity'
import LayeredListeningActivity from './LayeredListeningActivity'
import MovementActivity from './MovementActivity'
import ReviewQuestActivity from './ReviewQuestActivity'
import RhythmBuilderActivity from './RhythmBuilderActivity'
import SoundDictationActivity from './SoundDictationActivity'
import VoiceFormActivity from './VoiceFormActivity'
import './referenceActivities.css'
import './referenceAnimations.css'

export interface ReferenceActivityStageProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}

export default function ReferenceActivityStage(props: ReferenceActivityStageProps) {
  const { activity } = props
  const assets = useMemo(() => getActivityAssets(activity.id), [activity.id])
  const [unavailableAssets, setUnavailableAssets] = useState<string[]>([])

  const stage =
    activity.kind === 'listen-and-choose' ? (
      <ListenChoiceActivity {...props} />
    ) : activity.kind === 'instrument-detective' ? (
      <InstrumentDetectiveActivity {...props} />
    ) : activity.kind === 'layered-listening' ? (
      <LayeredListeningActivity {...props} />
    ) : activity.kind === 'note-ladder' ? (
      <ListenChoiceActivity {...props} />
    ) : activity.kind === 'voice-form-guess' ? (
      <VoiceFormActivity {...props} />
    ) : activity.kind === 'sound-dictation' ? (
      <SoundDictationActivity {...props} />
    ) : activity.kind === 'meter-movement' ? (
      <MovementActivity {...props} />
    ) : activity.kind === 'review-quest' ? (
      <ReviewQuestActivity {...props} />
    ) : (
      <RhythmBuilderActivity {...props} />
    )

  return (
    <>
      {stage}
      {assets.length > 0 && (
        <ReferenceAssetShelf
          assets={assets}
          unavailableAssets={unavailableAssets}
          onUnavailable={(asset) =>
            setUnavailableAssets((current) =>
              current.includes(asset.id) ? current : [...current, asset.id]
            )
          }
        />
      )}
    </>
  )
}

interface ReferenceAssetShelfProps {
  assets: ReferenceAsset[]
  unavailableAssets: string[]
  onUnavailable: (asset: ReferenceAsset) => void
}

function ReferenceAssetShelf({
  assets,
  unavailableAssets,
  onUnavailable,
}: ReferenceAssetShelfProps) {
  return (
    <section className="reference-activity__assets" aria-label="参考课件声音素材">
      <strong>参考声音素材（按需加载）</strong>
      {assets.map((asset) => {
        const unavailable = unavailableAssets.includes(asset.id)
        return (
          <div
            className={`reference-activity__asset${unavailable ? ' reference-activity__asset--unavailable' : ''}`}
            key={asset.id}
          >
            <strong>{asset.alt ?? '参考声音'}</strong>
            {asset.kind === 'audio' ? (
              <audio
                controls
                preload={asset.preload}
                src={asset.src}
                aria-label={asset.alt ?? '参考声音'}
                onError={() => onUnavailable(asset)}
              />
            ) : (
              <span>{asset.kind === 'image' ? '图片素材已准备好。' : '视频素材已准备好。'}</span>
            )}
            <small>
              {unavailable
                ? '这个声音暂时不可用，仍可以使用上面的互动和合成声音继续探索。'
                : '点击播放时才加载，不会提前占用课堂网络。'}
            </small>
          </div>
        )
      })}
    </section>
  )
}
