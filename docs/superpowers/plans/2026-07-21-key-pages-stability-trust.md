# 关键页稳定精致 + 最小信任修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Home / TrainingCenter / Theory / LessonMode fill the desktop viewport without overflow or overlap, stop fake training metrics, and deep-link review/quest entries to the correct theory topic or category.

**Architecture:** Reuse existing `openTheory(TheoryFocus)` and Theory’s `theoryFocus` consumer. Extract pure focus mappers for Home/AdventureMap so tests can lock deep links without mounting React. Make TrainingCenter display only real progress. Converge key-page layout via page CSS + `responsive.css` (last import); freeze new global layout passes in `index.css`. Small TopBar fixes for instrument note-names and fullscreen toggle.

**Tech Stack:** React 18, TypeScript, Vite, node:test (+ existing TypeScript transpile loader in tests), CSS (no new UI framework).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-21-key-pages-stability-trust-design.md`
- Do **not** add a new `index.css` desktop “layout pass” media block.
- Do **not** invent a second navigation system; deep links must use `openTheory` / `TheoryFocus`.
- Do **not** fabricate training sub-metrics from `activeBest - index * 14` (or similar).
- P1 excludes: backend, LessonMode write-to-reviewBook, full daily-challenge quiz shell, full CSS rewrite of non-key pages.
- After each task: `npm test` green (or the subset named in the task) before commit.
- Commits: small, message in Chinese or English matching recent style (`fix:` / `feat:` / `test:` / `style:`).

## File map

| File | Responsibility |
|------|----------------|
| `src/state/reviewDeepLink.ts` | Pure mappers: review item / weak category / theory topic → `TheoryFocus` |
| `src/state/stats.ts` | `GAME_META` includes all training game routes |
| `src/pages/TrainingCenter.tsx` | Honest metrics UI + copy aligned with 5 modules |
| `src/pages/Home.tsx` | Wire review-rail clicks to deep links |
| `src/pages/AdventureMap.tsx` | Wire quest topic cards / CTAs to `openTheory` |
| `src/components/TopBar.tsx` | Note names on xylophone/recorder; fullscreen toggle |
| `src/responsive.css` | Final fill/overflow guardrails for 4 key routes only (extend existing, no parallel system) |
| `src/pages/training.css`, `theory.css`, `lesson.css`, home rules in `index.css` | Page-scoped density/fill polish for key pages |
| `tests/reviewDeepLink.test.mjs` | Deep-link + GAME_META contract tests |
| `tests/statsMeta.test.mjs` or fold into above | GAME_META ↔ training routes |

---

### Task 1: Deep-link pure mappers + failing tests

**Files:**
- Create: `src/state/reviewDeepLink.ts`
- Create: `tests/reviewDeepLink.test.mjs`
- Modify: none yet for UI

**Interfaces:**
- Produces:
  - `focusFromReviewItem(item: { source: string; itemId: string; category: string; stage?: string }): TheoryFocus`
  - `focusFromWeakCategory(category: string): TheoryFocus`
  - `focusFromTheoryTopic(topic: { id: string; category: string; stage?: string }): TheoryFocus`
- Consumes: `TheoryFocus`, `createTheoryFocus` from `src/state/theoryFocus.ts`; optional stage validation against known stage ids if imported from catalog (keep mapper free of React).

- [ ] **Step 1: Write the failing test file**

Create `tests/reviewDeepLink.test.mjs` using the same TS loader pattern as `tests/theoryFocus.test.mjs`:

```javascript
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

function createTsLoader() {
  const cache = new Map()
  const load = (filePath) => {
    const resolved = path.resolve(filePath.endsWith('.ts') ? filePath : `${filePath}.ts`)
    if (cache.has(resolved)) return cache.get(resolved).exports
    const source = fs.readFileSync(resolved, 'utf8')
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText
    const module = { exports: {} }
    cache.set(resolved, module)
    const localRequire = (specifier) => {
      if (specifier.startsWith('.')) return load(path.resolve(path.dirname(resolved), specifier))
      return require(specifier)
    }
    const fn = new Function('module', 'exports', 'require', transpiled)
    fn(module, module.exports, localRequire)
    return module.exports
  }
  return load
}

test('focusFromReviewItem maps theory source to topicId', () => {
  const loadTs = createTsLoader()
  const { focusFromReviewItem } = loadTs('src/state/reviewDeepLink.ts')
  const focus = focusFromReviewItem({
    source: 'theory',
    itemId: 'pitch-up-down',
    category: '音高与唱名',
    stage: 'primary-lower',
  })
  assert.equal(focus.topicId, 'pitch-up-down')
  assert.equal(focus.category, '音高与唱名')
  assert.equal(focus.stage, 'primary-lower')
})

