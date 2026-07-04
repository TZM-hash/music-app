import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function createTsLoader() {
  const cache = new Map()
  const load = (filePath) => {
    const resolved = path.resolve(filePath.endsWith('.ts') ? filePath : `${filePath}.ts`)
    if (cache.has(resolved)) return cache.get(resolved).exports
    const source = fs.readFileSync(resolved, 'utf8')
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText
    const module = { exports: {} }
    cache.set(resolved, module)
    const localRequire = (specifier) => {
      if (specifier.startsWith('.')) return load(path.resolve(path.dirname(resolved), specifier))
      return require(specifier)
    }
    const fn = new Function('module', 'exports', 'require', transpiled)
    fn(module, module.exports, localRequire)
    return module.exports
  }
  return load
}

test('music ability signals highlight the active game ability', () => {
  const { buildMusicAbilitySignals } = createTsLoader()('src/state/musicAbilities.ts')

  const signals = buildMusicAbilitySignals({
    gameId: 'game-ear',
    stars: 2,
    rows: [
      { ok: true, label: '第 1 题', got: '大三度' },
      { ok: false, label: '第 2 题', got: '小三度', want: '纯五度' },
      { ok: true, label: '第 3 题', got: '大三和弦' },
    ],
  })

  assert.equal(signals.length, 5)
  assert.equal(signals[0].id, 'listening')
  assert.ok(signals[0].value > signals.find((item) => item.id === 'creating').value)
  assert.match(signals[0].tip, /听|耳/)
})

test('creative activity strengthens the creating dimension', () => {
  const { buildMusicAbilitySignals } = createTsLoader()('src/state/musicAbilities.ts')

  const signals = buildMusicAbilitySignals({
    gameId: 'mixer',
    stars: 3,
    creativeActions: 4,
    advice: '完成四小节节奏创编',
  })

  const creating = signals.find((item) => item.id === 'creating')
  assert.equal(creating.id, 'creating')
  assert.ok(creating.value >= 90)
  assert.equal(creating.tone, 'good')
})
