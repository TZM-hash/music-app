# Smart Review And Music Encyclopedia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build v0.9A by adding student-aware smart review, wrong-answer notebook, daily challenge, and a music encyclopedia connected to quizzes and recommendations.

**Architecture:** Add testable data modules for review records and encyclopedia entries, then integrate them into the existing Home, Theory, and Library surfaces. Keep the sidebar compact by using Library tabs for songs and encyclopedia, and use Home for daily challenge and weak-knowledge prompts.

**Tech Stack:** React 18, TypeScript, Vite single-file build, localStorage, Node `node:test` tests with the existing TypeScript transpile loader.

---

### Task 1: Review Data Model

**Files:**
- Create: `src/state/theoryReview.ts`
- Test: `tests/theoryReview.test.mjs`

- [x] **Step 1: Write the failing tests**

Create `tests/theoryReview.test.mjs` with tests for normalized records, wrong-answer filtering, weak categories, mastery status, and deterministic daily challenge generation.

- [x] **Step 2: Run the test to verify it fails**

Run: `node --test tests/theoryReview.test.mjs`

Expected: fail because `src/state/theoryReview.ts` does not exist.

- [x] **Step 3: Implement the data model**

Create `src/state/theoryReview.ts` with:

- `ReviewSource`
- `ReviewRecord`
- `ReviewQuestion`
- `ReviewBook`
- `createEmptyReviewBook`
- `recordReviewAnswer`
- `getWrongAnswers`
- `getWeakCategories`
- `getMasteryStatus`
- `buildDailyChallenge`
- localStorage helpers `loadReviewBook` and `saveReviewBook`

The implementation should accept plain data so tests can run without React or DOM.

- [x] **Step 4: Run the test to verify it passes**

Run: `node --test tests/theoryReview.test.mjs`

Expected: all review model tests pass.

### Task 2: Encyclopedia Content Model

**Files:**
- Create: `src/music/encyclopedia.ts`
- Test: `tests/encyclopedia.test.mjs`

- [x] **Step 1: Write the failing tests**

Create `tests/encyclopedia.test.mjs` with tests that assert:

- at least 36 entries exist
- all six planned categories exist
- every entry has title, summary, key facts, prompt, related theory ids, and at least three quiz questions
- related theory topic ids resolve to existing `THEORY_TOPICS`
- composer, appreciation, Chinese music, Western history, instrument, and genre examples are present

- [x] **Step 2: Run the test to verify it fails**

Run: `node --test tests/encyclopedia.test.mjs`

Expected: fail because `src/music/encyclopedia.ts` does not exist.

- [x] **Step 3: Implement the encyclopedia module**

Create `src/music/encyclopedia.ts` with:

- `EncyclopediaType`
- `EncyclopediaEntry`
- `ENCYCLOPEDIA_CATEGORIES`
- `ENCYCLOPEDIA_ENTRIES`
- `filterEncyclopediaEntries`
- `getEncyclopediaEntry`
- `encyclopediaToReviewQuestions`

The content should cover music composers, works and appreciation, Chinese traditional music, Western music history, instruments, and genres/forms.

- [x] **Step 4: Run the test to verify it passes**

Run: `node --test tests/encyclopedia.test.mjs`

Expected: all encyclopedia tests pass.

### Task 3: Connect Theory Quiz To Review Records

**Files:**
- Modify: `src/pages/Theory.tsx`
- Test: extend `tests/theoryReview.test.mjs`

- [x] **Step 1: Write the failing test**

Add a test that records multiple answers for the same theory question and verifies:

- the latest wrong answer appears once
- a later correct retry removes it from active wrong answers
- mastery becomes `improving` after mixed results

- [x] **Step 2: Run the test to verify it fails**

Run: `node --test tests/theoryReview.test.mjs`

Expected: fail until retry-clearing behavior is implemented or adjusted.

- [x] **Step 3: Update `MiniQuiz` in `Theory.tsx`**

Call `recordReviewAnswer` whenever a theory quiz option is chosen. Include source `theory`, topic id, title, category, stage, question text, options, selected answer, correct answer, and a timestamp.

- [x] **Step 4: Run focused tests**

Run: `node --test tests/theoryReview.test.mjs`

Expected: pass.

### Task 4: Add Daily Challenge And Wrong-Answer UI To Home

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/course.css` or `src/index.css` if shared Home styles live there

- [x] **Step 1: Add Home integration**

Use `loadReviewBook`, `buildDailyChallenge`, `getWrongAnswers`, and `getWeakCategories` to show:

- Daily challenge card
- Wrong-answer notebook preview
- Weak knowledge chips
- quick buttons into Theory and Library

- [x] **Step 2: Keep entry count compact**

Use the existing work-grid and recommendation areas rather than adding a new sidebar group.

- [x] **Step 3: Build check**

Run: `npm run build`

Expected: TypeScript and Vite build pass.

### Task 5: Add Encyclopedia Tab To Library

**Files:**
- Modify: `src/pages/Library.tsx`
- Modify: `src/pages/library.css`

- [x] **Step 1: Add a local tab state**

Add `view: 'songs' | 'encyclopedia'` and render existing song library under songs.

- [x] **Step 2: Render encyclopedia entries**

Add filters for encyclopedia category and stage, search by title/summary, entry cards with key facts, classroom prompt, related theory count, and quiz buttons.

- [x] **Step 3: Record encyclopedia quiz answers**

Use `recordReviewAnswer` with source `encyclopedia` when students answer encyclopedia quiz questions.

- [x] **Step 4: Build check**

Run: `npm run build`

Expected: TypeScript and Vite build pass.

### Task 6: Verification, Single-File Sync, And Commit

**Files:**
- Modify: `乐动课堂.html`

- [x] **Step 1: Run all Node tests**

Run: `node --test tests/theoryReview.test.mjs tests/encyclopedia.test.mjs tests/theoryFocus.test.mjs tests/theoryCatalog.test.mjs tests/theoryQuests.test.mjs tests/theoryDemos.test.mjs`

Expected: all tests pass.

- [x] **Step 2: Build the single-file app**

Run: `npm run build`

Expected: TypeScript and Vite build pass.

- [x] **Step 3: Sync distributable**

Run: `Copy-Item -LiteralPath dist\index.html -Destination 乐动课堂.html -Force`

Expected: `乐动课堂.html` timestamp updates.

- [x] **Step 4: Inspect git diff**

Run: `git status --short` and `git diff --stat`

Expected: only planned files changed.

- [x] **Step 5: Commit**

Run:

```bash
git add src tests docs/superpowers/plans/2026-07-03-smart-review-encyclopedia.md 乐动课堂.html
git commit -m "feat: add smart review encyclopedia system"
```

Expected: commit succeeds on branch `codex/v0.9a-smart-review-encyclopedia`.


