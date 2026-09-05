import type { TheoryStageId } from './theoryCatalog'

export const PRIMARY_GRADES = [1, 2, 3, 4, 5, 6] as const
export type PrimaryGrade = (typeof PRIMARY_GRADES)[number]
export type Semester = 1 | 2
export type CurriculumSource = 'textbook' | 'extension'

export interface PrimaryGradeInfo {
  grade: PrimaryGrade
  label: string
  short: string
  band: 'lower' | 'middle' | 'upper'
  description: string
}

export interface CurriculumUnit {
  id: string
  grade: PrimaryGrade
  semester: Semester
  unitNumber: number
  title: string
  focus: string
  keywords: string[]
}

export interface TopicCurriculum {
  edition: 'zhejiang-renyin'
  province: '浙江省'
  publisher: '人民音乐出版社'
  subject: '小学音乐'
  track: '综合实践'
  source: CurriculumSource
  grades: PrimaryGrade[]
  semester: Semester
  unitId: string
  unitNumber: number
  unitTitle: string
  focus: string
}

export const PRIMARY_GRADE_INFO: Record<PrimaryGrade, PrimaryGradeInfo> = {
  1: { grade: 1, label: '一年级', short: '一上/一下', band: 'lower', description: '从声音、动作和唱游开始发现音乐。' },
  2: { grade: 2, label: '二年级', short: '二上/二下', band: 'lower', description: '在童谣、律动和模仿中感受音乐变化。' },
  3: { grade: 3, label: '三年级', short: '三上/三下', band: 'middle', description: '把唱名、节奏和简单谱面连起来。' },
  4: { grade: 4, label: '四年级', short: '四上/四下', band: 'middle', description: '用乐器、乐句和结构读懂音乐。' },
  5: { grade: 5, label: '五年级', short: '五上/五下', band: 'upper', description: '连接五声旋律、合唱和音乐结构。' },
  6: { grade: 6, label: '六年级', short: '六上/六下', band: 'upper', description: '比较风格、设计伴奏并完成小创作。' },
}

interface UnitSeed {
  title: string
  focus: string
  keywords: string[]
}

type SemesterSeeds = { semester1: UnitSeed[]; semester2: UnitSeed[] }

