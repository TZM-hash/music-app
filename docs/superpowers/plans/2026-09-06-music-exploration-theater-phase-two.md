# 音乐探索剧场第二阶段实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在电脑端把作品地图、听觉实验室和主动聆听工具接入第一阶段探索剧场，让学生通过比较旋律、辨认音色、跟随节奏和文化换镜形成可保存的音乐证据。

**Architecture:** 使用独立纯数据模块 `src/music/explorationTools.ts` 提供工具元数据、合成音频序列和观察反馈；三个独立 React 工具组件管理局部交互并回传 `MusicDiscoveryToolNote`；`ExplorationTheater` 只负责工具面板、文化换镜和发现保存；`CourseCenter` 和 `TrainingCenter` 的桌面主区域分别改为作品地图和听觉实验室，旧页面入口继续保留。

**Tech Stack:** React 18、TypeScript、Vite、Tone.js/Web Audio、localStorage、Node test runner、ESLint、Prettier。

**Spec:** `docs/superpowers/specs/2026-09-06-music-exploration-theater-phase-two-design.md`

## Global Constraints

- 本阶段只针对电脑端设计和验收：不修改手机底部导航、不修改平板或窄屏专用布局、不新增移动端断点。
- 保留 React 18、TypeScript、Vite、单文件构建、Tone.js/Web Audio 和 localStorage；不增加依赖。
- 工具以证据和回听为中心，不以分数和唯一审美答案为中心。
- 音频使用现有引擎和可替换的合成音色；不得把合成样本称为真实录音。
- 新发现字段全部可选，旧 `MusicDiscovery`、旧探索单元和旧入口必须继续可读可用。
- 每个作品只推荐一到两个工具；没有工具配置的旧单元继续使用第一阶段 A/B 流程。
- 不删除旧训练、理论、器乐、课程和教师入口。
- 工具必须提供回到作品、再听原片段或等价返回动作；音频不可用时仍可选择、比较、保存观察。
- 新 CSS 只添加桌面基础布局，不添加 `@media (max-width: ...)` 规则。

---

### Task 1: 扩展工具数据和发现卡兼容边界

**Files:**

- Create: `src/music/explorationTools.ts`
- Modify: `src/music/explorationUnits.ts`
- Modify: `src/state/discoveries.ts`
- Create: `tests/explorationTools.test.mjs`
- Modify: `tests/explorationUnits.test.mjs`
- Modify: `tests/discoveries.test.mjs`

**Interfaces:**

```ts
export type ExplorationToolId = 'microscope' | 'instrument' | 'rhythm'
export interface ExplorationToolReference {
  id: ExplorationToolId
  stage: 'evidence' | 'concept' | 'relisten'
  title: string
  question: string
  evidenceLabels: string[]
}
export interface MusicDiscoveryToolNote {
  toolId: ExplorationToolId
  observation: string
  evidence: string[]
}
```

- [ ] **Step 1: Write failing tests.** Test the three tool definitions, non-empty Jasmine samples, bounded feedback, optional `ExplorationUnit.tools`, bounded `toolNotes`, and legacy discoveries without `toolNotes`.
- [ ] **Step 2: Run focused tests and verify failure.** Run `npm test -- tests/explorationTools.test.mjs tests/explorationUnits.test.mjs tests/discoveries.test.mjs`; new assertions fail while old assertions pass.
- [ ] **Step 3: Implement pure data.** Export `EXPLORATION_TOOL_CATALOG`, `JASMINE_MICROSCOPE_CUES`, `JASMINE_INSTRUMENT_SAMPLES`, `JASMINE_RHYTHM_PATTERN`, `getToolFeedback()` and `normalizeToolNotes()`. Limit observations to 160 characters, notes to 3, and evidence to 4 unique labels per note. Add optional `tools` to `ExplorationUnit`, with at most microscope and instrument recommendations for Jasmine. Add optional `toolNotes` to discovery draft/record and normalize on save.
- [ ] **Step 4: Verify.** Run the focused tests and `npm run build`; both pass.
- [ ] **Step 5: Commit.** `git add` the three source modules and three tests, then commit `feat: add exploration tool data boundaries`.

