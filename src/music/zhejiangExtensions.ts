import type { Route } from '../state/appState'
import type { TheoryTopic } from './theoryCatalog'
import type { PrimaryGrade } from './zhejiangCurriculum'

export interface ZhejiangExtension {
  id: string
  title: string
  region: '浙江'
  grades: PrimaryGrade[]
  category: string
  connection: string
  prompt: string
  keywords: string[]
  route?: Route
}

export const ZHEJIANG_EXTENSIONS: ZhejiangExtension[] = [
  {
    id: 'yue-opera-melody',
    title: '越剧里的旋律线',
    region: '浙江',
    grades: [3, 4, 5, 6],
    category: '音高与唱名',
    connection: '听一听地方腔调怎样用上行、下行和装饰表达情绪。',
    prompt: '试着把一条旋律唱得更婉转，听听音高方向和语气有什么变化。',
    keywords: ['越剧', '旋律线', '腔调'],
    route: 'library',
  },
  {
    id: 'jiangnan-sizhu-texture',
    title: '江南丝竹的层次',
    region: '浙江',
    grades: [4, 5, 6],
    category: '创作与编配',
    connection: '比较不同乐器进入后的音色和声部层次，理解“主线与陪伴”。',
    prompt: '先找出最像主旋律的声部，再想想哪一种音色适合做背景。',
    keywords: ['江南丝竹', '音色', '织体'],
    route: 'mixer',
  },
  {
    id: 'tea-picking-rhythm',
    title: '采茶歌的节奏脚步',
    region: '浙江',
    grades: [1, 2, 3, 4],
    category: '节奏与节拍',
    connection: '把劳动动作转成稳定拍、长短节奏和身体律动。',
    prompt: '边想象采茶动作边拍四拍，试着让每一步都落在稳定拍上。',
    keywords: ['采茶', '节奏', '律动'],
    route: 'game-taiko',
  },
  {
    id: 'water-town-breath',
    title: '水乡船歌的呼吸',
    region: '浙江',
    grades: [1, 2, 3, 4, 5],
    category: '速度力度与表情',
    connection: '感受水面、行船和歌声中的速度、力度与换气。',
    prompt: '把旋律分成可以一口气唱完的小句，听听哪里需要停一停。',
    keywords: ['水乡', '呼吸', '力度'],
    route: 'game-sing',
  },
  {
    id: 'dragon-boat-beat',
    title: '龙舟鼓点的共同脉搏',
    region: '浙江',
    grades: [2, 3, 4, 5, 6],
    category: '节奏与节拍',
    connection: '从集体划桨的动作理解强拍、重复和合奏配合。',
    prompt: '设计一个两拍鼓点，让同伴能在同一个脉搏上一起划。',
    keywords: ['龙舟', '鼓点', '合奏'],
    route: 'drums',
  },
  {
    id: 'zhejiang-folk-colors',
    title: '浙江民歌的地方颜色',
    region: '浙江',
    grades: [3, 4, 5, 6],
    category: '民族与音乐场景',
    connection: '比较方言、旋律走向和音色如何让民歌带上地方气质。',
    prompt: '选择一个你熟悉的地方声音，用三个关键词描述它的音乐颜色。',
    keywords: ['民歌', '方言', '地方色彩'],
    route: 'library',
  },
  {
    id: 'local-listening-map',
    title: '我身边的浙江声音地图',
    region: '浙江',
    grades: [1, 2, 3, 4, 5, 6],
    category: '民族与音乐场景',
    connection: '把校园、街巷和自然里的声音按高低、远近、强弱记录下来。',
    prompt: '找三种身边的声音，用线条或词语画出它们的变化。',
    keywords: ['声音地图', '聆听', '记录'],
    route: 'library',
  },
  {
    id: 'bamboo-flute-tone',
    title: '竹笛的清亮音色',
    region: '浙江',
    grades: [2, 3, 4, 5, 6],
    category: '民族与音乐场景',
    connection: '从竹笛的气息和音色，认识吹奏乐器的发声特点。',
    prompt: '比较清亮、柔和和有力度的声音，哪一种更像山水画面？',
    keywords: ['竹笛', '吹奏', '音色'],
    route: 'recorder',
  },
]

function stableHash(value: string): number {
  let hash = 0
  for (const char of value) hash = (hash * 33 + char.charCodeAt(0)) >>> 0
  return hash
}

export function getZhejiangExtension(
  topic: Pick<TheoryTopic, 'id' | 'category'>,
  grade?: PrimaryGrade
): ZhejiangExtension {
  const categoryMatches = ZHEJIANG_EXTENSIONS.filter((item) => item.category === topic.category)
  const candidates = categoryMatches.length > 0 ? categoryMatches : ZHEJIANG_EXTENSIONS
  const gradeMatches = grade ? candidates.filter((item) => item.grades.includes(grade)) : candidates
  const pool = gradeMatches.length > 0 ? gradeMatches : candidates
  return pool[stableHash(`${topic.id}:${grade ?? 'all'}`) % pool.length]
}