test('focusFromReviewItem maps encyclopedia source without fake topicId', () => {
  const loadTs = createTsLoader()
  const { focusFromReviewItem } = loadTs('src/state/reviewDeepLink.ts')
  const focus = focusFromReviewItem({
    source: 'encyclopedia',
    itemId: 'enc-mozart',
    category: '音乐故事',
  })
  assert.equal(focus.topicId, undefined)
  assert.equal(focus.category, '音乐故事')
})

test('focusFromWeakCategory only sets category', () => {
  const loadTs = createTsLoader()
  const { focusFromWeakCategory } = loadTs('src/state/reviewDeepLink.ts')
  assert.deepEqual(focusFromWeakCategory('节奏与拍号'), { category: '节奏与拍号' })
})

test('focusFromTheoryTopic sets topicId category stage', () => {
  const loadTs = createTsLoader()
  const { focusFromTheoryTopic } = loadTs('src/state/reviewDeepLink.ts')
  const focus = focusFromTheoryTopic({
    id: 'cadence',
    category: '音程与和声',
    stage: 'junior-advanced',
  })
  assert.deepEqual(focus, {
    topicId: 'cadence',
    category: '音程与和声',
    stage: 'junior-advanced',
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/reviewDeepLink.test.mjs`  
Expected: FAIL (module missing or exports missing)

- [ ] **Step 3: Implement `src/state/reviewDeepLink.ts`**

```typescript
import { createTheoryFocus, type TheoryFocus } from './theoryFocus'
import type { TheoryStageId } from '../music/theoryCatalog'

const STAGE_IDS = new Set<TheoryStageId>([
  'primary-lower',
  'primary-middle',
  'primary-upper',
  'junior-basic',
  'junior-advanced',
])

function asStage(stage?: string): TheoryStageId | undefined {
  if (!stage) return undefined
  return STAGE_IDS.has(stage as TheoryStageId) ? (stage as TheoryStageId) : undefined
}

export function focusFromReviewItem(item: {
  source: string
  itemId: string
  category: string
  stage?: string
}): TheoryFocus {
  if (item.source === 'theory') {
    return createTheoryFocus({
      topicId: item.itemId,
      category: item.category || undefined,
      stage: asStage(item.stage),
    })
  }
  // encyclopedia / daily / unknown: never treat itemId as theory topicId
  return createTheoryFocus({
    category: item.category || undefined,
  })
}

export function focusFromWeakCategory(category: string): TheoryFocus {
  return createTheoryFocus({ category })
}

export function focusFromTheoryTopic(topic: {
  id: string
  category: string
  stage?: string
}): TheoryFocus {
  return createTheoryFocus({
    topicId: topic.id,
    category: topic.category || undefined,
    stage: asStage(topic.stage),
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/reviewDeepLink.test.mjs`  
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/state/reviewDeepLink.ts tests/reviewDeepLink.test.mjs
git commit -m "test+feat: 复习/闯关深链纯函数与契约测试"
```

---

### Task 2: GAME_META includes game-echo + contract test

**Files:**
- Modify: `src/state/stats.ts` (`GAME_META`)
- Modify: `tests/reviewDeepLink.test.mjs` (add GAME_META test) **or** Create: `tests/statsMeta.test.mjs`

**Interfaces:**
- Produces: `GAME_META['game-echo']` exists with `{ name, icon, skill }`
- Training routes under test: `game-ear`, `game-read`, `game-sing`, `game-taiko`, `game-echo` (must match `TrainingCenter` MODULES routes)

- [ ] **Step 1: Write failing contract test**

Append to `tests/reviewDeepLink.test.mjs` (or new file with same loader):

```javascript
test('GAME_META covers all training center game routes', () => {
  const loadTs = createTsLoader()
  const { GAME_META } = loadTs('src/state/stats.ts')
  const trainingRoutes = ['game-ear', 'game-read', 'game-sing', 'game-taiko', 'game-echo']
  for (const route of trainingRoutes) {
    assert.ok(GAME_META[route], `missing GAME_META for ${route}`)
    assert.equal(typeof GAME_META[route].name, 'string')
    assert.equal(typeof GAME_META[route].icon, 'string')
    assert.equal(typeof GAME_META[route].skill, 'string')
  }
})
```

- [ ] **Step 2: Run test — expect FAIL on game-echo**

Run: `node --test tests/reviewDeepLink.test.mjs`  
Expected: FAIL `missing GAME_META for game-echo`

- [ ] **Step 3: Add game-echo to GAME_META**

In `src/state/stats.ts`:

```typescript
export const GAME_META: Record<string, { name: string; icon: string; skill: string }> = {
  'game-taiko': { name: '节奏反应', icon: '🥁', skill: '律动' },
  'game-echo': { name: '节奏记忆', icon: '🔁', skill: '节奏记忆' },
  'game-sing': { name: '跟唱冒险', icon: '🎤', skill: '演唱' },
  'game-ear': { name: '听感寻宝', icon: '👂', skill: '音准' },
  'game-read': { name: '谱面寻路', icon: '🎼', skill: '识谱' },
}
```

(Names may match TrainingCenter `title`/`former`; keep consistent with product Chinese labels.)

- [ ] **Step 4: Run tests — PASS**

Run: `node --test tests/reviewDeepLink.test.mjs`  
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/stats.ts tests/reviewDeepLink.test.mjs
git commit -m "fix: GAME_META 纳入节奏记忆 game-echo"
```

---

### Task 3: TrainingCenter honest metrics + copy

**Files:**
- Modify: `src/pages/TrainingCenter.tsx`
- Modify: `src/pages/training.css` (only if empty-state styles needed)

**Interfaces:**
- Consumes: `loadProgress().bestScores`, MODULES
- Produces: no `activeMetrics` fake spectrum in module stage; optional keep **module-level** `moduleSignals` only if values are real bestScores (they already are)

- [ ] **Step 1: Remove fake activeMetrics construction**

Delete:

```typescript
const activeMetrics = active.metrics.map((metric, index) => ({
  label: metric.slice(0, 2),
  value: activeBest > 0 ? Math.max(12, activeBest - index * 14) : 16 + ...,
  color: active.color,
}))
```

- [ ] **Step 2: Replace stage visuals when no score**

In the module stage JSX:

- Keep `ProgressRing` with `activeBest / 100` (real).
- If `activeBest === 0`: do **not** render `SpectrumBars` with fake values; render empty copy e.g. `<p className="training-stage-empty">还没有挑战记录，进入后会留下最高分。</p>`
- If `activeBest > 0`: either omit sub-spectrum entirely, or only show a single real bar from `activeBest` — **never** invent per-metric values. Preferred P1: remove the fake `SpectrumBars` block for active metrics completely; keep ring + metric **labels** as chips only (text tags, not scores).

Example stage spectrum section:

```tsx
<div className="training-stage-spectrum">
  <b>挑战能力信号</b>
  {activeBest > 0 ? (
    <p className="training-stage-signal-note">本机最高分 {activeBest}（子项能力需分项练习后才展示）</p>
  ) : (
    <p className="training-stage-empty">还没有挑战记录</p>
  )}
</div>
```

- [ ] **Step 3: Fix copy “四类” → five modules**

Head paragraph:

```tsx
这里统一管理听感、读谱、跟唱、节奏反应和节奏记忆五类小游戏。
```

Lab strip title may stay “能力信号站” but body should not claim fabricated balance metrics beyond average best score (average of real bests is OK).

- [ ] **Step 4: Manual smoke**

Run: `npm run dev` → open 挑战中心  
Expected: no multi-bar “能力” chart derived from one score; empty vs scored states differ honestly.

- [ ] **Step 5: Commit**

```bash
git add src/pages/TrainingCenter.tsx src/pages/training.css
git commit -m "fix: 挑战中心去掉伪能力声谱并修正五类文案"
```

---

### Task 4: Home review-rail deep links

**Files:**
- Modify: `src/pages/Home.tsx`

**Interfaces:**
- Consumes: `openTheory` from `useApp()`, `focusFromReviewItem`, `focusFromWeakCategory`
- Theory already applies `theoryFocus` in `useEffect` (`Theory.tsx` ~56–71)

- [ ] **Step 1: Import openTheory and mappers**

```typescript
const { navigate, mode, openTheory } = useApp()
import {
  focusFromReviewItem,
  focusFromWeakCategory,
} from '../state/reviewDeepLink'
```

- [ ] **Step 2: Wire daily items**

Replace `onClick={() => navigate('training')}` on daily items with:

```typescript
onClick={() => openTheory(focusFromReviewItem(item))}
```

Empty daily state may keep `navigate('training')`.

- [ ] **Step 3: Wire wrong-answer (回放点) items**

```typescript
onClick={() => openTheory(focusFromReviewItem(item))}
```

Empty wrong state may keep `navigate('theory')` or `openTheory()` — prefer `openTheory()` for consistency.

- [ ] **Step 4: Wire weak category chips**

```typescript
onClick={() => openTheory(focusFromWeakCategory(item.category))}
```

- [ ] **Step 5: Header “进入挑战中心”** stays `navigate('training')` (spec allows).

- [ ] **Step 6: Smoke**

With any review data (or temporarily log focus): click chip → Theory filters/category/topic update.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "fix: 首页今日练习/回放/薄弱方向深链到探索馆"
```

---

### Task 5: AdventureMap openTheory deep links

**Files:**
- Modify: `src/pages/AdventureMap.tsx`

**Interfaces:**
- Consumes: `openTheory` from `useApp()`, `focusFromTheoryTopic`
- Topic objects from `getTheoryTopic` include `id`, `category`, `stage`

- [ ] **Step 1: Destructure openTheory**

```typescript
const { navigate, openTheory } = useApp()
```

- [ ] **Step 2: Import mapper**

```typescript
import { focusFromTheoryTopic } from '../state/reviewDeepLink'
```

- [ ] **Step 3: Preview topic buttons**

Replace `onClick={() => navigate('theory')}` with:

```typescript
onClick={() =>
  openTheory(
    focusFromTheoryTopic({
      id: topic!.id,
      category: topic!.category,
      stage: topic!.stage,
    })
  )
}
```

- [ ] **Step 4: Primary “进入探索馆闯关” / “探索发现”**

Use first preview topic if available:

```typescript
onClick={() => {
  const first = previewTopics[0]
  if (first) {
    openTheory(
      focusFromTheoryTopic({
        id: first.id,
        category: first.category,
        stage: first.stage,
      })
    )
  } else {
    openTheory()
  }
}}
```

Practice route buttons remain `navigate(activeQuest.practiceRoute)`.

- [ ] **Step 5: Smoke** — open 闯关地图 → click 发现卡 → Theory lands on that topic.

- [ ] **Step 6: Commit**

```bash
git add src/pages/AdventureMap.tsx
git commit -m "fix: 闯关岛发现卡深链 openTheory(topicId)"
```

---

### Task 6: TopBar note names + fullscreen toggle

**Files:**
- Modify: `src/components/TopBar.tsx`

**Interfaces:**
- Consumes: `document.fullscreenElement`, Fullscreen API
- Produces: `isInstrument` includes xylophone & recorder; toggle fullscreen

- [ ] **Step 1: Expand isInstrument**

```typescript
const isInstrument =
  route === 'piano' ||
  route === 'drums' ||
  route === 'xylophone' ||
  route === 'recorder'
```

- [ ] **Step 2: Fullscreen state**

```typescript
const [isFullscreen, setIsFullscreen] = useState(
  () => typeof document !== 'undefined' && !!document.fullscreenElement
)

useEffect(() => {
  const onChange = () => setIsFullscreen(!!document.fullscreenElement)
  document.addEventListener('fullscreenchange', onChange)
  return () => document.removeEventListener('fullscreenchange', onChange)
}, [])

const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    void document.exitFullscreen?.()
  } else {
    void document.documentElement.requestFullscreen?.()
  }
}
```

Import `useEffect` from React.

- [ ] **Step 3: Wire button**

```tsx
<button
  className={`toolbtn ${isFullscreen ? 'active' : ''}`}
  onClick={toggleFullscreen}
  title={isFullscreen ? '退出全屏' : '投屏全屏'}
>
  {isFullscreen ? '退出全屏' : '全屏'}
</button>
```

- [ ] **Step 4: Smoke** — open 木琴: 音名 visible; 全屏 toggles.

- [ ] **Step 5: Commit**

```bash
git add src/components/TopBar.tsx
git commit -m "fix: 木琴竖笛音名开关 + 全屏进出切换"
```

---

### Task 7: Key-page layout polish (fill without overflow)

**Files:**
- Modify: `src/responsive.css` (authoritative last-import guardrails for `route-home`, `route-training`, `route-theory`, `route-lesson`)
- Modify as needed: `src/pages/training.css`, `src/pages/theory.css`, `src/pages/lesson.css`, home-related rules already under `.content.route-home` in `src/index.css` / `responsive.css`
- **Do not** append a new multi-page “Desktop density rebalance” mega-pass to `index.css`

**Interfaces:**
- Desktop: min-width 1024px and min-height 680px → key routes fill content area, internal scroll only where needed
- Short viewport: height auto + content scroll (existing responsive patterns)

- [ ] **Step 1: Audit current `responsive.css` key-route block**

Confirm rules for `.content.route-home`, `.route-training`, and add/align `.route-theory` / `.route-lesson` with the same fill/overflow contract:

```css
@media (min-width: 1024px) and (min-height: 680px) {
  .content.route-home,
  .content.route-training,
  .content.route-theory,
  .content.route-lesson {
    overflow: hidden !important;
  }

  .content.route-home > *,
  .content.route-training > *,
  .content.route-theory > *,
  .content.route-lesson > * {
    height: 100% !important;
    max-height: 100% !important;
    min-height: 0 !important;
  }
}
```

(Merge with existing home/training rules; avoid duplicating contradictory `height: auto !important` for the same breakpoint.)

- [ ] **Step 2: Theory / Lesson page shells**

Ensure `.theory-lab` / `.lesson-page` use:

```css
display: grid;
height: 100%;
min-height: 0;
grid-template-rows: auto minmax(0, 1fr);
overflow: hidden;
```

Inner nav/main: `min-height: 0; overflow: auto` as needed.

- [ ] **Step 3: Visual density consistency (4 pages only)**

Align within key pages:

- Card padding ~12–14px desktop
- Kicker font ~0.7–0.78rem
- Primary vs secondary buttons already styled — do not invent new button system
- Empty states: soft background, single line title + small hint (review-rail / training-stage-empty)

- [ ] **Step 4: Hand-test matrix**

| Viewport | Check |
|----------|--------|
| 1920×1080 | 4 routes fill, no page scroll unless content truly exceeds |
| 1366×768 | no overlap on home review-rail / training nav |
| 125% zoom | no clipped CTAs; scroll appears only when needed |
| Sidebar open/close | no horizontal overflow |

- [ ] **Step 5: Run full tests + build**

```bash
npm test
npm run build
```

Expected: all tests pass; build succeeds.

- [ ] **Step 6: Optional single-file sync** (if releasing offline HTML)

```bash
cp -f dist/index.html "乐动课堂.html"
```

(`乐动课堂.html` is gitignored — local only.)

- [ ] **Step 7: Commit**

```bash
git add src/responsive.css src/pages/training.css src/pages/theory.css src/pages/lesson.css src/index.css
git commit -m "style: 关键四页铺满不溢出与密度收敛"
```

---

### Task 8: Final verification checklist

**Files:** none required beyond fixes if bugs found

- [ ] **Step 1: Run full automated suite**

```bash
npm test
npm run build
```

Expected: PASS / build OK

- [ ] **Step 2: Spec acceptance checklist**

From spec §7.2:

1. Layout: 1920 / 1366 / 125% on Home, Training, Theory, Lesson  
2. Daily challenge item → Theory with topic/category  
3. Wrong-answer item → Theory deep link  
4. Weak chip → category filter  
5. Adventure topic card → topicId  
6. Training: no fake multi-metric bars  
7. Xylophone note-name toggle visible  
8. Fullscreen enter/exit  

- [ ] **Step 3: Commit any residual fixes** (if needed)

```bash
git commit -m "fix: P1 验收问题收尾"
```

- [ ] **Step 4: Report to user** with commit list and remaining P2 items (quiz shell, Lesson write-through, CSS token split).

---

## Self-review vs spec

| Spec requirement | Task |
|------------------|------|
| 4 key pages fill without overflow | Task 7 |
| No fake training sub-metrics | Task 3 |
| Home review deep links | Task 1 + 4 |
| Adventure openTheory topicId | Task 1 + 5 |
| Note names xylophone/recorder | Task 6 |
| Fullscreen toggle | Task 6 |
| GAME_META + game-echo | Task 2 |
| Contract tests 5–8 | Tasks 1–2 (4 deep-link + 1 meta; add more asserts if needed in Task 1) |
| Freeze new index.css layout passes | Task 7 constraint |
| No LessonMode review write | excluded |
| No full quiz shell | excluded |

Placeholder scan: none intentional.  
Type consistency: `TheoryFocus` / `createTheoryFocus` / `focusFrom*` naming stable across tasks.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-21-key-pages-stability-trust.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — this session runs tasks with checkpoints  

Which approach?