### Task 2: 实现音乐显微镜桌面组件

**Files:**

- Create: `src/components/MusicMicroscope.tsx`
- Create: `src/components/explorationTools.css`
- Create: `tests/musicMicroscope.test.mjs`

**Interface:**

```ts
export interface MusicMicroscopeProps {
  cues: ExplorationCue[]
  evidenceLabels: string[]
  onNote: (note: MusicDiscoveryToolNote) => void
  onReturn: () => void
}
```

- [ ] **Step 1: Write failing source-contract tests.** Assert A/B preview, segment timeline, change marker, `aria-pressed`, `aria-live="polite"`, `ensureAudio`, `playNote`, `stopAllAudio`, `onNote`, `onReturn`, fallback copy and “回到作品再听”.
- [ ] **Step 2: Run `npm test -- tests/musicMicroscope.test.mjs` and confirm the missing component fails.**
- [ ] **Step 3: Implement.** Use a playback token to prevent stale sequences; expose flowing/jumping preview, marked cue index, evidence toggles, observation save and return. Saving requires an observation or evidence but remains enabled when audio is unavailable.
- [ ] **Step 4: Style only the desktop tool.** Use a three-column `.music-microscope` layout, timeline, comparison cards and observation rail. Do not add mobile media queries.
- [ ] **Step 5: Run `npm test -- tests/musicMicroscope.test.mjs`, `npm run lint`, `npm run build`, then commit `feat: add desktop music microscope`.

### Task 3: 实现乐器探秘台和节奏与动作工作台

**Files:**

- Create: `src/components/InstrumentExplorer.tsx`
- Create: `src/components/RhythmMovementLab.tsx`
- Modify: `src/components/explorationTools.css`
- Create: `tests/explorationToolComponents.test.mjs`

**Interfaces:**

```ts
export interface InstrumentExplorerProps {
  samples: InstrumentSample[]
  onNote: (note: MusicDiscoveryToolNote) => void
  onReturn: () => void
}
export interface RhythmMovementLabProps {
  pattern: RhythmPattern
  onNote: (note: MusicDiscoveryToolNote) => void
  onReturn: () => void
}
```

- [ ] **Step 1: Write failing tests.** Require sample declaration, texture selection, two-sample comparison, instrument family choice, cultural note, keyboard/button interaction, `aria-live`, fallback and return in the instrument component; require stable-beat timeline, Space handling, movement words, click recording, observational feedback, no aesthetic right/wrong language and return in the rhythm component.
- [ ] **Step 2: Run `npm test -- tests/explorationToolComponents.test.mjs` and confirm failure.**
- [ ] **Step 3: Implement the instrument tool.** Play synthetic samples through the current audio engine, label them as samples rather than recordings, allow texture/family selection, show short culture context, and save a bounded observation.
- [ ] **Step 4: Implement the rhythm tool.** Record mouse and non-repeating Space clicks, compare them with the stable beat, allow 走/跳/摇/停/推/拉, and use only “很稳定 / 正在靠近 / 可以再听” feedback.
- [ ] **Step 5: Add desktop styles and run focused tests, lint and build.**
- [ ] **Step 6: Commit `feat: add desktop instrument and rhythm labs`.**

### Task 4: 接入探索剧场、文化换镜和工具观察保存

**Files:**

- Modify: `src/components/ExplorationTheater.tsx`
- Modify: `src/components/explorationTheater.css`
- Modify: `tests/explorationTheater.test.mjs`
- Modify: `tests/discoveries.test.mjs`

- [ ] **Step 1: Add failing assertions.** Require `unit.tools`, all three tool component names, `toolNotes`, tool return copy, culture-switch copy, and saving tool notes.
- [ ] **Step 2: Run `npm test -- tests/explorationTheater.test.mjs` and verify only new assertions fail.**
- [ ] **Step 3: Add panel state.** Show at most the configured tools for the current stage; retain first-stage context while expanded; merge notes by tool id and cap at three.
- [ ] **Step 4: Add culture switcher.** Show one or two relevant culture clues, record opened state, require “带着文化线索再听” before playback, and reuse keep/add/change relisten choices without a culture quiz.
- [ ] **Step 5: Save and preview.** Pass `toolNotes` to `saveMusicDiscovery()` and show tool observations/evidence in the reflection preview. Anonymous, audio-unavailable, and tool-not-open paths must still save.
- [ ] **Step 6: Run focused tests, lint, build and commit `feat: connect listening tools to exploration theater`.**

