import { DemoKind } from './theoryCatalog'

export interface DemoControl {
  value: string
  label: string
  detail: string
  notes: string[]
  beats?: string[]
  accentPattern?: number[]
  symbols?: string[]
}

export interface DemoScene {
  kind: DemoKind
  title: string
  prompt: string
  controls: DemoControl[]
  observations: string[]
}

const scenes: Record<DemoKind, DemoScene> = {
  pitch: {
    kind: 'pitch',
    title: '音高方向实验',
    prompt: '选择一种旋律方向，观察键盘高亮如何移动，并听音高是上升、下降还是跳进。',
    controls: [
      { value: 'ascending', label: '上行', detail: 'do re mi fa sol', notes: ['C4', 'D4', 'E4', 'F4', 'G4'] },
      { value: 'descending', label: '下行', detail: 'sol fa mi re do', notes: ['G4', 'F4', 'E4', 'D4', 'C4'] },
      { value: 'skip', label: '跳进', detail: 'do mi sol 高 do', notes: ['C4', 'E4', 'G4', 'C5'] },
    ],
    observations: ['相邻音级移动更平稳，跳进会让旋律轮廓更明显。', '键盘越往右，音高越高。'],
  },
  duration: {
    kind: 'duration',
    title: '时值长短实验',
    prompt: '选择一种时值组合，比较长音、短音、附点和休止在一小节里的位置。',
    controls: [
      { value: 'whole-half', label: '长音', detail: '全音符与二分音符', notes: ['C4', 'E4'], symbols: ['𝅝', '𝅗𝅥'] },
      { value: 'quarter-eighth', label: '一拍半拍', detail: '四分与八分', notes: ['C4', 'C4', 'E4', 'E4'], symbols: ['♩', '♪♪'] },
      { value: 'dotted', label: '附点', detail: '一拍半 + 半拍', notes: ['C4', 'G4'], symbols: ['♩.', '♪'] },
    ],
    observations: ['附点会把原来的时值增加一半。', '短音变多时，节奏会显得更密集。'],
  },
  meter: {
    kind: 'meter',
    title: '强弱拍实验',
    prompt: '切换拍号，观察强拍位置和每小节分组方式。',
    controls: [
      { value: '2-4', label: '2/4', detail: '强 弱', notes: ['C5', 'C4'], beats: ['1', '2'], accentPattern: [1, 0] },
      { value: '3-4', label: '3/4', detail: '强 弱 弱', notes: ['C5', 'C4', 'C4'], beats: ['1', '2', '3'], accentPattern: [1, 0, 0] },
      { value: '4-4', label: '4/4', detail: '强 弱 次强 弱', notes: ['C5', 'C4', 'G4', 'C4'], beats: ['1', '2', '3', '4'], accentPattern: [1, 0, 0.6, 0] },
      { value: '6-8', label: '6/8', detail: '两个大拍', notes: ['C5', 'C4', 'C4', 'G4', 'C4', 'C4'], beats: ['1', '2', '3', '4', '5', '6'], accentPattern: [1, 0, 0, 0.7, 0, 0] },
    ],
    observations: ['第一拍通常最强，6/8 常分成两个大拍。', '拍号变化会改变音乐的律动感。'],
  },
  staff: {
    kind: 'staff',
    title: '谱面位置实验',
    prompt: '选择一组音，观察音符在线、间和加线上的位置。',
    controls: [
      { value: 'line-notes', label: '线上的音', detail: 'E G B', notes: ['E4', 'G4', 'B4'] },
      { value: 'space-notes', label: '间里的音', detail: 'F A C', notes: ['F4', 'A4', 'C5'] },
      { value: 'ledger', label: '加线', detail: '中央 C 到高 C', notes: ['C4', 'E4', 'G4', 'C5'] },
    ],
    observations: ['音符位置越高，音高通常越高。', '加线临时扩展五线谱的音域。'],
  },
  jianpu: {
    kind: 'jianpu',
    title: '简谱唱名实验',
    prompt: '选择一组数字，观察它们和唱名、键盘音名的对应。',
    controls: [
      { value: '123', label: '1 2 3', detail: 'do re mi', notes: ['C4', 'D4', 'E4'], symbols: ['1', '2', '3'] },
      { value: '356', label: '3 5 6', detail: 'mi sol la', notes: ['E4', 'G4', 'A4'], symbols: ['3', '5', '6'] },
      { value: 'pentatonic', label: '五声', detail: '1 2 3 5 6', notes: ['C4', 'D4', 'E4', 'G4', 'A4'], symbols: ['1', '2', '3', '5', '6'] },
    ],
    observations: ['简谱数字和唱名是一一对应的。', '五声音阶少了 fa 和 ti，色彩更简洁。'],
  },
  scale: {
    kind: 'scale',
    title: '音阶色彩实验',
    prompt: '切换音阶材料，听大调、小调和五声音阶的色彩区别。',
    controls: [
      { value: 'major', label: 'C 大调', detail: '明亮稳定', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] },
      { value: 'minor', label: 'a 小调', detail: '柔和内省', notes: ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'] },
      { value: 'pentatonic', label: '五声音阶', detail: '民族色彩', notes: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'] },
    ],
    observations: ['大调和小调的半音位置不同，听感也不同。', '五声音阶常用于中国民歌和民族器乐。'],
  },
  interval: {
    kind: 'interval',
    title: '音程距离实验',
    prompt: '选择音程，观察两个音之间的键盘跨度并听稳定程度。',
    controls: [
      { value: 'second', label: '二度', detail: 'C-D 级进', notes: ['C4', 'D4'] },
      { value: 'third', label: '三度', detail: 'C-E 跳进', notes: ['C4', 'E4'] },
      { value: 'fifth', label: '五度', detail: 'C-G 稳定', notes: ['C4', 'G4'] },
      { value: 'octave', label: '八度', detail: 'C-C 同名音', notes: ['C4', 'C5'] },
    ],
    observations: ['跨度越大，键盘距离越远。', '五度和八度通常听起来更稳定。'],
  },
  chord: {
    kind: 'chord',
    title: '和弦色彩实验',
    prompt: '切换和弦类型，听明亮、柔和与紧张的色彩差别。',
    controls: [
      { value: 'major', label: '大三和弦', detail: 'C-E-G 明亮', notes: ['C4', 'E4', 'G4'] },
      { value: 'minor', label: '小三和弦', detail: 'A-C-E 柔和', notes: ['A3', 'C4', 'E4'] },
      { value: 'dominant7', label: '属七和弦', detail: 'G-B-D-F 紧张', notes: ['G3', 'B3', 'D4', 'F4'] },
    ],
    observations: ['大三和弦常明亮，小三和弦常柔和。', '七和弦比三和弦多一层张力。'],
  },
  tempo: {
    kind: 'tempo',
    title: '速度对比实验',
    prompt: '选择 BPM，观察拍点间距，并听同一拍组的快慢变化。',
    controls: [
      { value: 'slow', label: '60 BPM', detail: '慢速', notes: ['C4', 'C4', 'C4', 'C4'], beats: ['1', '2', '3', '4'] },
      { value: 'medium', label: '100 BPM', detail: '中速', notes: ['C4', 'C4', 'C4', 'C4'], beats: ['1', '2', '3', '4'] },
      { value: 'fast', label: '140 BPM', detail: '快速', notes: ['C4', 'C4', 'C4', 'C4'], beats: ['1', '2', '3', '4'] },
    ],
    observations: ['BPM 数字越大，单位时间内拍子越多。', '速度会改变音乐的情绪和动作感。'],
  },
  dynamics: {
    kind: 'dynamics',
    title: '力度层次实验',
    prompt: '选择力度层次，观察符号大小和听声音强弱变化。',
    controls: [
      { value: 'soft', label: 'p 弱', detail: '轻声', notes: ['C4'] },
      { value: 'medium', label: 'mf 中强', detail: '清楚', notes: ['C4'] },
      { value: 'strong', label: 'f 强', detail: '有力量', notes: ['C4'] },
      { value: 'crescendo', label: '渐强', detail: '越来越强', notes: ['C4', 'C4', 'C4'] },
    ],
    observations: ['力度不是音高，而是声音强弱。', '渐强能让音乐有推进感。'],
  },
  articulation: {
    kind: 'articulation',
    title: '奏法连接实验',
    prompt: '切换连音、跳音和重音，听声音连接方式如何改变音乐性格。',
    controls: [
      { value: 'legato', label: '连音', detail: '平滑连接', notes: ['C4', 'D4', 'E4'] },
      { value: 'staccato', label: '跳音', detail: '短促弹性', notes: ['C4', 'D4', 'E4'] },
      { value: 'accent', label: '重音', detail: '第一音强调', notes: ['C4', 'D4', 'E4'] },
    ],
    observations: ['同样的音高，奏法不同会改变性格。', '跳音更短，连音更流畅。'],
  },
  repeat: {
    kind: 'repeat',
    title: '反复结构实验',
    prompt: '选择结构，观察段落播放顺序如何变化。',
    controls: [
      { value: 'aa-b', label: 'A A B', detail: '主题重复后对比', notes: ['C4', 'E4', 'G4', 'C4', 'E4', 'G4', 'D4', 'F4', 'A4'], symbols: ['A', 'A', 'B'] },
      { value: 'a-ba', label: 'A BA', detail: '局部反复', notes: ['C4', 'E4', 'G4', 'D4', 'F4', 'A4', 'D4', 'F4', 'A4'], symbols: ['A', 'B', 'A'] },
      { value: 'intro-repeat', label: '引子 + 反复', detail: '短引子后主题重复', notes: ['G3', 'C4', 'E4', 'G4', 'C4', 'E4', 'G4'], symbols: ['引', 'A', 'A'] },
    ],
    observations: ['反复能强化主题记忆。', '不同反复顺序会改变听众对结构的感受。'],
  },
  form: {
    kind: 'form',
    title: '曲式结构实验',
    prompt: '切换曲式结构，观察主题、对比和再现的关系。',
    controls: [
      { value: 'ab', label: 'AB', detail: '两个段落', notes: ['C4', 'D4', 'E4', 'G4', 'A4', 'G4'], symbols: ['A', 'B'] },
      { value: 'aba', label: 'ABA', detail: '对比后再现', notes: ['C4', 'D4', 'E4', 'G4', 'A4', 'G4', 'C4', 'D4', 'E4'], symbols: ['A', 'B', 'A'] },
      { value: 'variation', label: '变奏', detail: '主题变化发展', notes: ['C4', 'E4', 'G4', 'C5', 'C4', 'G4', 'E4', 'C4'], symbols: ['主题', '变奏'] },
    ],
    observations: ['ABA 的最后一个 A 会带来回归感。', '变奏保留主题特征，同时改变节奏或音区。'],
  },
}

export function getDemoScene(kind: DemoKind): DemoScene {
  return scenes[kind]
}

export const DEMO_SCENES = scenes
