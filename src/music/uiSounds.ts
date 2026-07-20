// UI 音效引擎：课堂正反馈音效，只保留 5 个关键场景
// 默认关闭，老师在 TopBar 手动开启
import { ensureAudio, playNote, playDrum } from './audioEngine'

export type UISoundName = 'correct' | 'fanfare' | 'countdown' | 'star' | 'combo'

const PREF_KEY = 'music-edu-ui-sound-v1'
let enabled = loadPref()

function loadPref(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === '1'
  } catch {
    return false
  }
}

export function setUISoundEnabled(on: boolean): void {
  enabled = on
  try {
    localStorage.setItem(PREF_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function isUISoundEnabled(): boolean {
  return enabled
}

// UI 音效内部延迟定时器注册表：切页时统一清理，防止离开页面后仍发声
const uiTimers = new Set<number>()

/** 登记一个可被 stopUISounds 清理的延迟回调 */
export function uiLater(fn: () => void, ms: number): void {
  const id = window.setTimeout(() => {
    uiTimers.delete(id)
    fn()
  }, ms)
  uiTimers.add(id)
}

/** 播放 UI 音效（只在开启时发声）。延迟音符经统一登记，切页时由 stopUISounds 清理 */
export async function playUI(name: UISoundName): Promise<void> {
  if (!enabled) return
  await ensureAudio()
  switch (name) {
    case 'correct':
      // 明亮上行琶音 C-E-G（300ms 内完成）
      playNote('C5', '32n', 0.5)
      uiLater(() => playNote('E5', '32n', 0.5), 80)
      uiLater(() => playNote('G5', '32n', 0.5), 160)
      break
    case 'fanfare':
      // 胜利号角：三和弦 C-E-G-C + 低频冲击
      playNote('C4', '2n', 0.6)
      playNote('E4', '2n', 0.6)
      playNote('G4', '2n', 0.6)
      playNote('C5', '2n', 0.7)
      playDrum('kick')
      uiLater(() => playDrum('crash'), 200)
      break
    case 'countdown':
      // 鼓点递进（最后一击加铜钹）
      playDrum('kick')
      uiLater(() => playDrum('kick'), 400)
      uiLater(() => {
        playDrum('kick')
        playDrum('crash')
      }, 800)
      break
    case 'star':
      // 清脆"叮"（C6 八音盒感）
      playNote('C6', '16n', 0.4, 'musicbox')
      break
    case 'combo':
      // 金属铃声音高递进
      playNote('C6', '32n', 0.4)
      uiLater(() => playNote('E6', '32n', 0.4), 60)
      uiLater(() => playNote('G6', '32n', 0.45), 120)
      break
  }
}

/** 清掉所有尚未触发的 UI 音效延迟音符（切页时调用，避免"幽灵发声"） */
export function stopUISounds(): void {
  uiTimers.forEach((id) => window.clearTimeout(id))
  uiTimers.clear()
}