### Task 5: 把 CourseCenter 改为桌面作品地图

**Files:**

- Modify: `src/pages/CourseCenter.tsx`
- Modify: `src/pages/course.css`
- Modify: `tests/curriculumUi.test.mjs`
- Modify: `tests/experienceIntegration.test.mjs`

- [ ] **Step 1: Add failing assertions.** Require “作品地图”, current-grade summary, work/source/path filters, Jasmine card, tool tags, `openExploration('jasmine')`, theory secondary action, empty-state copy and retained teacher support.
- [ ] **Step 2: Run the focused integration tests and confirm new assertions fail.**
- [ ] **Step 3: Implement minimum map data.** Use Jasmine plus existing curriculum-mapped work summaries; filter by grade, source, path and tag; show only matching cards and default to `selectedGrade` when present.
- [ ] **Step 4: Implement desktop layout.** Use left filter rail, center card grid and right selected-work detail with “开始探索” and “查看音乐线索”. Keep existing course/theory support actions.
- [ ] **Step 5: Add desktop-only styles, run focused tests, lint and build, then commit `feat: turn course center into desktop works map`.**

### Task 6: 把 TrainingCenter 顶部改为桌面听觉实验室

**Files:**

- Modify: `src/pages/TrainingCenter.tsx`
- Modify: `src/pages/training.css`
- Modify: `tests/experienceIntegration.test.mjs`

- [ ] **Step 1: Add failing assertions.** Require “听觉实验室”, three tool titles/questions, current-grade copy, “从一段作品开始”, “自由练习”, “更多练习”, and retained `MusicExperienceStage`/legacy game routes.
- [ ] **Step 2: Run `npm test -- tests/experienceIntegration.test.mjs` and confirm failure.**
- [ ] **Step 3: Implement the desktop lab hero.** Add three tool cards, `navigate('lesson')` work entry, a free-practice panel with a return-to-work action, and move the existing experience stage/challenge area below without deleting it.
- [ ] **Step 4: Add desktop-only styles, run focused tests, lint and build, then commit `feat: add desktop auditory lab entry`.**

### Task 7: 全量验证与桌面端交付记录

**Files:**

- Modify: `.superpowers/sdd/2026-09-06-music-exploration-theater-phase-two/progress.md`
- Read: `docs/superpowers/specs/2026-09-06-music-exploration-theater-phase-two-design.md`
- Read: `docs/superpowers/plans/2026-09-06-music-exploration-theater-phase-two.md`

- [ ] **Step 1: Run fresh full checks.** `npm test`, `npm run lint`, `npm run build` must all pass.
- [ ] **Step 2: Run targeted Prettier checks on every phase-two file and scan `src tests` for `TBD|TODO|待补充|临时实现`; no new markers are allowed.
- [ ] **Step 3: Verify only the wide desktop flow.** Works map filter → Jasmine → theater → microscope → instrument → rhythm → culture switcher → discovery save; auditory lab free practice returns to work; legacy challenge entry remains. Do not perform mobile/tablet visual acceptance.
- [ ] **Step 4: Record exact commands, test count, desktop result and audio limitation in the phase-two ledger.
- [ ] **Step 5: Commit the ledger with `chore: record phase two desktop verification`.

## Self-Review Checklist

- [ ] Data compatibility is covered by Task 1.
- [ ] Microscope, instrument, rhythm, culture and theater integration are covered by Tasks 2–4.
- [ ] Works map and auditory lab are covered by Tasks 5–6.
- [ ] No mobile/tablet implementation task or new mobile breakpoint exists.
- [ ] No task deletes legacy routes or old teacher/challenge entries.
- [ ] Every tool has an explicit note and return interface.
- [ ] `MusicDiscovery.toolNotes` remains optional and bounded.
- [ ] Every implementation task starts with a failing test and ends with focused verification.
- [ ] No placeholders remain in the plan.
