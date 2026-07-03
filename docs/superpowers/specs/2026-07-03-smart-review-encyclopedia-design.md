# v0.9A Smart Review And Music Encyclopedia Design

## Goal

Turn the app from a rich music theory library into a full learning loop: students learn a topic, answer playful questions, collect wrong answers, receive daily review, and discover connected encyclopedia knowledge. The version combines v0.8A smart review with v0.9 encyclopedia expansion so content growth directly supports learning retention.

## Scope

This version adds four connected areas:

- Smart review and wrong-answer notebook.
- Daily challenge generation.
- Knowledge mastery tracking by student.
- Music encyclopedia content covering school music knowledge beyond theory drills.

The version should not rebuild the whole app shell, replace existing games, or introduce online accounts. All progress stays local and student-aware, following the current app pattern.

## Learning Loop

The primary loop is:

1. Student opens a course, theory topic, quest island, or encyclopedia card.
2. Student answers a short quiz or challenge.
3. The app records correctness, topic id, category, difficulty, source, and time.
4. Wrong answers enter the notebook.
5. Weak categories feed daily challenge and recommended review.
6. Repeated correct answers can mark an item as improving or mastered.

The loop should work for both theory topics and encyclopedia entries. This prevents encyclopedia content from becoming passive reading only.

## Smart Review Model

Create a shared local progress model for review activity. It should track:

- Current student id.
- Item source: theory, encyclopedia, or daily challenge.
- Topic or entry id.
- Category and stage.
- Question text, selected answer, correct answer, and timestamp.
- Attempt count, correct count, wrong count, and latest result.

Derived helpers should expose:

- Wrong-answer list.
- Weak categories.
- Recommended review ids.
- Mastery status: new, learning, needs review, improving, mastered.
- Daily challenge candidates.

The model should be testable without React and should avoid relying on visual components.

## Daily Challenge

Add a daily challenge surface that feels like a small learning game rather than a report.

Each daily challenge should include:

- A few new knowledge questions.
- A few review questions from weak or wrong items.
- A mix of theory and encyclopedia questions when available.
- A short result message after completion.
- A simple reward phrase or badge label.

The first implementation can generate deterministic daily sets from local content and the current date. It does not need cloud sync or a complex spaced-repetition algorithm.

## Wrong-Answer Notebook

The wrong-answer notebook should help students understand what to fix.

It should show:

- Wrong item title and category.
- The student's last selected answer.
- Correct answer.
- Short explanation from the source item when available.
- Buttons to retry, review the related knowledge, or mark as understood.

Retrying should update the local record. A successfully retried item can move out of the active wrong-answer list while still contributing to mastery history.

## Music Encyclopedia

Add an encyclopedia module with structured entries. Each entry should include:

- id
- type
- title
- subtitle
- stage
- category
- summary
- key facts
- listening or classroom prompt
- related theory topic ids
- quiz questions

Initial encyclopedia categories:

- Music composers: Bach, Mozart, Beethoven, Chopin, Tchaikovsky, Nie Er, Xian Xinghai, and other school-relevant figures.
- Works and appreciation: Ode to Joy, March of the Volunteers, Yellow River Cantata, Little Star Variations, Swan Lake selections, and other familiar examples.
- Chinese folk and traditional music: folk songs, opera basics, regional styles, pentatonic sound, and Chinese instruments.
- Western music history: Baroque, Classical, Romantic, modern music, orchestra development, and basic style recognition.
- Instruments: Chinese national instruments, Western orchestral families, keyboard instruments, percussion, voice types, and ensemble roles.
- Genres and forms: march, dance, sonata, concerto, symphony, suite, folk song, art song, and school chorus.

Content should be suitable for primary and junior-high students: clear, accurate, story-like, and quiz-ready.

## UI Direction

Keep entrances concise. Recommended navigation structure:

- Course Center remains the main staged path.
- Theory Lab remains the focused theory learning and demo page.
- Adventure Map keeps quest-style learning.
- Add one clear Music Encyclopedia page or integrate it into the existing Library if that avoids another sidebar item.
- Home gains compact cards for Daily Challenge, Wrong-Answer Notebook, and Weak Knowledge.

Avoid adding many new top-level buttons. The home page and course path should guide students toward the next useful activity.

## Components

Likely modules:

- `src/state/theoryReview.ts`: local review records, wrong-answer helpers, mastery helpers, and daily challenge helpers.
- `src/music/encyclopedia.ts`: structured encyclopedia entries and quiz content.
- `src/pages/ReviewCenter.tsx` or integrated sections inside `Theory.tsx` and `Home.tsx`.
- `src/pages/Encyclopedia.tsx` or an expanded `Library.tsx` encyclopedia tab.

The final routing choice should follow the existing app structure and keep duplicate entrances minimal.

## Data Flow

Quiz completion calls a record helper with a normalized payload. The helper saves to local storage under the current student. Pages read derived data instead of duplicating scoring logic.

Daily challenge generation reads:

- Theory topics.
- Encyclopedia entries.
- Review history.
- Current date.
- Current student id.

The generated challenge can be recalculated on render as long as it remains stable for the same student and date.

## Testing

Add Node tests for:

- Review record aggregation.
- Wrong-answer list behavior.
- Mastery status transitions.
- Daily challenge generation stability.
- Encyclopedia entry validity.
- Encyclopedia quiz coverage.
- Related theory topic ids resolving to existing topics.

Existing catalog, demo, quest, and focus tests should continue to pass.

## Delivery

After implementation:

- Run new review and encyclopedia tests.
- Run existing theory catalog, quest, demo, and focus tests.
- Run `npm run build`.
- Copy `dist/index.html` to `乐动课堂.html`.
- Commit the result to git.

