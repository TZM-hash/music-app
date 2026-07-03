# v0.6A Interactive Theory Demos Design

## Goal

Upgrade the theory lab from mostly static visual examples into a classroom-friendly interactive demo surface. Each theory topic should feel like a small experiment: students can click a control, hear the sound, see the visual highlight change, and read a short observation prompt.

## Scope

This version focuses on the theory lab demo area only. It does not rebuild practice games, student analytics, or the course center. Existing topic filtering, mini quizzes, and lesson routes stay intact.

## Demo Model

Create a shared demo configuration module for all existing `DemoKind` values. Each demo kind gets:

- A concise classroom prompt.
- Three or more selectable controls.
- Observation cues that tell teachers and students what to notice.
- Stable labels and values that the React demo component can render without hard-coding every text string in `Theory.tsx`.

## Interaction Behavior

The demo area will show:

- A control strip above the visual surface.
- A selected-state highlight for the active control.
- A topic-aware visual for keyboard, rhythm, staff, scale, interval, chord, tempo, dynamics, articulation, repeat, and form demos.
- A “听演示” button that plays the active control instead of only playing a generic demo kind.

Controls must be simple enough for classroom projection and touch use. The interface should avoid modal dialogs, complex settings, or separate pages.

## Visual Treatment

Reuse existing CSS and colors. Add denser, clearer visual states:

- Keyboard keys highlight selected notes.
- Rhythm beats show strong/weak grouping and selected pattern.
- Staff demo shows selected note positions.
- Scale, interval, and chord demos show active notes with labels.
- Form demos show selected sections or structure.

## Testing

Add a Node test for the demo configuration module. The test verifies every `DemoKind` has a scene, at least three controls, classroom prompts, and observations. This keeps future topic additions from silently falling back to weak demos.

## Delivery

After implementation:

- Run demo configuration tests.
- Run existing theory catalog tests.
- Run `npm run build`.
- Copy `dist/index.html` to `乐动课堂.html`.
- Commit the result to git.
