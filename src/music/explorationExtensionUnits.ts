import type {
  ExplorationAgeBand,
  ExplorationChoice,
  ExplorationConceptCard,
  ExplorationEvidenceOption,
  ExplorationPath,
  ExplorationPathConfig,
  ExplorationUnit,
} from './explorationUnits'
import type { ExplorationCue } from './explorationAudio'
import { getEvidenceVariant, getSongFragment } from './explorationAudio'
import type {
  ExplorationToolReference,
  InstrumentSample,
  RhythmPattern,
} from './explorationTools'
import type { PrimaryGrade } from './zhejiangCurriculum'

const ALL_BANDS: ExplorationAgeBand[] = ['primary-1-2', 'primary-3-4', 'primary-5-6']
const ALL_PRIMARY_GRADES: PrimaryGrade[] = [1, 2, 3, 4, 5, 6]

interface PathDraft {
  label: string
  prompt: string
  choices: ExplorationChoice[]
}

interface EvidenceDraft {
  label: string
  feedback: string
  conceptId: string
  isBest: boolean
}

interface ExtensionUnitDraft {
  id: string
  title: string
  subtitle: string
  question: string
  icon: string
  color: string
  songId: string
  grades: PrimaryGrade[]
  semester: 1 | 2
  curriculumUnitTitle: string
  tags: string[]
  curriculumTopicIds: string[]
  paths: Record<ExplorationPath, PathDraft>
  evidence: {
    prompt: string
    flowing: EvidenceDraft
    jumping: EvidenceDraft
  }
  concepts: ExplorationConceptCard[]
  culture: ExplorationUnit['culture']
  reflectionPrompts: ExplorationUnit['reflectionPrompts']
  tools: ExplorationToolReference[]
  instrumentSamples: InstrumentSample[]
  rhythmPattern: RhythmPattern
}

function cueFor(songId: string, index: number, patch: ExplorationCue['patch']): ExplorationCue {
  return {
    ...(getSongFragment(songId, index, index + 1)[0] ?? {
      note: 'C4',
      beats: 1,
      velocity: 0.8,
      patch: 'piano',
    }),
    patch,
  }
}

function sample(
  songId: string,
  index: number,
  data: Omit<InstrumentSample, 'cue'> & { patch: ExplorationCue['patch'] }
): InstrumentSample {
  const { patch, ...rest } = data
  return { ...rest, cue: cueFor(songId, index, patch) }
}

function tool(
  id: ExplorationToolReference['id'],
  stage: ExplorationToolReference['stage'],
  title: string,
  question: string,
  evidenceLabels: string[]
): ExplorationToolReference {
  return { id, stage, title, question, evidenceLabels }
}

function path(
  id: ExplorationPath,
  label: string,
  prompt: string,
  choices: ExplorationChoice[]
): ExplorationPathConfig {
  return { id, label, prompt, choices }
}

function createUnit(draft: ExtensionUnitDraft): ExplorationUnit {
  const pathOrder: ExplorationPath[] = ['emotion', 'movement', 'story', 'culture']
  const paths = pathOrder.map((id) => path(id, draft.paths[id].label, draft.paths[id].prompt, draft.paths[id].choices))
  const evidenceOptions: ExplorationEvidenceOption[] = [draft.evidence.flowing, draft.evidence.jumping].map(
    (option, index) => ({ id: index === 0 ? 'flowing' : 'jumping', ...option })
  )

  return {
    id: draft.id,
    title: draft.title,
    subtitle: draft.subtitle,
    question: draft.question,
    icon: draft.icon,
    color: draft.color,
    source: 'extension',
    songId: draft.songId,
    grades: draft.grades,
    semester: draft.semester,
    curriculumUnitTitle: draft.curriculumUnitTitle,
    tags: draft.tags,
    curriculumTopicIds: draft.curriculumTopicIds,
    paths,
    evidence: { prompt: draft.evidence.prompt, options: evidenceOptions },
    concepts: draft.concepts,
    culture: draft.culture,
    relisten: {
      prompt: '带着刚才的感受和音乐线索，再听一次。你的发现要怎样更新？',
      choices: [
        { id: 'keep-feeling', label: '保留原来的感受', hint: '我还是这样听，但现在能说出原因。', color: '#b7d99b' },
        { id: 'add-clue', label: '增加一条音乐线索', hint: '我又听见了节奏、音色或旋律的变化。', color: '#acd1d9' },
        { id: 'change-interpretation', label: '改变自己的理解', hint: '新的线索让我想到不同的画面。', color: '#e2b69e' },
      ],
    },
    reflectionPrompts: draft.reflectionPrompts,
    tools: draft.tools,
    toolData: {
      microscopeCues: getEvidenceVariant(draft.id, 'flowing'),
      instrumentSamples: draft.instrumentSamples,
      rhythmPattern: draft.rhythmPattern,
    },
  }
}

