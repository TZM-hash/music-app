import { GRADE_ONE_ACTIVITY_IDS } from './referenceLessons/gradeOneUpper'
import { GRADE_TWO_ACTIVITY_IDS } from './referenceLessons/gradeTwoUpper'

export type ReferenceCourseSource = 'zhejiang' | 'renyin-reference' | 'original'
export type ReferenceGrade = 1 | 2 | 3
export type JourneyStepId =
  | 'hook'
  | 'listen'
  | 'feel'
  | 'notice'
  | 'try'
  | 'explain'
  | 'create'
  | 'reflect'

export type ReferenceActivityKind =
  | 'listen-and-choose'
  | 'instrument-detective'
  | 'long-short-sort'
  | 'rhythm-tap'
  | 'rhythm-builder'
  | 'meter-movement'
  | 'note-ladder'
  | 'voice-form-guess'
  | 'layered-listening'
  | 'sound-dictation'
  | 'review-quest'

export interface ReferenceKnowledgePoint {
  id: string
  grade: ReferenceGrade
  semester: 1
  source: ReferenceCourseSource
  unitLabel: string
  title: string
  shortPrompt: string
  concepts: string[]
  activityIds: string[]
}

export interface ReferenceActivity {
  id: string
  kind: ReferenceActivityKind
  knowledgePointId: string
  title: string
  prompt: string
  steps: JourneyStepId[]
  audioIds: string[]
  assetIds: string[]
  feedback: {
    correct: string
    retry: string
    complete: string
  }
  summary: string
}

export interface ReferenceKnowledgePointFilter {
  grade?: ReferenceGrade
  source?: ReferenceCourseSource
  search?: string
}

const point = (
  id: string,
  grade: ReferenceGrade,
  title: string,
  shortPrompt: string,
  concepts: string[]
): ReferenceKnowledgePoint => ({
  id,
  grade,
  semester: 1,
  source: 'renyin-reference',
  unitLabel: `${grade === 1 ? '一年级' : grade === 2 ? '二年级' : '三年级'}上册参考探索`,
  title,
  shortPrompt,
  concepts,
  activityIds: GRADE_ONE_ACTIVITY_IDS[id] ?? GRADE_TWO_ACTIVITY_IDS[id] ?? [],
})

