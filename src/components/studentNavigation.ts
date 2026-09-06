import type { Route } from '../state/appState'

export interface StudentPrimaryNavItem {
  route: Route
  icon: string
  label: string
  hint: string
}

/** 学生端保留四个一级入口，其他页面按场馆和功能归入侧栏次级入口。 */
export const STUDENT_PRIMARY_NAV: StudentPrimaryNavItem[] = [
  { route: 'home', icon: '🏠', label: '今日', hint: '今天先玩什么' },
  { route: 'theory', icon: '🧭', label: '探索', hint: '教材与声音发现' },
  { route: 'training', icon: '🎠', label: '玩乐', hint: '听、拍、创作' },
  { route: 'adventure', icon: '🎒', label: '我的', hint: '发现与作品' },
]

/** 学段总览由首页和课堂内的上下文入口承载，避免与顶部年级筛选重复。 */
export const STUDENT_SECONDARY_NAV: StudentPrimaryNavItem[] = [
  { route: 'lesson', icon: '📖', label: '互动课堂', hint: '听玩创一节课' },
  { route: 'library', icon: '📚', label: '作品与素材', hint: '作品地图、歌曲与故事' },
]

/** 具体乐器作为次级入口收纳，避免占用主导航但保持随时可用。 */
export const STUDENT_INSTRUMENT_NAV: StudentPrimaryNavItem[] = [
  { route: 'piano', icon: '🎹', label: '钢琴', hint: '音高、音阶与和弦' },
  { route: 'drums', icon: '🥁', label: '架子鼓', hint: '节拍互动' },
  { route: 'recorder', icon: '🪈', label: '竖笛', hint: '指法与旋律' },
  { route: 'xylophone', icon: '🎶', label: '木琴', hint: '清脆打击旋律' },
  { route: 'woodblock', icon: '🪵', label: '木鱼', hint: '短促木质敲击' },
  { route: 'clappers', icon: '👏', label: '响板', hint: '干脆的成对节奏' },
  { route: 'bell', icon: '🔔', label: '碰钟', hint: '明亮的余音' },
  { route: 'gong', icon: '🌕', label: '锣', hint: '低沉回响' },
  { route: 'drum', icon: '🪘', label: '鼓', hint: '有弹性的冲击' },
  { route: 'cymbal', icon: '🥏', label: '钹', hint: '闪亮金属声' },
  { route: 'pipa', icon: '🪕', label: '琵琶', hint: '清晰拨弦' },
  { route: 'erhu', icon: '🎻', label: '二胡', hint: '歌唱般的弓弦' },
  { route: 'dizi', icon: '🎋', label: '竹笛', hint: '带气息的旋律' },
  { route: 'violin', icon: '🎻', label: '小提琴', hint: '连贯的弓弦线条' },
  { route: 'bass', icon: '🎸', label: '贝斯', hint: '低音支撑' },
  { route: 'marimba', icon: '🪵', label: '马林巴', hint: '温暖木质音' },
  { route: 'musicbox', icon: '🧸', label: '八音盒', hint: '轻巧闪烁旋律' },
  { route: 'organ', icon: '🎛️', label: '管风琴/电子琴', hint: '持续和声' },
  { route: 'synth', icon: '🎚️', label: '合成器', hint: '电子质感音色' },
  { route: 'pluck', icon: '🪕', label: '拨弦', hint: '快速收束的颗粒感' },
  { route: 'handbell', icon: '🛎️', label: '铃铛', hint: '清亮金属声' },
  { route: 'strings', icon: '🎻', label: '弦乐', hint: '柔和长线条' },
  { route: 'trumpet', icon: '🎺', label: '小号', hint: '明亮号角声' },
  { route: 'small-drum', icon: '🥁', label: '小鼓', hint: '清楚的重音节奏' },
  { route: 'ban-drum', icon: '🪘', label: '板鼓', hint: '戏曲节拍与停顿' },
  { route: 'orchestra', icon: '🎼', label: '管弦合奏', hint: '厚实展开的空间' },
  { route: 'dragon-drum', icon: '🚣', label: '龙舟鼓', hint: '共同行动的脉搏' },
]