const springFestival = createUnit({
  id: 'spring-festival-overture',
  title: '《春节序曲》·节日的火花',
  subtitle: '课堂听辨提示 · 热闹、明亮、一起行动',
  question: '一段音乐，怎样把“热闹”变成可以听见的动作？',
  icon: '🧨',
  color: '#e0673c',
  songId: 'spring-festival-overture',
  grades: [3, 4, 5, 6],
  semester: 2,
  curriculumUnitTitle: '节日与生活',
  tags: ['春节序曲', '节日', '管弦乐', '强弱'],
  curriculumTopicIds: ['dynamics-basic', 'tempo-basic', 'contrast-repetition', 'orchestra-sections'],
  paths: {
    emotion: {
      label: '情绪',
      prompt: '第一遍听到这段节日音乐，你的心情更接近哪一种？',
      choices: [
        { id: 'spring-excited', label: '热烈兴奋', hint: '像门一打开，大家都来了。', color: '#f4a261' },
        { id: 'spring-bright', label: '明亮开心', hint: '像灯笼一盏一盏亮起来。', color: '#f6d365' },
        { id: 'spring-expect', label: '期待出发', hint: '像听见远处的锣鼓，准备加入。', color: '#f7c6a3' },
      ],
    },
    movement: {
      label: '动作',
      prompt: '音乐的哪一种动作最想带着你一起做？',
      choices: [
        { id: 'spring-step', label: '踏步前进', hint: '强拍像脚步一样清楚。', color: '#f3c17a' },
        { id: 'spring-wave', label: '挥手转圈', hint: '旋律向外打开，身体也想打开。', color: '#e7b7d8' },
        { id: 'spring-clap', label: '拍手回应', hint: '重复的节奏像大家一起回应。', color: '#b7d99b' },
      ],
    },
    story: {
      label: '故事',
      prompt: '你会把这段音乐放进哪一个节日画面？',
      choices: [
        { id: 'spring-family', label: '一家人团聚', hint: '声音越来越热闹，屋子里有笑声。', color: '#f2c7a5' },
        { id: 'spring-lion', label: '街上的舞狮', hint: '鼓点带着队伍向前走。', color: '#e8a1a1' },
        { id: 'spring-lights', label: '灯会开始', hint: '明亮的音色像一片灯海。', color: '#f6d68d' },
      ],
    },
    culture: {
      label: '文化',
      prompt: '你熟悉的春节声音里，有哪些可以和音乐连起来？',
      choices: [
        { id: 'spring-drum', label: '锣鼓和鞭炮', hint: '强弱和重音让节日更有气势。', color: '#ee9b77' },
        { id: 'spring-greeting', label: '拜年问候', hint: '重复与回应像一声声祝福。', color: '#d7b8e3' },
        { id: 'spring-market', label: '热闹的街市', hint: '不同音色叠在一起，形成声音的场景。', color: '#b6d7c8' },
      ],
    },
  },
  evidence: {
    prompt: '比较 A、B 两段提示：哪一段更像节日队伍正在向前？你从哪里听出来的？',
    flowing: {
      label: 'A：强拍清楚、力度有对比，像队伍越走越热闹',
      feedback: '你抓住了强拍和力度对比。它们让音乐有了向前走的动作。',
      conceptId: 'spring-dynamics',
      isBest: true,
    },
    jumping: {
      label: 'B：音高跳得更远，像烟花突然在空中打开',
      feedback: '你听到了音高的跳进，它能制造突然打开的感觉；我们再比较它和强拍的作用。',
      conceptId: 'spring-dynamics',
      isBest: false,
    },
  },
  concepts: [
    {
      id: 'spring-dynamics',
      title: '强弱对比',
      short: '声音的力量变化，会改变动作和情绪。',
      body: '音乐有时轻、有时有力；强拍和力度变化会让我们听见队伍、脚步或节日气氛的起伏。',
      listenPrompt: '找找哪里更有力，哪里又收了回来。',
      ageBands: ALL_BANDS,
    },
    {
      id: 'spring-timbre',
      title: '管弦乐音色',
      short: '不同乐器一起出现，会形成更大的声音场景。',
      body: '铜管、弦乐和打击乐的声音颜色不同。它们轮流或叠加，就像把节日画面一层层铺开。',
      listenPrompt: '再听一次，猜猜哪一类声音最先吸引你。',
      ageBands: ['primary-3-4', 'primary-5-6'],
    },
    {
      id: 'spring-form',
      title: '重复与对比',
      short: '熟悉的材料回来，新材料带来变化。',
      body: '节日音乐常用重复让人记住，再用速度、力度或音色对比把情绪推向新的位置。',
      listenPrompt: '听听有没有“又回来、又变亮”的片段。',
      ageBands: ['primary-5-6'],
    },
  ],
  culture: {
    title: '把春节的声音带进课堂',
    body: '春节序曲以节日生活为音乐想象。这里使用短小的课堂示范音型来观察节奏、力度和音色，不替代原曲录音；老师可以播放正版音源，再让学生用同样的问题去听。',
    ageBands: {
      'primary-1-2': '你熟悉的春节声音可能有脚步、笑声、锣鼓和问候。先找一个你最熟悉的声音。',
      'primary-3-4': '想想音乐怎样用强弱、重复和不同音色，把节日场景变得更有动作。',
      'primary-5-6': '把节日经验和音乐结构联系起来：哪些材料重复了？哪些地方出现了对比？',
    },
  },
  reflectionPrompts: {
    'primary-1-2': '我听到的节日音乐像______，因为它的声音______。',
    'primary-3-4': '我觉得这段音乐很______，因为我听到了______的强弱/音色变化。',
    'primary-5-6': '我对节日气氛的新理解是______；支持我的音乐证据是______。',
  },
  tools: [
    tool('microscope', 'evidence', '音乐显微镜', '节日的“热闹”具体藏在哪个声音变化里？', ['强拍清楚', '力度变亮', '重复出现']),
    tool('instrument', 'concept', '乐器探秘台', '哪一种乐器颜色最像节日场景？', ['明亮', '有力', '厚实']),
    tool('rhythm', 'relisten', '节奏与动作工作台', '怎样用稳定拍走出节日队伍？', ['稳定拍', '重音', '一起动作']),
  ],
  instrumentSamples: [
    sample('spring-festival-overture', 0, { id: 'spring-trumpet', label: '明亮有力的铜管样本', instrument: '小号', family: '铜管乐器', texture: '明亮、集中', technique: '吹奏', cultureNote: '铜管的明亮音色常能把节日的号召感推到前面。', patch: 'piano' }),
    sample('spring-festival-overture', 2, { id: 'spring-drum', label: '清楚有力的打击样本', instrument: '小鼓', family: '打击乐器', texture: '清脆、有重音', technique: '敲击', cultureNote: '打击乐把脚步和强拍变得更容易跟随。', patch: 'musicbox' }),
  ],
  rhythmPattern: {
    bpm: 108,
    beatsPerBar: 4,
    steps: [
      { beats: 1, label: '迎', accent: true },
      { beats: 1, label: '走' },
      { beats: 1, label: '跳' },
      { beats: 1, label: '亮' },
    ],
    movementWords: ['走', '跳', '挥', '拍', '转'],
  },
})

