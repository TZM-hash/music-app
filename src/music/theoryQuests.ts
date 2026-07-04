import type { Route } from '../state/appState'
import type { TheoryStageId } from './theoryCatalog'

export interface TheoryQuest {
  id: string
  title: string
  icon: string
  mood: string
  stage: TheoryStageId
  mission: string
  topicIds: string[]
  practiceRoute: Route
  reward: string
  color: string
}

export const THEORY_QUESTS: TheoryQuest[] = [
  {
    id: 'pitch-forest',
    title: '音高森林',
    icon: '🎹',
    mood: '听见高低，点亮音符',
    stage: 'primary-lower',
    mission: '从声音四要素、唱名、键盘方向出发，像寻宝一样找出音的高低和旋律走向。',
    topicIds: ['sound-four-properties', 'pitch-up-down', 'solfege-numbers', 'keyboard-direction', 'voice-register', 'melodic-step-leap'],
    practiceRoute: 'game-ear',
    reward: '音符探险徽章',
    color: '#2f9e44',
  },
  {
    id: 'rhythm-carnival',
    title: '节奏嘉年华',
    icon: '🥁',
    mood: '拍起来，节奏就活了',
    stage: 'primary-middle',
    mission: '用口令、拍手和节奏反应挑战稳定拍、附点、切分、三连音和复合节奏。',
    topicIds: ['steady-beat', 'quarter-eighth-notes', 'rhythm-pattern-ta-ta-ti', 'dotted-rhythm', 'syncopation', 'triplet', 'tie-and-slur', 'offbeat'],
    practiceRoute: 'game-taiko',
    reward: '律动达人徽章',
    color: '#f25050',
  },
  {
    id: 'score-castle',
    title: '识谱城堡',
    icon: '🏰',
    mood: '破解谱面密码',
    stage: 'primary-upper',
    mission: '读懂线间、谱号、加线、调号、反复路线和谱面标记优先级。',
    topicIds: ['staff-lines-spaces', 'treble-clef', 'jianpu-staff-map', 'bass-clef', 'ledger-lines', 'grand-staff', 'repeat-endings', 'score-markings-order'],
    practiceRoute: 'game-read',
    reward: '谱面侦探徽章',
    color: '#f59f00',
  },
  {
    id: 'scale-river',
    title: '音阶河流',
    icon: '🌊',
    mood: '顺着调式水流前进',
    stage: 'primary-upper',
    mission: '比较大调、小调、五声音阶、宫商角徵羽和转调，让调性色彩变得听得见。',
    topicIds: ['c-major-scale', 'g-major-scale', 'f-major-scale', 'major-minor-feeling', 'pentatonic-scale', 'gong-shang-jue-zhi-yu', 'relative-major-minor', 'modulation-pivot'],
    practiceRoute: 'game-sing',
    reward: '音阶航海徽章',
    color: '#4dabf7',
  },
  {
    id: 'harmony-lab',
    title: '和声实验室',
    icon: '🧪',
    mood: '给旋律调颜色',
    stage: 'junior-basic',
    mission: '听辨音程、三和弦、七和弦、低音线与终止式，理解稳定和张力。',
    topicIds: ['interval-basic', 'consonance-dissonance', 'triads', 'primary-triads', 'harmonic-function', 'seventh-chords', 'cadence', 'bass-line'],
    practiceRoute: 'game-ear',
    reward: '和声魔法徽章',
    color: '#7048e8',
  },
  {
    id: 'expression-stage',
    title: '表情舞台',
    icon: '🎭',
    mood: '同一旋律也能演出不同表情',
    stage: 'junior-basic',
    mission: '用速度、力度、奏法、换气、装饰音和自由速度塑造音乐表现。',
    topicIds: ['tempo-basic', 'dynamics-basic', 'articulation-basic', 'breath-mark', 'ritardando', 'accelerando', 'ornaments-intro', 'rubato-and-phrasing'],
    practiceRoute: 'game-sing',
    reward: '舞台表现徽章',
    color: '#d6336c',
  },
  {
    id: 'form-maze',
    title: '曲式迷宫',
    icon: '🧩',
    mood: '找到 A、B 和回来的路',
    stage: 'junior-basic',
    mission: '在反复、问答、二段体、三段体、回旋、变奏中找到音乐结构路线。',
    topicIds: ['repeat-signs', 'phrase-question-answer', 'call-response', 'binary-ternary-form', 'intro-coda', 'contrast-repetition', 'rondo-form', 'variation-development'],
    practiceRoute: 'library',
    reward: '结构解谜徽章',
    color: '#0c8599',
  },
  {
    id: 'composer-studio',
    title: '作曲小屋',
    icon: '🎨',
    mood: '把发现变成自己的音乐',
    stage: 'junior-advanced',
    mission: '从动机、旋律线、节奏创编、固定音型和四小节乐句开始做小作品。',
    topicIds: ['motif', 'melody-contour', 'rhythm-composition', 'question-answer-writing', 'ostinato', 'texture-melody-accompaniment', 'four-bar-phrase-writing', 'arrangement-color'],
    practiceRoute: 'mixer',
    reward: '小作曲家徽章',
    color: '#ff922b',
  },
  {
    id: 'world-music-port',
    title: '世界音乐港',
    icon: '🌏',
    mood: '听见不同文化的声音',
    stage: 'junior-advanced',
    mission: '认识民族乐器、民歌地域、戏曲行当、世界音乐节拍和听赏地图。',
    topicIds: ['instrument-families', 'chinese-instruments', 'folk-song-region', 'opera-role-types', 'world-music-meter', 'orchestra-sections', 'listening-map', 'listening-analysis'],
    practiceRoute: 'library',
    reward: '音乐旅行家徽章',
    color: '#12b886',
  },
]

export function getQuestById(id: string): TheoryQuest | undefined {
  return THEORY_QUESTS.find((quest) => quest.id === id)
}
