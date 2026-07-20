import type { ReviewQuestion } from '../state/theoryReview'
import type { TheoryStageId } from './theoryCatalog'

export type EncyclopediaType =
  | 'composer'
  | 'appreciation'
  | 'chinese-music'
  | 'western-history'
  | 'instrument'
  | 'genre-form'

export interface EncyclopediaQuiz {
  question: string
  options: string[]
  answer: number
  explanation: string
}

export interface EncyclopediaEntry {
  id: string
  type: EncyclopediaType
  title: string
  subtitle: string
  stage: TheoryStageId
  category: string
  summary: string
  /** 多段正文：背景、特点、代表作、听赏指引（扩写阶段注入） */
  detail?: string
  keyFacts: string[]
  prompt: string
  relatedTheoryIds: string[]
  quiz: EncyclopediaQuiz[]
}

export interface EncyclopediaFilter {
  type?: EncyclopediaType
  category?: string
  stage?: TheoryStageId
  search?: string
}

export const ENCYCLOPEDIA_CATEGORIES: { type: EncyclopediaType; label: string }[] = [
  { type: 'composer', label: '音乐家' },
  { type: 'appreciation', label: '作品与欣赏' },
  { type: 'chinese-music', label: '中国传统音乐' },
  { type: 'western-history', label: '西方音乐史' },
  { type: 'instrument', label: '乐器' },
  { type: 'genre-form', label: '体裁与曲式' },
]

function quiz(title: string, category: string, fact: string): EncyclopediaQuiz[] {
  return [
    {
      question: `${title}最适合归入哪一类音乐线索？`,
      options: [category, '课堂座位', '文件格式'],
      answer: 0,
      explanation: `${title}属于${category}，可以和相关音乐发现一起回看。`,
    },
    {
      question: `探索${title}时，最应该先抓住什么？`,
      options: [fact, '按钮颜色', '屏幕宽度'],
      answer: 0,
      explanation: fact,
    },
    {
      question: `${title}可以怎样进入课堂活动？`,
      options: ['先听辨或观察，再说出依据', '只背标题', '跳过音乐材料'],
      answer: 0,
      explanation: '音乐故事要回到聆听、演唱、演奏或讨论中使用。',
    },
  ]
}

function entry(
  id: string,
  type: EncyclopediaType,
  title: string,
  subtitle: string,
  stage: TheoryStageId,
  summary: string,
  keyFacts: string[],
  prompt: string,
  relatedTheoryIds: string[]
): EncyclopediaEntry {
  const category = ENCYCLOPEDIA_CATEGORIES.find((item) => item.type === type)?.label ?? type
  return {
    id,
    type,
    title,
    subtitle,
    stage,
    category,
    summary,
    keyFacts,
    prompt,
    relatedTheoryIds,
    quiz: quiz(title, category, keyFacts[0]),
  }
}

