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

function loadReview() {
  return createTsLoader()('src/state/theoryReview.ts')
}

function question(overrides = {}) {
  return {
    source: 'theory',
    itemId: 'rhythm-basic',
    itemTitle: '节奏基础',
    category: '节奏与节拍',
    stage: 'primary-middle',
    question: '四分音符通常有几拍？',
    options: ['半拍', '一拍', '两拍'],
    correctAnswer: 1,
    selectedAnswer: 0,
    timestamp: 1000,
    ...overrides,
  }
}

test('recordReviewAnswer aggregates attempts and keeps latest result', () => {
  const review = loadReview()
  let book = review.createEmptyReviewBook('student-a')

  book = review.recordReviewAnswer(book, question({ selectedAnswer: 0, timestamp: 1000 }))
  book = review.recordReviewAnswer(book, question({ selectedAnswer: 1, timestamp: 2000 }))

  const key = 'theory:rhythm-basic:四分音符通常有几拍？'
  assert.equal(book.records[key].attempts, 2)
  assert.equal(book.records[key].correct, 1)
  assert.equal(book.records[key].wrong, 1)
  assert.equal(book.records[key].latestCorrect, true)
  assert.equal(book.records[key].lastSelectedAnswer, 1)
})

test('wrong answers only include active latest mistakes', () => {
  const review = loadReview()
  let book = review.createEmptyReviewBook('student-a')

  book = review.recordReviewAnswer(book, question({ selectedAnswer: 2, timestamp: 1000 }))
  assert.equal(review.getWrongAnswers(book).length, 1)

  book = review.recordReviewAnswer(book, question({ selectedAnswer: 1, timestamp: 2000 }))
  assert.equal(review.getWrongAnswers(book).length, 0)
})

test('weak categories rank categories by wrong answer pressure', () => {
  const review = loadReview()
  let book = review.createEmptyReviewBook('student-a')

  book = review.recordReviewAnswer(book, question({ itemId: 'meter', category: '节奏与节拍', selectedAnswer: 0 }))
  book = review.recordReviewAnswer(book, question({ itemId: 'meter-2', category: '节奏与节拍', selectedAnswer: 0, question: '3/4有几拍？' }))
  book = review.recordReviewAnswer(book, question({ itemId: 'composer', category: '音乐家', selectedAnswer: 0, question: '谁写了欢乐颂？' }))
  book = review.recordReviewAnswer(book, question({ itemId: 'composer', category: '音乐家', selectedAnswer: 1, question: '谁写了欢乐颂？', correctAnswer: 1 }))

  const weak = review.getWeakCategories(book)
  assert.equal(weak[0].category, '节奏与节拍')
  assert.equal(weak[0].wrong, 2)
  assert.ok(weak[0].accuracy < weak[1].accuracy)
})

test('mastery status moves from new to needs review, improving, and mastered', () => {
  const review = loadReview()
  let book = review.createEmptyReviewBook('student-a')

  assert.equal(review.getMasteryStatus(book, 'theory', 'scale-basic'), 'new')

  book = review.recordReviewAnswer(book, question({ itemId: 'scale-basic', selectedAnswer: 0 }))
  assert.equal(review.getMasteryStatus(book, 'theory', 'scale-basic'), 'needs-review')

  book = review.recordReviewAnswer(book, question({ itemId: 'scale-basic', selectedAnswer: 1, timestamp: 2000 }))
  assert.equal(review.getMasteryStatus(book, 'theory', 'scale-basic'), 'improving')

  book = review.recordReviewAnswer(book, question({ itemId: 'scale-basic', selectedAnswer: 1, timestamp: 3000 }))
  book = review.recordReviewAnswer(book, question({ itemId: 'scale-basic', selectedAnswer: 1, timestamp: 4000 }))
  assert.equal(review.getMasteryStatus(book, 'theory', 'scale-basic'), 'mastered')
})

test('daily challenge is stable for same student and date and prefers weak items', () => {
  const review = loadReview()
  let book = review.createEmptyReviewBook('student-a')

  book = review.recordReviewAnswer(book, question({ itemId: 'meter', category: '节奏与节拍', selectedAnswer: 0 }))

  const pool = [
    question({ itemId: 'meter', category: '节奏与节拍', selectedAnswer: undefined }),
    question({ source: 'encyclopedia', itemId: 'beethoven', itemTitle: '贝多芬', category: '音乐家', question: '贝多芬是哪一时期的重要作曲家？', correctAnswer: 0, selectedAnswer: undefined }),
    question({ itemId: 'scale-basic', category: '调式与音阶', question: '大调音阶常见色彩是？', correctAnswer: 2, selectedAnswer: undefined }),
    question({ source: 'encyclopedia', itemId: 'erhu', itemTitle: '二胡', category: '民族乐器', question: '二胡属于哪类乐器？', correctAnswer: 1, selectedAnswer: undefined }),
  ]

  const first = review.buildDailyChallenge(book, pool, '2026-07-03', 3)
  const second = review.buildDailyChallenge(book, pool, '2026-07-03', 3)

  assert.deepEqual(first.map((item) => item.id), second.map((item) => item.id))
  assert.equal(first.length, 3)
  assert.equal(first[0].itemId, 'meter')
})

