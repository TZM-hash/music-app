import type { JourneyStepId, ReferenceActivity } from '../referenceCourseware'

const COMMON_STEPS: JourneyStepId[] = ['hook', 'listen', 'feel', 'notice', 'try', 'explain', 'create', 'reflect']

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
      correct: '你找到一个可以听见、比较和再次尝试的音乐线索。',
      retry: '回听一次，注意音高、时值、速度或音色的差别。',
      complete: '这条线索已经连接到音乐概念，可以继续探索。',
    },
    summary,
  }
}

export const GRADE_TWO_ACTIVITIES: ReferenceActivity[] = [
  activity(
    'g2-do-mi-sol-activity',
    'note-ladder',
    'g2-do-mi-sol',
    'do、mi、sol 音高阶梯',
    '听三个唱名，再把它们放到自己的音高阶梯上。',
    'do、mi、sol 是三个可以听见高低关系的唱名。',
    'g2/solfege/ladder',
    'g2/solfege/do-mi-sol'
  ),
  activity(
    'g2-135-polyphony-activity',
    'layered-listening',
    'g2-135-polyphony',
    '135 声部小屋',
    '打开和关闭不同声部，听声音怎样从一个人变成一群人。',
    '多声部不是声音越多越好，而是不同线条同时进行并互相配合。',
    'g2/polyphony/rooms',
    'g2/polyphony/135'
  ),
  activity(
    'g2-fast-rhythm-activity',
    'rhythm-tap',
    'g2-fast-rhythm',
    '快速节奏反应',
    '同一个节奏快起来以后，身体和耳朵会发现什么？',
    '速度改变会让相同节奏呈现不同的运动感。',
    'g2/rhythm/speedometer',
    'g2/rhythm/fast'
  ),
  activity(
    'g2-solfege-listen-activity',
    'listen-and-choose',
    'g2-solfege-listen',
    '听音回应唱名',
    '先听一小句，再用唱名或选择回应它。',
    '视唱把听见的旋律变成自己的声音。',
    'g2/solfege/echo',
    'g2/solfege/response'
  ),
  activity(
    'g2-135-hearing-activity',
    'note-ladder',
    'g2-135-hearing',
    '135 听音寻宝',
    '从三个候选唱名里找到你听到的声音。',
    '听辨唱名时，可以关注音高方向和声音在阶梯上的位置。',
    'g2/solfege/treasure',
    'g2/solfege/135-hearing'
  ),
  activity(
    'g2-meter-creation-activity',
    'rhythm-builder',
    'g2-meter-creation',
    '节拍创编小工坊',
    '先选择拍子，再拼一条可以走出来的节奏。',
    '拍子给节奏提供稳定分组，创编让节奏变成自己的表达。',
    'g2/rhythm/workshop',
    'g2/rhythm/create'
  ),
  activity(
    'g2-note-values-activity',
    'rhythm-builder',
    'g2-note-values',
    '音符时值拼图',
    '比较二分、四分、八分和十六分音符的长短关系。',
    '音符时值表示声音持续多久，短时值可以让节奏更灵活。',
    'g2/rhythm/note-values',
    'g2/rhythm/values'
  ),
  activity(
    'g2-violin-piano-flute-activity',
    'instrument-detective',
    'g2-violin-piano-flute',
    '小提琴、钢琴、笛子音色站',
    '比较拉、弹、吹三种演奏方式带来的声音颜色。',
    '乐器的材料和演奏方式会共同决定音色与文化联想。',
    'g2/instruments/violin-piano-flute',
    'g2/instruments/compare'
  ),
  activity(
    'g2-fa-si-high-do-activity',
    'note-ladder',
    'g2-fa-si-high-do',
    '新的唱名到哪里？',
    '把 fa、si 和高音 do 放进音高空间。',
    '唱名可以帮助我们记住旋律在音高空间中的位置。',
    'g2/solfege/new-names',
    'g2/solfege/fa-si-high-do'
  ),
  activity(
    'g2-meter-2-3-activity',
    'meter-movement',
    'g2-meter-2-3',
    '二拍子和三拍子律动',
    '选择适合音乐的动作，感受拍子如何循环。',
    '拍子的分组会影响身体的重心和动作方向。',
    'g2/meter/two-three',
    'g2/meter/movement'
  ),
  activity(
    'g2-percussion-family-activity',
    'instrument-detective',
    'g2-percussion-family',
    '打击乐器找家',
    '按演奏方式和声音质感给打击乐器分类。',
    '打击乐器可以用敲、击、摇、擦等方式发声。',
    'g2/instruments/percussion-family',
    'g2/instruments/percussion'
  ),
  activity(
    'g2-review-activity',
    'review-quest',
    'g2-review',
    '二年级欣赏复习站',
    '把唱名、节奏、音色和拍子线索带回作品。',
    '复习时再次试听和比较，能帮助音乐知识留下真实声音。',
    'g2/review/music-station',
    'g2/review/works'
  ),
]

export const GRADE_TWO_ACTIVITY_IDS: Record<string, string[]> = Object.fromEntries(
  GRADE_TWO_ACTIVITIES.map((item) => [item.knowledgePointId, [item.id]])
)
