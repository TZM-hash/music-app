import { useEffect, useMemo, useState } from 'react'
import { recordResult } from '../state/progress'
import {
  completeJourneyStep,
  createJourneyState,
  recordJourneyAudio,
  selectJourneyEvidence,
  submitJourney,
  type JourneyState,
  type JourneySubmitResult,
} from '../music/learningJourney'
import type { JourneyStepId, ReferenceActivity } from '../music/referenceCourseware'
import './learningJourney.css'

export interface LearningJourneyProps {
  activity: ReferenceActivity
  onComplete?: (result: JourneySubmitResult) => void
  onReturn?: () => void
}

const STEP_LABELS: Record<JourneyStepId, string> = {
  hook: '进入情境',
  listen: '先听一听',
  feel: '说说感受',
  notice: '发现线索',
  try: '动手试试',
  explain: '认识概念',
  create: '做个变化',
  reflect: '留下总结',
}

const STEP_COPY: Record<JourneyStepId, string> = {
  hook: '跟着故事进入音乐现场。',
  listen: '先让耳朵听见，再决定自己的发现。',
  feel: '选择一个贴近你感受的词。',
  notice: '找出支持你感受的音乐线索。',
  try: '用一次操作把听到的变化表现出来。',
  explain: '用一张短卡片给刚才的发现命名。',
  create: '改变一个元素，听听结果有什么不同。',
  reflect: '把听到、感受到和学会的内容留下来。',
}

function createInitialState(activity: ReferenceActivity): JourneyState {
  return createJourneyState(activity)
}

export default function LearningJourney({ activity, onComplete, onReturn }: LearningJourneyProps) {
  const [state, setState] = useState(() => createInitialState(activity))
  const [notice, setNotice] = useState('')
  const currentStep = activity.steps[state.stepIndex]
  const currentLabel = currentStep ? STEP_LABELS[currentStep] : '探索完成'
  const progress = useMemo(
    () => Math.round((state.completedStepIds.length / Math.max(activity.steps.length, 1)) * 100),
    [activity.steps.length, state.completedStepIds.length]
  )

  useEffect(() => {
    setState(createInitialState(activity))
    setNotice('')
  }, [activity])

  const listenOnce = () => {
    const audioId = activity.audioIds[0] ?? `fallback:${activity.id}`
    setState((current) => recordJourneyAudio(current, audioId))
    setNotice(
      activity.audioIds.length > 0
        ? '试听已经记录，可以带着自己的感觉继续。'
        : '当前活动没有可用音频，仍然可以根据提示观察和保存。'
    )
  }

  const chooseEvidence = (value: string) => {
    setState((current) => selectJourneyEvidence(current, value))
    setNotice(`已经记下“${value}”，再找一个声音线索。`)
  }

  const completeCurrentStep = () => {
    if (!currentStep) return
    const next = completeJourneyStep(state, currentStep)
    if (next === state) {
      setNotice('先完成当前小任务，再进入下一步。')
      return
    }
    setState(next)
    if (next.status === 'complete') {
      const result = submitJourney(next, activity)
      recordResult(`reference-activity:${activity.id}`, 1, result.stars, result.score)
      onComplete?.(result)
      setNotice(activity.feedback.complete)
    } else {
      setNotice('很好，带着这个发现继续往前走。')
    }
  }

  return (
    <section className="learning-journey" aria-labelledby="learning-journey-title">
      <header className="learning-journey__header">
        <div>
          <span className="learning-journey__eyebrow">音乐探索旅程</span>
          <h1 id="learning-journey-title">{activity.title}</h1>
          <p>{activity.prompt}</p>
        </div>
        {onReturn && (
          <button type="button" className="learning-journey__return" onClick={onReturn}>
            回到探索
          </button>
        )}
      </header>

      <ol className="learning-journey__steps" aria-label="学习旅程进度">
        {activity.steps.map((step, index) => (
          <li className={index < state.stepIndex ? 'done' : index === state.stepIndex ? 'active' : ''} key={step}>
            <span>{index + 1}</span>
            <small>{STEP_LABELS[step]}</small>
          </li>
        ))}
      </ol>

      <div className="learning-journey__progress" aria-label={`已完成 ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <main className="learning-journey__stage">
        <span className="learning-journey__stage-label">现在：{currentLabel}</span>
        <h2>{currentStep ? STEP_COPY[currentStep] : activity.summary}</h2>
        {currentStep === 'listen' && (
          <button type="button" className="learning-journey__listen" onClick={listenOnce}>
            试听这一段
          </button>
        )}
        {(currentStep === 'feel' || currentStep === 'notice') && (
          <div className="learning-journey__evidence" aria-label="感受和线索">
            {['轻松', '有力量', '向上走', '声音变长'].map((value) => (
              <button type="button" key={value} onClick={() => chooseEvidence(value)}>
                {value}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="learning-journey__next"
          disabled={!currentStep}
          onClick={completeCurrentStep}
        >
          {currentStep ? (state.stepIndex === activity.steps.length - 1 ? '完成探索' : '完成这一步') : '探索完成'}
        </button>
        <p className="learning-journey__live" aria-live="polite">
          {notice || activity.summary}
        </p>
      </main>
    </section>
  )
}
