# 音乐体验与童趣界面升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有学生端变成低密度、可听可玩可创作的浙江小学音乐探索游乐园，并保持离线单文件发布能力。

**Architecture:** 先以纯数据定义和可复用 `MusicExperienceStage` 建立体验闭环，再把它接入挑战中心和首页；随后收拢导航并用独立 `playful.css` 覆盖全局视觉，避免一次性重写历史 CSS。所有个人结果继续通过现有 discoveries/progress 存储，音频复用 `audioEngine`。

**Tech Stack:** React 18 + TypeScript + Vite + Tone.js + 原生 CSS + Node test runner。

**Spec:** `docs/superpowers/specs/2026-09-03-music-experience-playful-ui-design.md`

## Global Constraints

- 保持浙江省人音版小学 1—6 年级内容优先，教材外内容标记为拓展。
- 保持离线单文件构建，不新增远程字体、远程图片或必需联网服务。
- 学生端一级导航最多四项；教师专属入口只在教师模式显示。
- 互动失败不能阻断页面；无音频权限时仍能用触控完成。
- 主要触控目标至少 44px，并支持 `prefers-reduced-motion`。
- 每个阶段完成独立验证后提交 Git，不推送远程。

---

### Task 1: 体验定义与年级适配

**Files:**
- Create: `src/music/experienceActivities.ts`
- Create: `tests/experienceActivities.test.mjs`
- Modify: `.trellis/tasks/09-03-music-experience-playful-ui/prd.md`

**Interfaces:**
- Produces `ExperienceKind`, `ExperienceActivity`, `ExperienceJourney`, `getAgeBand`, `getRecommendedActivities`, `buildExperienceJourney` for UI tasks.

- [ ] **Step 1: Write the failing test** — cover all three kinds, stable grade bands, grade 1/4/6 prompts, and unknown-grade fallback.
- [ ] **Step 2: Run `node --test tests/experienceActivities.test.mjs` and confirm the module is missing.**
- [ ] **Step 3: Implement the smallest typed catalog and pure helpers; use existing `PrimaryGrade` and `zhejiangCurriculum` types without browser dependencies.**
- [ ] **Step 4: Run the focused test, then `npm test`.**
- [ ] **Step 5: Commit `feat: 建立音乐探险体验定义` with the catalog and tests.**

### Task 2: 可复用互动舞台

**Files:**
- Create: `src/components/MusicExperienceStage.tsx`
- Create: `src/components/musicExperience.css`
- Create: `src/state/experienceSessions.ts`
- Create: `tests/experienceSessions.test.mjs`
- Modify: `src/music/uiSounds.ts` only if a missing positive cue is needed

**Interfaces:**
- Consumes `ExperienceJourney` from Task 1 and `saveMusicDiscovery` from existing state.
- Produces `MusicExperienceStage` props `{ journey, studentId, onNavigate?, onComplete? }` and `createExperienceSummary`/`recordExperienceStep` helpers.

- [ ] **Step 1: Write failing pure-state tests for step completion, clamped progress, reset, and anonymous-session behavior.**
- [ ] **Step 2: Run the focused test and verify the expected missing-function failure.**
- [ ] **Step 3: Implement state helpers, then build the three code-native scenes with real `playNote`/`playDrum` calls and visual fallback.**
- [ ] **Step 4: Add keyboard/focus labels, reduced-motion CSS, and a save-discovery action.**
- [ ] **Step 5: Run focused tests, lint and TypeScript.**
- [ ] **Step 6: Commit `feat: 增加音乐探险互动舞台`.**

### Task 3: 玩乐中心与浙江声景接入

**Files:**
- Modify: `src/pages/TrainingCenter.tsx`
- Modify: `src/pages/training.css`
- Modify: `src/music/experienceActivities.ts`
- Modify: `src/state/discoveries.ts` only for a compatible summary projection if required
- Add/update: `tests/experienceIntegration.test.mjs`

**Interfaces:**
- Consumes `MusicExperienceStage` and `getRecommendedActivities`.
- Produces a grade-aware “今日玩乐” stage plus a secondary “更多练习” list preserving existing game routes.

- [ ] **Step 1: Add failing source/integration assertions for the three activity labels, grade-aware recommendation, and preserved legacy routes.**
- [ ] **Step 2: Run the focused test and observe failure.**
- [ ] **Step 3: Add the stage and Zhejiang scene labels without deleting existing modules.**
- [ ] **Step 4: Verify student switching and discovery save path manually.**
- [ ] **Step 5: Run `npm test`, lint and `npx tsc -b`.**
- [ ] **Step 6: Commit `feat: 接入音乐玩乐中心与浙江声景`.**

### Task 4: 学生导航与首页任务驱动布局

**Files:**
- Create: `src/components/MobileNav.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `tests/homeSimplification.test.mjs`

**Interfaces:**
- Consumes existing `Route` and `useApp`; no new route strings.
- Produces four primary labels: 今日、探索、玩乐、我的, plus a single primary home CTA and retained exploration card.

- [ ] **Step 1: Extend source tests for the four labels, mobile nav, retained exploration card, and absence of class battle.**
- [ ] **Step 2: Run the focused test and confirm the new labels are absent.**
- [ ] **Step 3: Implement shared nav metadata, mobile nav rendering, and home playground doors that route to existing pages.**
- [ ] **Step 4: Remove only duplicated above-fold copy/entry blocks; keep progress, discovery and portfolio data reachable.**
- [ ] **Step 5: Run tests, lint, type-check and a local browser smoke check.**
- [ ] **Step 6: Commit `feat: 收拢学生导航与首页音乐探险入口`.**

### Task 5: 音乐手作乐园视觉系统与响应式 QA

**Files:**
- Create: `src/playful.css`
- Modify: `src/main.tsx`
- Modify: `src/responsive.css` only for non-overlapping mobile rules
- Modify: `src/components/musicExperience.css` and page CSS as needed
- Create: outside-repo QA screenshots under the temporary workspace only

**Interfaces:**
- Consumes the class names produced by Tasks 2–4 and existing shell selectors.
- Produces the shared color, surface, typography, motion, focus and responsive layer.

- [ ] **Step 1: Add failing CSS/source assertions for the design tokens, reduced-motion rule and four primary nav classes.**
- [ ] **Step 2: Run the focused test and verify failure.**
- [ ] **Step 3: Implement the scoped playful layer with explicit control typography, 44px targets and no external assets.**
- [ ] **Step 4: Run Browser/IAB if available; otherwise use the existing local HTTP + Playwright fallback and record the reason.**
- [ ] **Step 5: Check 1280×720 and 390×844, fix clipping/overflow/console issues, then run full test/lint/typecheck/build.**
- [ ] **Step 6: Compare `dist/index.html` and `乐动课堂.html`, record hashes, and commit `feat: 应用音乐手作乐园视觉系统`.**

### Task 6: 最终验收与任务记录

**Files:**
- Modify: `.trellis/tasks/09-03-music-experience-playful-ui/check.jsonl`
- Modify: `.trellis/tasks/09-03-music-experience-playful-ui/implement.jsonl`
- Create: `.trellis/tasks/09-03-music-experience-playful-ui/research/verification.md`

- [ ] **Step 1: Curate the two context manifests with the frontend spec and design spec paths.**
- [ ] **Step 2: Run the full verification commands and write observed output to `research/verification.md`.**
- [ ] **Step 3: Inspect `git diff`, confirm no unrelated files, and commit `docs: 记录音乐体验升级验收`.**