// 这是可校准的“教材对照主题”，用能力目标复原人音版的综合实践节奏，
// 不直接复制某一印次的单元标题或教材曲目。
const GRADE_UNIT_SEEDS: Record<PrimaryGrade, SemesterSeeds> = {
  1: {
    semester1: [
      { title: '我的声音会说话', focus: '高低、长短、强弱和音色', keywords: ['听辨', '模仿', '声音要素'] },
      { title: '唱游和动作', focus: '稳定拍、快慢和身体律动', keywords: ['拍手', '走步', '唱游'] },
      { title: '动物的音乐', focus: '用声音和动作表现形象', keywords: ['音色', '力度', '表现'] },
    ],
    semester2: [
      { title: '春天的歌', focus: '旋律方向和呼吸', keywords: ['上行', '下行', '乐句'] },
      { title: '节日与生活', focus: '节奏、速度和生活声音', keywords: ['节奏', '速度', '场景'] },
      { title: '小小乐器家', focus: '认识乐器和合奏角色', keywords: ['乐器', '音色', '合奏'] },
    ],
  },
  2: {
    semester1: [
      { title: '童谣与节奏', focus: '四分、八分和休止的感觉', keywords: ['童谣', '节奏', '休止'] },
      { title: '旋律的方向', focus: '高低、重复和呼应', keywords: ['旋律', '重复', '呼应'] },
      { title: '音乐中的故事', focus: '速度、力度和情绪变化', keywords: ['故事', '情绪', '对比'] },
    ],
    semester2: [
      { title: '进行曲与舞步', focus: '稳定拍、强弱和队形律动', keywords: ['进行曲', '强拍', '律动'] },
      { title: '民族乐器初识', focus: '吹拉弹打与音色比较', keywords: ['民族乐器', '音色', '比较'] },
      { title: '重复与呼应', focus: '短句重复、问答和结尾', keywords: ['问答', '重复', '结尾'] },
    ],
  },
  3: {
    semester1: [
      { title: '唱名与谱面', focus: '唱名、简谱和五线谱线间', keywords: ['唱名', '简谱', '五线谱'] },
      { title: '节奏小能手', focus: '拍号、节奏型和节奏口令', keywords: ['拍号', '节奏型', '口令'] },
      { title: '乐句会呼吸', focus: '乐句方向、换气和收束', keywords: ['乐句', '换气', '收束'] },
    ],
    semester2: [
      { title: '中国民歌', focus: '民歌旋律与地方色彩', keywords: ['民歌', '地方', '旋律'] },
      { title: '音乐家与作品', focus: '听赏线索和作品故事', keywords: ['听赏', '作曲家', '故事'] },
      { title: '小小合奏', focus: '旋律、节奏和合奏配合', keywords: ['合奏', '声部', '配合'] },
    ],
  },
  4: {
    semester1: [
      { title: '音色与乐器', focus: '乐器家族、音区和音色层次', keywords: ['乐器', '音区', '音色'] },
      { title: '拍号与节奏变化', focus: '附点、切分和节奏对比', keywords: ['拍号', '附点', '切分'] },
      { title: '旋律和伴奏', focus: '主旋律、低音与背景', keywords: ['旋律', '伴奏', '织体'] },
    ],
    semester2: [
      { title: '中华音乐风格', focus: '五声旋律和民族音色', keywords: ['五声', '民族', '风格'] },
      { title: '世界音乐窗口', focus: '不同节拍、速度和表情', keywords: ['世界音乐', '节拍', '比较'] },
      { title: '听赏表达', focus: '用音乐语言说明听感依据', keywords: ['听赏', '依据', '表达'] },
    ],
  },
  5: {
    semester1: [
      { title: '五声旋律', focus: '宫商角徵羽与旋律色彩', keywords: ['五声调式', '旋律', '色彩'] },
      { title: '合唱与和声', focus: '音程、和弦和声部平衡', keywords: ['合唱', '和声', '平衡'] },
      { title: '音乐结构', focus: '乐段、重复、对比和回归', keywords: ['乐段', '结构', '回归'] },
    ],
    semester2: [
      { title: '民歌与地方色彩', focus: '旋律、方言和地域风格', keywords: ['民歌', '方言', '地域'] },
      { title: '音乐创编', focus: '动机、节奏和问答句创作', keywords: ['动机', '创编', '问答'] },
      { title: '舞台表达', focus: '速度、力度、连音和表情', keywords: ['表情', '舞台', '表现'] },
    ],
  },
  6: {
    semester1: [
      { title: '复杂节奏与读谱', focus: '复合节奏、谱面标记和读谱顺序', keywords: ['复杂节奏', '读谱', '标记'] },
      { title: '曲式与变化', focus: '二段体、三段体和变奏', keywords: ['曲式', '变奏', '对比'] },
      { title: '伴奏与织体', focus: '低音、和弦和声部层次', keywords: ['伴奏', '织体', '声部'] },
    ],
    semester2: [
      { title: '中国戏曲与民间音乐', focus: '越剧、民歌和地方腔调', keywords: ['越剧', '民间音乐', '腔调'] },
      { title: '世界音乐比较', focus: '不同文化的节奏与音色', keywords: ['文化', '节奏', '音色'] },
      { title: '四小节创作', focus: '动机发展、句尾和完整表达', keywords: ['创作', '动机', '乐句'] },
    ],
  },
}

function buildUnits(): CurriculumUnit[] {
  return PRIMARY_GRADES.flatMap((grade) => {
    const seeds = GRADE_UNIT_SEEDS[grade]
    return [
      ...seeds.semester1.map((seed, index) => ({
        ...seed,
        id: `zj-renyin-g${grade}-s1-u${index + 1}`,
        grade,
        semester: 1 as Semester,
        unitNumber: index + 1,
      })),
      ...seeds.semester2.map((seed, index) => ({
        ...seed,
        id: `zj-renyin-g${grade}-s2-u${index + 1}`,
        grade,
        semester: 2 as Semester,
        unitNumber: index + 1,
      })),
    ]
  })
}

export const ZHEJIANG_RENYIN_UNITS = buildUnits()

export function getGradeLabel(grade: PrimaryGrade): string {
  return PRIMARY_GRADE_INFO[grade].label
}

export function getSemesterLabel(semester: Semester): string {
  return semester === 1 ? '上册' : '下册'
}

export function getCurriculumSourceLabel(source: CurriculumSource): string {
  return source === 'textbook' ? '教材同步' : '教材外拓展'
}

export function getCurriculumUnits(grade: PrimaryGrade, semester?: Semester): CurriculumUnit[] {
  return ZHEJIANG_RENYIN_UNITS.filter((unit) => unit.grade === grade && (!semester || unit.semester === semester))
}

