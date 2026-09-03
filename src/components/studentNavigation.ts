import type { Route } from '../state/appState'

export interface StudentPrimaryNavItem {
  route: Route
  icon: string
  label: string
  hint: string
}

/** 学生端只保留四个一级入口；具体乐器和教材页面从场馆内部进入。 */
export const STUDENT_PRIMARY_NAV: StudentPrimaryNavItem[] = [
  { route: 'home', icon: '🏠', label: '今日', hint: '今天先玩什么' },
  { route: 'theory', icon: '🧭', label: '探索', hint: '教材与声音发现' },
  { route: 'training', icon: '🎠', label: '玩乐', hint: '听、拍、创作' },
  { route: 'adventure', icon: '🎒', label: '我的', hint: '发现与作品' },
]

export const STUDENT_SECONDARY_NAV: StudentPrimaryNavItem[] = [
  { route: 'lesson', icon: '📖', label: '互动课堂', hint: '听玩创一节课' },
  { route: 'library', icon: '📚', label: '素材库', hint: '歌曲与故事素材' },
  { route: 'course', icon: '🗺️', label: '学段总览', hint: '各年级目标与进度' },
]

