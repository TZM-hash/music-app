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

test('push navigation stores the previous route as return parent', () => {
  const { applyRouteNavigation, backButtonLabel } = createTsLoader()('src/state/navigationHistory.ts')

  const next = applyRouteNavigation({ route: 'theory', stack: [] }, 'piano')

  assert.deepEqual(next, { route: 'piano', stack: ['theory'] })
  assert.equal(backButtonLabel(next.stack), '返回音乐探索馆')
})

test('direct navigation clears return stack for sidebar-style jumps', () => {
  const { applyRouteNavigation } = createTsLoader()('src/state/navigationHistory.ts')

  const next = applyRouteNavigation({ route: 'piano', stack: ['theory'] }, 'course', { history: 'reset' })

  assert.deepEqual(next, { route: 'course', stack: [] })
})

test('direct navigation clears return stack even when selecting the current route', () => {
  const { applyRouteNavigation } = createTsLoader()('src/state/navigationHistory.ts')

  const next = applyRouteNavigation({ route: 'piano', stack: ['theory'] }, 'piano', { history: 'reset' })

  assert.deepEqual(next, { route: 'piano', stack: [] })
})

test('multi-level back pops one parent at a time', () => {
  const { popRouteHistory, backButtonLabel } = createTsLoader()('src/state/navigationHistory.ts')

  const first = popRouteHistory({ route: 'mixer', stack: ['theory', 'piano'] })
  const second = popRouteHistory(first)

  assert.deepEqual(first, { route: 'piano', stack: ['theory'] })
  assert.equal(backButtonLabel(first.stack), '返回音乐探索馆')
  assert.deepEqual(second, { route: 'theory', stack: [] })
})

test('same-route navigation does not duplicate the current route', () => {
  const { applyRouteNavigation } = createTsLoader()('src/state/navigationHistory.ts')

  const next = applyRouteNavigation({ route: 'theory', stack: ['home'] }, 'theory')

  assert.deepEqual(next, { route: 'theory', stack: ['home'] })
})
