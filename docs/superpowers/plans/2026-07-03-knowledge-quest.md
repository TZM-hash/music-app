# Knowledge Quest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the theory catalog to 100+ topics with deeper quizzes and add a playful quest island layer for guided learning.

**Architecture:** Keep `theoryCatalog.ts` as the public catalog API, add `theoryExpansion.ts` for supplemental topics and quiz enrichment, and add `theoryQuests.ts` for island data. Update `AdventureMap.tsx` to render quest islands using existing progress data.

**Tech Stack:** React 18, TypeScript, Vite, Tone.js, Node built-in test runner.

---

### Task 1: Catalog Expansion Tests

**Files:**
- Modify: `tests/theoryCatalog.test.mjs`
- Create: `tests/theoryQuests.test.mjs`

- [ ] Add assertions that the catalog has at least 100 topics and every topic has at least four quiz questions.
- [ ] Add quest tests that validate quest topic ids and island count.
- [ ] Run both tests and confirm they fail because expansion and quest data do not exist yet.

### Task 2: Knowledge Expansion

**Files:**
- Create: `src/music/theoryExpansion.ts`
- Modify: `src/music/theoryCatalog.ts`

- [ ] Add supplemental topics across all existing categories.
- [ ] Add a quiz enrichment helper so base and supplemental topics have at least four questions.
- [ ] Export the merged catalog from `theoryCatalog.ts`.
- [ ] Re-run catalog tests and confirm they pass.

### Task 3: Quest Island Data

**Files:**
- Create: `src/music/theoryQuests.ts`

- [ ] Add at least eight quest islands grouped by learning mission.
- [ ] Each island must reference valid topic ids from the merged catalog.
- [ ] Re-run quest tests and confirm they pass.

### Task 4: Adventure UI

**Files:**
- Modify: `src/pages/AdventureMap.tsx`
- Modify: `src/pages/course.css`

- [ ] Rework AdventureMap into “乐理闯关岛”.
- [ ] Show island mission, topic count, practice route, reward, and progress.
- [ ] Keep actions to enter theory, course, or practice routes.

### Task 5: Verification and Delivery

**Files:**
- Modify: `乐动课堂.html`

- [ ] Run `node --test tests/theoryCatalog.test.mjs`.
- [ ] Run `node --test tests/theoryQuests.test.mjs`.
- [ ] Run `node --test tests/theoryDemos.test.mjs`.
- [ ] Run `npm run build`.
- [ ] Copy `dist/index.html` to `乐动课堂.html`.
- [ ] Commit the changes.