const jiangnanSizhu = createUnit({
  id: 'jiangnan-sizhu',
  title: '江南丝竹·一条旋律和它的朋友',
  subtitle: '小型合奏 · 听见主线、陪伴和回应',
  question: '一条旋律，怎样和身边的声音一起变得更有层次？',
  icon: '🎋',
  color: '#4f9d8c',
  songId: 'jiangnan-sizhu',
  grades: [4, 5, 6],
  semester: 2,
  curriculumUnitTitle: '小小合奏',
  tags: ['江南丝竹', '主旋律', '音色', '合奏'],
  curriculumTopicIds: ['arrangement-color', 'texture-melody-accompaniment', 'ostinato', 'orchestra-sections'],
  paths: {
    emotion: {
      label: '情绪',
      prompt: '第一遍听江南丝竹，你的心情更靠近哪一边？',
      choices: [
        { id: 'sizhu-gentle', label: '温柔流动', hint: '像水面被微风轻轻推开。', color: '#b8d8cc' },
        { id: 'sizhu-lively', label: '清亮灵巧', hint: '像小声音在互相打招呼。', color: '#f3d37a' },
        { id: 'sizhu-peaceful', label: '安静有层次', hint: '不喧闹，但里面有很多声音。', color: '#b8cde3' },
      ],
    },
    movement: {
      label: '动作',
      prompt: '你想怎样跟着主线和陪伴声部？',
      choices: [
        { id: 'sizhu-sway', label: '水波摇曳', hint: '跟着主旋律的长线条。', color: '#acd1d9' },
        { id: 'sizhu-point', label: '手指点画', hint: '点出一粒粒清脆的装饰声音。', color: '#f2c7a5' },
        { id: 'sizhu-weave', label: '双手交织', hint: '让两条声音在空中交会。', color: '#d6c6e5' },
      ],
    },
    story: {
      label: '故事',
      prompt: '这些声音像在讲一个怎样的江南故事？',
      choices: [
        { id: 'sizhu-boat', label: '小船慢慢经过', hint: '一条线前行，另一条线陪着它。', color: '#b7d7dd' },
        { id: 'sizhu-garden', label: '园林里的对话', hint: '不同声音像隔着窗互相回应。', color: '#c7dfb6' },
        { id: 'sizhu-walk', label: '桥边散步', hint: '主线和背景一起铺出空间。', color: '#e4c2ac' },
      ],
    },
    culture: {
      label: '文化',
      prompt: '你会用哪个江南场景来理解这种合奏？',
      choices: [
        { id: 'sizhu-water', label: '水巷和小桥', hint: '声音有远有近，像空间被打开。', color: '#acd1d9' },
        { id: 'sizhu-courtyard', label: '院落里的相聚', hint: '小型合奏像熟悉的人围坐在一起。', color: '#e5c29c' },
        { id: 'sizhu-bamboo', label: '竹影和风声', hint: '清亮音色和柔和线条一起流动。', color: '#b7d99b' },
      ],
    },
  },
  evidence: {
    prompt: '比较 A、B 两段：哪一段更容易听见“主旋律和陪伴”？你从哪里听出来的？',
    flowing: {
      label: 'A：一条线清楚向前，旁边有轻轻的声音陪着它',
      feedback: '你听见了主旋律和陪伴声部的层次，这就是合奏里的声音分工。',
      conceptId: 'sizhu-texture',
      isBest: true,
    },
    jumping: {
      label: 'B：声音轮流跳出来，每一条线都很突出',
      feedback: '你注意到不同声部轮流出现。再比较一次，哪一段更像一条主线带着大家走？',
      conceptId: 'sizhu-texture',
      isBest: false,
    },
  },
  concepts: [
    {
      id: 'sizhu-texture',
      title: '主旋律与陪伴',
      short: '合奏不只是声音变多，还要听出谁在说主要的话。',
      body: '当一条旋律比较清楚，其他声部在旁边补充、回应或铺底，就形成了可以辨认的层次。',
      listenPrompt: '用手指跟住最像“说话”的那条旋律。',
      ageBands: ['primary-3-4', 'primary-5-6'],
    },
    {
      id: 'sizhu-instrument',
      title: '音色搭配',
      short: '音色不同，旋律的性格也会不同。',
      body: '竹笛的清亮、琵琶的颗粒和二胡的连贯，都能让同一条旋律出现不同颜色。',
      listenPrompt: '再听一次，找出最清亮或最柔和的声音。',
      ageBands: ALL_BANDS,
    },
    {
      id: 'sizhu-ensemble',
      title: '合奏中的回应',
      short: '听见别人，也让自己的声部留出空间。',
      body: '小型合奏常有呼应、交替和重叠。每个声部既要表达，也要听见同伴。',
      listenPrompt: '听听有没有一个声音出现后，另一个声音马上回应。',
      ageBands: ['primary-5-6'],
    },
  ],
  culture: {
    title: '江南丝竹：熟悉的人一起说音乐',
    body: '江南丝竹常以小型合奏呈现，丝弦与竹管等乐器在旋律、装饰和陪伴之间互相配合。本单元把“主线与朋友”作为入口，让学生先听层次，再认识织体。',
    ageBands: {
      'primary-1-2': '想象几个人一起说话：有人说主要的话，有人轻轻回应。',
      'primary-3-4': '听一听哪条线最像主旋律，哪种声音在旁边陪伴。',
      'primary-5-6': '把“主旋律、伴奏、回应”作为观察角度，描述合奏的层次。',
    },
  },
  reflectionPrompts: {
    'primary-1-2': '我听到的合奏像______，因为有一个声音在______。',
    'primary-3-4': '我听见______是主旋律，旁边的______让音乐更有层次。',
    'primary-5-6': '我对合奏层次的新理解是______；我听到的依据是______。',
  },
  tools: [
    tool('microscope', 'evidence', '音乐显微镜', '把主旋律和陪伴声部分开听。', ['主线清楚', '声音重叠', '轮流回应']),
    tool('instrument', 'concept', '乐器探秘台', '比较不同乐器怎样改变同一条旋律的颜色。', ['清亮', '颗粒感', '连贯']),
    tool('rhythm', 'relisten', '节奏与动作工作台', '让身体同时感受主线和背景的脉搏。', ['稳定拍', '交替', '留出空间']),
  ],
  instrumentSamples: [
    sample('jiangnan-sizhu', 0, { id: 'sizhu-dizi', label: '清亮的吹奏样本', instrument: '竹笛', family: '吹奏乐器', texture: '清亮、流动', technique: '气息吹奏', cultureNote: '竹笛的清亮音色可以把旋律线条提到前面。', patch: 'musicbox' }),
    sample('jiangnan-sizhu', 1, { id: 'sizhu-pipa', label: '清脆的弹拨样本', instrument: '琵琶', family: '弹拨乐器', texture: '清脆、颗粒感', technique: '拨弦', cultureNote: '弹拨音头清楚，适合听见装饰和回应。', patch: 'piano' }),
  ],
  rhythmPattern: {
    bpm: 78,
    beatsPerBar: 4,
    steps: [
      { beats: 1, label: '主线', accent: true },
      { beats: 1, label: '陪伴' },
      { beats: 1, label: '回应' },
      { beats: 1, label: '留白' },
    ],
    movementWords: ['摇', '点', '交织', '停', '回应'],
  },
})

