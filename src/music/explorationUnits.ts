import type { PrimaryGrade } from './zhejiangCurriculum'

export type ExplorationPath = 'emotion' | 'movement' | 'story' | 'culture'
export type ExplorationStageId =
  | 'listen'
  | 'express'
  | 'evidence'
  | 'concept'
  | 'relisten'
  | 'reflect'
export type ExplorationAgeBand = 'primary-1-2' | 'primary-3-4' | 'primary-5-6'

export interface ExplorationChoice {
  id: string
  label: string
  hint?: string
  color?: string
}

export interface ExplorationPathConfig {
  id: ExplorationPath
  label: string
  prompt: string
  choices: ExplorationChoice[]
}

export interface ExplorationEvidenceOption {
  id: string
  label: string
  feedback: string
  conceptId: string
  isBest: boolean
}

export interface ExplorationConceptCard {
  id: string
  title: string
  short: string
  body: string
  listenPrompt: string
  ageBands: ExplorationAgeBand[]
}

export interface ExplorationUnit {
  id: string
  title: string
  subtitle: string
  question: string
  icon: string
  color: string
  source: 'textbook' | 'extension'
  songId: string
  curriculumTopicIds: string[]
  paths: ExplorationPathConfig[]
  evidence: { prompt: string; options: ExplorationEvidenceOption[] }
  concepts: ExplorationConceptCard[]
  culture: {
    title: string
    body: string
    ageBands: Partial<Record<ExplorationAgeBand, string>>
  }
  relisten: { prompt: string; choices: ExplorationChoice[] }
  reflectionPrompts: Partial<Record<ExplorationAgeBand, string>>
}

