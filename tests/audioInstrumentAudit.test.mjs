import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const read = (file) => fs.readFileSync(path.resolve(file), 'utf8')

test('参考音频通过源码导入，单文件不依赖 public 根路径', () => {
  const source = read('src/music/referenceAssets.ts')
  assert.match(source, /from ['"]\.\/reference-courseware\//)
  assert.doesNotMatch(source, /src:\s*['"]\/reference-courseware\//)
})

test('乐器侦探的木鱼、碰钟、钢琴使用独立试听资源与兜底音色', () => {
  const source = read('src/components/reference/InstrumentDetectiveActivity.tsx')
  assert.match(source, /getReferenceAsset|playReferenceAudio/)
  assert.match(source, /woodblock/)
  assert.match(source, /bell/)
  assert.match(source, /piano/)
  assert.match(source, /fallback|兜底/)
  assert.match(source, /stopAllAudio/)
})

test('节奏提交会完整回放 pattern，并且有可取消的播放生命周期', () => {
  const source = read('src/components/reference/RhythmBuilderActivity.tsx')
  assert.match(source, /playPattern|playRhythm|回放/)
  assert.match(source, /pattern\.map|for \(const .*pattern/)
  assert.match(source, /clearTimeout|cancel|token|stopAllAudio/)
  assert.match(source, /播放中|正在播放/)
})

test('乐器侧栏覆盖实际使用的音色，并接入通用试听页', () => {
  const nav = read('src/components/studentNavigation.ts')
  const app = read('src/App.tsx')
  const routes = read('src/state/appState.tsx')
  for (const instrument of [
    '木鱼',
    '响板',
    '碰钟',
    '锣',
    '鼓',
    '钹',
    '琵琶',
    '二胡',
    '竹笛',
    '小提琴',
    '贝斯',
    '马林巴',
    '八音盒',
    '管风琴',
    '合成器',
    '拨弦',
    '铃铛',
    '弦乐',
    '小号',
    '小鼓',
    '板鼓',
    '管弦合奏',
    '龙舟鼓',
  ]) {
    assert.match(nav, new RegExp(instrument))
  }
  assert.match(app, /InstrumentSoundPage/)
  assert.match(routes, /'woodblock'/)
})

test('木鱼、铃铛、八音盒、拨弦使用彼此独立的专用音源', () => {
  const source = read('src/music/audioEngine.ts')

  assert.match(source, /function playWoodblockSound/)
  assert.match(source, /function playBellSound/)
  assert.match(source, /function playMusicboxSound/)
  assert.match(source, /function playPluckSound/)
  assert.match(source, /function playGongSound/)
  assert.match(source, /PluckSynth/)

  assert.doesNotMatch(source, /case 'woodblock':\s*playDrum\('tom'\)/s)
  assert.doesNotMatch(source, /case 'gong':\s*playDrum\('crash'\)/s)
  assert.doesNotMatch(source, /case 'bell':\s*playNote\(pitch, duration, velocity, 'musicbox'\)/s)
  assert.doesNotMatch(source, /case 'handbell':\s*playNote\(pitch, duration, velocity, 'musicbox'\)/s)
  assert.doesNotMatch(source, /case 'pipa':\s*case 'pluck':\s*triggerVoice\('pluck'/s)
  assert.match(source, /kind === 'bell'[\s\S]*getBellSynth/)
  assert.match(source, /kind === 'pluck'[\s\S]*getPluckSynth/)
  assert.match(source, /woodblockBody\?\.triggerRelease/)
})

test('新增乐器按钢琴、架子鼓、竖笛、木琴的模式提供对应互动', () => {
  const page = read('src/pages/InstrumentSoundPage.tsx')
  const catalog = read('src/music/instrumentSounds.ts')

  assert.match(catalog, /interaction:\s*'keyboard'/)
  assert.match(catalog, /interaction:\s*'drum-pad'/)
  assert.match(catalog, /interaction:\s*'wind-fingering'/)
  assert.match(catalog, /interaction:\s*'mallet-bars'/)

  assert.match(page, /attackInstrumentSound/)
  assert.match(page, /releaseInstrumentSound/)
  assert.match(page, /onPointerDown/)
  assert.match(page, /onPointerUp/)
  assert.match(page, /keydown/)
  assert.match(page, /role="grid"/)
  assert.match(page, /Visualizer/)
})
