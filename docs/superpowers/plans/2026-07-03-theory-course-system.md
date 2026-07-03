# Theory Course System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete primary-to-junior-high theory course system with structured topic coverage, category and difficulty filtering, and simplified navigation.

**Architecture:** Move theory knowledge into a reusable catalog module, let the theory lab and course pages consume that catalog, and keep instrument/game pages as contextual practice tools. The route structure remains lightweight, but the visible entry points become learning-first.

**Tech Stack:** React 18, TypeScript, Vite, Tone.js, Node built-in test runner for catalog checks.

---

### Task 1: Structured Theory Catalog

**Files:**
- Create: `tests/theoryCatalog.test.mjs`
- Create: `src/music/theoryCatalog.ts`

- [ ] Write a failing Node test that imports the catalog and verifies topic coverage, stage filters, category filters, and quiz/demo completeness.
- [ ] Run `node --test tests/theoryCatalog.test.mjs` and confirm it fails because the catalog does not exist.
- [ ] Implement `src/music/theoryCatalog.ts` with typed stages, categories, topics, helper filters, and enough topics to cover primary and junior-high theory.
- [ ] Re-run the test and confirm it passes.

### Task 2: Theory Lab Filtering

**Files:**
- Modify: `src/pages/Theory.tsx`
- Modify: `src/pages/theory.css`

- [ ] Replace the local topic list with the shared catalog.
- [ ] Add teaching category and stage/difficulty selectors.
- [ ] Add topic count and empty-state behavior.
- [ ] Keep existing interactive demos and mini quizzes wired to the selected topic.

### Task 3: Course System

**Files:**
- Modify: `src/pages/CourseCenter.tsx`

- [ ] Rework courses into a complete learning path from primary lower grades through junior-high advanced.
- [ ] Link each course to category/stage concepts and the correct practice routes.
- [ ] Keep the classroom-friendly lesson flow.

### Task 4: Entry Simplification

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/components/TopBar.tsx`

- [ ] Keep the sidebar focused on main learning destinations.
- [ ] Move support tools to Home and contextual course actions instead of prominent duplicate navigation.
- [ ] Keep teacher-only management entries.

### Task 5: Verification

**Files:**
- Modify as needed from previous tasks.

- [ ] Run `node --test tests/theoryCatalog.test.mjs`.
- [ ] Run `npm run build`.
- [ ] Inspect `git diff --stat` and summarize changed files.
