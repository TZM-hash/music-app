import type { Route } from './appState'

export type NavigationHistoryMode = 'push' | 'reset' | 'replace'

export interface RouteNavigationOptions {
  history?: NavigationHistoryMode
}

export interface RouteHistoryState {
  route: Route
  stack: Route[]
}

export const ROUTE_LABELS: Record<Route, string> = {
  home: '今日探索',
  lesson: '互动课堂',
  course: '学段总览',
  training: '挑战中心',
  'reference-forest': '森林乐器大冒险',
  adventure: '我的发现',
  piano: '钢琴',
  drums: '架子鼓',
  mixer: '混音创作',
  recorder: '竖笛',
  xylophone: '木琴',
  woodblock: '木鱼',
  clappers: '响板',
  bell: '碰钟',
  gong: '锣',
  drum: '鼓',
  cymbal: '钹',
  pipa: '琵琶',
  erhu: '二胡',
  dizi: '竹笛',
  violin: '小提琴',
  bass: '贝斯',
  marimba: '马林巴',
  musicbox: '八音盒',
  organ: '管风琴/电子琴',
  synth: '合成器',
  pluck: '拨弦',
  handbell: '铃铛',
  strings: '弦乐',
  trumpet: '小号',
  'small-drum': '小鼓',
  'ban-drum': '板鼓',
  orchestra: '管弦合奏',
  'dragon-drum': '龙舟鼓',
  'game-ear': '听感挑战',
  'game-echo': '节奏复制',
  'game-taiko': '节奏反应',
  'game-sing': '跟唱挑战',
  'game-read': '读谱闯关',
  library: '素材库',
  theory: '音乐探索馆',
  class: '学生档案',
  dashboard: '成长观察',
}

const MAX_RETURN_STACK = 12

export function applyRouteNavigation(
  state: RouteHistoryState,
  nextRoute: Route,
  options: RouteNavigationOptions = {}
): RouteHistoryState {
  const history = options.history ?? 'push'
  if (history === 'reset') return { route: nextRoute, stack: [] }
  if (history === 'replace') return { route: nextRoute, stack: state.stack }
  if (state.route === nextRoute) return state

  return {
    route: nextRoute,
    stack: [...state.stack, state.route].slice(-MAX_RETURN_STACK),
  }
}

export function popRouteHistory(state: RouteHistoryState): RouteHistoryState {
  const previousRoute = state.stack[state.stack.length - 1]
  if (!previousRoute) return state

  return {
    route: previousRoute,
    stack: state.stack.slice(0, -1),
  }
}

export function backButtonLabel(stack: Route[]): string {
  const targetRoute = stack[stack.length - 1]
  return targetRoute ? `返回${ROUTE_LABELS[targetRoute]}` : '返回上层'
}
