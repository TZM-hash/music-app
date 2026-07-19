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
  course: '成长路线',
  training: '挑战中心',
  adventure: '闯关地图',
  piano: '钢琴',
  drums: '架子鼓',
  mixer: '混音创作',
  recorder: '竖笛',
  xylophone: '木琴',
  'game-ear': '听感挑战',
  'game-echo': '节奏复制',
  battle: '班级对战',
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
  options: RouteNavigationOptions = {},
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
