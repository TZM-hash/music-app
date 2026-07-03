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

test('quest islands cover valid theory topics', () => {
  const loadTsModule = createTsLoader()
  const catalog = loadTsModule('src/music/theoryCatalog.ts')
  const quests = loadTsModule('src/music/theoryQuests.ts')
  const topicIds = new Set(catalog.THEORY_TOPICS.map((topic) => topic.id))

  assert.ok(quests.THEORY_QUESTS.length >= 8)
  for (const quest of quests.THEORY_QUESTS) {
    assert.ok(quest.id)
    assert.ok(quest.title)
    assert.ok(quest.icon)
    assert.ok(quest.topicIds.length >= 6, `${quest.id} needs at least six topics`)
    assert.ok(quest.reward.length >= 4, `${quest.id} needs a reward`)
    assert.ok(quest.practiceRoute, `${quest.id} needs a practice route`)

    for (const topicId of quest.topicIds) {
      assert.ok(topicIds.has(topicId), `${quest.id} references missing topic ${topicId}`)
    }
  }
})

test('quest islands include playful and advanced missions', () => {
  const loadTsModule = createTsLoader()
  const quests = loadTsModule('src/music/theoryQuests.ts')
  const stages = new Set(quests.THEORY_QUESTS.map((quest) => quest.stage))
  const ids = quests.THEORY_QUESTS.map((quest) => quest.id)

  assert.ok(stages.has('junior-advanced'))
  assert.ok(ids.includes('rhythm-carnival'))
  assert.ok(ids.includes('harmony-lab'))
  assert.ok(ids.includes('composer-studio'))
})