export function getStageForGrade(grade: PrimaryGrade): TheoryStageId {
  if (grade <= 2) return 'primary-lower'
  if (grade <= 4) return 'primary-middle'
  return 'primary-upper'
}

const STAGE_GRADES: Record<TheoryStageId, PrimaryGrade[]> = {
  'primary-lower': [1, 2],
  'primary-middle': [3, 4],
  'primary-upper': [5, 6],
  'junior-basic': [5, 6],
  'junior-advanced': [6],
}

/** 返回一个学段对应的教材年级，供全局年级筛选复用。 */
export function getGradesForStage(stage: TheoryStageId): PrimaryGrade[] {
  return [...(STAGE_GRADES[stage] ?? [])]
}

export function stageMatchesGrade(stage: TheoryStageId, grade: PrimaryGrade): boolean {
  return getGradesForStage(stage).includes(grade)
}

const CATEGORY_UNIT_NUMBER: Record<string, number> = {
  '音高与唱名': 1,
  '节奏与节拍': 2,
  '记谱与读谱': 3,
  '调式与音阶': 1,
  '音程与和声': 2,
  '速度力度与表情': 2,
  '曲式结构': 3,
  '创作与编配': 3,
  '民族与音乐场景': 1,
}

const TOPIC_GRADE_OVERRIDES: Record<string, { grades: PrimaryGrade[]; semester: Semester; unitNumber: number }> = {
  'sound-four-properties': { grades: [1], semester: 1, unitNumber: 1 },
  'pitch-up-down': { grades: [1, 2], semester: 2, unitNumber: 1 },
  'steady-beat': { grades: [1, 2], semester: 1, unitNumber: 2 },
  'quarter-eighth-notes': { grades: [2], semester: 1, unitNumber: 1 },
  'rests-basic': { grades: [2], semester: 1, unitNumber: 1 },
  'staff-lines-spaces': { grades: [3], semester: 1, unitNumber: 1 },
  'treble-clef': { grades: [3, 4], semester: 1, unitNumber: 1 },
  'jianpu-staff-map': { grades: [3], semester: 1, unitNumber: 1 },
  'meter-basic': { grades: [3, 4], semester: 1, unitNumber: 2 },
  'sixteenth-notes': { grades: [4], semester: 1, unitNumber: 2 },
  'dotted-rhythm': { grades: [4], semester: 1, unitNumber: 2 },
  'syncopation': { grades: [4, 5], semester: 1, unitNumber: 2 },
  'pentatonic-scale': { grades: [5, 6], semester: 1, unitNumber: 1 },
  'motif': { grades: [5], semester: 2, unitNumber: 2 },
  'four-bar-phrase-writing': { grades: [6], semester: 2, unitNumber: 3 },
  'folk-song-region': { grades: [5, 6], semester: 2, unitNumber: 1 },
  'chinese-instruments': { grades: [2, 3, 4], semester: 2, unitNumber: 2 },
}

function stableNumber(value: string): number {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash
}

function fallbackAlignment(input: { id: string; category: string; stage: TheoryStageId }) {
  const grades = STAGE_GRADES[input.stage]
  const grade = grades[stableNumber(input.id) % grades.length]
  const semester = (stableNumber(`${input.id}:semester`) % 2) + 1 as Semester
  const unitNumber = CATEGORY_UNIT_NUMBER[input.category] ?? 1
  return { grades, selectedGrade: grade, semester, unitNumber }
}

export function alignTheoryTopic(input: { id: string; category: string; stage: TheoryStageId }): TopicCurriculum {
  const override = TOPIC_GRADE_OVERRIDES[input.id]
  const fallback = fallbackAlignment(input)
  const grades = override?.grades ?? [fallback.selectedGrade]
  const semester = override?.semester ?? fallback.semester
  const unitNumber = override?.unitNumber ?? fallback.unitNumber
  const selectedGrade = grades[0]
  const unit =
    getCurriculumUnits(selectedGrade, semester).find((item) => item.unitNumber === unitNumber) ??
    getCurriculumUnits(selectedGrade, semester)[0]

  return {
    edition: 'zhejiang-renyin',
    province: '浙江省',
    publisher: '人民音乐出版社',
    subject: '小学音乐',
    track: '综合实践',
    source: input.stage.startsWith('primary-') ? 'textbook' : 'extension',
    grades,
    semester,
    unitId: unit.id,
    unitNumber: unit.unitNumber,
    unitTitle: unit.title,
    focus: unit.focus,
  }
}
