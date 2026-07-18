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

/** 播放 UI 音效（只在开启时发声） */
export async function playUI(name: UISoundName): Promise<void> {
  if (!enabled) return
  await ensureAudio()
  switch (name) {
    case 'correct':
      // 明亮上行琶音 C-E-G（300ms 内完成）
      playNote('C5', '32n', 0.5)
      setTimeout(() => playNote('E5', '32n', 0.5), 80)
      setTimeout(() => playNote('G5', '32n', 0.5), 160)
      break
    case 'fanfare':
      // 胜利号角：三和弦 C-E-G-C + 低频冲击
      playNote('C4', '2n', 0.6)
      playNote('E4', '2n', 0.6)
      playNote('G4', '2n', 0.6)
      playNote('C5', '2n', 0.7)
      playDrum('kick')
      setTimeout(() => playDrum('crash'), 200)
      break
    case 'countdown':
      // 鼓点递进（最后一击加铜钹）
      playDrum('kick')
      setTimeout(() => playDrum('kick'), 400)
      setTimeout(() => {
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
      setTimeout(() => playNote('E6', '32n', 0.4), 60)
      setTimeout(() => playNote('G6', '32n', 0.45), 120)
      break
  }
}
