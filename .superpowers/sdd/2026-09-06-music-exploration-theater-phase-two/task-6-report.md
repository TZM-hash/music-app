# Task 6 Report: Desktop Auditory Lab Entry

## Status

Implemented the desktop auditory lab entry in `TrainingCenter.tsx` while preserving the existing music experience stage, legacy challenge area, and legacy game routes.

## Changes

- Added a desktop-only `听觉实验室` hero/header at the top of Training Center.
- Added three auditory tool cards with their core questions and current grade applicability:
  - `音乐显微镜`
  - `乐器探秘台`
  - `节奏与动作工作台`
- Added the current-grade summary, `从一段作品开始` work entry, and `自由练习` observation panel.
- Added the free-practice `回到作品` action using the existing `navigate('lesson')` pattern.
- Kept `MusicExperienceStage`, the legacy challenge area, `更多练习`, and all existing `game-ear`, `game-read`, `game-sing`, `game-taiko`, and `game-echo` routes.
- Added only desktop styles under `@media (min-width: 1024px)` and hid the new section outside desktop without adding or changing max-width media queries.
- Updated `tests/experienceIntegration.test.mjs` with focused assertions for the new entry and retained behavior.

## TDD Evidence

1. Added the focused auditory-lab assertions before implementation.
2. Ran `npm test -- tests/experienceIntegration.test.mjs`; it failed with 188 passing and 1 failing test because `听觉实验室` was absent.
3. Implemented the entry and styles.
4. Ran `node --test tests/experienceIntegration.test.mjs`; 18 tests passed.

## Verification

- `node --test tests/experienceIntegration.test.mjs`: passed, 18/18.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npx prettier --check src/pages/TrainingCenter.tsx src/pages/training.css tests/experienceIntegration.test.mjs`: passed.
- `git diff --check`: passed.
- Existing max-width media-query count in `training.css`: unchanged at 4.

## Scope Check

Changed only `src/pages/TrainingCenter.tsx`, `src/pages/training.css`, `tests/experienceIntegration.test.mjs`, and this required report. No dependencies, `CourseCenter`, or `ExplorationTheater` changes were made.
