import { Route } from '../state/appState'
import { EXPANDED_THEORY_TOPICS, enrichTheoryTopicQuiz } from './theoryExpansion'

export type TheoryStageId =
  | 'primary-lower'
  | 'primary-middle'
  | 'primary-upper'
  | 'junior-basic'
  | 'junior-advanced'

export type DemoKind =
  | 'pitch'
  | 'duration'
  | 'meter'
  | 'staff'
  | 'jianpu'
  | 'scale'
  | 'interval'
  | 'chord'
  | 'tempo'
  | 'dynamics'
  | 'articulation'
  | 'repeat'
  | 'form'

export interface TheoryStage {
  id: TheoryStageId
  label: string
  short: string
  order: number
}

export interface MiniQuestion {
  q: string
  options: string[]
  answer: number
}

export interface TheoryTopic {
  id: string
  category: string
  stage: TheoryStageId
  level: string
  title: string
  subtitle: string
  concept: string
  keyPoints: string[]
  demo: {
    kind: DemoKind
    title: string
    caption: string
  }
  actions: { label: string; route: Route }[]
  quiz: MiniQuestion[]
}

export interface TheoryTopicFilter {
  category?: string
  stage?: TheoryStageId
}

export const THEORY_STAGES: TheoryStage[] = [
  { id: 'primary-lower', label: '小学低段', short: '小低', order: 1 },
  { id: 'primary-middle', label: '小学中段', short: '小中', order: 2 },
  { id: 'primary-upper', label: '小学高段', short: '小高', order: 3 },
  { id: 'junior-basic', label: '初中基础', short: '初基', order: 4 },
  { id: 'junior-advanced', label: '初中进阶', short: '初进', order: 5 },
]

export const THEORY_CATEGORIES = [
  '音高与唱名',
  '节奏与节拍',
  '记谱与读谱',
  '调式与音阶',
  '音程与和声',
  '速度力度与表情',
  '曲式结构',
  '创作与编配',
  '民族与课堂常识',
]

const piano = { label: '钢琴示范', route: 'piano' as Route }
const ear = { label: '听觉辨识训练', route: 'game-ear' as Route }
const read = { label: '读谱训练', route: 'game-read' as Route }
const rhythm = { label: '节奏反应训练', route: 'game-taiko' as Route }
const sing = { label: '音准与视唱训练', route: 'game-sing' as Route }
const library = { label: '曲库谱例', route: 'library' as Route }
const mixer = { label: '混音器创编', route: 'mixer' as Route }
const recorder = { label: '竖笛指法', route: 'recorder' as Route }

function topic(
  id: string,
  category: string,
  stage: TheoryStageId,
  level: string,
  title: string,
  subtitle: string,
  concept: string,
  keyPoints: string[],
  demo: TheoryTopic['demo'],
  actions: TheoryTopic['actions'],
  quiz: MiniQuestion[]
): TheoryTopic {
  return { id, category, stage, level, title, subtitle, concept, keyPoints, demo, actions, quiz }
}

