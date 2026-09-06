# Desktop exploration final-review fix report

## Scope and review result

All five important final-review findings were validated against the phase-two design, phase-two
plan, current Jasmine configuration, and source at `acb7d58` before editing.

1. `TrainingCenter.tsx` cards and free practice only called `navigate('lesson')`; no listening
   tool rendered in the desktop lab.
2. `RhythmMovementLab.tsx` used the first tap as its time origin and only played a tap sound; it
   did not start a stable beat.
3. Its section-level Space handler intercepted key presses from editable controls and composing
   input.
4. `ExplorationTheater.tsx` held culture-opened state locally; neither exploration sessions nor
   discoveries persisted it.
5. `progress.md` described an executable Jasmine rhythm-theater path and desktop acceptance more
   broadly than the code and prior evidence supported.

## Implemented fixes

### Auditory lab

`TrainingCenter.tsx` now opens `MusicMicroscope`, `InstrumentExplorer`, and
`RhythmMovementLab` inside the desktop auditory-lab surface. It supplies the existing Jasmine
microscope cues, instrument samples, and rhythm pattern. Tool notes remain local/status-only for
free practice. The primary work action and every visible return-to-work action use
`openExploration('jasmine')`; legacy challenge routes and `MusicExperienceStage` remain intact.

### Rhythm and movement

`RhythmMovementLab.tsx` now has an explicit start/stop control. After `ensureAudio` succeeds it
plays a stable beat using `playNote`, captures the playback origin with `performance.now()`, and
compares later taps to the nearest beat. Stop, replacement start, and unmount clear the interval
and call `stopAllAudio`. Feedback remains process-oriented and does not add right/wrong language.
The Space handler returns immediately for composition, input, textarea, select, and editable
targets before preventing default or recording a tap.

### Culture persistence

`cultureOpened?: boolean` is optional in exploration responses/sessions and discoveries. The
session parser keeps valid booleans while old serialized sessions remain valid without the field.
The theater restores the saved value, records opening it, passes it to discovery save, and shows
the result in the reflection preview. Old discovery records continue to read with
`cultureOpened === undefined`.

### Configuration boundary

The hard-coded Jasmine fixtures in `ExplorationTheater` were not expanded into generalized unit
configuration. Jasmine is the only configured unit, and its `tools` list deliberately contains
only microscope and instrument. Rhythm is available in the auditory lab and can be rendered by a
future configured theater unit, but there is no executable Jasmine rhythm-theater route.

## TDD evidence

Focused tests were changed before production code and run as a red suite:

```powershell
node --test tests/experienceIntegration.test.mjs tests/explorationToolComponents.test.mjs tests/explorationSessions.test.mjs tests/discoveries.test.mjs tests/explorationTheater.test.mjs
```

Initial result: exit `1`; `tests 46`; `pass 41`; `fail 5`. The five failures mapped one-to-one to
the missing tool rendering, stable-beat lifecycle, editable Space guard, session/discovery culture
persistence, and theater culture wiring. After the minimum implementation, the same command
returned exit `0`; `tests 46`; `pass 46`; `fail 0`.

## Final verification

| Command                                           | Exit | Result                                                                                              |
| ------------------------------------------------- | ---: | --------------------------------------------------------------------------------------------------- |
| phase-two targeted evidence suite (nine files)    |    0 | `tests 74`; `pass 74`; `fail 0`; `cancelled 0`; `skipped 0`; `todo 0`                               |
| `npm test`                                        |    0 | `tests 192`; `pass 192`; `fail 0`; `cancelled 0`; `skipped 0`; `todo 0`                             |
| `npm run lint`                                    |    0 | ESLint completed with no reported errors                                                            |
| `npm run build`                                   |    0 | `tsc -b && vite build`; `1121 modules transformed`; `dist/index.html 6,241.37 kB`; built in `1.91s` |
| Prettier check for all 14 changed phase-two files |    0 | `All matched files use Prettier code style!`                                                        |
| `git diff --check`                                |    0 | No whitespace errors reported                                                                       |

Prettier was run on every changed phase-two code/test file before final documentation. The final
check includes this ledger and report.

## Remaining limitation

The automated suite validates helper wiring, timing-origin logic, persistence boundaries, source
contracts, and fallback behavior. It cannot certify actual browser speaker output or autoplay
permission. No mobile/tablet navigation or layout work was changed, and no `max-width` media query
was added.