const yueOpera = createUnit({
  id: 'yue-opera',
  title: '越剧·水袖里的唱腔',
  subtitle: '浙江地方戏曲 · 听见婉转、停顿和舞台动作',
  question: '一句唱腔，怎样用声音和动作把人物的心事说出来？',
  icon: '🎭',
  color: '#a75d7d',
  songId: 'yue-opera',
  grades: [4, 5, 6],
  semester: 2,
  curriculumUnitTitle: '中国戏曲与民间音乐',
  tags: ['越剧', '唱腔', '水袖', '地方文化'],
  curriculumTopicIds: ['folk-song-region', 'opera-role-types', 'ornaments-intro', 'breath-mark'],
  paths: {
    emotion: {
      label: '情绪',
      prompt: '这段唱腔让你先感到哪一种情绪？',
      choices: [
        { id: 'yue-tender', label: '细腻婉转', hint: '像心里有话，慢慢说出来。', color: '#e7b9c8' },
        { id: 'yue-longing', label: '想念牵挂', hint: '声音拉长，好像在等一个人。', color: '#c3c4e8' },
        { id: 'yue-brave', label: '柔中有力', hint: '外表轻柔，里面有坚持。', color: '#e5b285' },
      ],
    },
    movement: {
      label: '动作',
      prompt: '如果用水袖或手势跟着唱腔，你会怎样移动？',
      choices: [
        { id: 'yue-sleeve', label: '水袖展开', hint: '把长音的线条拉开。', color: '#d7b9df' },
        { id: 'yue-step', label: '小步停走', hint: '在停顿处留下表情。', color: '#e7c18e' },
        { id: 'yue-look', label: '回眸停住', hint: '旋律收住时，动作也收住。', color: '#b7d6c4' },
      ],
    },
    story: {
      label: '故事',
      prompt: '你会把这段唱腔放进哪一种舞台时刻？',
      choices: [
        { id: 'yue-wait', label: '等人回信', hint: '一句话绕了几个弯，才说出想念。', color: '#bfc9e9' },
        { id: 'yue-meet', label: '园中相遇', hint: '声音和动作都很轻，却很有方向。', color: '#c7ddb7' },
        { id: 'yue-choice', label: '做出决定', hint: '柔和的声音里出现了力量。', color: '#e6ad9a' },
      ],
    },
    culture: {
      label: '文化',
      prompt: '你对越剧舞台最想先观察什么？',
      choices: [
        { id: 'yue-voice', label: '唱腔和方言', hint: '语言的声调会影响旋律的弯曲。', color: '#e7b4c2' },
        { id: 'yue-sleeve-culture', label: '水袖和身段', hint: '动作把声音里的长短和停顿显现出来。', color: '#c6c3e1' },
        { id: 'yue-stage', label: '锣鼓和舞台', hint: '伴奏帮助人物进入、停顿和转身。', color: '#edc18b' },
      ],
    },
  },
  evidence: {
    prompt: '比较 A、B 两段：哪一段更像“唱腔在说话”？你听到了哪些弯曲或停顿？',
    flowing: {
      label: 'A：音与音之间有婉转的装饰和停顿，像一句话有语气',
      feedback: '你听见了装饰和呼吸，它们让旋律更像人物在说话。',
      conceptId: 'yue-ornament',
      isBest: true,
    },
    jumping: {
      label: 'B：音高起伏更大，像舞台动作突然打开',
      feedback: '你注意到了音高的起伏。越剧的唱腔还常用装饰和停顿来形成语气，我们再听一遍。',
      conceptId: 'yue-ornament',
      isBest: false,
    },
  },
  concepts: [
    {
      id: 'yue-ornament',
      title: '装饰与腔调',
      short: '音符周围的小弯曲，会让唱腔更有语气。',
      body: '戏曲唱腔不是把每个音唱得笔直，而会用装饰、滑动和回旋表现人物的语气与情绪。',
      listenPrompt: '找一处旋律没有直直走，而是绕了一下的地方。',
      ageBands: ['primary-3-4', 'primary-5-6'],
    },
    {
      id: 'yue-phrase',
      title: '乐句会呼吸',
      short: '长短、停顿和收束让一句唱腔有了表情。',
      body: '唱腔的乐句像说话一样会换气、停一停、再把情绪送出去。动作也可以帮助我们看见这种呼吸。',
      listenPrompt: '听听哪里像说完半句话，哪里真正收住。',
      ageBands: ALL_BANDS,
    },
    {
      id: 'yue-timbre',
      title: '地方腔调的颜色',
      short: '语言、音色和舞台习惯一起形成地方味道。',
      body: '越剧发源于浙江嵊州一带，唱腔、语言声调和舞台身段共同形成了辨识度很高的地方风格。',
      listenPrompt: '带着“地方腔调”再听，想想声音为什么有这样的性格。',
      ageBands: ['primary-5-6'],
    },
  ],
  culture: {
    title: '越剧：从浙江乡土走上舞台',
    body: '越剧是浙江有代表性的地方戏曲。欣赏时可以同时看三件事：唱腔怎样说话，乐器怎样托住人物，水袖和身段怎样把声音变成动作。',
    ageBands: {
      'primary-1-2': '把唱腔想成会转弯的说话声：哪里拉长，哪里停一停？',
      'primary-3-4': '观察唱腔、呼吸和动作怎样互相配合，先说听到的现象。',
      'primary-5-6': '把装饰、乐句和地方腔调联系起来，理解戏曲音乐为什么像人物在说话。',
    },
  },
  reflectionPrompts: {
    'primary-1-2': '我听到的唱腔像______，因为它在______的地方停/转了弯。',
    'primary-3-4': '我觉得这句唱腔很______，因为我听到了______的装饰/呼吸。',
    'primary-5-6': '我对越剧地方腔调的新理解是______；支持我的音乐证据是______。',
  },
  tools: [
    tool('microscope', 'evidence', '音乐显微镜', '把唱腔里的装饰、停顿和收束放大。', ['旋律弯曲', '停顿清楚', '长音延展']),
    tool('instrument', 'concept', '乐器探秘台', '听听伴奏怎样托住人物的声音。', ['柔和', '清脆', '连续']),
  ],
  instrumentSamples: [
    sample('yue-opera', 0, { id: 'yue-erhu', label: '连贯的拉弦样本', instrument: '二胡', family: '拉弦乐器', texture: '柔和、连贯', technique: '拉弦', cultureNote: '拉弦音色能把唱腔中的长线条托得更连贯。', patch: 'strings' }),
    sample('yue-opera', 2, { id: 'yue-percussion', label: '清楚的戏曲伴奏样本', instrument: '板鼓', family: '打击乐器', texture: '清脆、有停顿', technique: '敲击', cultureNote: '打击乐可以提示进入、停顿和舞台动作。', patch: 'musicbox' }),
  ],
  rhythmPattern: {
    bpm: 72,
    beatsPerBar: 4,
    steps: [
      { beats: 1, label: '唱', accent: true },
      { beats: 1, label: '延' },
      { beats: 1, label: '停' },
      { beats: 1, label: '答' },
    ],
    movementWords: ['展', '停', '回眸', '走', '收'],
  },
})

