import type { ReferenceActivity, JourneyStepId } from '../referenceCourseware'

const COMMON_STEPS: JourneyStepId[] = ['hook', 'listen', 'feel', 'notice', 'try', 'explain', 'reflect']

function activity(
  id: string,
  kind: ReferenceActivity['kind'],
  knowledgePointId: string,
  title: string,
  prompt: string,
  summary: string,
  assetId: string,
  audioId: string
): ReferenceActivity {
  return {
    id,
    kind,
    knowledgePointId,
    title,
    prompt,
    steps: [...COMMON_STEPS],
    audioIds: [audioId],
    assetIds: [assetId],
    feedback: {
      correct: '你的观察已经找到一个可以听见的线索。',
      retry: '再听一次，注意声音的长短、力度或音色变化。',
      complete: '这一关完成了，把这条线索带回下一段音乐。',
    },
    summary,
  }
}

export const GRADE_ONE_ACTIVITIES: ReferenceActivity[] = [
  activity(
    'g1-posture-activity',
    'listen-and-choose',
    'g1-posture',
    '歌唱前的身体准备',
    '小歌手要出发了，先听听什么样的身体状态最适合歌唱。',
    '歌唱时身体要自然、放松、有准备。',
    'g1/forest/character-singer',
    'g1/posture/intro'
  ),
  activity(
    'g1-x-xx-rhythm-activity',
    'rhythm-builder',
    'g1-x-xx-rhythm',
    '一声还是两声？',
    '用节奏卡走过森林小路，比较 X 和 XX 的不同。',
    '一个短声音和两个更快的短声音，可以组成不同节奏。',
    'g1/forest/rhythm-cards',
    'g1/rhythm/x-xx'
  ),
  activity(
    'g1-dynamics-activity',
    'listen-and-choose',
    'g1-dynamics',
    '森林里的大声和小声',
    '听听风吹过树叶和鼓声，选择你感受到的力量。',
    '声音有强有弱，力度变化会让音乐更有表情。',
    'g1/forest/dynamics-leaves',
    'g1/dynamics/contrast'
  ),
  activity(
    'g1-meter-2-3-activity',
    'meter-movement',
    'g1-meter-2-3',
    '两步还是三步？',
    '跟着音乐走一走，感受拍子怎样分组。',
    '二拍子和三拍子会让身体形成不同的律动方向。',
    'g1/forest/movement-path',
    'g1/meter/two-three'
  ),
  activity(
    'g1-duration-activity',
    'long-short-sort',
    'g1-duration',
    '长音短音消消乐',
    '听两个声音，把它们送到长音或短音的篮子里。',
    '声音持续的时间不同，就有长音和短音。',
    'g1/forest/long-short-baskets',
    'g1/duration/compare'
  ),
  activity(
    'g1-pitch-activity',
    'note-ladder',
    'g1-pitch',
    '音高小阶梯',
    '小鸟飞上飞下，听听旋律往哪里走。',
    '声音有高有低，旋律可以向上走，也可以向下走。',
    'g1/forest/pitch-ladder',
    'g1/pitch/up-down'
  ),
  activity(
    'g1-clappers-activity',
    'instrument-detective',
    'g1-clappers',
    '响板在哪里？',
    '从森林声音中找到清脆的响板。',
    '响板通过碰击发出清脆、短促的声音。',
    'g1/forest/clappers',
    'g1/instrument/clappers'
  ),
  activity(
    'g1-woodblock-activity',
    'instrument-detective',
    'g1-woodblock',
    '木鱼的声音',
    '听听木鱼的声音像什么样的脚步。',
    '木鱼的音色清楚，适合帮助我们听见节奏。',
    'g1/forest/woodblock',
    'g1/instrument/woodblock'
  ),
  activity(
    'g1-bell-activity',
    'instrument-detective',
    'g1-bell',
    '碰钟会停留多久？',
    '听碰钟的余音，观察声音怎样慢慢消失。',
    '碰钟的声音明亮并且会延续一会儿。',
    'g1/forest/bell',
    'g1/instrument/bell'
  ),
  activity(
    'g1-labor-rhythm-activity',
    'rhythm-builder',
    'g1-labor-rhythm',
    '一起劳动的节奏',
    '跟着劳动号子和节奏卡，把动作配到音乐里。',
    '生活中的重复动作可以形成稳定、有力量的劳动节奏。',
    'g1/forest/labor-scene',
    'g1/labor/rhythm'
  ),
  activity(
    'g1-gong-drum-cymbal-activity',
    'instrument-detective',
    'g1-gong-drum-cymbal',
    '锣鼓钹音乐会',
    '比较锣、鼓、钹的音色和演奏动作。',
    '不同打击乐器的材料和演奏方式会带来不同音色。',
    'g1/forest/gong-drum-cymbal',
    'g1/instrument/gong-drum-cymbal'
  ),
  activity(
    'g1-concert-review-activity',
    'review-quest',
    'g1-concert-review',
    '森林音乐会复习',
    '打开最后一颗星，把今天听到的线索带回音乐会。',
    '复习不是背答案，而是再次听见、说出和使用音乐线索。',
    'g1/forest/concert',
    'g1/review/concert'
  ),
]

export const GRADE_ONE_ACTIVITY_IDS: Record<string, string[]> = Object.fromEntries(
  GRADE_ONE_ACTIVITIES.map((item) => [item.knowledgePointId, [item.id]])
)

export interface GradeOneForestStage {
  id: string
  label: string
  activityId: string
  story: string
}

export const GRADE_ONE_FOREST_QUEST: GradeOneForestStage[] = [
  { id: 'prologue', label: '序章 · 森林醒来了', activityId: 'g1-posture-activity', story: '先让身体和耳朵准备好。' },
  { id: 'stage-1', label: '第一关 · 节奏小路', activityId: 'g1-x-xx-rhythm-activity', story: '用 X 和 XX 找到回家的路。' },
  { id: 'stage-2', label: '第二关 · 长短溪流', activityId: 'g1-duration-activity', story: '长音和短音在溪流两边唱歌。' },
  { id: 'stage-3', label: '第三关 · 力度山谷', activityId: 'g1-dynamics-activity', story: '听风声和鼓声怎样改变力量。' },
  { id: 'stage-4', label: '第四关 · 乐器树屋', activityId: 'g1-clappers-activity', story: '找到响板、木鱼和碰钟的声音朋友。' },
  { id: 'stage-5', label: '第五关 · 劳动广场', activityId: 'g1-labor-rhythm-activity', story: '用稳定节奏和动作一起完成任务。' },
  { id: 'finale', label: '终章 · 森林音乐会', activityId: 'g1-concert-review-activity', story: '把今天的听觉发现带上舞台。' },
]
