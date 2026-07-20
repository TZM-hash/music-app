// 班级对战状态：改为可订阅 store，所有 UI 实例自动同步，不再靠手动 setBattle(getBattleState())
import { useSyncExternalStore } from 'react'

export interface TeamState {
  name: string
  score: number
  color: string
}

export interface BattleState {
  left: TeamState
  right: TeamState
  round: number
  totalRounds: number
  active: boolean
}

const INITIAL: BattleState = {
  left: { name: '蓝队', score: 0, color: '#4dabf7' },
  right: { name: '红队', score: 0, color: '#ff6b6b' },
  round: 0,
  totalRounds: 10,
  active: false,
}

let state: BattleState = {
  left: { ...INITIAL.left },
  right: { ...INITIAL.right },
  round: INITIAL.round,
  totalRounds: INITIAL.totalRounds,
  active: INITIAL.active,
}

const listeners = new Set<() => void>()

function setState(next: BattleState): void {
  state = next
  listeners.forEach((l) => l())
}

export function getBattleState(): BattleState {
  return state
}

/** 订阅对战状态变化（useSyncExternalStore 用），返回取消订阅函数 */
export function subscribeBattle(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React hook：组件随对战状态自动更新，无需手动同步 */
export function useBattleState(): BattleState {
  return useSyncExternalStore(subscribeBattle, getBattleState)
}

export function startBattle(totalRounds = 10): void {
  setState({
    left: { ...INITIAL.left },
    right: { ...INITIAL.right },
    round: 0,
    totalRounds,
    active: true,
  })
}

export function scoreTeam(side: 'left' | 'right', points: number): void {
  if (!state.active) return
  setState({
    ...state,
    left: side === 'left' ? { ...state.left, score: state.left.score + points } : state.left,
    right: side === 'right' ? { ...state.right, score: state.right.score + points } : state.right,
  })
}

export function nextRound(): boolean {
  const round = state.round + 1
  setState({ ...state, round })
  return round < state.totalRounds
}

export function endBattle(): 'left' | 'right' | 'tie' {
  setState({ ...state, active: false })
  if (state.left.score > state.right.score) return 'left'
  if (state.right.score > state.left.score) return 'right'
  return 'tie'
}

export function resetBattle(): void {
  setState({
    left: { ...state.left, score: 0 },
    right: { ...state.right, score: 0 },
    round: 0,
    totalRounds: state.totalRounds,
    active: false,
  })
}
