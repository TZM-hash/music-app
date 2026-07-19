// 跨游戏统一连击系统
import { playUI } from '../music/uiSounds'
import { celebrate } from '../components/Celebration'

export type ComboTier = 'none' | 'fire' | 'gold' | 'rainbow'

let count = 0

export function hitCombo(): { count: number; tier: ComboTier } {
  count++
  const tier = getTier(count)

  if (count === 5) {
    playUI('combo')
    celebrate('small')
  } else if (count === 10) {
    playUI('combo')
    celebrate('medium')
  } else if (count > 0 && count % 20 === 0) {
    playUI('combo')
    celebrate('large')
  }

  return { count, tier }
}

export function resetCombo(): void {
  count = 0
}

export function getComboCount(): number {
  return count
}

function getTier(c: number): ComboTier {
  if (c >= 20) return 'rainbow'
  if (c >= 10) return 'gold'
  if (c >= 5) return 'fire'
  return 'none'
}

export function getComboColor(tier: ComboTier): string {
  switch (tier) {
    case 'rainbow': return '#ff2d55'
    case 'gold': return '#ff9500'
    case 'fire': return '#ff6b35'
    default: return '#1c1c1e'
  }
}