const liangzhu = createUnit({
  id: 'liang-zhu',
  title: '《梁祝》·先听见主题，再走进故事',
  subtitle: '小提琴协奏曲 · 听见主题、对比和情绪转折',
  question: '一段旋律，怎样让我们听见人物、故事和情绪的变化？',
  icon: '🦋',
  color: '#7b789b',
  songId: 'liang-zhu',
  grades: [5, 6],
  semester: 1,
  curriculumUnitTitle: '音乐家与作品',
  tags: ['梁祝', '主题旋律', '故事', '小提琴'],
  curriculumTopicIds: ['period-form', 'contrast-repetition', 'orchestra-sections', 'listening-map'],
  paths: {
    emotion: {
      label: '情绪',
      prompt: '听到这段主题时，你的第一感觉是什么？',
      choices: [
        { id: 'liangzhu-tender', label: '温柔眷恋', hint: '像两个人在故事里第一次相遇。', color: '#e7bdd0' },
        { id: 'liangzhu-dramatic', label: '紧张转折', hint: '熟悉的主题忽然换了一种力量。', color: '#c8b89f' },
        { id: 'liangzhu-hopeful', label: '展开希望', hint: '声音一点点变大，情绪也向前走。', color: '#b6d5c8' },
      ],
    },
    movement: {
      label: '动作',
      prompt: '如果用动作画出“主题的变化”，你会怎样做？',
      choices: [
        { id: 'liangzhu-step', label: '一步步走近', hint: '主题像人物一样慢慢出现。', color: '#d8c29e' },
        { id: 'liangzhu-circle', label: '回到熟悉动作', hint: '主题回来时，故事也像被重新想起。', color: '#c9c5e4' },
        { id: 'liangzhu-open', label: '双手向外展开', hint: '主题变得更宽广、更有力量。', color: '#b8d7c6' },
      ],
    },
    story: {
      label: '故事',
      prompt: '你会把这段主题放进故事的哪一个时刻？',
      choices: [
        { id: 'liangzhu-meet', label: '人物相遇', hint: '熟悉的旋律带着故事出现。', color: '#c6c8db' },
        { id: 'liangzhu-separate', label: '离别转折', hint: '音乐的对比让情绪发生变化。', color: '#b6d7cd' },
        { id: 'liangzhu-butterfly', label: '化蝶想象', hint: '旋律从沉重走向更开阔的画面。', color: '#b9d4e7' },
      ],
    },
    culture: {
      label: '文化',
      prompt: '理解《梁祝》时，你想从哪一个线索进入？',
      choices: [
        { id: 'liangzhu-theme', label: '主题旋律', hint: '先听见一条让人记住的旋律线。', color: '#d6bfd3' },
        { id: 'liangzhu-instrument', label: '小提琴音色', hint: '听它怎样让旋律像人在歌唱。', color: '#b9d2dc' },
        { id: 'liangzhu-story', label: '故事文化', hint: '把人物和音乐变化联系起来。', color: '#d8c39c' },
      ],
    },
  },
  evidence: {
    prompt: '比较 A、B 两段：哪一段更像主题正在讲述故事？你抓住了什么变化？',
    flowing: {
      label: 'A：熟悉的主题回来，又换了新的音色和力度',
      feedback: '你听见了主题的回归和变化。熟悉的材料回来时，故事也会产生新的意义。',
      conceptId: 'liangzhu-theme',
      isBest: true,
    },
    jumping: {
      label: 'B：音高突然跳开，像情绪出现了强烈转折',
      feedback: '你听见了音高的距离和情绪转折。再比较它和主题回归的不同作用。',
      conceptId: 'liangzhu-theme',
      isBest: false,
    },
  },
  concepts: [
    {
      id: 'liangzhu-theme',
      title: '主题旋律',
      short: '一条能被记住的旋律线，像故事里反复出现的人物。',
      body: '主题是作品里重要、容易被记住的音乐材料。它可以回来，也可以换音色、力度或伴奏，带出新的情绪。',
      listenPrompt: '找一条你听过一次后还能认出来的旋律。',
      ageBands: ['primary-3-4', 'primary-5-6'],
    },
    {
      id: 'liangzhu-timbre',
      title: '小提琴的歌唱感',
      short: '拉弦音色可以把旋律拉成长线，像人物在歌唱。',
      body: '小提琴能用连贯的线条、滑动和力度变化表现细腻情绪。我们先听音色，再讨论它让故事产生了什么感觉。',
      listenPrompt: '找找旋律像一口气唱出来的地方。',
      ageBands: ['primary-5-6'],
    },
    {
      id: 'liangzhu-map',
      title: '故事听赏地图',
      short: '用线条记录主题出现、对比和回归。',
      body: '把主题第一次出现、情绪转折和再次回来画下来，音乐就从“故事感觉”变成了一张可以交流的听赏地图。',
      listenPrompt: '用线条画出主题从出现到回归的路线。',
      ageBands: ['primary-3-4', 'primary-5-6'],
    },
  ],
  culture: {
    title: '《梁祝》：浙江故事进入交响舞台',
    body: '《梁祝》以中国民间爱情故事为文化背景，用小提琴协奏曲的方式讲述人物和情绪。欣赏时可以区分故事联想与音乐证据：先听主题、音色和结构，再说自己的画面。',
    ageBands: {
      'primary-1-2': '想象一条旋律在故事里出现：它是温柔的、勇敢的，还是正在变化？',
      'primary-3-4': '用主题、音色和强弱变化画一张自己的故事听赏地图。',
      'primary-5-6': '区分“故事联想”和“音乐证据”，用听到的主题、结构或音色说明自己的理解。',
    },
  },
  reflectionPrompts: {
    'primary-1-2': '我听到的《梁祝》主题像______，因为它的声音______。',
    'primary-3-4': '这段音乐让我想到______，因为它的主题/音色______了。',
    'primary-5-6': '我对《梁祝》故事与音乐的新理解是______；支持我的音乐证据是______。',
  },
  tools: [
    tool('microscope', 'evidence', '音乐显微镜', '找出主题出现、变化和回归的地方。', ['主题回来', '力度变化', '情绪转折']),
    tool('instrument', 'concept', '乐器探秘台', '比较拉弦和打击音色怎样改变故事感。', ['歌唱感', '厚实', '明亮']),
    tool('rhythm', 'relisten', '节奏与动作工作台', '用动作画出主题出现和情绪转折。', ['稳定拍', '展开', '回归']),
  ],
  instrumentSamples: [
    sample('liang-zhu', 0, { id: 'liangzhu-violin', label: '连贯歌唱的拉弦样本', instrument: '小提琴', family: '拉弦乐器', texture: '柔和、连贯', technique: '拉弦', cultureNote: '小提琴的长线条适合表现主题和人物的细腻情绪。', patch: 'strings' }),
    sample('liang-zhu', 2, { id: 'liangzhu-orchestra', label: '厚实有力量的合奏样本', instrument: '管弦合奏', family: '管弦乐器', texture: '厚实、展开', technique: '合奏', cultureNote: '合奏音色可以把熟悉的主题推向更大的舞台空间。', patch: 'piano' }),
  ],
  rhythmPattern: {
    bpm: 80,
    beatsPerBar: 4,
    steps: [
      { beats: 1, label: '主题', accent: true },
      { beats: 1, label: '展开' },
      { beats: 1, label: '转折' },
      { beats: 1, label: '回归' },
    ],
    movementWords: ['走', '回', '展开', '转身', '停'],
  },
})

