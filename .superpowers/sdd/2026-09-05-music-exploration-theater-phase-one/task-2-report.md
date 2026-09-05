# Task 2 implementation report

## Files changed

- `src/music/explorationAudio.ts`
  - Added the pure `ExplorationCue` data types and sequence helpers.
  - Reads melodies from `BUILTIN_SONGS`, removes rests, and creates independent cue objects.
  - Adds bounded fragment extraction, jasmine flowing/jumping evidence variants, and beat-to-millisecond duration conversion.
  - Has no React, Tone.js, Web Audio, `ensureAudio`, or localStorage dependencies.
- `tests/explorationAudio.test.mjs`
  - Added TypeScript transpile-loader tests for melody data, fragments, bounds, evidence variants, copy isolation, and duration conversion.

## Tests run

- `npm test -- tests/explorationAudio.test.mjs` — passed, 143 tests, 0 failures.
- `npm run build` — passed; TypeScript compilation and Vite single-file production build completed successfully.
- `git diff --check` — passed with no whitespace errors.

## Design decisions

- The existing jasmine melody remains the single source of truth; the new module does not duplicate it.
- Base cues use the existing playback-compatible defaults `velocity: 0.8` and `patch: 'piano'`.
- Flowing evidence is the first eight playable jasmine cues. Jumping evidence keeps cue count and beat durations while replacing selected pitches with clear playable leaps and uses the strings patch for contrast.
- Unknown evidence unit ids and runtime-invalid variants fall back to the flowing jasmine fragment, as required.
- `getCueDurationMs()` defaults invalid BPM values to 60 and clamps beats to 0.125.

## Concerns

- Audio playback integration is intentionally deferred to later UI tasks, per the brief.
- The repository test script expands the focused command to the full test suite because it is configured as `node --test tests/*.test.mjs`; the full suite passed.
