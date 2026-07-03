# Interactive Theory Demos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the theory lab demo area into a selectable, sound-linked interactive surface for every existing demo kind.

**Architecture:** Add a reusable `theoryDemos` module that describes controls, prompts, and observations for each `DemoKind`. Refactor `Theory.tsx` so the demo UI renders from that module and plays the currently selected control.

**Tech Stack:** React 18, TypeScript, Tone.js audio helpers, SVG/CSS visualizations, Node built-in test runner.

---

### Task 1: Demo Configuration Contract

**Files:**
- Create: `tests/theoryDemos.test.mjs`
- Create: `src/music/theoryDemos.ts`

- [ ] Write a failing Node test that imports `src/music/theoryDemos.ts` and verifies every demo kind has a scene, prompt, observations, and at least three controls.
- [ ] Run `node --test tests/theoryDemos.test.mjs`; expected failure is missing module.
- [ ] Implement `src/music/theoryDemos.ts` with scene data for all demo kinds.
- [ ] Re-run `node --test tests/theoryDemos.test.mjs`; expected pass.

### Task 2: Theory Demo Rendering

**Files:**
- Modify: `src/pages/Theory.tsx`
- Modify: `src/pages/theory.css`

- [ ] Replace the old demo rendering with a `TheoryDemoLab` component driven by `getDemoScene`.
- [ ] Add selectable demo controls and observation cues.
- [ ] Update demo visual components to accept the selected control.
- [ ] Update audio playback so `听演示` plays the active control.

### Task 3: Verification and Single File Sync

**Files:**
- Modify: `乐动课堂.html`

- [ ] Run `node --test tests/theoryDemos.test.mjs`.
- [ ] Run `node --test tests/theoryCatalog.test.mjs`.
- [ ] Run `npm run build`.
- [ ] Copy `dist/index.html` to `乐动课堂.html`.
- [ ] Commit the changes.
