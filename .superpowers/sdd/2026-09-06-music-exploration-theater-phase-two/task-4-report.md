# Task 4 Report: Connect Listening Tools to Exploration Theater

## Changed files

- src/components/ExplorationTheater.tsx
  - Connected the existing MusicMicroscope, InstrumentExplorer, and RhythmMovementLab components.
  - Added stage-scoped tool shelf state using the optional unit.tools configuration.
  - Kept the first-listen unit context and a "回到作品再听" action visible while a tool is expanded.
  - Merged tool notes by toolId and capped the in-memory theater collection at three notes before passing it to discovery persistence.
  - Added the culture switcher flow with one or two culture clues, an explicit opened state, and the required "带着文化线索再听" action.
  - Preserved the existing keep/add/change relisten choices without adding a culture quiz.
  - Added tool observations and evidence to the reflection preview and passed toolNotes to saveMusicDiscovery().
  - Kept anonymous, audio-unavailable, and tool-not-open save paths available.
- src/components/explorationTheater.css
  - Added desktop styles for the stage tool shelf, expanded context panel, and bounded observation preview.
  - Added no media queries or mobile/tablet layout changes.
- tests/explorationTheater.test.mjs
  - Added focused source-contract assertions for stage-scoped tool integration, all three tool components, bounded note merging, return copy, and culture-switch behavior.
- tests/discoveries.test.mjs
  - Extended the bounded tool-note persistence assertion to verify the instrument and rhythm records survive normalization.
- .superpowers/sdd/2026-09-06-music-exploration-theater-phase-two/task-4-report.md
  - Added this implementation and verification report.

## TDD red/green evidence

### Red

Command:

    npm test -- tests/explorationTheater.test.mjs

Result before implementation: exit code 1; the test script expanded to the repository test set, with 183 tests run, 181 passed and 2 failed. Only the two new theater assertions failed:

- 探索剧场按阶段接入工具并合并保存有界观察
- 探索剧场提供文化换镜并要求带着文化线索再听

The failures were the expected missing unit.tools/tool component/note and culture-switch contracts. Existing theater behavior and the prior discovery bounds test passed.

### Green

After implementation and the required explicit toolNotes: toolNotes save contract:

    npm test -- tests/explorationTheater.test.mjs tests/discoveries.test.mjs

Result: exit code 0; 183 passed, 0 failed, 0 cancelled, 0 skipped.

## Verification commands/results

- npm test -> exit 0; 183 passed, 0 failed, 0 cancelled, 0 skipped.
- npm run lint -> exit 0; ESLint completed without errors.
- npx tsc -b --pretty false -> exit 0.
- npm run build -> exit 0; TypeScript and Vite production build completed successfully, transforming 1121 modules.
- npx prettier --check src/components/ExplorationTheater.tsx src/components/explorationTheater.css tests/explorationTheater.test.mjs tests/discoveries.test.mjs -> exit 0; all modified files matched Prettier code style.
- git diff --check -> exit 0; no whitespace errors.

## Self-review and concerns

- The theater only renders configured tools for the current stage and falls back to the existing A/B evidence flow when no tool configuration is present.
- The Jasmine unit intentionally retains its existing two configured recommendations; the rhythm component is wired for any future unit configuration without changing the current unit data.
- Tool note normalization remains owned by src/music/explorationTools.ts and the discovery state boundary; the theater also caps its local collection at three and replaces a prior note from the same tool id.
- Culture content is shown as one clue initially and up to two after opening. Playback through the culture switcher is unavailable until the student explicitly opens the culture view.
- The task does not include browser-level visual acceptance. Audio remains dependent on browser audio policy, while the existing unavailable-audio fallback keeps selection, observation, and saving usable.
- Pre-existing untracked Trellis/Superpowers artifacts were left untouched and are not included in this commit.
