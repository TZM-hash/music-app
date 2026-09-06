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
