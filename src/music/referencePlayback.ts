import type { ReferenceAsset } from './referenceAssets'

let activeAudio: HTMLAudioElement | null = null
let playbackToken = 0

/** 停止由参考课件资源创建的上一段音频。 */
export function stopReferenceAudio(): void {
  playbackToken += 1
  if (!activeAudio) return
  activeAudio.pause()
  activeAudio.currentTime = 0
  activeAudio = null
}

/**
 * 先尝试播放真实参考音频；加载失败或浏览器拒绝时交给调用方使用合成兜底。
 * 返回 true 表示真实音频已经开始播放，false 表示调用方应走 fallback。
 */
export async function playReferenceAudio(
  asset: Pick<ReferenceAsset, 'src'>,
  fallback: () => void
): Promise<boolean> {
  stopReferenceAudio()
  const token = playbackToken
  const audio = new Audio(asset.src)
  audio.preload = 'auto'
  activeAudio = audio
  audio.onended = () => {
    if (activeAudio === audio) activeAudio = null
  }
  try {
    await audio.play()
    if (token !== playbackToken) {
      audio.pause()
      return false
    }
    return true
  } catch {
    if (activeAudio === audio) activeAudio = null
    audio.pause()
    fallback()
    return false
  }
}