export const ENCYCLOPEDIA_ENTRIES: EncyclopediaEntry[] = [
  entry('bach', 'composer', '巴赫', '巴洛克时期的复调大师', 'junior-basic', '巴赫的作品结构清晰、声部严密，常用来理解复调、节奏稳定和和声进行。', ['复调织体清楚', '代表作有平均律键盘曲集', '巴洛克音乐重要人物'], '听一小段赋格，找一找主题有没有在不同声部轮流出现。', ['countermelody', 'parallel-motion', 'harmonic-function']),
  entry('mozart', 'composer', '莫扎特', '古典主义的旋律天才', 'primary-upper', '莫扎特的旋律明亮、句法平衡，适合探索问答乐句、清晰终止和古典风格。', ['旋律自然流畅', '古典主义代表人物', '常见清楚的乐句结构'], '哼唱一段莫扎特旋律，判断它像提问还是回答。', ['phrase-question-answer', 'cadence', 'period-form']),
  entry('beethoven', 'composer', '贝多芬', '从古典走向浪漫的作曲家', 'junior-basic', '贝多芬常用短小动机发展出强烈的音乐戏剧性，是理解主题发展的好入口。', ['动机发展很突出', '代表作包括欢乐颂', '连接古典与浪漫风格'], '听欢乐颂主题，观察重复和变化怎样让旋律被记住。', ['motif', 'theme-development', 'variation-development']),
  entry('chopin', 'composer', '肖邦', '钢琴诗人', 'junior-basic', '肖邦作品常有歌唱性的旋律、细腻力度和自由速度，适合联系钢琴音色与乐句表达。', ['钢琴作品丰富', '旋律常有歌唱性', '常用自由速度表达'], '用同一旋律比较平直演奏和带呼吸演奏的区别。', ['rubato-and-phrasing', 'ornaments-intro', 'vocal-range']),
  entry('tchaikovsky', 'composer', '柴科夫斯基', '旋律浓郁的俄罗斯作曲家', 'junior-basic', '柴科夫斯基的舞剧和交响作品旋律鲜明、配器丰富，适合做音乐形象欣赏。', ['舞剧音乐广为流传', '旋律情感强烈', '管弦乐色彩丰富'], '听天鹅湖主题，说出主要旋律由哪类乐器呈现。', ['orchestra-sections', 'arrangement-color', 'listening-map']),
  entry('nie-er', 'composer', '聂耳', '义勇军进行曲作者', 'primary-upper', '聂耳的歌曲节奏坚定、形象鲜明，是感受进行曲节奏和爱国歌曲的重要材料。', ['创作义勇军进行曲', '节奏坚定有号召力', '歌曲和时代紧密相关'], '拍出进行曲的稳定强拍，感受音乐怎样带来前进感。', ['steady-beat', 'tempo-basic', 'rhythmic-motif']),
  entry('ode-to-joy', 'appreciation', '欢乐颂', '贝多芬第九交响曲主题', 'primary-middle', '欢乐颂主题级进明显、结构整齐，适合初学者歌唱和分析旋律线。', ['主题便于歌唱', '常见级进旋律', '来自第九交响曲'], '唱主题前两句，画出旋律上行和下行的方向。', ['melodic-step-leap', 'melody-contour', 'phrase-question-answer']),
  entry('march-volunteers', 'appreciation', '义勇军进行曲', '中华人民共和国国歌', 'primary-upper', '这首作品节奏有力、进行感强，能帮助学生理解进行曲和强弱组织。', ['进行曲风格鲜明', '附点和强拍带来力量', '旋律具有号召感'], '边听边踏步，找出最有推动力的节奏。', ['dotted-rhythm', 'steady-beat', 'rhythm-pattern-ta-ta-ti']),
  entry('yellow-river-cantata', 'appreciation', '黄河大合唱', '大型声乐套曲', 'junior-basic', '黄河大合唱把合唱、朗诵和民族情感结合起来，适合做声部角色与作品背景讨论。', ['大型声乐作品', '有鲜明民族气质', '合唱声部对比丰富'], '听合唱片段，分辨主旋律、低声部和节奏支撑。', ['ensemble-roles', 'listening-analysis', 'classroom-ensemble-rules']),
  entry('little-star-variations', 'appreciation', '小星星变奏曲', '主题与变奏', 'primary-upper', '熟悉的主题在变奏中改变节奏、织体和装饰，是理解变奏的好材料。', ['保留主题轮廓', '每段有不同变化', '适合比较聆听'], '先唱主题，再听一个变奏，说出哪里变了。', ['variation-development', 'theme-development', 'ornaments-intro']),
  entry('swan-lake', 'appreciation', '天鹅湖选段', '舞剧音乐', 'primary-upper', '天鹅湖旋律优美、配器形象鲜明，适合用聆听地图记录情绪和音色。', ['舞剧音乐代表', '旋律抒情', '配器塑造形象'], '用线条画出主题情绪的起伏。', ['listening-map', 'orchestra-sections', 'dynamics-basic']),
  entry('jasmine-flower', 'appreciation', '茉莉花', '中国民歌代表', 'primary-middle', '茉莉花旋律委婉，体现五声调式和民歌地域风格。', ['五声调式色彩明显', '旋律柔和流畅', '常用于民歌欣赏'], '唱一唱旋律，找出它有没有 fa 和 ti。', ['pentatonic-scale', 'gong-shang-jue-zhi-yu', 'folk-song-region']),
  entry('pentatonic-sound', 'chinese-music', '五声音阶', '宫商角徵羽', 'primary-upper', '五声音阶由五个骨干音构成，是许多中国民歌和传统音乐的重要音高材料。', ['常见五个骨干音', '民族风格鲜明', '适合旋律创作'], '用 1 2 3 5 6 编一条四小节旋律。', ['pentatonic-scale', 'gong-shang-jue-zhi-yu', 'melody-ending']),
  entry('chinese-opera', 'chinese-music', '中国戏曲行当', '生旦净丑', 'junior-basic', '戏曲行当用唱、念、做、打和服装脸谱区分角色类型。', ['行当体现角色类型', '唱腔与表演结合', '脸谱有象征性'], '看一张戏曲剧照，猜角色类型并说明依据。', ['opera-role-types', 'expression-terms', 'listening-analysis']),
  entry('jiangnan-sizhu', 'chinese-music', '江南丝竹', '细腻雅致的民间合奏', 'junior-basic', '江南丝竹常由二胡、琵琶、笛子等乐器合奏，音色轻巧细腻。', ['小型民间合奏', '音色柔和细腻', '常见加花变奏'], '听合奏片段，记录听到的拉弦、吹奏或弹拨音色。', ['chinese-instruments', 'ensemble-roles', 'ornaments-intro']),
  entry('northern-folk-song', 'chinese-music', '北方民歌', '高亢开阔的地域风格', 'primary-upper', '北方民歌常旋律开阔、节奏鲜明，和地域语言、劳动生活有关。', ['旋律常较开阔', '地域语言影响风格', '节奏直接有力'], '比较一首北方民歌和南方民歌，说出音区和节奏差异。', ['folk-song-region', 'voice-register', 'tempo-basic']),
  entry('erhu-tradition', 'chinese-music', '二胡音乐', '拉弦音色与歌唱性', 'primary-middle', '二胡音色接近人声，擅长表现连贯、细腻的旋律。', ['属于拉弦乐器', '音色有歌唱性', '擅长连奏和滑音'], '听二胡旋律，模仿它的连贯呼吸。', ['chinese-instruments', 'articulation-basic', 'rubato-and-phrasing']),
  entry('lion-dance-drums', 'chinese-music', '锣鼓与舞狮', '节奏型和场景音乐', 'primary-middle', '锣鼓音乐通过固定节奏型、强弱和速度变化配合动作场景。', ['打击乐节奏鲜明', '固定节奏型常重复', '速度变化配合动作'], '用桌面节奏模仿一个舞狮出场。', ['rhythmic-motif', 'ostinato', 'accelerando']),
  entry('baroque', 'western-history', '巴洛克音乐', '规则、装饰与复调', 'junior-basic', '巴洛克音乐常有稳定律动、复调织体和装饰音，巴赫是代表人物之一。', ['稳定低音常见', '复调织体重要', '装饰音丰富'], '听一段巴洛克音乐，数一数低音是否有规律重复。', ['bass-line', 'countermelody', 'ornaments-intro']),
  entry('classical-period', 'western-history', '古典主义音乐', '清晰、均衡、讲结构', 'junior-basic', '古典主义重视清楚的乐句和结构，常适合分析问答、终止和曲式。', ['乐句结构清晰', '均衡感强', '常见奏鸣曲和交响曲'], '把一个主题分成前句和后句。', ['period-form', 'cadence', 'binary-ternary-form']),
  entry('romantic-period', 'western-history', '浪漫主义音乐', '情感与个性', 'junior-basic', '浪漫主义音乐强调个人情感、音色变化和更自由的速度处理。', ['情感表达浓厚', '力度速度变化多', '音色想象丰富'], '听同一主题的强弱变化，描述情绪如何改变。', ['dynamics-basic', 'rubato-and-phrasing', 'arrangement-color']),
  entry('modern-music', 'western-history', '现代音乐入门', '新音色与新节奏', 'junior-advanced', '现代音乐探索新的音色、节奏和结构，常打破传统听感。', ['节奏可能更复杂', '音色实验丰富', '结构更开放'], '听一个现代片段，先记录你听到的音色和节奏特点。', ['polyrhythm-intro', 'chromatic-neighbor', 'listening-map']),
  entry('orchestra-growth', 'western-history', '管弦乐队发展', '从小编制到大音响', 'primary-upper', '管弦乐队由弦乐、木管、铜管和打击乐等声部协作，形成丰富音响。', ['声部分工明确', '配器决定色彩', '指挥协调整体'], '看乐队座位图，标出弦乐和管乐位置。', ['orchestra-sections', 'ensemble-roles', 'arrangement-color']),
  entry('jazz-intro', 'western-history', '爵士乐入门', '切分、即兴与蓝调色彩', 'junior-basic', '爵士乐常有切分节奏、即兴演奏和独特色彩，适合联系节奏弹性。', ['切分节奏常见', '即兴是重要特点', '和声色彩丰富'], '拍一个切分节奏，感受重音移动。', ['syncopation', 'offbeat', 'seventh-chords']),
  entry('piano', 'instrument', '钢琴', '键盘乐器', 'primary-lower', '钢琴用键盘控制音高，既能演奏旋律，也能演奏和声。', ['左低右高', '可同时弹多个音', '适合观察音高空间'], '在键盘上找两个 do，听听它们是不是八度关系。', ['keyboard-direction', 'same-note-octave', 'triads']),
  entry('violin', 'instrument', '小提琴', '弦乐家族的高音乐器', 'primary-middle', '小提琴音色明亮，常担任旋律声部，也能用不同弓法改变表情。', ['属于弦乐器', '常演奏高音旋律', '弓法影响表情'], '听小提琴连奏和跳奏，比较声音连接方式。', ['instrument-families', 'articulation-basic', 'voice-register']),
  entry('flute', 'instrument', '长笛', '木管家族的明亮音色', 'primary-middle', '长笛靠气息发声，音色清亮，常表现轻快或流动的旋律。', ['属于木管乐器', '靠气息发声', '音色清亮'], '模仿长笛旋律的呼吸位置。', ['instrument-families', 'breath-mark', 'melodic-step-leap']),
  entry('erhu', 'instrument', '二胡', '中国拉弦乐器', 'primary-middle', '二胡用弓拉弦发声，音色柔韧，常用于民族音乐旋律。', ['中国拉弦乐器', '音色接近人声', '常表现歌唱性旋律'], '听二胡和小提琴，比较音色的明暗。', ['chinese-instruments', 'instrument-families', 'rubato-and-phrasing']),
  entry('guzheng', 'instrument', '古筝', '中国弹拨乐器', 'primary-middle', '古筝用手指拨弦，常有刮奏、摇指等富有画面感的奏法。', ['中国弹拨乐器', '音色清亮', '常用装饰性奏法'], '听古筝刮奏，想象它表现的画面。', ['chinese-instruments', 'ornaments-intro', 'pentatonic-scale']),
  entry('percussion', 'instrument', '打击乐器', '节奏与色彩担当', 'primary-lower', '打击乐器通过敲击、摇动或摩擦发声，常负责节奏、强调和音色效果。', ['靠敲击等动作发声', '节奏功能明显', '音色种类很多'], '用不同材料敲出三种音色，说出最适合哪种场景。', ['instrument-families', 'steady-beat', 'rhythm-composition']),
  entry('march', 'genre-form', '进行曲', '稳定步伐感', 'primary-middle', '进行曲通常节拍稳定、重音清楚，常服务于队列和庄重场景。', ['节拍稳定', '重音清楚', '常有前进感'], '跟着音乐踏步，判断强拍在哪里。', ['steady-beat', 'meter-basic', 'dotted-rhythm']),
  entry('waltz', 'genre-form', '圆舞曲', '三拍子的旋转感', 'primary-middle', '圆舞曲常为三拍子，强弱弱的律动带来旋转感。', ['常见三拍子', '强弱弱律动', '适合舞蹈场景'], '拍出强弱弱，感受三拍子的摆动。', ['meter-basic', 'compound-meter', 'tempo-basic']),
  entry('sonata', 'genre-form', '奏鸣曲', '对比与发展', 'junior-advanced', '奏鸣曲常包含主题对比、展开和再现，是西方器乐曲的重要体裁。', ['主题对比明显', '发展段推动材料变化', '常用于器乐作品'], '听两个主题，描述它们的性格差异。', ['contrast-repetition', 'theme-development', 'modulation-pivot']),
  entry('concerto', 'genre-form', '协奏曲', '独奏与乐队对话', 'junior-basic', '协奏曲让独奏乐器和乐队形成对话、竞答与合作。', ['独奏和乐队互动', '常有技巧展示', '对话感强'], '听独奏进入时，判断乐队是陪衬还是回应。', ['call-response', 'ensemble-roles', 'texture-melody-accompaniment']),
  entry('symphony', 'genre-form', '交响曲', '管弦乐大型体裁', 'junior-basic', '交响曲通常由多个乐章构成，充分发挥管弦乐队的音色和结构能力。', ['大型管弦乐体裁', '多乐章常见', '主题发展丰富'], '用聆听地图记录一个乐章的主题回归。', ['orchestra-sections', 'theme-development', 'listening-map']),
  entry('suite', 'genre-form', '组曲', '多个小段组合', 'primary-upper', '组曲由若干相对独立的小段组成，常来自舞曲、戏剧或场景音乐。', ['多个乐段组合', '每段性格可不同', '适合比较聆听'], '给三个小段分别取一个情绪标题。', ['binary-ternary-form', 'contrast-repetition', 'intro-coda']),
]

