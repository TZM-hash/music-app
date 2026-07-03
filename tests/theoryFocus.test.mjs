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

test('theory focus can target a course stage', () => {
  const loadTsModule = createTsLoader()
  const { createTheoryFocus, matchesTheoryFocus } = loadTsModule('src/state/theoryFocus.ts')
  const focus = createTheoryFocus({ stage: 'junior-advanced' })

  assert.deepEqual(focus, { stage: 'junior-advanced' })
  assert.equal(matchesTheoryFocus({ stage: 'junior-advanced', category: '音程与和声', id: 'cadence' }, focus), true)
  assert.equal(matchesTheoryFocus({ stage: 'primary-lower', category: '音高与唱名', id: 'pitch-up-down' }, focus), false)
})