export const JASMINE_EXPLORATION_UNIT: ExplorationUnit = {
  id: 'jasmine',
  title: '茉莉花 · 江南的味道',
  subtitle: '《茉莉花》/《茉莉花开（民乐）》',
  question: '一朵花，为什么能唱出江南的味道？',
  icon: '🌼',
  color: '#6c9f83',
  source: 'textbook',
  songId: 'jasmine',
  curriculumTopicIds: ['pentatonic-scale', 'gong-shang-jue-zhi-yu', 'folk-song-region'],
  paths: [
    {
      id: 'emotion',
      label: '情绪',
      prompt: '第一遍听到这段音乐时，你的心情更接近哪一种？',
      choices: [
        { id: 'emotion-gentle', label: '温柔安静', hint: '像花香轻轻飘过', color: '#f4c6c2' },
        { id: 'emotion-curious', label: '好奇期待', hint: '像发现了一朵新花', color: '#f3d37a' },
        { id: 'emotion-happy', label: '轻快愉悦', hint: '像在春风里微笑', color: '#b7d99b' },
      ],
    },
    {
      id: 'movement',
      label: '动作',
      prompt: '音乐流动时，你最想用什么动作跟着它？',
      choices: [
        { id: 'movement-sway', label: '左右摇曳', hint: '身体随着旋律慢慢摆动', color: '#a9d7cf' },
        { id: 'movement-open', label: '双手开放', hint: '像花瓣一层层打开', color: '#f2c7a5' },
        { id: 'movement-step', label: '轻轻走步', hint: '脚步一格一格向前走', color: '#c9c2e8' },
      ],
    },
    {
      id: 'story',
      label: '故事',
      prompt: '这段音乐让你看见了怎样的画面或故事？',
      choices: [
        { id: 'story-garden', label: '花园里的清晨', hint: '露珠和花香一起醒来', color: '#d5e8b6' },
        { id: 'story-river', label: '小河边的散步', hint: '水面和旋律一起流动', color: '#b9d9ed' },
        { id: 'story-gift', label: '把花送给朋友', hint: '一朵花带着祝福出发', color: '#f2c3d1' },
      ],
    },
    {
      id: 'culture',
      label: '文化',
      prompt: '听到“江南”时，你会把这段音乐和什么联系起来？',
      choices: [
        { id: 'culture-water-town', label: '水乡小桥', hint: '河水、桥影和细雨', color: '#acd1d9' },
        { id: 'culture-jasmine', label: '茉莉花香', hint: '清淡又有记忆的香气', color: '#e8e4bb' },
        { id: 'culture-folk-song', label: '人们传唱的民歌', hint: '不同地方唱出自己的味道', color: '#e2b69e' },
      ],
    },
  ],
  evidence: {
    prompt: '比较 A、B 两段旋律：哪一段更像水流一样平稳地走？你是从哪里听出来的？',
    options: [
      {
        id: 'flowing',
        label: 'A：旋律一步一步流动，像小河向前走',
        feedback: '你听到了相邻音之间平稳的进行，这种级进让旋律显得婉转流动。',
        conceptId: 'melody-stepwise',
        isBest: true,
      },
      {
        id: 'jumping',
        label: 'B：旋律跳得更远，起伏更明显',
        feedback: '你注意到了旋律的跳进。它会带来更明显的高低起伏，我们再比较一次两段的走向。',
        conceptId: 'melody-stepwise',
        isBest: false,
      },
    ],
  },
  concepts: [
    {
      id: 'melody-stepwise',
      title: '旋律走得平稳',
      short: '相邻的音一步一步走，叫级进。',
      body: '旋律像小河一样向前流动，很多相邻的音一步一步走，这样的进行叫级进。',
      listenPrompt: '再听一听，找找旋律平稳向前走的地方。',
      ageBands: ['primary-1-2', 'primary-3-4'],
    },
    {
      id: 'melody',
      title: '旋律',
      short: '旋律是有方向、有形状的音的线条。',
      body: '一个个音按一定的节奏和方向连起来，就形成了旋律。旋律可以上行、下行，也可以重复和呼应。',
      listenPrompt: '再听一次，用手指画出旋律的大致方向。',
      ageBands: ['primary-3-4'],
    },
    {
      id: 'timbre',
      title: '音色',
      short: '不同的声音有不同的颜色。',
      body: '音色就是声音独特的样子。同一条旋律换一种声音来演奏，音乐的气质也可能发生变化。',
      listenPrompt: '再听一次，注意主旋律的声音颜色和变化。',
      ageBands: ['primary-3-4'],
    },
    {
      id: 'pentatonic-scale',
      title: '五声音阶',
      short: 'do、re、mi、sol、la 五个骨干音。',
      body: '《茉莉花》的旋律主要使用 do、re、mi、sol、la 五个音。少了半音的尖锐倾向，声音听起来圆润、开阔。',
      listenPrompt: '再听一次，感受五声音阶带来的圆润色彩。',
      ageBands: ['primary-5-6'],
    },
    {
      id: 'folk-song-region',
      title: '民歌的地域色彩',
      short: '同一首民歌在不同地方会有不同味道。',
      body: '地域、方言和演唱方式会改变民歌的气质。江苏版《茉莉花》多显得婉转细腻，其他地方的版本也可能更明快或更爽朗。',
      listenPrompt: '带着“地域色彩”再听，想想声音为什么像这个地方。',
      ageBands: ['primary-5-6'],
    },
  ],
  culture: {
    title: '江苏的茉莉花，也有不同地方的回声',
    body: '《茉莉花》是流传很广的民歌，江苏版本常用婉转、细腻的旋律唱出茉莉花香。到了不同地域，同一首歌会因为方言、节奏和演唱方式变得更明快、更爽朗或更舒展。',
    ageBands: {
      'primary-1-2': '江苏的水乡常让人想到清清的河水和淡淡的花香。',
      'primary-3-4': '江苏版《茉莉花》常以婉转的旋律和柔和的音色唱出江南气质。',
      'primary-5-6': '不同地域会唱出不同版本；比较它们，能听见民歌的地域色彩。',
    },
  },
  relisten: {
    prompt: '带着自己的感受和刚发现的线索，再听一次。你想怎样更新自己的发现？',
    choices: [
      { id: 'keep-feeling', label: '保留原来的感受', hint: '我还是这样听，但现在知道了原因。', color: '#b7d99b' },
      { id: 'add-clue', label: '增加一个新的音乐线索', hint: '我又听到了旋律、音色或地域的线索。', color: '#acd1d9' },
      { id: 'change-interpretation', label: '改变自己的理解', hint: '新的线索让我想到了不同的画面。', color: '#e2b69e' },
    ],
  },
  reflectionPrompts: {
    'primary-1-2': '我听到的《茉莉花》像______，因为它的旋律______。',
    'primary-3-4': '我觉得这段音乐______，因为我听到了______的旋律/音色。',
    'primary-5-6': '我对江南味道的新理解是______；支持我的音乐证据是______。',
  },
}

export const EXPLORATION_UNITS: ExplorationUnit[] = [JASMINE_EXPLORATION_UNIT]

export function getExplorationUnit(id?: string): ExplorationUnit {
  return EXPLORATION_UNITS.find((unit) => unit.id === id) ?? JASMINE_EXPLORATION_UNIT
}

export function getExplorationAgeBand(
  grade?: PrimaryGrade | number | null
): ExplorationAgeBand {
  if (typeof grade !== 'number' || !Number.isInteger(grade) || grade < 1 || grade > 6) {
    return 'primary-1-2'
  }
  if (grade <= 2) return 'primary-1-2'
  if (grade <= 4) return 'primary-3-4'
  return 'primary-5-6'
}
