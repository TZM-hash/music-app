/** 应用中可被侧栏和试听页使用的乐器/音色标识。 */
export type InstrumentSoundId =
  | 'piano'
  | 'drums'
  | 'recorder'
  | 'xylophone'
  | 'woodblock'
  | 'clappers'
  | 'bell'
  | 'gong'
  | 'drum'
  | 'cymbal'
  | 'pipa'
  | 'erhu'
  | 'dizi'
  | 'violin'
  | 'bass'
  | 'marimba'
  | 'musicbox'
  | 'organ'
  | 'synth'
  | 'pluck'
  | 'handbell'
  | 'strings'
  | 'trumpet'
  | 'small-drum'
  | 'ban-drum'
  | 'orchestra'
  | 'dragon-drum'

export interface InstrumentSoundInfo {
  name: string
  icon: string
  hint: string
  note: string
}

export const INSTRUMENT_SOUND_INFO: Record<InstrumentSoundId, InstrumentSoundInfo> = {
  piano: { name: '钢琴', icon: '🎹', hint: '有层次、能连成旋律', note: 'C4' },
  drums: { name: '架子鼓', icon: '🥁', hint: '用力度推动节拍', note: 'C2' },
  recorder: { name: '竖笛', icon: '🪈', hint: '清亮的气息与旋律', note: 'G4' },
  xylophone: { name: '木琴', icon: '🎶', hint: '清脆、短促的敲击', note: 'C5' },
  woodblock: { name: '木鱼', icon: '🪵', hint: '圆润、短促的木质敲击', note: 'C4' },
  clappers: { name: '响板', icon: '👏', hint: '干脆、成对的节奏', note: 'C4' },
  bell: { name: '碰钟', icon: '🔔', hint: '明亮并留下余音', note: 'G5' },
  gong: { name: '锣', icon: '🌕', hint: '低沉、扩散的回响', note: 'C3' },
  drum: { name: '鼓', icon: '🪘', hint: '有弹性的低频冲击', note: 'C2' },
  cymbal: { name: '钹', icon: '🥏', hint: '闪亮、延展的金属声', note: 'C6' },
  pipa: { name: '琵琶', icon: '🪕', hint: '清晰的拨弦与颗粒感', note: 'E4' },
  erhu: { name: '二胡', icon: '🎻', hint: '连贯、带有歌唱感', note: 'A4' },
  dizi: { name: '竹笛', icon: '🎋', hint: '通透、带气息的线条', note: 'G5' },
  violin: { name: '小提琴', icon: '🎻', hint: '弓弦拉出的长线条', note: 'A4' },
  bass: { name: '贝斯', icon: '🎸', hint: '低沉而稳定的支撑', note: 'C2' },
  marimba: { name: '马林巴', icon: '🪵', hint: '温暖、饱满的木质音', note: 'C4' },
  musicbox: { name: '八音盒', icon: '🧸', hint: '轻巧、闪烁的旋律', note: 'C5' },
  organ: { name: '管风琴/电子琴', icon: '🎛️', hint: '持续、宽阔的和声', note: 'C4' },
  synth: { name: '合成器', icon: '🎚️', hint: '有电子质感的音色', note: 'C4' },
  pluck: { name: '拨弦', icon: '🪕', hint: '轻轻拨动后快速收束', note: 'E4' },
  handbell: { name: '铃铛', icon: '🛎️', hint: '清亮、短促的金属声', note: 'C5' },
  strings: { name: '弦乐', icon: '🎻', hint: '柔和、连贯的长线条', note: 'A4' },
  trumpet: { name: '小号', icon: '🎺', hint: '明亮、集中的号角声', note: 'C5' },
  'small-drum': { name: '小鼓', icon: '🥁', hint: '清楚、有重音的节奏', note: 'C3' },
  'ban-drum': { name: '板鼓', icon: '🪘', hint: '短促、带停顿的戏曲节拍', note: 'C3' },
  orchestra: { name: '管弦合奏', icon: '🎼', hint: '厚实、展开的合奏空间', note: 'C4' },
  'dragon-drum': { name: '龙舟鼓', icon: '🚣', hint: '有力、统一行动的脉搏', note: 'C2' },
}