const dragonBoat = createUnit({
  id: 'dragon-boat-rhythm',
  title: '龙舟鼓点·一起划向前',
  subtitle: '端午节奏 · 从共同脉搏听见合作',
  question: '一群人怎样靠同一个鼓点，一起把船划向前？',
  icon: '🛶',
  color: '#2e8b8b',
  songId: 'dragon-boat-rhythm',
  grades: ALL_PRIMARY_GRADES,
  semester: 2,
  curriculumUnitTitle: '节日与生活',
  tags: ['龙舟', '鼓点', '稳定拍', '合作'],
  curriculumTopicIds: ['steady-beat', 'meter-basic', 'rhythm-pattern-ta-ta-ti', 'call-response'],
  paths: {
    emotion: {
      label: '情绪',
      prompt: '听到共同鼓点时，你更接近哪一种感受？',
      choices: [
        { id: 'dragon-power', label: '有力量', hint: '大家的动作连在了一起。', color: '#e99572' },
        { id: 'dragon-excited', label: '紧张兴奋', hint: '比赛开始前，心跳也在加速。', color: '#f3c875' },
        { id: 'dragon-together', label: '一起努力', hint: '一个人慢一点，大家就会互相等。', color: '#a9d7cf' },
      ],
    },
    movement: {
      label: '动作',
      prompt: '哪个动作最能表现共同脉搏？',
      choices: [
        { id: 'dragon-row', label: '一起划', hint: '手臂在同一个拍点落下。', color: '#a6d2df' },
        { id: 'dragon-pull', label: '向后拉', hint: '重音像把船向前推。', color: '#e4c39a' },
        { id: 'dragon-stop', label: '听鼓停住', hint: '停顿也需要大家一起完成。', color: '#d0c7e5' },
      ],
    },
    story: {
      label: '故事',
      prompt: '这组鼓点会出现在怎样的龙舟故事里？',
      choices: [
        { id: 'dragon-start', label: '出发', hint: '鼓点把大家召集到同一条船上。', color: '#f2c58f' },
        { id: 'dragon-race', label: '冲刺', hint: '重复的节奏越来越有方向。', color: '#e9a38f' },
        { id: 'dragon-finish', label: '到达', hint: '最后一下像全队一起欢呼。', color: '#b6d5ba' },
      ],
    },
    culture: {
      label: '文化',
      prompt: '端午和龙舟活动让你想到什么？',
      choices: [
        { id: 'dragon-community', label: '邻里一起参加', hint: '音乐是大家共同做的事情。', color: '#b4d8d3' },
        { id: 'dragon-river', label: '河流和水面', hint: '鼓声在开阔的地方传得更远。', color: '#a9cee3' },
        { id: 'dragon-memory', label: '节日记忆', hint: '同一个节奏会把人带回熟悉的场景。', color: '#e5c29d' },
      ],
    },
  },
  evidence: {
    prompt: '比较 A、B 两段：哪一段更适合大家一起划？你听到了怎样的稳定拍或重音？',
    flowing: {
      label: 'A：脉搏稳定，重音反复出现，动作容易对齐',
      feedback: '你听见了稳定拍和重音。共同脉搏让很多人的动作可以靠近。',
      conceptId: 'dragon-beat',
      isBest: true,
    },
    jumping: {
      label: 'B：节奏有更多变化，像个人在自由发挥',
      feedback: '你听到了节奏变化。自由变化很有趣，但集体划船还需要一条大家都能跟住的脉搏。',
      conceptId: 'dragon-beat',
      isBest: false,
    },
  },
  concepts: [
    {
      id: 'dragon-beat',
      title: '稳定拍',
      short: '一格一格向前的共同脉搏，是合作的地基。',
      body: '稳定拍不等于每一下都一样响，而是时间间隔保持清楚，让大家知道下一步什么时候到来。',
      listenPrompt: '先不管复杂节奏，只找每一拍的共同脉搏。',
      ageBands: ALL_BANDS,
    },
    {
      id: 'dragon-accent',
      title: '重音与动作',
      short: '更突出的那一下，会提示身体怎样发力。',
      body: '重音像一个动作提示：可以是划桨落下、队伍发力，也可以是大家一起喊出的回应。',
      listenPrompt: '听听哪一下最想让你用力。',
      ageBands: ['primary-3-4', 'primary-5-6'],
    },
    {
      id: 'dragon-response',
      title: '呼应与合作',
      short: '一个节奏提出动作，另一个节奏回应它。',
      body: '集体音乐常用重复、呼应和轮流，让每个人既能表达，又能听见队伍。',
      listenPrompt: '找一处像“大家一起说”的重复或回应。',
      ageBands: ['primary-5-6'],
    },
  ],
  culture: {
    title: '端午龙舟：把节奏变成共同动作',
    body: '龙舟活动让节奏和身体合作变得很直观：鼓点提示、划桨回应、全队保持方向。本单元从动作和稳定拍进入，不要求学生先记住拍号名称。',
    ageBands: {
      'primary-1-2': '想象大家一起划船：什么时候落桨，什么时候停一下？',
      'primary-3-4': '用重音和稳定拍说明：为什么同一个脉搏能帮助大家合作？',
      'primary-5-6': '把稳定拍、重音和呼应联系起来，描述音乐如何组织集体动作。',
    },
  },
  reflectionPrompts: {
    'primary-1-2': '我听到的龙舟鼓点像______，因为大家在______的拍子上一起动作。',
    'primary-3-4': '我觉得这段节奏很______，因为我听到了______的稳定拍/重音。',
    'primary-5-6': '我对合作节奏的新理解是______；最支持我的音乐证据是______。',
  },
  tools: [
    tool('microscope', 'evidence', '音乐显微镜', '找出让大家对齐的共同脉搏。', ['拍点稳定', '重音反复', '节奏回应']),
    tool('rhythm', 'relisten', '节奏与动作工作台', '用点击和动作体验一支队伍怎样靠近同一拍。', ['稳定拍', '动作靠近', '一起停止']),
    tool('instrument', 'concept', '乐器探秘台', '比较鼓、锣等打击音色怎样改变动作感。', ['有力', '清脆', '延续']),
  ],
  instrumentSamples: [
    sample('dragon-boat-rhythm', 0, { id: 'dragon-drum', label: '有力的鼓点样本', instrument: '龙舟鼓', family: '打击乐器', texture: '厚实、有力', technique: '敲击', cultureNote: '鼓点把共同脉搏说得清楚，方便队伍一起行动。', patch: 'piano' }),
    sample('dragon-boat-rhythm', 2, { id: 'dragon-gong', label: '开阔的锣声样本', instrument: '锣声样本', family: '打击乐器', texture: '明亮、延展', technique: '敲击', cultureNote: '较长的延展声可以像一个动作的提示或回应。', patch: 'strings' }),
  ],
  rhythmPattern: {
    bpm: 104,
    beatsPerBar: 4,
    steps: [
      { beats: 1, label: '划', accent: true },
      { beats: 1, label: '划' },
      { beats: 1, label: '嘿', accent: true },
      { beats: 1, label: '划' },
    ],
    movementWords: ['划', '拉', '喊', '停', '推'],
  },
})

export const ZHEJIANG_EXPLORATION_UNITS: ExplorationUnit[] = [
  springFestival,
  jiangnanSizhu,
  yueOpera,
  liangzhu,
  dragonBoat,
]
