# Task 5 Report: Turn Course Center into Desktop Works Map

## Scope

Implemented only the Task 5 files:

- `src/pages/CourseCenter.tsx`
- `src/pages/course.css`
- `tests/curriculumUi.test.mjs`
- `tests/experienceIntegration.test.mjs`

`TrainingCenter.tsx`, `ExplorationTheater.tsx`, `MobileNav.tsx`, and their related behavior were not modified. Existing narrow-screen `max-width` rules remain unchanged; the new layout adds only a desktop `min-width` rule.

## Implementation

- Replaced the CourseCenter main area with a desktop works map using a left filter rail, center work-card grid, and right selected-work detail panel.
- Added local work summaries from the existing curriculum-mapped theory topics plus the Jasmine exploration work.
- Added grade, source, path, and tag filters. The grade filter initializes from `selectedGrade` when present and otherwise follows the current student grade.
- Added Jasmine card metadata for `音乐显微镜`, `乐器探秘台`, four exploration paths, culture context, curriculum source, and grade coverage.
- Added selected-work actions for `开始探索` and `查看音乐线索`; Jasmine uses `openExploration('jasmine')`, while mapped theory works retain theory navigation.
- Added an explicit empty state with filter reset behavior.
- Preserved teacher support actions for the existing interactive classroom and music exploration館 entry points.
- Added focused source-contract assertions for the map structure, filters, Jasmine tags, navigation, empty state, teacher support, and desktop-only styles.

## TDD Evidence

### Red

Command:

    node --test tests/curriculumUi.test.mjs tests/experienceIntegration.test.mjs

Before implementation, the focused run had 25 passing tests and 2 failing new Task 5 tests. The failures were the expected missing `作品地图`, map filters, Jasmine work/tool contracts, `openExploration('jasmine')`, selected-work actions, empty state, teacher support, and layout selectors.

### Green

Command:

    node --test tests/curriculumUi.test.mjs tests/experienceIntegration.test.mjs

After implementation, the focused run passed 27/27 tests with 0 failures.

## Verification

- `npm test` -> passed, 185/185 tests.
- `npm run lint` -> passed with no ESLint errors.
- `npm run build` -> passed; TypeScript and Vite production build completed successfully.
- `npx prettier --check src/pages/CourseCenter.tsx src/pages/course.css tests/curriculumUi.test.mjs tests/experienceIntegration.test.mjs` -> passed.
- `git diff --check` -> passed with no whitespace errors.

## Concerns

- The work map intentionally uses curriculum theory topics as the first batch of mapped works; only Jasmine has a full exploration-theater route in this task. Other mapped cards preserve theory navigation.
- Desktop visual acceptance was not performed in a browser. Audio behavior remains dependent on browser audio policy, as in the existing exploration flow.
- Pre-existing untracked `.superpowers` briefs, review diffs, and progress artifacts were left untouched and were not included in the commit.
