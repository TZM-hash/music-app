import type { Route } from '../state/appState'
import type { DemoScene } from './theoryDemos'
import type { TheoryTopic } from './theoryCatalog'

export type ExplorationStepId = 'listen' | 'guess' | 'play' | 'speak' | 'create'

export interface ExplorationStep {
  id: ExplorationStepId
  title: string
  badge: string
  prompt: string
  microGoal: string
  actionLabel: string
  route?: Route
}

export interface ExplorationTaskCard {
  topicId: string
  title: string
  mission: string
  checkpoints: string[]
  steps: ExplorationStep[]
}

function pickPlayAction(topic: TheoryTopic): TheoryTopic['actions'][number] | undefined {
  return topic.actions.find((action) => action.route !== 'mixer') ?? topic.actions[0]
}

function pickCreateAction(topic: TheoryTopic): TheoryTopic['actions'][number] {
  return topic.actions.find((action) => action.route === 'mixer') ?? { label: '混音创作', route: 'mixer' }
}

export function buildExplorationLoop(topic: TheoryTopic, scene: DemoScene): ExplorationStep[] {
  // 数据不全时给兜底文案，避免空 controls/keyPoints 直接 TypeError 白屏
  const firstControl = scene.controls[0] ?? ({ label: '声音' } as DemoScene['controls'][number])
  const compareControl = scene.controls[1] ?? firstControl
  const keyPointA = topic.keyPoints[0] ?? '我听到的变化'
  const keyPointB = topic.keyPoints[1] ?? keyPointA
  const playAction = pickPlayAction(topic)
  const createAction = pickCreateAction(topic)

  return [
    {
      id: 'listen',
      title: '听一听',
      badge: '耳朵热身',
      prompt: `先听“${topic.demo.title}”，注意声音的${topic.subtitle}。`,
      microGoal: `听出${firstControl.label}的声音特点`,
      actionLabel: '播放演示',
    },
    {
      id: 'guess',
      title: '猜一猜',
      badge: '发现变化',
      prompt: `比较“${firstControl.label}”和“${compareControl.label}”，说说哪里变了。`,
      microGoal: `指出${firstControl.label}和${compareControl.label}的不同`,
      actionLabel: '选择变化',
    },
    {
      id: 'play',
      title: '玩一玩',
      badge: '动手体验',
      prompt: `切换下面的声音按钮，让耳朵、眼睛和身体一起找规律。`,
      microGoal: `亲手试玩${scene.controls.slice(0, 3).map((control) => control.label).join('、') || '声音按钮'}`,
      actionLabel: playAction ? `去${playAction.label}` : '切换试玩',
      route: playAction?.route,
    },
    {
      id: 'create',
      title: '创作一下',
      badge: '小小创编',
      prompt: `把这个发现变成一个四拍小作品，可以从旋律、节奏或音色开始。`,
      microGoal: `做一段带有“${topic.subtitle}”感觉的小声音`,
      actionLabel: `去${createAction.label}`,
      route: createAction.route,
    },
    {
      id: 'speak',
      title: '说一说',
      badge: '表达分享',
      prompt: `用自己的话说出一个发现：${keyPointA}、${keyPointB}，或者你听到的感受。`,
      microGoal: '说出我听到、看到、想到的一个变化',
      actionLabel: '表达感受',
    },
  ]
}

export function buildExplorationTaskCard(topic: TheoryTopic, scene: DemoScene): ExplorationTaskCard {
  const checkpoints = [
    ...topic.keyPoints.slice(0, 3),
    scene.observations[0],
  ].filter(Boolean)

  return {
    topicId: topic.id,
    title: `${topic.title}声音探险卡`,
    mission: `听见“${topic.subtitle}”，试玩一个变化，再创作一段四拍小声音。`,
    checkpoints,
    steps: buildExplorationLoop(topic, scene),
  }
}
