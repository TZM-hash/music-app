# Task 3 Report

## Status

Implemented the desktop-only Instrument Explorer and Rhythm Movement Lab from the Task 3 brief. ExplorationTheater integration was intentionally left unchanged.

## TDD

1. Added `tests/explorationToolComponents.test.mjs` before production implementation.
2. Ran `node --test tests/explorationToolComponents.test.mjs`; confirmed the expected red state because both components and their CSS were missing.
3. Implemented the two components and shared desktop styles.
4. Re-ran the focused suite; all 5 tests passed.

## Implementation

- `InstrumentExplorer` consumes `InstrumentSample[]`, marks every sound as a synthetic sample rather than a recording, filters by texture and instrument family, supports two-sample A/B comparison, shows cultural context, handles button and keyboard audition, reports audio fallback through `aria-live`, saves bounded observations through `MusicDiscoveryToolNote`, and returns to the work.
- `RhythmMovementLab` consumes `RhythmPattern`, renders a stable beat timeline, records mouse taps and non-repeating Space presses, compares tap timing to the beat, supports 走/跳/摇/停/推/拉, uses only 很稳定 / 正在靠近 / 可以再听 as timing feedback, saves observations, and returns to the work.
- Both tools use the existing audio engine helpers and stop audio on unmount. No dependencies, mobile/tablet changes, media queries, or theater integration were added.

## Verification

- `node --test tests/explorationToolComponents.test.mjs`: 5 passed.
- `npm test`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.

## Concerns

- The components are intentionally not wired into `ExplorationTheater` per the brief.
- Audio availability remains dependent on the browser audio policy; the UI provides the required fallback and keeps non-audio interactions available.

## Review Fix Evidence

- Root cause: the native `<button>` keyboard activation already dispatches `click`, while `InstrumentExplorer` also handled Enter/Space in the same sample button's `onKeyDown`, causing `playSample` to run twice.
- Fix: removed the redundant sample-button `onKeyDown`; retained `type="button"` and the native `onClick` path, so mouse, Enter, and Space activation remain supported without duplicate playback.
- Regression test: updated `tests/explorationToolComponents.test.mjs` to require the native sample button/onClick contract and reject an `onKeyDown` handler on `.instrument-explorer__play`.
- Evidence: the pre-fix focused regression test failed on the duplicate-handler assertion; after the fix `node --test tests/explorationToolComponents.test.mjs` passed all 5 tests.
- Post-fix verification: `npm run lint`, `npm run build`, and `git diff --check` all exited 0.
