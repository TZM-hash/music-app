import type { PrimaryGrade } from './zhejiangCurriculum'

export type ExperienceKind = 'sound-detective' | 'rhythm-sprite' | 'music-canvas'
export type ExperienceAgeBand = 'primary-1-2' | 'primary-3-4' | 'primary-5-6'
export type ExperienceStepId = 'listen' | 'find' | 'move' | 'play' | 'create' | 'share'

export interface ExperiencePrompts {
  listen: string
  play: string
  create: string
}

export interface ExperienceActivity {
  id: string
  kind: ExperienceKind
  title: string
  subtitle: string
  icon: string
  color: string
  duration: string
  grades: PrimaryGrade[]
  prompts: ExperiencePrompts
  curriculumTopicIds: string[]
  zhejiangTag: string
  source: 'textbook' | 'extension'
}

export interface ExperienceStep {
  id: ExperienceStepId
  label: string
  prompt: string
  actionLabel: string
}

export interface ExperienceJourney {
  activity: ExperienceActivity
  ageBand: ExperienceAgeBand
  steps: ExperienceStep[]
}

const ALL_GRADES: PrimaryGrade[] = [1, 2, 3, 4, 5, 6]

export const EXPERIENCE_ACTIVITIES: ExperienceActivity[] = [
  {
    id: 'sound-detective',
    kind: 'sound-detective',
    title: '声音侦探',
    subtitle: '听出声音哪里变了',
    icon: '🕵️',
    color: '#2f80ed',
    duration: '约 2 分钟',
    grades: ALL_GRADES,
    prompts: {
      listen: '先听两段声音，找出你最先注意到的变化。',
      play: '按下两个声音按钮，反复听一听再做选择。',
      create: '把你听到的高低、强弱或音色变化说给同伴听。',
    },
    curriculumTopicIds: ['sound-four-properties', 'pitch-up-down', 'chinese-instruments'],
    zhejiangTag: '越剧声腔',
    source: 'extension',
  },
  {
    id: 'rhythm-sprite',
    kind: 'rhythm-sprite',
    title: '节奏精灵',
    subtitle: '让身体跟着拍子走',
    icon: '🥁',
    color: '#f2994a',
    duration: '约 3 分钟',
    grades: ALL_GRADES,
    prompts: {
      listen: '先听完整的四拍，心里默数拍子，不急着点击。',
      play: '跟着精灵敲一敲，感受强拍、弱拍和停顿。',
      create: '用四拍或八拍设计一个自己的节奏口令。',
    },
    curriculumTopicIds: ['steady-beat', 'quarter-eighth-notes', 'meter-basic', 'syncopation'],
    zhejiangTag: '龙舟鼓点',
    source: 'extension',
  },
  {
    id: 'music-canvas',
    kind: 'music-canvas',
    title: '音乐画布',
    subtitle: '把听到的感觉画出来',
    icon: '🎨',
    color: '#27ae60',
    duration: '约 4 分钟',
    grades: ALL_GRADES,
    prompts: {
      listen: '闭上眼听一小段，想象它的颜色、线条和方向。',
      play: '选择颜色、形状和移动方式，让画面跟着音乐呼吸。',
      create: '完成一张音乐小画，再用一句话说出你的理由。',
    },
    curriculumTopicIds: ['motif', 'pentatonic-scale', 'four-bar-phrase-writing', 'folk-song-region'],
    zhejiangTag: '西湖水乡',
    source: 'extension',
  },
]

const AGE_COPY: Record<ExperienceAgeBand, Record<ExperienceStepId, string>> = {
  'primary-1-2': {
    listen: '先听一听，找一个像小动物或风一样的声音。',
    find: '哪一个声音更高、更长或更响？点出你的发现。',
    move: '拍手、跺脚或摇一摇身体，让拍子带你走。',
    play: '试试大按钮，听听每一次点击会变成什么声音。',
    create: '做四拍小作品，让它像一场小小的声音游戏。',
    share: '选一个颜色或词语，说说这段音乐让你想到什么。',
  },
  'primary-3-4': {
    listen: '先听完整片段，再记住一个最明显的声音线索。',
    find: '比较两种变化，指出它们在节奏、音高或音色上的不同。',
    move: '跟着稳定拍做回应，停顿时身体也继续数拍。',
    play: '切换不同声音，找出它们在合奏中适合的位置。',
    create: '用四到八拍组合一个有重复和变化的动机。',
    share: '用“因为……所以……”说明你的听感依据。',
  },
  'primary-5-6': {
    listen: '先建立整体印象，再留意结构、织体和表情的变化。',
    find: '比较两段声音的层次，判断变化如何影响音乐表达。',
    move: '用身体标出强弱和句子方向，感受音乐的呼吸。',
    play: '调整音区、速度或配器，观察音乐性格如何改变。',
    create: '设计一个完整的四小节动机，并安排前后呼应。',
    share: '用音乐术语和个人感受各说一个理由，再保存你的发现。',
  },
}

const STEP_LABELS: Record<ExperienceStepId, { label: string; actionLabel: string }> = {
  listen: { label: '听一听', actionLabel: '播放声音' },
  find: { label: '找一找', actionLabel: '比较变化' },
  move: { label: '动一动', actionLabel: '跟着拍' },
  play: { label: '玩一玩', actionLabel: '开始试玩' },
  create: { label: '创一创', actionLabel: '留下作品' },
  share: { label: '说一说', actionLabel: '保存发现' },
}

export function getAgeBand(grade?: PrimaryGrade | number | null): ExperienceAgeBand {
  if (grade === 3 || grade === 4) return 'primary-3-4'
  if (grade === 5 || grade === 6) return 'primary-5-6'
  return 'primary-1-2'
}

export function getRecommendedActivities(grade?: PrimaryGrade | number | null): ExperienceActivity[] {
  const normalizedGrade = typeof grade === 'number' && grade >= 1 && grade <= 6 ? grade as PrimaryGrade : undefined
  return EXPERIENCE_ACTIVITIES.filter((activity) =>
    normalizedGrade === undefined || activity.grades.includes(normalizedGrade)
  )
}

export function buildExperienceJourney(
  activity: ExperienceActivity,
  grade?: PrimaryGrade | number | null
): ExperienceJourney {
  const ageBand = getAgeBand(grade)
  const copy = AGE_COPY[ageBand]
  const stepIds: ExperienceStepId[] = ['listen', 'find', 'move', 'play', 'create', 'share']
  const steps = stepIds.map((id) => ({
    id,
    label: STEP_LABELS[id].label,
    actionLabel: STEP_LABELS[id].actionLabel,
    prompt:
      id === 'listen'
        ? `${activity.prompts.listen} ${copy.listen}`
        : id === 'play'
          ? `${activity.prompts.play} ${copy.play}`
          : id === 'create'
            ? `${activity.prompts.create} ${copy.create}`
            : copy[id],
  }))

  return { activity, ageBand, steps }
}