const BASE_THEORY_TOPICS: TheoryTopic[] = [
  topic(
    'sound-four-properties',
    '音高与唱名',
    'primary-lower',
    'L1',
    '声音的四个要素',
    '高低、长短、强弱、音色',
    '音乐中的声音可以从高低、长短、强弱和音色四个角度观察，这是进入乐理学习的第一组概念。',
    ['高低对应音高', '长短对应时值', '强弱和音色帮助表达情绪'],
    { kind: 'dynamics', title: '声音要素对比', caption: '用同一个音感受高低、强弱和长短的变化。' },
    [piano, sing],
    [
      { q: '声音高低在乐理中通常叫？', options: ['音高', '速度', '力度'], answer: 0 },
      { q: '声音强弱主要对应什么？', options: ['力度', '谱号', '小节线'], answer: 0 },
    ]
  ),
  topic(
    'pitch-up-down',
    '音高与唱名',
    'primary-lower',
    'L1',
    '音的高低',
    '上行与下行',
    '音高表示声音的高低。旋律向上走通常听起来更高，向下走通常听起来更低。',
    ['向上移动音变高', '向下移动音变低', '高低变化形成旋律方向'],
    { kind: 'pitch', title: '高低方向', caption: '听一组上行和下行音，判断旋律方向。' },
    [piano, ear],
    [
      { q: '旋律往上走，音通常怎样？', options: ['变高', '变低', '变短'], answer: 0 },
      { q: '判断音高主要听什么？', options: ['高低', '歌词', '颜色'], answer: 0 },
    ]
  ),
  topic(
    'solfege-numbers',
    '音高与唱名',
    'primary-lower',
    'L1',
    '唱名与简谱数字',
    'do re mi 与 1 2 3',
    '唱名帮助我们把音唱出来，简谱数字帮助我们把唱名写下来。1 到 7 对应 do 到 ti。',
    ['1 对应 do', '5 对应 sol', '唱名和数字可以互相转换'],
    { kind: 'jianpu', title: '唱名数字对照', caption: '看数字、唱唱名，建立一一对应。' },
    [sing, read],
    [
      { q: '简谱 1 通常唱作？', options: ['do', 'mi', 'sol'], answer: 0 },
      { q: 'sol 对应哪个简谱数字？', options: ['3', '5', '7'], answer: 1 },
    ]
  ),
  topic(
    'keyboard-direction',
    '音高与唱名',
    'primary-lower',
    'L1',
    '键盘上的高低',
    '左低右高',
    '在钢琴键盘上，越往右音越高，越往左音越低。键盘是理解音高空间的直观工具。',
    ['左边音低', '右边音高', '白键可对应 C 大调唱名'],
    { kind: 'pitch', title: '键盘方向', caption: '观察键盘从左到右的音高变化。' },
    [piano, ear],
    [
      { q: '钢琴键盘越往右，音通常？', options: ['越高', '越低', '不变'], answer: 0 },
      { q: '键盘左侧通常是什么音区？', options: ['低音区', '高音区', '无声区'], answer: 0 },
    ]
  ),
  topic(
    'same-note-octave',
    '音高与唱名',
    'primary-middle',
    'L2',
    '同名音与八度',
    '两个 do 的关系',
    '同名音可以出现在不同高度。低 do 和高 do 名字相同，音高相差一个八度。',
    ['同名音名字相同', '八度听起来相似但高度不同', '八度是旋律扩展的重要距离'],
    { kind: 'interval', title: '八度听辨', caption: '听低 do 和高 do，感受相似与高低差。' },
    [piano, ear],
    [
      { q: '低 do 到高 do 通常是？', options: ['八度', '二度', '休止'], answer: 0 },
      { q: '同名音的特点是？', options: ['名字相同', '一定同高', '一定不同唱名'], answer: 0 },
    ]
  ),
  topic(
    'fixed-note-names',
    '音高与唱名',
    'primary-middle',
    'L2',
    '音名 C D E',
    '固定音高名称',
    '音名是固定音高的名称，常用 C D E F G A B 表示七个基本音。',
    ['音名有七个基本字母', 'C 常对应 do', '音名用于乐器和乐谱交流'],
    { kind: 'pitch', title: '音名键盘', caption: '看 C D E F G A B 在键盘上的排列。' },
    [piano, read],
    [
      { q: '七个基本音名不包括？', options: ['H', 'C', 'G'], answer: 0 },
      { q: 'C 大调中 C 通常唱作？', options: ['do', 'fa', 'ti'], answer: 0 },
    ]
  ),
  topic(
    'whole-half-steps',
    '音高与唱名',
    'primary-upper',
    'L3',
    '半音与全音',
    '相邻键的距离',
    '半音是相邻两个琴键之间的最小距离，两个半音组成一个全音。',
    ['相邻琴键是半音', '两个半音是全音', 'E-F 和 B-C 之间是半音'],
    { kind: 'interval', title: '半音全音', caption: '听 C-C# 与 C-D 的距离差别。' },
    [piano, ear],
    [
      { q: '一个全音等于几个半音？', options: ['1 个', '2 个', '3 个'], answer: 1 },
      { q: '相邻两个琴键之间通常是？', options: ['半音', '八度', '四拍'], answer: 0 },
    ]
  ),
  topic(
    'chromatic-notes',
    '音高与唱名',
    'junior-basic',
    'L4',
    '十二平均律与半音阶',
    '一组八度内的 12 个音',
    '常见键盘音乐把一个八度平均分成十二个半音。半音阶按半音连续上行或下行。',
    ['一个八度分成 12 个半音', '半音阶连续使用半音', '黑键和白键共同组成半音阶'],
    { kind: 'scale', title: '半音阶阶梯', caption: '观察连续半音怎样填满一个八度。' },
    [piano, ear],
    [
      { q: '一个八度通常分成几个半音？', options: ['7 个', '8 个', '12 个'], answer: 2 },
      { q: '半音阶的特点是？', options: ['连续半音', '只用五个音', '只用强拍'], answer: 0 },
    ]
  ),
  topic(
    'transposition-intro',
    '音高与唱名',
    'junior-advanced',
    'L5',
    '移调入门',
    '旋律整体升高或降低',
    '移调是把旋律整体移动到新的音高位置，音程关系保持不变。',
    ['旋律整体移动', '相对关系保持', '适合调整音域或调性'],
    { kind: 'scale', title: '旋律移位', caption: '同一组音从不同起点播放，听旋律关系是否保持。' },
    [piano, sing],
    [
      { q: '移调时保持不变的是？', options: ['相对音程关系', '绝对音名', '歌词颜色'], answer: 0 },
      { q: '移调常用来调整什么？', options: ['音域', '小节线颜色', '题目数量'], answer: 0 },
    ]
  ),

  topic(
    'steady-beat',
    '节奏与节拍',
    'primary-lower',
    'L1',
    '稳定拍',
    '音乐里的脚步',
    '稳定拍像音乐里的脚步，帮助我们一起唱、一起拍、一起走。',
    ['拍子要均匀', '强弱可变化但速度要稳', '合奏需要共同稳定拍'],
    { kind: 'meter', title: '稳定拍体验', caption: '听均匀拍点，跟着拍手。' },
    [rhythm, library],
    [
      { q: '稳定拍最重要的是？', options: ['均匀', '忽快忽慢', '只拍强拍'], answer: 0 },
      { q: '合奏时大家需要共同什么？', options: ['稳定拍', '同一颜色', '同一座位'], answer: 0 },
    ]
  ),
  topic(
    'quarter-eighth-notes',
    '节奏与节拍',
    'primary-lower',
    'L1',
    '四分音符与八分音符',
    '一拍与半拍',
    '四分音符常作为一拍，八分音符通常是半拍。两个八分音符合起来等于一个四分音符。',
    ['四分音符常是一拍', '八分音符常是半拍', '两个八分等于一个四分'],
    { kind: 'duration', title: '一拍半拍', caption: '听一拍和半拍的长短差别。' },
    [rhythm, library],
    [
      { q: '两个八分音符通常等于几个四分音符？', options: ['1 个', '2 个', '4 个'], answer: 0 },
      { q: '八分音符通常比四分音符？', options: ['更短', '更长', '一样长'], answer: 0 },
    ]
  ),
  topic(
    'rests-basic',
    '节奏与节拍',
    'primary-lower',
    'L1',
    '休止符',
    '有节拍的安静',
    '休止符表示这一段不发声，但节拍仍然继续向前走。',
    ['休止不是停止数拍', '心里要继续数拍', '休止让音乐有呼吸'],
    { kind: 'duration', title: '有声与休止', caption: '听声音和空拍交替出现。' },
    [rhythm, library],
    [
      { q: '休止符表示？', options: ['不发声但数拍', '越来越响', '升半音'], answer: 0 },
      { q: '遇到休止符时节拍应该？', options: ['继续', '停止', '变调'], answer: 0 },
    ]
  ),
  topic(
    'barline-measure',
    '节奏与节拍',
    'primary-middle',
    'L2',
    '小节与小节线',
    '把音乐分组',
    '小节线把音乐按固定拍数组成小节，方便读谱、排练和合奏定位。',
    ['小节线用于分组', '每小节通常拍数固定', '合奏时可用小节定位'],
    { kind: 'meter', title: '小节分组', caption: '四拍一组，第一拍更强。' },
    [read, rhythm],
    [
      { q: '小节线主要用来？', options: ['分组音乐', '改变音高', '表示休止'], answer: 0 },
      { q: '4/4 拍一小节通常有几拍？', options: ['3 拍', '4 拍', '6 拍'], answer: 1 },
    ]
  ),
  topic(
    'meter-basic',
    '节奏与节拍',
    'primary-middle',
    'L2',
    '拍号 2/4、3/4、4/4',
    '每小节几拍',
    '拍号告诉我们每小节有几拍，以及以哪种音符作为一拍。',
    ['上方数字表示每小节拍数', '下方数字表示一拍单位', '第一拍通常是强拍'],
    { kind: 'meter', title: '常见拍号', caption: '听 2/4、3/4、4/4 的强弱循环。' },
    [rhythm, library],
    [
      { q: '3/4 拍每小节有几拍？', options: ['2 拍', '3 拍', '4 拍'], answer: 1 },
      { q: '拍号上方数字表示？', options: ['每小节拍数', '音高', '力度'], answer: 0 },
    ]
  ),
  topic(
    'dotted-rhythm',
    '节奏与节拍',
    'primary-upper',
    'L3',
    '附点节奏',
    '时值增加一半',
    '附点写在音符右侧，让原来的时值增加一半，形成长短更有弹性的节奏。',
    ['附点增加原时值一半', '附点四分音符是一拍半', '附点节奏常产生推动感'],
    { kind: 'duration', title: '附点长短', caption: '听普通四分音符和附点四分音符的差别。' },
    [rhythm, library],
    [
      { q: '附点的作用是？', options: ['时值增加一半', '升高半音', '变成休止'], answer: 0 },
      { q: '附点四分音符通常是？', options: ['1.5 拍', '2 拍', '半拍'], answer: 0 },
    ]
  ),
  topic(
    'syncopation',
    '节奏与节拍',
    'primary-upper',
    'L3',
    '切分节奏',
    '重音移动',
    '切分节奏会把重音从常规强拍位置移动到弱拍或拍内位置，让音乐更有律动。',
    ['重音位置发生移动', '弱拍可能被强调', '常用于民歌、流行和舞曲'],
    { kind: 'meter', title: '切分重音', caption: '听常规重音和切分重音的不同律动。' },
    [rhythm, mixer],
    [
      { q: '切分节奏的特点是？', options: ['重音移动', '完全无拍', '只唱长音'], answer: 0 },
      { q: '切分常让音乐更有？', options: ['律动', '静止感', '无声效果'], answer: 0 },
    ]
  ),
  topic(
    'triplet',
    '节奏与节拍',
    'primary-upper',
    'L3',
    '三连音',
    '一拍分成三等份',
    '三连音把原本常分成两份的时值平均分成三份，形成不同的流动感。',
    ['平均分成三份', '常标数字 3', '要保持三份均匀'],
    { kind: 'duration', title: '三等分', caption: '听二等分和三等分的节奏差别。' },
    [rhythm, library],
    [
      { q: '三连音通常把时值分成几等份？', options: ['2 份', '3 份', '4 份'], answer: 1 },
      { q: '演奏三连音最重要的是？', options: ['三份均匀', '越快越好', '只弹第一下'], answer: 0 },
    ]
  ),
  topic(
    'tie-and-slur',
    '节奏与节拍',
    'primary-upper',
    'L3',
    '延音线与连音线',
    '相同音延长，不同音连贯',
    '延音线连接两个相同音高，把时值合并；连音线连接不同音，提示演唱或演奏要更连贯。',
    ['相同音连接多为延音线', '延音线合并时值', '不同音连接多提示连贯演奏'],
    { kind: 'articulation', title: '延长与连贯', caption: '听相同音延长和不同音连贯的差别。' },
    [rhythm, sing],
    [
      { q: '延音线连接相同音时主要作用是？', options: ['合并时值', '升高半音', '改变谱号'], answer: 0 },
      { q: '连音线连接不同音时常提示？', options: ['连贯演奏', '立刻停止', '只打强拍'], answer: 0 },
    ]
  ),
  topic(
    'compound-meter',
    '节奏与节拍',
    'junior-basic',
    'L4',
    '复拍子 6/8',
    '两个大拍的摇动感',
    '6/8 拍每小节有六个八分音符，常分成两个大拍，形成摇动感。',
    ['每小节六个八分音符', '常分成两个大拍', '适合摇篮曲和舞曲感'],
    { kind: 'meter', title: '6/8 摇动', caption: '听 6/8 拍的两个大拍分组。' },
    [rhythm, library],
    [
      { q: '6/8 拍每小节有几个八分音符？', options: ['3 个', '6 个', '8 个'], answer: 1 },
      { q: '6/8 拍常分成几个大拍？', options: ['2 个', '4 个', '6 个'], answer: 0 },
    ]
  ),
  topic(
    'mixed-rhythm-reading',
    '节奏与节拍',
    'junior-advanced',
    'L5',
    '复杂节奏读法',
    '附点、切分、连音组合',
    '较复杂节奏常把附点、切分、连音线和休止组合起来，需要先分拍再连贯演奏。',
    ['先找稳定拍', '再分析拍内细分', '最后连贯表达重音'],
    { kind: 'meter', title: '复杂节奏拆解', caption: '把一小节复杂节奏拆成拍内单位。' },
    [rhythm, mixer],
    [
      { q: '读复杂节奏第一步常是？', options: ['找稳定拍', '直接加速', '忽略休止'], answer: 0 },
      { q: '附点和切分组合时要特别注意？', options: ['重音和时值', '谱号颜色', '歌词字体'], answer: 0 },
    ]
  ),

  topic(
    'staff-lines-spaces',
    '记谱与读谱',
    'primary-lower',
    'L1',
    '五线谱的线与间',
    '五条线四个间',
    '五线谱用线和间记录音高。音符位置越高，音高通常越高。',
    ['五线谱有五条线', '线与线之间叫间', '音符上下移动表示音高变化'],
    { kind: 'staff', title: '线间位置', caption: '观察音符在线和间上的位置变化。' },
    [read, library],
    [
      { q: '五线谱有几条线？', options: ['4 条', '5 条', '6 条'], answer: 1 },
      { q: '线与线之间叫？', options: ['间', '拍', '调'], answer: 0 },
    ]
  ),
  topic(
    'treble-clef',
    '记谱与读谱',
    'primary-middle',
    'L2',
    '高音谱号',
    'G 谱号',
    '高音谱号常用于较高音区的旋律，它的螺旋中心帮助确定 G 音位置。',
    ['又叫 G 谱号', '常用于旋律和右手', '适合竖笛和歌唱谱'],
    { kind: 'staff', title: '高音谱号位置', caption: '看高音谱号和音符位置的对应。' },
    [read, piano],
    [
      { q: '高音谱号又叫？', options: ['G 谱号', 'F 谱号', '休止符'], answer: 0 },
      { q: '竖笛谱常用哪种谱号？', options: ['高音谱号', '低音谱号', '不使用谱号'], answer: 0 },
    ]
  ),
  topic(
    'jianpu-staff-map',
    '记谱与读谱',
    'primary-middle',
    'L2',
    '简谱与五线谱对应',
    '数字和谱面一起读',
    '简谱用数字表示唱名，五线谱用位置表示音高。两者可以互相帮助读谱。',
    ['数字对应唱名', '五线位置对应音高', '熟悉歌曲可双谱对照'],
    { kind: 'jianpu', title: '双谱对照', caption: '看数字、唱名和键盘音名之间的关系。' },
    [read, library],
    [
      { q: '简谱 5 通常唱作？', options: ['mi', 'sol', 'ti'], answer: 1 },
      { q: '五线谱主要通过什么表示音高？', options: ['音符位置', '歌词长度', '颜色'], answer: 0 },
    ]
  ),
  topic(
    'bass-clef',
    '记谱与读谱',
    'primary-upper',
    'L3',
    '低音谱号',
    'F 谱号',
    '低音谱号常用于较低音区，如钢琴左手、大提琴和低音乐器。',
    ['又叫 F 谱号', '适合低音区', '读法不同于高音谱号'],
    { kind: 'staff', title: '低音谱号入门', caption: '观察低音谱号中的音符位置。' },
    [read, piano],
    [
      { q: '低音谱号又叫？', options: ['F 谱号', 'G 谱号', '力度记号'], answer: 0 },
      { q: '钢琴左手常用？', options: ['低音谱号', '高音谱号', '只用简谱'], answer: 0 },
    ]
  ),
  topic(
    'ledger-lines',
    '记谱与读谱',
    'primary-upper',
    'L3',
    '加线',
    '超出五线的音',
    '当音高超出五线谱范围时，用短加线临时扩展谱面。',
    ['加线临时扩展范围', '中央 C 常在下加一线', '加线也要按线间规律读'],
    { kind: 'staff', title: '加线位置', caption: '看中央 C 和更高更低的加线音。' },
    [read, piano],
    [
      { q: '超出五线范围的音常用？', options: ['加线', '小节线', '渐强线'], answer: 0 },
      { q: '高音谱表中央 C 常在？', options: ['下加一线', '第五线', '第一间'], answer: 0 },
    ]
  ),
  topic(
    'key-signature-intro',
    '记谱与读谱',
    'junior-basic',
    'L4',
    '调号',
    '谱号后的升降记号',
    '调号写在谱号后面，说明整首或一段音乐中固定使用哪些升降音。',
    ['调号影响全曲固定音', '写在谱号后面', '帮助判断调性'],
    { kind: 'staff', title: '调号观察', caption: '看升号或降号固定写在谱表前方。' },
    [read, library],
    [
      { q: '调号通常写在哪里？', options: ['谱号后面', '每个歌词上', '结尾处'], answer: 0 },
      { q: '调号主要说明什么？', options: ['固定升降音', '拍子速度', '歌词段落'], answer: 0 },
    ]
  ),
  topic(
    'accidentals',
    '记谱与读谱',
    'junior-basic',
    'L4',
    '临时升降记号',
    '♯、♭、♮',
    '临时记号写在音符前，改变该音在当前小节中的音高。',
    ['升号升高半音', '降号降低半音', '还原号取消升降'],
    { kind: 'interval', title: '升降还原', caption: '听本音、升音和降音的差别。' },
    [piano, read],
    [
      { q: '升号的作用是？', options: ['升高半音', '降低半音', '延长一拍'], answer: 0 },
      { q: '还原号的作用是？', options: ['取消升降', '加快速度', '重复一遍'], answer: 0 },
    ]
  ),
  topic(
    'score-navigation',
    '记谱与读谱',
    'junior-advanced',
    'L5',
    '谱面阅读顺序',
    '从整体到细节',
    '读一首完整谱例时，先看谱号、调号、拍号和速度，再分析音高、节奏和结构。',
    ['先看谱面头部信息', '再读小节与句子', '最后处理表情和细节'],
    { kind: 'staff', title: '谱面信息层级', caption: '把谱面信息按阅读顺序拆开。' },
    [library, read],
    [
      { q: '读新谱第一步适合先看？', options: ['谱号调号拍号', '最后一个音', '颜色'], answer: 0 },
      { q: '完整读谱需要结合？', options: ['音高节奏结构', '只看歌词', '只看速度'], answer: 0 },
    ]
  ),

  topic(
    'c-major-scale',
    '调式与音阶',
    'primary-middle',
    'L2',
    'C 大调音阶',
    'do 到高音 do',
    'C 大调音阶由 C D E F G A B C 组成，是学习音高和视唱的常用起点。',
    ['C 大调没有固定升降号', '音阶按级进排列', '适合初学视唱'],
    { kind: 'scale', title: 'C 大调阶梯', caption: '听完整上行音阶，观察阶梯式上升。' },
    [piano, sing],
    [
      { q: 'C 大调音阶从哪个音开始？', options: ['C', 'F#', 'B'], answer: 0 },
      { q: 'C 大调固定升降号有几个？', options: ['0 个', '1 个', '7 个'], answer: 0 },
    ]
  ),
  topic(
    'major-minor-feeling',
    '调式与音阶',
    'primary-upper',
    'L3',
    '大调与小调色彩',
    '明亮与柔和',
    '大调常给人明亮稳定的感觉，小调常给人柔和、忧伤或内省的感觉。',
    ['大调常明亮', '小调常柔和或忧伤', '调式色彩影响情绪'],
    { kind: 'scale', title: '大小调对比', caption: '听 C 大调和 a 小调的色彩差异。' },
    [piano, ear],
    [
      { q: '大调常见色彩是？', options: ['明亮', '完全无声', '只适合低音'], answer: 0 },
      { q: '小调常见色彩是？', options: ['柔和或忧伤', '一定最快', '没有音高'], answer: 0 },
    ]
  ),
  topic(
    'pentatonic-scale',
    '调式与音阶',
    'primary-upper',
    'L3',
    '五声音阶',
    'do re mi sol la',
    '五声音阶由五个主要音组成，是中国民歌和民族器乐中非常常见的音阶材料。',
    ['常用 do re mi sol la', '中国民族音乐常见', '旋律简洁有民族色彩'],
    { kind: 'scale', title: '五声音阶', caption: '听五声音阶和七声音阶的差别。' },
    [piano, library],
    [
      { q: '五声音阶有几个主要音？', options: ['5 个', '7 个', '12 个'], answer: 0 },
      { q: '五声音阶常见于？', options: ['中国民族音乐', '只在噪音中', '只在休止符中'], answer: 0 },
    ]
  ),
  topic(
    'relative-major-minor',
    '调式与音阶',
    'junior-basic',
    'L4',
    '关系大小调',
    '同调号不同主音',
    '关系大小调使用相同调号，但主音和音乐中心不同，例如 C 大调和 a 小调。',
    ['调号相同', '主音不同', '色彩和终止感不同'],
    { kind: 'scale', title: '关系大小调', caption: '听 C 大调和 a 小调如何共享材料但中心不同。' },
    [piano, ear],
    [
      { q: 'C 大调的关系小调常是？', options: ['a 小调', 'G 大调', 'F# 小调'], answer: 0 },
      { q: '关系大小调的共同点是？', options: ['调号相同', '速度相同', '歌词相同'], answer: 0 },
    ]
  ),
  topic(
    'circle-of-fifths-intro',
    '调式与音阶',
    'junior-basic',
    'L4',
    '五度关系入门',
    '调性之间的邻近关系',
    '相隔五度的调在调号和和声上关系较近，常用于理解调号增减和转调方向。',
    ['五度关系连接调性', '调号按规律增减', '常用于转调理解'],
    { kind: 'interval', title: '五度连接', caption: '听 C 到 G、F 到 C 的稳定关系。' },
    [piano, ear],
    [
      { q: 'C 往上纯五度是？', options: ['G', 'D', 'F'], answer: 0 },
      { q: '五度关系常帮助理解？', options: ['调性关系', '按钮形状', '歌词断句'], answer: 0 },
    ]
  ),
  topic(
    'modes-and-national-flavor',
    '调式与音阶',
    'junior-advanced',
    'L5',
    '调式色彩拓展',
    '民族调式与旋律中心',
    '不同调式会形成不同的旋律中心和色彩。民族调式常围绕特定骨干音组织旋律。',
    ['调式有中心音', '骨干音塑造风格', '民族调式常与五声材料有关'],
    { kind: 'scale', title: '调式色彩', caption: '听不同中心音带来的色彩变化。' },
    [library, piano],
    [
      { q: '调式通常需要明确什么？', options: ['中心音', '屏幕亮度', '座位'], answer: 0 },
      { q: '民族调式常围绕什么组织？', options: ['骨干音', '随机噪音', '按钮顺序'], answer: 0 },
    ]
  ),

  topic(
    'interval-basic',
    '音程与和声',
    'primary-upper',
    'L3',
    '音程',
    '两个音之间的距离',
    '音程描述两个音之间的距离，是理解旋律跳进和和声关系的基础。',
    ['音程用度数描述', '二度常像级进', '五度和八度听起来稳定'],
    { kind: 'interval', title: '音程听辨', caption: '听二度、三度、五度和八度的不同跨度。' },
    [ear, piano],
    [
      { q: '音程描述几个音之间的距离？', options: ['两个音', '一小节', '一种速度'], answer: 0 },
      { q: 'do 到 sol 通常是？', options: ['五度', '二度', '休止'], answer: 0 },
    ]
  ),
  topic(
    'consonance-dissonance',
    '音程与和声',
    'junior-basic',
    'L4',
    '协和与不协和',
    '稳定与紧张',
    '不同音程同时响起会产生稳定或紧张的听感。协和与不协和帮助塑造和声张力。',
    ['协和听感较稳定', '不协和带来张力', '张力常需要解决'],
    { kind: 'interval', title: '稳定与紧张', caption: '听协和音程和紧张音程的对比。' },
    [ear, piano],
    [
      { q: '不协和音程常带来？', options: ['张力', '完全静音', '小节线'], answer: 0 },
      { q: '协和音程听起来通常？', options: ['较稳定', '一定很快', '没有音高'], answer: 0 },
    ]
  ),
  topic(
    'triads',
    '音程与和声',
    'junior-basic',
    'L4',
    '三和弦',
    '根音、三音、五音',
    '三和弦通常由三个音叠置而成，是和声学习和伴奏设计的基础。',
    ['三和弦有三个主要音', '大三和弦常明亮', '小三和弦常柔和或忧伤'],
    { kind: 'chord', title: '大小三和弦', caption: '听 C 大三和弦与 A 小三和弦的色彩差异。' },
    [piano, ear],
    [
      { q: '三和弦通常由几个音组成？', options: ['3 个', '2 个', '8 个'], answer: 0 },
      { q: 'C 大三和弦包含？', options: ['C-E-G', 'C-D-E', 'C-F-B'], answer: 0 },
    ]
  ),
  topic(
    'chord-inversions',
    '音程与和声',
    'junior-basic',
    'L4',
    '和弦转位',
    '同一和弦的不同低音',
    '和弦转位会改变低音位置，但和弦成员音仍然属于同一个和弦。',
    ['成员音保持', '低音位置改变', '转位让连接更平顺'],
    { kind: 'chord', title: '转位对比', caption: '听 C-E-G、E-G-C、G-C-E 的低音变化。' },
    [piano, ear],
    [
      { q: '和弦转位改变的是？', options: ['低音位置', '所有成员音', '拍号'], answer: 0 },
      { q: '转位常用于让和弦连接？', options: ['更平顺', '没有声音', '变成休止'], answer: 0 },
    ]
  ),
  topic(
    'seventh-chords',
    '音程与和声',
    'junior-advanced',
    'L5',
    '七和弦入门',
    '三和弦上再叠一个七音',
    '七和弦在三和弦基础上加入七音，常带来更丰富或更需要解决的和声张力。',
    ['由四个主要音构成', '比三和弦张力更强', '常需要解决到稳定和弦'],
    { kind: 'chord', title: '七和弦色彩', caption: '听三和弦与七和弦的紧张度差异。' },
    [piano, ear],
    [
      { q: '七和弦通常比三和弦多了什么？', options: ['七音', '小节线', '歌词'], answer: 0 },
      { q: '七和弦常带来更多？', options: ['和声张力', '静音时间', '谱号数量'], answer: 0 },
    ]
  ),
  topic(
    'cadence',
    '音程与和声',
    'junior-advanced',
    'L5',
    '终止式',
    '音乐句子的收束',
    '终止式是和声进行带来的收束感，帮助乐句或乐段形成结束、停顿或继续的感觉。',
    ['终止带来收束感', 'V-I 常有稳定结束感', '半终止像句子未完'],
    { kind: 'chord', title: '终止听感', caption: '听 V-I 与停在 V 上的不同结束感。' },
    [piano, library],
    [
      { q: 'V-I 终止常带来？', options: ['稳定结束感', '完全无声', '速度记号'], answer: 0 },
      { q: '半终止听起来常像？', options: ['还没说完', '已经彻底结束', '没有拍子'], answer: 0 },
    ]
  ),

  topic(
    'tempo-basic',
    '速度力度与表情',
    'primary-middle',
    'L2',
    '速度',
    '快慢与 BPM',
    '速度表示音乐进行的快慢。BPM 数字越大，每分钟拍数越多，音乐越快。',
    ['BPM 表示每分钟拍数', '数字越大越快', '速度影响音乐情绪'],
    { kind: 'tempo', title: '速度对比', caption: '同一组拍点用慢速、中速、快速播放。' },
    [rhythm, library],
    [
      { q: 'BPM 数字越大，音乐通常？', options: ['越快', '越慢', '越低'], answer: 0 },
      { q: '速度主要表示音乐的？', options: ['快慢', '高低', '强弱'], answer: 0 },
    ]
  ),
  topic(
    'dynamics-basic',
    '速度力度与表情',
    'primary-middle',
    'L2',
    '力度',
    'p、f 与强弱',
    '力度记号表示声音强弱。p 表示弱，f 表示强，渐强渐弱让音乐有起伏。',
    ['p 表示弱', 'f 表示强', '力度变化塑造情绪'],
    { kind: 'dynamics', title: '强弱变化', caption: '听同一个音的弱、中、强三种力度。' },
    [piano, sing],
    [
      { q: 'f 通常表示？', options: ['强', '弱', '慢'], answer: 0 },
      { q: 'p 通常表示？', options: ['弱', '强', '快'], answer: 0 },
    ]
  ),
  topic(
    'articulation-basic',
    '速度力度与表情',
    'primary-upper',
    'L3',
    '连音与跳音',
    '连接方式',
    '连音让声音更连贯，跳音让声音短促有弹性，不同奏法会改变音乐性格。',
    ['连音强调连贯', '跳音强调短促', '奏法影响音乐性格'],
    { kind: 'articulation', title: '连与跳', caption: '听同一组音分别用连音和跳音播放。' },
    [piano, library],
    [
      { q: '跳音通常听起来？', options: ['短促', '无限延长', '完全无声'], answer: 0 },
      { q: '连音更强调？', options: ['流畅连接', '突然停止', '只看歌词'], answer: 0 },
    ]
  ),
  topic(
    'expression-terms',
    '速度力度与表情',
    'junior-basic',
    'L4',
    '常见表情术语',
    'cantabile、dolce、marcato',
    '表情术语提示演唱或演奏的性格，例如如歌、柔和、强调等。',
    ['cantabile 表示如歌', 'dolce 表示柔和甜美', 'marcato 表示强调'],
    { kind: 'dynamics', title: '表情语气', caption: '同一旋律用不同表情语气播放。' },
    [sing, library],
    [
      { q: 'cantabile 常表示？', options: ['如歌地', '急速地', '无声地'], answer: 0 },
      { q: 'marcato 常表示？', options: ['强调地', '非常弱', '不数拍'], answer: 0 },
    ]
  ),
  topic(
    'rubato-and-phrasing',
    '速度力度与表情',
    'junior-advanced',
    'L5',
    '自由速度与乐句呼吸',
    '有控制的弹性',
    '自由速度不是随意忽快忽慢，而是在稳定整体脉搏中为了乐句表达做细微弹性处理。',
    ['整体脉搏仍要清楚', '句尾可有呼吸', '弹性速度服务表达'],
    { kind: 'tempo', title: '乐句弹性', caption: '听机械速度和有呼吸的乐句处理。' },
    [sing, library],
    [
      { q: '自由速度应该服务于？', options: ['乐句表达', '随机混乱', '取消节拍'], answer: 0 },
      { q: '做速度弹性时仍要保持？', options: ['整体脉搏', '屏幕亮度', '题目顺序'], answer: 0 },
    ]
  ),

  topic(
    'repeat-signs',
    '曲式结构',
    'primary-middle',
    'L2',
    '反复记号',
    '回到前面再演奏',
    '反复记号提示演奏者回到指定位置再演奏，能减少记谱并强化主题。',
    ['反复提示回到指定位置', '可强化主题记忆', '要看清开始和结束反复'],
    { kind: 'repeat', title: '反复结构', caption: '听 A 段重复后再进入 B 段。' },
    [library, piano],
    [
      { q: '反复记号通常提示？', options: ['回到某处再演奏', '立刻停止', '升半音'], answer: 0 },
      { q: '反复结构常能强化？', options: ['主题', '谱号数量', '座位'], answer: 0 },
    ]
  ),
  topic(
    'phrase-question-answer',
    '曲式结构',
    'primary-upper',
    'L3',
    '问答乐句',
    '像说话一样呼应',
    '很多旋律由前后呼应的乐句组成，前一句像提问，后一句像回答。',
    ['乐句有呼吸感', '前后可形成呼应', '句尾收束影响完整感'],
    { kind: 'form', title: '问答乐句', caption: '听一个上行提问和一个下行回答。' },
    [sing, library],
    [
      { q: '问答乐句强调什么？', options: ['前后呼应', '随机音', '只看颜色'], answer: 0 },
      { q: '乐句学习要注意？', options: ['呼吸与收束', '忽略旋律', '只打强拍'], answer: 0 },
    ]
  ),
  topic(
    'binary-ternary-form',
    '曲式结构',
    'junior-basic',
    'L4',
    '二段体与三段体',
    'AB 与 ABA',
    '二段体通常由两个不同段落组成，三段体常形成 A-B-A 的对比与再现。',
    ['AB 是两个段落', 'ABA 有再现', '段落对比形成结构感'],
    { kind: 'form', title: 'AB 与 ABA', caption: '听两段式和三段式的结构差异。' },
    [library, piano],
    [
      { q: 'ABA 中最后的 A 表示？', options: ['主题再现', '休止', '速度记号'], answer: 0 },
      { q: 'AB 结构通常有几个主要段落？', options: ['2 个', '3 个', '8 个'], answer: 0 },
    ]
  ),
  topic(
    'variation-development',
    '曲式结构',
    'junior-advanced',
    'L5',
    '变奏与展开',
    '主题的变化发展',
    '变奏保留主题可识别特征，同时改变节奏、音区、伴奏或装饰，让材料继续发展。',
    ['主题保持可识别', '可改变节奏或音区', '展开让材料持续发展'],
    { kind: 'form', title: '主题变奏', caption: '听主题和节奏变化后的版本。' },
    [library, mixer],
    [
      { q: '变奏需要保留什么？', options: ['主题可识别特征', '完全随机', '所有休止'], answer: 0 },
      { q: '变奏可以改变？', options: ['节奏或音区', '音乐是否存在', '谱号名称'], answer: 0 },
    ]
  ),

  topic(
    'motif',
    '创作与编配',
    'primary-upper',
    'L3',
    '动机',
    '短小的音乐种子',
    '动机是短小而有特点的音乐材料，可以通过重复、模进和变化发展成完整旋律。',
    ['动机短小', '要有可记忆特征', '可通过重复和变化发展'],
    { kind: 'form', title: '动机发展', caption: '听一个短动机如何重复和变化。' },
    [mixer, piano],
    [
      { q: '动机通常是？', options: ['短小音乐材料', '整本教材', '无声部分'], answer: 0 },
      { q: '动机可通过什么发展？', options: ['重复和变化', '删除节拍', '只改颜色'], answer: 0 },
    ]
  ),
  topic(
    'melody-contour',
    '创作与编配',
    'primary-upper',
    'L3',
    '旋律线',
    '上行、下行、波浪',
    '旋律线描述旋律的高低走向。清楚的旋律线能让音乐更容易听懂和记住。',
    ['旋律可上行或下行', '波浪线形成起伏', '旋律线影响情绪'],
    { kind: 'scale', title: '旋律轮廓', caption: '听上行、下行和波浪式旋律。' },
    [sing, piano],
    [
      { q: '旋律线描述什么？', options: ['高低走向', '谱纸颜色', '座位顺序'], answer: 0 },
      { q: '清楚的旋律线有助于？', options: ['记忆旋律', '取消音高', '减少拍子'], answer: 0 },
    ]
  ),
  topic(
    'texture-melody-accompaniment',
    '创作与编配',
    'junior-basic',
    'L4',
    '旋律与伴奏织体',
    '主线和背景',
    '旋律是主要线条，伴奏提供节奏、和声和氛围。伴奏不能盖过旋律。',
    ['旋律是主线', '伴奏提供支持', '音量和音区要平衡'],
    { kind: 'chord', title: '主线与伴奏', caption: '听单旋律和加伴奏后的层次变化。' },
    [mixer, piano],
    [
      { q: '伴奏应该怎样对待旋律？', options: ['支持旋律', '完全盖住旋律', '取消旋律'], answer: 0 },
      { q: '织体学习关注？', options: ['音乐层次', '按钮大小', '题目颜色'], answer: 0 },
    ]
  ),
  topic(
    'four-bar-phrase-writing',
    '创作与编配',
    'junior-advanced',
    'L5',
    '四小节乐句写作',
    '起承转合',
    '四小节乐句常需要明确动机、节奏、终止和呼吸位置，让短旋律形成完整表达。',
    ['动机要清楚', '节奏要稳定或有设计', '句尾要有收束感'],
    { kind: 'form', title: '四小节设计', caption: '听一个四小节乐句如何开始、发展和结束。' },
    [mixer, sing],
    [
      { q: '四小节乐句句尾常需要？', options: ['收束感', '完全随机', '只剩休止'], answer: 0 },
      { q: '写短旋律时动机应该？', options: ['清楚可记', '越乱越好', '没有节奏'], answer: 0 },
    ]
  ),

  topic(
    'instrument-families',
    '民族与课堂常识',
    'primary-lower',
    'L1',
    '常见乐器分类',
    '弦乐、管乐、打击乐',
    '乐器可以按发声方式大致分为弦乐、管乐、打击乐等，不同乐器有不同音色。',
    ['弦乐靠弦振动', '管乐靠气息振动', '打击乐靠敲击发声'],
    { kind: 'dynamics', title: '音色对比', caption: '用不同音色理解乐器家族。' },
    [library, piano],
    [
      { q: '鼓通常属于？', options: ['打击乐器', '弦乐器', '键盘谱号'], answer: 0 },
      { q: '乐器分类常依据？', options: ['发声方式', '课桌高度', '歌词数量'], answer: 0 },
    ]
  ),
  topic(
    'chinese-instruments',
    '民族与课堂常识',
    'primary-middle',
    'L2',
    '中国民族乐器',
    '吹拉弹打',
    '中国民族乐器常按吹、拉、弹、打分类，如笛子、二胡、琵琶、锣鼓等。',
    ['吹奏类靠气息', '拉弦类靠弓拉弦', '弹拨和打击各有鲜明音色'],
    { kind: 'dynamics', title: '吹拉弹打', caption: '听不同民族乐器音色的对比。' },
    [library, recorder],
    [
      { q: '二胡通常属于？', options: ['拉弦乐器', '打击乐器', '速度术语'], answer: 0 },
      { q: '笛子通常属于？', options: ['吹奏乐器', '弹拨乐器', '休止符'], answer: 0 },
    ]
  ),
  topic(
    'ensemble-roles',
    '民族与课堂常识',
    'junior-basic',
    'L4',
    '合奏声部角色',
    '旋律、低音、节奏、和声',
    '合奏中不同声部承担不同功能：旋律突出主题，低音支撑根基，节奏保持脉搏，和声丰富色彩。',
    ['旋律负责主题', '低音支撑稳定', '节奏和和声组织整体'],
    { kind: 'chord', title: '声部分工', caption: '听旋律、低音、节奏和和声逐层加入。' },
    [mixer, library],
    [
      { q: '合奏中旋律声部通常负责？', options: ['主题', '只打拍', '只休止'], answer: 0 },
      { q: '低音声部常提供？', options: ['根基支撑', '歌词翻译', '题目答案'], answer: 0 },
    ]
  ),
  topic(
    'listening-analysis',
    '民族与课堂常识',
    'junior-advanced',
    'L5',
    '听赏分析方法',
    '听什么、怎么说',
    '听赏音乐时可以从速度、力度、音色、节奏、旋律、结构和情绪等角度有顺序地描述。',
    ['先听整体情绪', '再找音乐要素', '最后说明依据'],
    { kind: 'form', title: '听赏路径', caption: '把一段音乐按要素拆开听。' },
    [library, sing],
    [
      { q: '听赏分析适合先关注？', options: ['整体情绪', '屏幕边框', '文件名'], answer: 0 },
      { q: '说明感受时最好给出？', options: ['音乐依据', '随机猜测', '座位号'], answer: 0 },
    ]
  ),
]

export const THEORY_TOPICS: TheoryTopic[] = [
  ...BASE_THEORY_TOPICS,
  ...EXPANDED_THEORY_TOPICS,
].map(enrichTheoryTopicQuiz)

export function getStageLabel(stage: TheoryStageId): string {
  return THEORY_STAGES.find((item) => item.id === stage)?.label ?? stage
}

export function filterTheoryTopics(filter: TheoryTopicFilter = {}): TheoryTopic[] {
  return THEORY_TOPICS.filter((topic) => {
    const categoryMatch = !filter.category || topic.category === filter.category
    const stageMatch = !filter.stage || topic.stage === filter.stage
    return categoryMatch && stageMatch
  })
}

export function getTheoryTopic(id: string): TheoryTopic | undefined {
  return THEORY_TOPICS.find((topic) => topic.id === id)
}
