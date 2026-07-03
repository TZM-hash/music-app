export type ReviewSource = 'theory' | 'encyclopedia' | 'daily'

export type MasteryStatus = 'new' | 'learning' | 'needs-review' | 'improving' | 'mastered'

export interface ReviewQuestion {
  id?: string
  source: ReviewSource
  itemId: string
  itemTitle: string
  category: string
  stage?: string
  question: string
  options: string[]
  correctAnswer: number
  selectedAnswer?: number
  explanation?: string
  timestamp?: number
}

export interface ReviewRecord {
  id: string
  source: ReviewSource
  itemId: string
  itemTitle: string
  category: string
  stage?: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  attempts: number
  correct: number
  wrong: number
  latestCorrect: boolean
  lastSelectedAnswer?: number
  firstAnsweredAt: number
  lastAnsweredAt: number
}

export interface ReviewBook {
  studentId: string
  records: Record<string, ReviewRecord>
  createdAt: number
  updatedAt: number
}

export interface WeakCategory {
  category: string
  attempts: number
  correct: number
  wrong: number
  activeWrong: number
  accuracy: number
}

const STORAGE_KEY = 'music-edu-theory-review-v1'

export function createEmptyReviewBook(studentId = 'anonymous'): ReviewBook {
  const now = Date.now()
  return {
    studentId,
    records: {},
    createdAt: now,
    updatedAt: now,
  }
}

export function reviewQuestionId(question: Pick<ReviewQuestion, 'source' | 'itemId' | 'question'>): string {
  return `${question.source}:${question.itemId}:${question.question}`
}

export function recordReviewAnswer(book: ReviewBook, question: ReviewQuestion): ReviewBook {
  const id = reviewQuestionId(question)
  const timestamp = question.timestamp ?? Date.now()
  const latestCorrect = question.selectedAnswer === question.correctAnswer
  const previous = book.records[id]
  const record: ReviewRecord = {
    id,
    source: question.source,
    itemId: question.itemId,
    itemTitle: question.itemTitle,
    category: question.category,
    stage: question.stage,
    question: question.question,
    options: question.options.slice(),
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    attempts: (previous?.attempts ?? 0) + 1,
    correct: (previous?.correct ?? 0) + (latestCorrect ? 1 : 0),
    wrong: (previous?.wrong ?? 0) + (latestCorrect ? 0 : 1),
    latestCorrect,
    lastSelectedAnswer: question.selectedAnswer,
    firstAnsweredAt: previous?.firstAnsweredAt ?? timestamp,
    lastAnsweredAt: timestamp,
  }

  return {
    ...book,
    records: {
      ...book.records,
      [id]: record,
    },
    updatedAt: timestamp,
  }
}

export function getWrongAnswers(book: ReviewBook): ReviewRecord[] {
  return Object.values(book.records)
    .filter((record) => !record.latestCorrect)
    .sort((a, b) => b.lastAnsweredAt - a.lastAnsweredAt || a.id.localeCompare(b.id))
}

export function getWeakCategories(book: ReviewBook): WeakCategory[] {
  const groups = new Map<string, WeakCategory>()

  for (const record of Object.values(book.records)) {
    const current =
      groups.get(record.category) ??
      {
        category: record.category,
        attempts: 0,
        correct: 0,
        wrong: 0,
        activeWrong: 0,
        accuracy: 1,
      }
    current.attempts += record.attempts
    current.correct += record.correct
    current.wrong += record.wrong
    current.activeWrong += record.latestCorrect ? 0 : 1
    current.accuracy = current.attempts > 0 ? current.correct / current.attempts : 1
    groups.set(record.category, current)
  }

  return Array.from(groups.values()).sort(
    (a, b) =>
      b.activeWrong - a.activeWrong ||
      b.wrong - a.wrong ||
      a.accuracy - b.accuracy ||
      a.category.localeCompare(b.category)
  )
}

export function getMasteryStatus(book: ReviewBook, source: ReviewSource, itemId: string): MasteryStatus {
  const records = Object.values(book.records).filter((record) => record.source === source && record.itemId === itemId)
  if (records.length === 0) return 'new'

  const attempts = records.reduce((sum, record) => sum + record.attempts, 0)
  const correct = records.reduce((sum, record) => sum + record.correct, 0)
  const activeWrong = records.some((record) => !record.latestCorrect)
  const accuracy = attempts > 0 ? correct / attempts : 0

  if (activeWrong) return 'needs-review'
  if (correct >= 3 && accuracy >= 0.75) return 'mastered'
  if (attempts >= 2 && correct > 0) return 'improving'
  return correct > 0 ? 'learning' : 'needs-review'
}

export function buildDailyChallenge(
  book: ReviewBook,
  pool: ReviewQuestion[],
  dateKey = new Date().toISOString().slice(0, 10),
  limit = 6
): ReviewQuestion[] {
  const weak = new Set(getWeakCategories(book).slice(0, 3).map((item) => item.category))
  const wrongIds = new Set(getWrongAnswers(book).map((item) => item.id))
  const studentSeed = stableHash(`${book.studentId}:${dateKey}`)

  return pool
    .map((question, index) => {
      const id = question.id ?? reviewQuestionId(question)
      const reviewWeight = wrongIds.has(id) ? 200 : 0
      const weakWeight = weak.has(question.category) ? 100 : 0
      const jitter = stableHash(`${studentSeed}:${dateKey}:${id}:${index}`) % 97
      return {
        ...question,
        id,
        selectedAnswer: undefined,
        score: reviewWeight + weakWeight - jitter / 100,
      }
    })
    .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)))
    .slice(0, limit)
    .map(({ score: _score, ...question }) => question)
}

export function loadReviewBook(studentId = 'anonymous'): ReviewBook {
  const books = readStorage()
  return normalizeBook(books[studentId], studentId)
}

export function saveReviewBook(book: ReviewBook): void {
  try {
    const books = readStorage()
    books[book.studentId] = book
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
  } catch {
    /* ignore storage failures */
  }
}

function readStorage(): Record<string, ReviewBook> {
  try {
    if (typeof localStorage === 'undefined') return {}
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, ReviewBook>) : {}
  } catch {
    return {}
  }
}

function normalizeBook(book: ReviewBook | undefined, studentId: string): ReviewBook {
  if (!book || !book.records) return createEmptyReviewBook(studentId)
  return {
    studentId: book.studentId || studentId,
    records: book.records || {},
    createdAt: book.createdAt || Date.now(),
    updatedAt: book.updatedAt || Date.now(),
  }
}

function stableHash(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
