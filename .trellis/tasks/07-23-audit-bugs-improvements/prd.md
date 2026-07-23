# Audit and fix music-app bugs and improvements

## Goal

This is a half-finished React + Vite + TypeScript music education web app (music-edu-app).
Audit the codebase for real, evidence-backed bugs and prioritized improvement opportunities,
then fix the agreed-upon issues so the test suite passes and user-visible correctness
problems (scoring, resource leaks, accessibility) are resolved.

## Confirmed Facts (from inspection)

- `npx tsc -b` passes clean; `npm run lint` passes clean. No type or lint errors.
- `npm test` (node --test) has exactly 1 failing test: `findStudentById follows the selected student id`
  (tests/students.test.mjs:30) — `TypeError: students.findStudentById is not a function`.
- All `JSON.parse` call sites in the state layer are already try/catch guarded (no unguarded-parse bugs).
- Lifecycle scaffolding (`useTimers`, `useMounted`, `useMelodyPreview`, `stopAllAudio` on route change)
  is generally sound; leaks are localized.

## Findings (evidence-backed, grouped by severity)

### Critical / test-breaking

- **B1** `src/state/students.ts` — missing `findStudentById(roster, id)` pure function that
  `tests/students.test.mjs:37-40` requires. Only defect that breaks `npm test`.

### High — user-visible correctness

- **B2** `src/pages/games/TaikoGame.tsx:132,158` — `st.current.miss` is never incremented.
  Missed-note path and the "不可" hit path both reset combo/soul but never `s.miss++`, so the
  result screen always shows "漏: 0" and the `miss > great` advice branch (line 80) is dead.
- **B3** `src/pages/games/EchoGame.tsx:164,187` — final star rating uses only the LAST round's
  accuracy (`acc = correct / pattern.notes.length`), not the whole session. Score accumulates
  correctly but stars/`recordResult` misgrade (ace 4 rounds + fumble round 5 => 0 stars).
- **B4** `src/state/creativeWorks.ts:171` — id sequence uses `all.length + 1`; once capped at
  `MAX_WORKS = 24`, sequence is pinned at 25. Two saves in the same ms collide on
  `work-${createdAt}-${sequence}` and the de-dupe filter drops the older work (silent data loss).

### High — resource leaks (setState-after-unmount)

- **B5** `src/pages/games/SingGame.tsx:103-112` — mic stream/AudioContext leak: if code between
  `await det.start()` and `detector.current = det` throws, the `catch` never calls `det.stop()`.
- **B6** `src/pages/Xylophone.tsx:47` — `timers.current[n.note]` setTimeout(setActive, 300) never
  cleared on unmount.
- **B7** `src/pages/Drums.tsx:84` — `timers.current[kind]` setTimeout(setHit(null), 120) never
  cleared on unmount.
- **B8** `src/components/Visualizer.tsx:19` — `useNoteBursts.push` setTimeout(setBursts, ~1s) is
  never tracked/cleared; no cleanup effect at all.
- **B9** `src/pages/Piano.tsx:187-206` — held keyboard note gets stuck when `octave` changes
  mid-press: keyup handler recomputes target with new `shift`, so original note never releases.

### Medium

- **B10** `src/pages/Mixer.tsx:402-411` — `importFromFile` casts parsed JSON to `SavedProject`
  without validation; `loadProject` runs `p.tracks.map(...)` outside the try/catch and crashes on
  malformed-but-parseable JSON. An `isSavedProject` guard already exists (line 170) but is unused here.
- **B11** `src/pages/Mixer.tsx:482` — saved-projects list uses index-as-key with `deleteProject(idx)`,
  causing stale label/handler association after deleting a middle project.
- **B12** `src/music/audioEngine.ts:27-31` — `ensureAudio` race: no in-flight promise guard, so
  concurrent callers can invoke `toneStart()` multiple times.
- **B13** `src/state/backup.ts:4-16` — `BACKUP_KEYS` omits `music-edu-roster-initialized-v1`,
  reintroducing the "deleted students resurrect" bug on import; also omits
  `music-edu-current-student-v1` (selected student lost across export/import).
- **B14** `src/components/SongPicker.tsx:122-127` — clickable `<span>` nested inside a `<button>`
  (invalid HTML, not keyboard accessible).
- **B15** `src/pages/games/EchoGame.tsx:135` — echo phase can soft-lock: round only advances when
  taps reach `pattern.notes.length`, with no timeout for under-tapping.
- **B16** Accessibility gaps: instrument `<button>`s (Piano/Xylophone/Recorder/Drums) respond only
  to `onPointerDown/Up` (Enter/Space silent); icon-only buttons in Mixer lack `aria-label`;
  text inputs in ClassRoster/Library use placeholder without a label.

### Low

- **B17** `src/pages/TeamBattle.tsx:72` — visible text typo: "开始对战国" should be "开始对战".
- **B18** `src/state/stats.ts:62,85` — `trend` documented as cumulative ("累计次数") but pushes
  per-bucket `count: slice.length`.
- **B19** `src/state/appState.tsx:80` — invalid persisted `mode` discards the parsed `showNoteNames`.
- **B20** `src/App.tsx:79-83` — `ErrorBoundary` not keyed by route, so it does not auto-reset on
  navigation (only via the "回到首页" button).

## Requirements

- Fix B1 so `npm test` passes fully.
- Fix the agreed subset of B2–B20 (scope to be confirmed with user).
- Every fix must keep `tsc -b`, `npm run lint`, and `npm test` green.
- Add/adjust tests only where they meaningfully reduce regression risk (e.g. scoring fixes).

## Acceptance Criteria

- [ ] `npm test` passes with 0 failures.
- [ ] `npx tsc -b` and `npm run lint` remain clean.
- [ ] TaikoGame result shows correct miss count; EchoGame stars reflect whole-session accuracy.
- [ ] No setState-after-unmount from the identified timer/mic leaks (B5-B9).
- [ ] Agreed-upon medium/low items resolved.

## Open Questions

- Scope: fix everything (B1-B20) or a prioritized subset? (Recommended: B1-B9 first.)

## Notes

- All findings above carry file:line anchors verified by code inspection during this audit.
