import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const readSource = (filePath) => fs.readFileSync(path.resolve(filePath), 'utf8')

test('童趣视觉层提供稳定的设计令牌与离线实现', () => {
  const css = readSource('src/playful.css')
  const main = readSource('src/main.tsx')

  for (const token of [
    '--playful-bg',
    '--playful-blue',
    '--playful-coral',
    '--playful-mint',
    '--playful-purple',
    '--playful-radius-card',
    '--playful-shadow-paper',
  ]) {
    assert.match(css, new RegExp(token.replaceAll('-', '\\-')))
  }

  assert.match(css, /prefers-reduced-motion\s*:\s*reduce/)
  assert.match(css, /:focus-visible/)
  assert.match(css, /min-height\s*:\s*44px/)
  assert.doesNotMatch(css, /https?:\/\//)

  const playfulImport = main.indexOf("import './playful.css'")
  const navigationImport = main.indexOf("import './navigation.css'")
  assert.ok(playfulImport >= 0, 'main.tsx should import the playful layer')
  assert.ok(playfulImport > navigationImport, 'playful layer should load after base navigation styles')
})

test('童趣视觉层覆盖首页、玩乐中心、探索馆和学生导航', () => {
  const css = readSource('src/playful.css')

  for (const selector of [
    '.content.route-home',
    '.content.route-training',
    '.content.route-theory',
    '.home-playground',
    '.training-experience-shell',
    '.mobile-nav',
    '.side-primary-group',
  ]) {
    assert.match(css, new RegExp(selector.replaceAll('.', '\\.') + '\\b'))
  }
})
