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
  { route: 'library', icon: '📚', label: '素材库', hint: '歌曲与故事素材' },
]

/** 具体乐器作为次级入口收纳，避免占用主导航但保持随时可用。 */
export const STUDENT_INSTRUMENT_NAV: StudentPrimaryNavItem[] = [
  { route: 'piano', icon: '🎹', label: '钢琴', hint: '音高、音阶与和弦' },
  { route: 'drums', icon: '🥁', label: '架子鼓', hint: '节拍互动' },
  { route: 'recorder', icon: '🪈', label: '竖笛', hint: '指法与旋律' },
  { route: 'xylophone', icon: '🎶', label: '木琴', hint: '清脆打击旋律' },
]

