// 班级对战状态
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

let state: BattleState = {
  left: { name: '蓝队', score: 0, color: '#4dd0e8' },
  right: { name: '红队', score: 0, color: '#e06078' },
  round: 0,
  totalRounds: 10,
  active: false,
}

export function getBattleState(): BattleState {
  return { ...state }
}

export function startBattle(totalRounds = 10): void {
  state = {
    left: { name: '蓝队', score: 0, color: '#4dd0e8' },
    right: { name: '红队', score: 0, color: '#e06078' },
    round: 0,
    totalRounds,
    active: true,
  }
}

export function scoreTeam(side: 'left' | 'right', points: number): void {
  if (side === 'left') state.left.score += points
  else state.right.score += points
}

export function nextRound(): boolean {
  state.round++
  return state.round < state.totalRounds
}

export function endBattle(): 'left' | 'right' | 'tie' {
  state.active = false
  if (state.left.score > state.right.score) return 'left'
  if (state.right.score > state.left.score) return 'right'
  return 'tie'
}

export function resetBattle(): void {
  state.active = false
  state.left.score = 0
  state.right.score = 0
  state.round = 0
}