export function filterEncyclopediaEntries(filter: EncyclopediaFilter = {}): EncyclopediaEntry[] {
  const query = filter.search?.trim().toLowerCase()
  return ENCYCLOPEDIA_ENTRIES.filter((entry) => {
    if (filter.type && entry.type !== filter.type) return false
    if (filter.category && entry.category !== filter.category) return false
    if (filter.stage && entry.stage !== filter.stage) return false
    if (query) {
      const haystack = `${entry.title} ${entry.subtitle} ${entry.summary} ${entry.keyFacts.join(' ')}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}

export function getEncyclopediaEntry(id: string): EncyclopediaEntry | undefined {
  return ENCYCLOPEDIA_ENTRIES.find((entry) => entry.id === id)
}

export function encyclopediaToReviewQuestions(entries: EncyclopediaEntry[] = ENCYCLOPEDIA_ENTRIES): ReviewQuestion[] {
  return entries.flatMap((entry) =>
    entry.quiz.map((item, index) => ({
      id: `encyclopedia:${entry.id}:${index}`,
      source: 'encyclopedia',
      itemId: entry.id,
      itemTitle: entry.title,
      category: entry.category,
      stage: entry.stage,
      question: item.question,
      options: item.options,
      correctAnswer: item.answer,
      explanation: item.explanation,
    }))
  )
}
