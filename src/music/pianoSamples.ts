// 本地打包的钢琴采样（Salamander 系列，经 nbrosowsky/tonejs-instruments 分发）。
// 用 Vite 静态 import，构建时会被 singlefile 插件内联为 data URL，
// 这样双击打开的 乐动课堂.html 也能发出真实钢琴音色，不再依赖 CDN。

import sampleC2 from './piano-samples/C2.mp3'
import sampleDs2 from './piano-samples/Ds2.mp3'
import sampleFs2 from './piano-samples/Fs2.mp3'
import sampleA2 from './piano-samples/A2.mp3'
import sampleC3 from './piano-samples/C3.mp3'
import sampleDs3 from './piano-samples/Ds3.mp3'
import sampleFs3 from './piano-samples/Fs3.mp3'
import sampleA3 from './piano-samples/A3.mp3'
import sampleC4 from './piano-samples/C4.mp3'
import sampleDs4 from './piano-samples/Ds4.mp3'
import sampleFs4 from './piano-samples/Fs4.mp3'
import sampleA4 from './piano-samples/A4.mp3'
import sampleC5 from './piano-samples/C5.mp3'
import sampleDs5 from './piano-samples/Ds5.mp3'
import sampleFs5 from './piano-samples/Fs5.mp3'
import sampleA5 from './piano-samples/A5.mp3'
import sampleC6 from './piano-samples/C6.mp3'

/** Tone.Sampler 用的采样表：键为音名，值为打包后的 URL（生产为 data:） */
export const EMBEDDED_PIANO_SAMPLES: Record<string, string> = {
  C2: sampleC2,
  'D#2': sampleDs2,
  'F#2': sampleFs2,
  A2: sampleA2,
  C3: sampleC3,
  'D#3': sampleDs3,
  'F#3': sampleFs3,
  A3: sampleA3,
  C4: sampleC4,
  'D#4': sampleDs4,
  'F#4': sampleFs4,
  A4: sampleA4,
  C5: sampleC5,
  'D#5': sampleDs5,
  'F#5': sampleFs5,
  A5: sampleA5,
  C6: sampleC6,
}
