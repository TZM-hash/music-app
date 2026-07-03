# v0.7C Knowledge Quest Design

## Goal

Make the app feel richer and more playful by expanding the music theory knowledge base and turning study into a lightweight quest path. Students should feel they are progressing through musical islands rather than reading a long list of facts.

## Scope

This version expands the existing theory catalog and adds a gamified quest layer. It does not rebuild the existing rhythm, ear, singing, or reading games. It reuses current routes and progress storage.

## Knowledge Expansion

The theory catalog should grow from 57 topics to at least 100 topics. Each topic must have at least four quiz questions. The expanded content should cover:

- More rhythm patterns and notation details.
- More staff reading, clef, key signature, and score navigation topics.
- More scales, modes, Chinese pentatonic variants, and modulation basics.
- More intervals, triads, seventh chords, harmonic function, and cadence topics.
- More expression markings, tempo changes, articulation, ornaments, and performance vocabulary.
- More form, phrase, theme, variation, rondo, and listening analysis topics.
- More composition and classroom creativity topics.
- More Chinese and world music classroom knowledge.

## Quest Layer

Create a `theoryQuests` module that groups topics into playable islands. Each island has a name, icon, mood, stage, topic ids, practice route, and reward badge text.

The quest layer is intentionally light:

- It does not create a separate game engine.
- It uses the existing `adventure` route.
- It should show island cards with topic counts and progress signals.
- Each island offers actions to open the theory lab, start the related practice route, or open course guidance.

## UI Direction

The updated Adventure Map becomes “乐理闯关岛”. It should feel more playful than the normal course list:

- Bigger island cards.
- Short mission language.
- Visible topic count and practice route.
- Reward text.
- Progress based on existing best scores and theory quiz records.

## Testing

Add tests that assert:

- The expanded catalog has at least 100 topics.
- Every topic has at least four quiz questions.
- Every category has meaningful depth.
- Quest islands cover valid topic ids.
- There are at least eight quest islands and at least one for advanced junior-high topics.

## Delivery

After implementation:

- Run catalog and quest tests.
- Run existing demo tests.
- Run `npm run build`.
- Copy `dist/index.html` to `乐动课堂.html`.
- Commit to git.