export const REFERENCE_KNOWLEDGE_POINTS: ReferenceKnowledgePoint[] = [
  point('g1-posture', 1, '歌唱姿势', '让身体准备好，声音才有空间。', ['歌唱', '姿势']),
  point('g1-x-xx-rhythm', 1, 'X、XX 节奏', '听一听，一个声音和两个短声音有什么不同。', ['节奏', '模仿']),
  point('g1-dynamics', 1, '强弱', '音乐是轻轻说，还是有力量地说？', ['强', '弱', '力度']),
  point('g1-meter-2-3', 1, '二拍子、三拍子', '身体跟着几步一组的拍子走？', ['二拍子', '三拍子', '律动']),
  point('g1-duration', 1, '音的长短', '哪个声音停留得更久？', ['长音', '短音', '时值']),
  point('g1-pitch', 1, '音的高低', '旋律是往上走，还是往下走？', ['音高', '上行', '下行']),
  point('g1-clappers', 1, '响板', '听听清脆的声音来自哪一种乐器。', ['乐器', '音色']),
  point('g1-woodblock', 1, '木鱼', '木鱼的声音有什么质感？', ['乐器', '音色']),
  point('g1-bell', 1, '碰钟', '碰钟的声音会延续多久？', ['乐器', '长音']),
  point('g1-labor-rhythm', 1, '劳动节奏', '用身体和节奏表现一起劳动的场景。', ['劳动', '节奏', '动作']),
  point('g1-gong-drum-cymbal', 1, '锣、鼓、钹', '比较三种打击乐器的声音和动作。', ['打击乐器', '音色']),
  point('g1-concert-review', 1, '音乐会复习', '把听过的声音线索带回音乐会。', ['复习', '欣赏']),

  point('g2-do-mi-sol', 2, 'do、mi、sol', '听三个唱名在音高阶梯上的位置。', ['唱名', '音高']),
  point('g2-135-polyphony', 2, '135 多声部', '打开和关闭声部，听听声音怎样叠在一起。', ['多声部', '叠加']),
  point('g2-fast-rhythm', 2, '快速节奏', '同样的节奏加快以后，身体会怎样？', ['速度', '节奏']),
  point('g2-solfege-listen', 2, '视唱与听音', '先听，再用唱名回应。', ['视唱', '听音']),
  point('g2-135-hearing', 2, '听辨 135', '从三个声音中找到听到的唱名。', ['唱名', '听辨']),
  point('g2-meter-creation', 2, '节拍与创编', '选择拍子，拼出自己的节奏。', ['节拍', '创编']),
  point('g2-note-values', 2, '二分、四分、八分、十六分音符', '用时值卡比较声音持续的长度。', ['音符', '时值', '节奏']),
  point('g2-violin-piano-flute', 2, '小提琴、钢琴、笛子', '比较三种乐器的声音颜色。', ['乐器', '音色', '文化']),
  point('g2-fa-si-high-do', 2, 'fa、si、高音 do', '把新的唱名放到音高阶梯上。', ['唱名', '音区']),
  point('g2-meter-2-3', 2, '二拍子、三拍子', '听拍子并选择合适的动作。', ['二拍子', '三拍子', '动作']),
  point('g2-percussion-family', 2, '打击乐器分类', '按声音和演奏方式给乐器找家。', ['乐器分类', '打击乐器']),
  point('g2-review', 2, '歌曲与欣赏曲复习', '用线索卡回忆听过的歌曲和作品。', ['复习', '欣赏']),

  point('g3-solfege-note-names', 3, '唱名、音名', '把听到的声音和符号连接起来。', ['唱名', '音名']),
  point('g3-dynamics-marks', 3, '力度记号', '从声音变化中找到对应的力度线索。', ['力度', '记号']),
  point('g3-music-emotion', 3, '音乐与情绪', '音乐让你感到什么？哪些声音支持这种感受？', ['情绪', '主观感受']),
  point('g3-low-567-high-1', 3, '低音 567、高音 1', '比较低音区和高音区的距离。', ['音区', '音高']),
  point('g3-labor-chant', 3, '劳动号子与演唱形式', '听听领唱和回应怎样一起推动劳动。', ['劳动号子', '演唱形式']),
  point('g3-sound-dictation', 3, '听音记谱', '听完声音，把它排成简单谱面。', ['听音', '记谱']),
  point('g3-ostinato', 3, '固定节奏型伴奏', '让固定节奏成为音乐的脚步。', ['固定节奏', '伴奏']),
  point('g3-voice-ranges', 3, '男高、男低、女高、女中、童声', '从音区和音色寻找不同的声音角色。', ['人声', '音区', '音色']),
  point('g3-two-part', 3, '二声部', '先分开听，再听两个声部怎样配合。', ['二声部', '合唱']),
  point('g3-unison-chorus-round', 3, '齐唱、合唱、轮唱', '辨认大家是一起唱，还是错开进入。', ['齐唱', '合唱', '轮唱']),
  point('g3-polyphony', 3, '多声部', '用声部开关观察音乐的层次。', ['多声部', '层次']),
  point('g3-crescendo-diminuendo', 3, '强、弱、渐强、渐弱', '用音量轨迹表现音乐逐渐变强或变弱。', ['强', '弱', '渐强', '渐弱']),
  point('g3-review', 3, '歌曲与欣赏曲复习', '带着情绪、动作和文化线索再听一次。', ['复习', '欣赏']),
]

export function getReferenceKnowledgePoints(
  filter: ReferenceKnowledgePointFilter = {}
): ReferenceKnowledgePoint[] {
  const search = filter.search?.trim().toLocaleLowerCase('zh-CN')
  return REFERENCE_KNOWLEDGE_POINTS.filter((item) => {
    if (filter.grade !== undefined && item.grade !== filter.grade) return false
    if (filter.source !== undefined && item.source !== filter.source) return false
    if (!search) return true
    const haystack = [item.id, item.title, item.shortPrompt, item.unitLabel, ...item.concepts]
      .join(' ')
      .toLocaleLowerCase('zh-CN')
    return haystack.includes(search)
  })
}

export function validateReferenceCatalog(
  points: readonly ReferenceKnowledgePoint[],
  activities: readonly ReferenceActivity[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const pointIds = new Set<string>()
  for (const item of points) {
    if (pointIds.has(item.id)) errors.push(`重复知识点 id：${item.id}`)
    pointIds.add(item.id)
    if (!item.title.trim() || !item.shortPrompt.trim()) errors.push(`知识点缺少短文案：${item.id}`)
  }

  const activityIds = new Set<string>()
  for (const activity of activities) {
    if (activityIds.has(activity.id)) errors.push(`重复活动 id：${activity.id}`)
    activityIds.add(activity.id)
    if (!pointIds.has(activity.knowledgePointId)) {
      errors.push(`活动引用不存在的知识点：${activity.id}`)
    }
    for (const step of ['listen', 'try', 'reflect'] as const) {
      if (!activity.steps.includes(step)) errors.push(`活动缺少${step}步骤：${activity.id}`)
    }
    if (!activity.feedback.correct || !activity.feedback.retry || !activity.feedback.complete) {
      errors.push(`活动缺少反馈文案：${activity.id}`)
    }
  }

  return { valid: errors.length === 0, errors }
}
