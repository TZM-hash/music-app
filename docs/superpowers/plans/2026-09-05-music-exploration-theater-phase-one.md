# 音乐探索剧场第一阶段实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有乐动课堂中交付第一个可运行的“音乐探索剧场”单元，以《茉莉花 / 茉莉花开（民乐）》验证“先听—表达—找证据—知识浮现—再听—总结”的完整体验闭环。

**Architecture:** 新增独立的探索单元内容模型、可恢复的探索会话状态和 `ExplorationTheater` 组件；保留现有 `MusicExperienceStage` 及训练中心作为兼容入口，先把 `LessonMode` 和首页主入口切换到新探索剧场。探索单元使用现有曲库和 Web Audio/Tone.js 能力播放旋律片段，发现记录采用可选字段增量扩展，旧数据无需迁移即可继续读取。

**Tech Stack:** React 18、TypeScript strict mode、Vite、Tone.js / Web Audio、浏览器 `localStorage`、Node `node:test`、PowerShell、现有 CSS 体系。

**Spec:** `docs/superpowers/specs/2026-09-05-music-exploration-theater-redesign.md`

## Global Constraints

- 面向浙江省小学 1—6 年级课堂；同一探索单元通过低段、中段、高段支架适配，不复制六套产品。
- 情绪、动作、故事、文化是进入音乐的路径，不是四个必须完成的栏目；每个单元只突出一到两条主路径。
- 所有主观感受都允许保留差异；反馈必须回到“你是从音乐的哪里听出来的？”以及可听见的音乐证据。
- 乐理概念必须在学生听到或验证现象之后出现，知识卡保持短、可听、可比较、可回听。
- 第一阶段使用现有离线音频、合成音和曲库，不引入后端、账号体系、外部音频服务或复杂 AI 识别。
- 不删除现有理论页、游戏页、乐器页和旧探索舞台；旧入口仍可用，新的 `LessonMode` 承载首个探索剧场单元。
- 现有本地数据、单文件构建和离线播放能力不能被破坏；新增 `localStorage` 字段必须兼容缺失字段和旧发现记录。
- 所有交互必须支持重听、跳过后继续和无音频降级；不能因浏览器音频权限或设备无声永久阻塞流程。
- 学生反馈使用观察性语言，不显示审美偏好排名，不把“感受不同”标为错误。
- 每个任务完成后运行该任务的定向测试；最终运行完整测试、lint、build，并进行浏览器交互验收。

---

## 文件与职责总览

### 新建文件

- `src/music/explorationUnits.ts`：探索单元的类型、路径、年级文案和《茉莉花》内容配置；不包含 React 或音频播放副作用。
- `src/music/explorationAudio.ts`：从现有 `Song` 数据生成可播放的片段和证据对比序列；纯函数部分可直接测试。
- `src/state/explorationSessions.ts`：探索流程状态机、会话读写和本地存储兼容逻辑。
- `src/components/ExplorationTheater.tsx`：首个探索剧场的交互舞台；负责播放、选择、反馈、二次聆听和发现卡保存。
- `src/components/explorationTheater.css`：探索剧场的布局、卡片、步骤、反馈和响应式样式。
- `tests/explorationUnits.test.mjs`：内容配置和年级适配的纯逻辑测试。
- `tests/explorationAudio.test.mjs`：片段截取、变体生成和时值计算测试。
- `tests/explorationSessions.test.mjs`：状态机、会话持久化和恢复测试。
- `tests/explorationTheater.test.mjs`：组件源码契约和可访问性关键标记测试。

### 修改文件

- `src/state/appState.tsx`：增加当前探索单元焦点和 `openExploration()`，为首页、课程入口和探索剧场共享进入方式。
- `src/state/discoveries.ts`：为新发现卡增加感受、路径、音乐证据、知识线索和二次聆听字段，同时保持旧记录可读。
- `src/pages/LessonMode.tsx`：从理论课时规划器切换为探索剧场页面，保留通往课程、听觉实验室和线索库的支持入口。
- `src/pages/lesson.css`：更新课时页的外层布局和教师支持信息样式。
- `src/pages/Home.tsx`：将“开始今日探险/开始探索”主动作指向茉莉花探索单元，减少首屏对理论目录的依赖。
- `src/playful.css` 或 `src/responsive.css`：仅在现有全局规则覆盖新课时页时做最小兼容调整，不复制大段组件样式。
- `tests/discoveries.test.mjs`：覆盖新增字段的保存、读取、截断和旧记录兼容。
- `tests/experienceIntegration.test.mjs`：新增探索剧场接入和保留旧训练入口的源码契约。
- `tests/curriculumUi.test.mjs`：如现有 UI 契约依赖旧 `LessonMode` 文案，改为验证新的探索剧场入口和年级提示。

---

### Task 1: 建立探索单元内容模型与《茉莉花》配置

**Files:**

- Create: `src/music/explorationUnits.ts`
- Create: `tests/explorationUnits.test.mjs`
- Read: `src/music/experienceActivities.ts`
- Read: `src/music/zhejiangCurriculum.ts`
- Read: `src/music/songs.ts`
- Read: `docs/superpowers/specs/2026-09-05-music-exploration-theater-redesign.md`

**Interfaces:**

- Produces `ExplorationPath`, `ExplorationStageId`, `ExplorationAgeBand`, `ExplorationChoice`, `ExplorationEvidenceOption`, `ExplorationConceptCard`, `ExplorationUnit`。
- Produces `JASMINE_EXPLORATION_UNIT`、`EXPLORATION_UNITS`、`getExplorationUnit(id?: string)`、`getExplorationAgeBand(grade?: PrimaryGrade | number | null)`。
- `getExplorationUnit()` 在没有匹配 id 时返回 `JASMINE_EXPLORATION_UNIT`，保证首页和旧入口不会因为焦点缺失而空白。

- [ ] **Step 1: Write the failing content contract tests**

在 `tests/explorationUnits.test.mjs` 使用现有 TypeScript transpile loader，加入以下断言：

```js
test('茉莉花探索单元提供四条路径、音乐证据和二次聆听内容', () => {
  const load = createTsLoader()
  const { JASMINE_EXPLORATION_UNIT } = load('src/music/explorationUnits.ts')

  assert.equal(JASMINE_EXPLORATION_UNIT.id, 'jasmine')
  assert.match(JASMINE_EXPLORATION_UNIT.title, /江南/)
  assert.deepEqual(
    JASMINE_EXPLORATION_UNIT.paths.map((path) => path.id),
    ['emotion', 'movement', 'story', 'culture']
  )
  assert.ok(JASMINE_EXPLORATION_UNIT.evidence.options.length >= 2)
  assert.ok(JASMINE_EXPLORATION_UNIT.concepts.length >= 2)
  assert.match(JASMINE_EXPLORATION_UNIT.relisten.prompt, /再听|听到/)
})

test('探索单元按年级映射低中高三种支架', () => {
  const load = createTsLoader()
  const { getExplorationAgeBand, getExplorationUnit } = load('src/music/explorationUnits.ts')

  assert.equal(getExplorationAgeBand(1), 'primary-1-2')
  assert.equal(getExplorationAgeBand(4), 'primary-3-4')
  assert.equal(getExplorationAgeBand(6), 'primary-5-6')
  assert.equal(getExplorationAgeBand(undefined), 'primary-1-2')
  assert.equal(getExplorationUnit('missing').id, 'jasmine')
})
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- tests/explorationUnits.test.mjs`

Expected: FAIL because `src/music/explorationUnits.ts` does not exist yet。

- [ ] **Step 3: Implement the content model and unit configuration**

在 `src/music/explorationUnits.ts` 中实现以下结构：

```ts
export type ExplorationPath = 'emotion' | 'movement' | 'story' | 'culture'
export type ExplorationStageId =
  | 'listen'
  | 'express'
  | 'evidence'
  | 'concept'
  | 'relisten'
  | 'reflect'
export type ExplorationAgeBand = 'primary-1-2' | 'primary-3-4' | 'primary-5-6'

export interface ExplorationChoice {
  id: string
  label: string
  hint?: string
  color?: string
}

export interface ExplorationPathConfig {
  id: ExplorationPath
  label: string
  prompt: string
  choices: ExplorationChoice[]
}

export interface ExplorationEvidenceOption {
  id: string
  label: string
  feedback: string
  conceptId: string
  isBest: boolean
}

export interface ExplorationConceptCard {
  id: string
  title: string
  short: string
  body: string
  listenPrompt: string
  ageBands: ExplorationAgeBand[]
}

export interface ExplorationUnit {
  id: string
  title: string
  subtitle: string
  question: string
  icon: string
  color: string
  source: 'textbook' | 'extension'
  songId: string
  curriculumTopicIds: string[]
  paths: ExplorationPathConfig[]
  evidence: {
    prompt: string
    options: ExplorationEvidenceOption[]
  }
  concepts: ExplorationConceptCard[]
  culture: {
    title: string
    body: string
    ageBands: Partial<Record<ExplorationAgeBand, string>>
  }
  relisten: {
    prompt: string
    choices: ExplorationChoice[]
  }
  reflectionPrompts: Partial<Record<ExplorationAgeBand, string>>
}
```

《茉莉花》配置必须包含：

- 主题“一朵花，为什么能唱出江南的味道？”。
- 情绪、动作、故事、文化四条入口，各至少三个可选表达。
- 一个 A/B 音乐证据互动：让学生比较较流动的旋律与较跳跃的变体。
- 低段概念“旋律走得平稳/级进”，中段概念“旋律、级进、音色”，高段概念“五声音阶/地域色彩”。
- 文化信息放在证据之后，包括江苏版本婉转、不同地域版本性格不同的简短文案。
- 二次聆听选择“保留原感受/增加新线索/改变理解”，不能只有标准答案。

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `npm test -- tests/explorationUnits.test.mjs`

Expected: PASS。

- [ ] **Step 5: Commit the self-contained content model**

```powershell
$ErrorActionPreference = 'Stop'
git add src/music/explorationUnits.ts tests/explorationUnits.test.mjs
git commit -m "feat: add exploration unit content model"
```

---

### Task 2: 建立片段播放数据与证据变体生成器

**Files:**

- Create: `src/music/explorationAudio.ts`
- Create: `tests/explorationAudio.test.mjs`
- Read: `src/music/songs.ts`
- Read: `src/music/audioEngine.ts`

**Interfaces:**

- Produces `ExplorationCue`、`ExplorationCueVariant`、`getSongMelody(songId)`、`getSongFragment(songId, start, end)`、`getEvidenceVariant(unitId, variant)`、`getCueDurationMs(cue, bpm)`。
- `ExplorationCue` 只描述音符，不直接调用 Tone.js：`{ note: string; beats: number; velocity: number; patch: 'piano' | 'musicbox' | 'strings' }`。
- `getSongFragment()` 对非法范围进行边界裁剪，找不到曲目时返回空数组，不抛出异常。
- UI 层稍后使用这些纯数据调用已有 `playNote()` 和 `ensureAudio()`。

- [ ] **Step 1: Write failing audio-data tests**

```js
test('可以从茉莉花曲库截取有限长度的旋律片段', () => {
  const load = createTsLoader()
  const { getSongMelody, getSongFragment } = load('src/music/explorationAudio.ts')

  const melody = getSongMelody('jasmine')
  const fragment = getSongFragment('jasmine', 0, 8)

  assert.ok(melody.length > fragment.length)
  assert.equal(fragment.length, 8)
  assert.ok(fragment.every((cue) => cue.note !== 'rest'))
})

test('证据变体可比较且不会修改原曲库数据', () => {
  const load = createTsLoader()
  const { getEvidenceVariant } = load('src/music/explorationAudio.ts')

  const flowing = getEvidenceVariant('jasmine', 'flowing')
  const jumping = getEvidenceVariant('jasmine', 'jumping')

  assert.ok(flowing.length > 0)
  assert.ok(jumping.length > 0)
  assert.notDeepEqual(flowing.map((cue) => cue.note), jumping.map((cue) => cue.note))
})

test('节拍时值转换保持正数并可用于等待播放', () => {
  const load = createTsLoader()
  const { getCueDurationMs } = load('src/music/explorationAudio.ts')

  assert.equal(getCueDurationMs({ note: 'C4', beats: 1, velocity: 0.7, patch: 'piano' }, 60), 1000)
  assert.ok(getCueDurationMs({ note: 'C4', beats: 0.5, velocity: 0.7, patch: 'piano' }, 80) > 0)
})
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- tests/explorationAudio.test.mjs`

Expected: FAIL because the new audio data module does not exist yet。

- [ ] **Step 3: Implement pure sequence helpers**

实现时从 `BUILTIN_SONGS` 读取曲目，并过滤 `rest`；不要复制整首旋律到新文件。`getEvidenceVariant('jasmine', 'flowing')` 使用原曲前八个可演奏音符，`jumping` 使用同一长度但将部分相邻级进替换为更明显的跳进，确保学生可以听出差异且仍然是可播放的音高。所有返回数组都创建新对象，不能修改 `BUILTIN_SONGS`。

`getCueDurationMs()` 使用四分音符时值：`60000 / bpm * beats`，对非有限或小于等于 0 的 bpm 使用 60，对 beats 使用至少 0.125 的下限。

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `npm test -- tests/explorationAudio.test.mjs`

Expected: PASS。

- [ ] **Step 5: Commit the audio sequence helpers**

```powershell
$ErrorActionPreference = 'Stop'
git add src/music/explorationAudio.ts tests/explorationAudio.test.mjs
git commit -m "feat: add exploration audio fragments"
```

---

### Task 3: 建立可恢复的探索会话状态机

**Files:**

- Create: `src/state/explorationSessions.ts`
- Create: `tests/explorationSessions.test.mjs`
- Read: `src/state/experienceSessions.ts`
- Read: `src/state/students.ts`

**Interfaces:**

- Produces `ExplorationSession`、`ExplorationResponse`、`RelistenChoice`。
- Produces `createExplorationSession(unitId, studentId, grade, startedAt?)`。
- Produces `updateExplorationSession(session, response, updatedAt?)`。
- Produces `advanceExplorationStage(session, stage, updatedAt?)`。
- Produces `getExplorationProgress(session)`、`isExplorationComplete(session)`。
- Produces `loadExplorationSession(studentId, unitId)`、`saveExplorationSession(session)`、`clearExplorationSession(studentId, unitId)`。
- 存储键固定为 `music-edu-exploration-sessions-v1`；匿名会话允许在内存中运行，但不写入学生个人记录。

- [ ] **Step 1: Write failing state-machine tests**

测试必须覆盖：初始阶段为 `listen`、重复记录不丢失已选内容、阶段只能在六个合法阶段内推进、进度被限制在 0 到 1、完成阶段为 `reflect` 且写入 `completedAt`、学生和单元组合隔离、缺少 localStorage 时函数仍返回可用默认值。

示例断言：

```js
test('探索会话按固定顺序推进并记录二次聆听选择', () => {
  const load = createTsLoader()
  const { createExplorationSession, updateExplorationSession, advanceExplorationStage } =
    load('src/state/explorationSessions.ts')

  let session = createExplorationSession('jasmine', 'stu-1', 4, 100)
  session = updateExplorationSession(session, {
    firstFeelingId: 'gentle',
    pathId: 'emotion',
    expressionId: 'water',
  }, 200)
  session = advanceExplorationStage(session, 'evidence', 300)
  session = updateExplorationSession(session, { evidenceId: 'flowing' }, 400)
  session = advanceExplorationStage(session, 'relisten', 500)
  session = updateExplorationSession(session, { relistenChoice: 'new-clue' }, 600)

  assert.equal(session.stage, 'relisten')
  assert.equal(session.pathId, 'emotion')
  assert.equal(session.relistenChoice, 'new-clue')
  assert.ok(session.updatedAt >= 600)
})
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- tests/explorationSessions.test.mjs`

Expected: FAIL because the new session module does not exist yet。

- [ ] **Step 3: Implement the state machine and persistence**

固定阶段顺序为：

```ts
['listen', 'express', 'evidence', 'concept', 'relisten', 'reflect']
```

`advanceExplorationStage()` 只接受合法阶段并更新 `stage`；UI 负责是否允许点击下一步，状态模块不把审美选择判为错误。`updateExplorationSession()` 对数组字段做去重和长度限制，对未知字段忽略。`loadExplorationSession()` 读取 JSON 时过滤无效记录，缺失 `stage`、`updatedAt` 或 `unitId` 的记录返回 `null`，不抛出异常。

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `npm test -- tests/explorationSessions.test.mjs`

Expected: PASS。

- [ ] **Step 5: Commit the session state machine**

```powershell
$ErrorActionPreference = 'Stop'
git add src/state/explorationSessions.ts tests/explorationSessions.test.mjs
git commit -m "feat: add resumable exploration sessions"
```

---

### Task 4: 扩展“我的音乐发现”数据并保持旧记录兼容

**Files:**

- Modify: `src/state/discoveries.ts`
- Modify: `tests/discoveries.test.mjs`
- Read: `src/pages/Home.tsx`
- Read: `src/state/backup.ts`

**Interfaces:**

- `MusicDiscovery` 增加以下可选字段：`unitId?: string`、`path?: ExplorationPath`、`firstFeeling?: string`、`evidence?: string[]`、`concepts?: string[]`、`relistenChoice?: string`、`relistenReflection?: string`。
- `MusicDiscoveryDraft` 接受相同字段。
- `createMusicDiscovery()` 始终输出 `evidence` 和 `concepts` 数组，即使旧草稿未传；旧记录读取时允许这两个字段不存在。
- 现有 `topicId`、`title`、`statement`、`source`、`tags`、学生隔离、上限 60 条和删除学生逻辑保持不变。

- [ ] **Step 1: Add failing compatibility tests**

在 `tests/discoveries.test.mjs` 增加：

```js
test('探索发现卡保存感受、路径、音乐证据和二次聆听变化', () => {
  const discoveries = loadDiscoveries()
  discoveries.saveMusicDiscovery({
    studentId: 'stu-a',
    unitId: 'jasmine',
    topicId: 'pentatonic-scale',
    title: '茉莉花 · 江南的味道',
    statement: '我从平稳的旋律里听到温柔。',
    path: 'emotion',
    firstFeeling: '温柔',
    evidence: ['级进', '音色柔和'],
    concepts: ['旋律', '五声音阶'],
    relistenChoice: 'new-clue',
    relistenReflection: '第二次听到了旋律里的五个音。',
  }, 600)

  const [saved] = discoveries.loadMusicDiscoveries('stu-a')
  assert.equal(saved.unitId, 'jasmine')
  assert.deepEqual(saved.evidence, ['级进', '音色柔和'])
  assert.equal(saved.relistenChoice, 'new-clue')
})

test('旧发现记录没有新增字段时仍然可以读取', () => {
  globalThis.localStorage.setItem('music-edu-discoveries-v1', JSON.stringify([{
    id: 'legacy-1', studentId: 'stu-old', topicId: 'steady-beat',
    title: '稳定拍', statement: '我能跟着拍点走。', createdAt: 100,
  }]))
  const discoveries = loadDiscoveries()
  const [legacy] = discoveries.loadMusicDiscoveries('stu-old')
  assert.equal(legacy.title, '稳定拍')
  assert.equal(legacy.unitId, undefined)
})
```

- [ ] **Step 2: Run the focused tests and verify the new tests fail**

Run: `npm test -- tests/discoveries.test.mjs`

Expected: FAIL on the new fields while the pre-existing tests still pass。

- [ ] **Step 3: Add optional fields and bounded normalization**

扩展 `MusicDiscoveryDraft` 和 `MusicDiscovery` 类型；`createMusicDiscovery()` 对 `evidence`、`concepts` 和 `tags` 使用 `Array.from(new Set(...)).slice(0, 8)`，对字符串字段 trim 后截断：`firstFeeling` 40 字符、`relistenReflection` 160 字符。不得改变现有 `statement` 160 字符限制和旧记录过滤条件。

- [ ] **Step 4: Run all discovery tests**

Run: `npm test -- tests/discoveries.test.mjs`

Expected: PASS。

- [ ] **Step 5: Commit the backward-compatible discovery schema**

```powershell
$ErrorActionPreference = 'Stop'
git add src/state/discoveries.ts tests/discoveries.test.mjs
git commit -m "feat: store evidence in music discoveries"
```

---

### Task 5: 实现探索剧场交互组件与响应式样式

**Files:**

- Create: `src/components/ExplorationTheater.tsx`
- Create: `src/components/explorationTheater.css`
- Create: `tests/explorationTheater.test.mjs`
- Read: `src/music/audioEngine.ts`
- Read: `src/music/explorationAudio.ts`
- Read: `src/music/explorationUnits.ts`
- Read: `src/state/explorationSessions.ts`
- Read: `src/state/discoveries.ts`
- Read: `src/components/MusicExperienceStage.tsx`

**Interfaces:**

```ts
export interface ExplorationTheaterProps {
  unit: ExplorationUnit
  studentId?: string | null
  grade?: PrimaryGrade | null
  onExit?: () => void
  onComplete?: (discovery: MusicDiscovery) => void
}
```

组件必须导出默认 `ExplorationTheater`，不修改现有 `MusicExperienceStage` 的 props 或行为。

- [ ] **Step 1: Write source-contract tests before implementation**

`tests/explorationTheater.test.mjs` 验证以下源码契约：

```js
test('探索剧场呈现六个学习阶段并包含核心追问', () => {
  const source = readSource('src/components/ExplorationTheater.tsx')
  for (const stage of ['listen', 'express', 'evidence', 'concept', 'relisten', 'reflect']) {
    assert.match(source, new RegExp(stage))
  }
  assert.match(source, /你是从音乐的哪里听出来的/)
  assert.match(source, /保存我的音乐发现/)
  assert.match(source, /aria-live="polite"/)
})

test('探索剧场包含试听、确认、再听和无音频降级路径', () => {
  const source = readSource('src/components/ExplorationTheater.tsx')
  assert.match(source, /ensureAudio/)
  assert.match(source, /playNote/)
  assert.match(source, /stopAllAudio/)
  assert.match(source, /audioUnavailable/)
  assert.match(source, /再听一次/)
  assert.match(source, /evidenceId/)
  assert.match(source, /relistenChoice/)
})

test('探索剧场使用观察性反馈而不是统一审美答案', () => {
  const source = readSource('src/components/ExplorationTheater.tsx')
  assert.match(source, /因为/)
  assert.match(source, /再听/)
  assert.doesNotMatch(source, /审美正确|你的感受是错误的/)
})
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- tests/explorationTheater.test.mjs`

Expected: FAIL because the component and stylesheet do not exist yet。

- [ ] **Step 3: Implement the six-stage theater state and audio controls**

组件使用 `loadExplorationSession()` 初始化，找不到会话时用 `createExplorationSession(unit.id, studentId, grade)`；每次选择或阶段变化都调用 `saveExplorationSession()`，匿名会话只更新 React state。

六个场景必须按以下行为实现：

1. `listen`：播放 8—12 个音符的茉莉花片段；首次播放完成后才允许进入下一步；播放中可停止和重听。
2. `express`：选择一项主观感受、一条入口路径和一个表达画面/动作/故事；四条路径都可选，但允许学生选择不同答案；页面显示“没有唯一答案，接下来一起找依据”。
3. `evidence`：试听 `flowing` 与 `jumping` 两个变体，确认后显示基于所选选项的反馈；选错时提示重听差异，不把感受标为错误；至少完成一次证据确认才允许进入下一步。
4. `concept`：根据年级展示对应的一到两张音乐线索卡；先显示“你刚才听到的是……”再给短定义和重听提示；高段额外显示文化信息，文化信息之后必须再次提供回听入口。
5. `relisten`：播放同一片段，选择“保留原感受/增加新线索/改变理解”，并显示“第二次你可能注意到……”的个性化提示；允许学生保留最初感受。
6. `reflect`：展示发现卡预览，包括作品、初始感受、入口路径、音乐证据、音乐词语和二次聆听变化；点击“保存我的音乐发现”调用 `saveMusicDiscovery()`，保存成功后调用 `onComplete`。

播放逻辑必须通过 `ensureAudio()`、已有 `playNote()` 和 `stopAllAudio()`；使用一个播放 token 或 `useRef` 防止快速连续点击导致旧片段覆盖新片段。音频失败时设置 `audioUnavailable`，在 `aria-live="polite"` 区域显示“设备暂时没有发出声音，但仍可以继续选择、比较和保存发现”。

- [ ] **Step 4: Implement accessible and responsive markup**

要求：

- 当前阶段导航使用 `aria-current="step"`，未解锁阶段使用 `disabled`。
- 情绪、路径、证据和回听选项使用按钮，并通过 `aria-pressed` 或 `aria-selected` 暴露选择状态。
- 反馈区域使用 `role="status"` 或 `aria-live="polite"`。
- 颜色不作为唯一信息；每个选项有文字标签。
- 桌面端采用“左侧步骤 + 中央声音互动 + 右侧本次发现”布局；窄屏改为单列，步骤变为可横向滚动或紧凑列表。
- 每个阶段都有“上一步”“继续”或“保存”明确动作；不能依赖自动跳转。

- [ ] **Step 5: Add focused theater styles**

在 `src/components/explorationTheater.css` 中实现 `.exploration-theater` 命名空间，至少包含：阶段进度条、音频播放按钮、路径卡片、证据 A/B 试听卡、线索卡、文化信息卡、发现卡预览、错误/降级反馈和 `@media (max-width: 720px)` 单列布局。不要将旧 `.music-experience-stage` 的样式复制进新文件。

- [ ] **Step 6: Run focused tests and TypeScript check**

Run: `npm test -- tests/explorationTheater.test.mjs`

Expected: PASS。

Run: `npm run build`

Expected: TypeScript and Vite build pass；若出现未使用导入或严格类型错误，在本任务内修复后再次运行。

- [ ] **Step 7: Commit the exploration theater component**

```powershell
$ErrorActionPreference = 'Stop'
git add src/components/ExplorationTheater.tsx src/components/explorationTheater.css tests/explorationTheater.test.mjs
git commit -m "feat: add jasmine exploration theater"
```

---

### Task 6: 接入 LessonMode、应用导航和首页主入口

**Files:**

- Modify: `src/state/appState.tsx`
- Modify: `src/pages/LessonMode.tsx`
- Modify: `src/pages/lesson.css`
- Modify: `src/pages/Home.tsx`
- Modify: `tests/experienceIntegration.test.mjs`
- Modify: `tests/curriculumUi.test.mjs`
- Read: `src/pages/CourseCenter.tsx`
- Read: `src/pages/AdventureMap.tsx`

**Interfaces:**

- `AppState` 增加 `explorationUnitId: string | null`。
- `AppState` 增加 `openExploration: (unitId?: string, options?: RouteNavigationOptions) => void`。
- `openExploration()` 默认使用 `jasmine`，设置探索焦点后导航到 `lesson`，并关闭窄屏侧栏。
- `LessonMode` 读取 `explorationUnitId`，调用 `getExplorationUnit()` 并传递当前学生、年级和完成回调给 `ExplorationTheater`。

- [ ] **Step 1: Add failing integration assertions**

在 `tests/experienceIntegration.test.mjs` 增加：

```js
test('LessonMode 以探索剧场承载茉莉花试点并保留支持入口', () => {
  const lesson = readSource('src/pages/LessonMode.tsx')
  assert.match(lesson, /ExplorationTheater/)
  assert.match(lesson, /getExplorationUnit/)
  assert.match(lesson, /jasmine/)
  assert.match(lesson, /我的音乐发现|音乐证据/)
  assert.match(lesson, /navigate\('training'\)|navigate\('theory'\)|navigate\('course'\)/)
})

test('首页主探索动作进入探索剧场而不是直接打开理论目录', () => {
  const home = readSource('src/pages/Home.tsx')
  assert.match(home, /openExploration/)
  assert.match(home, /今日探索/)
})

test('旧音乐探险舞台和训练中心入口仍然保留', () => {
  const training = readSource('src/pages/TrainingCenter.tsx')
  assert.match(training, /MusicExperienceStage/)
  assert.match(training, /game-ear/)
  assert.match(training, /game-taiko/)
})
```

如 `tests/curriculumUi.test.mjs` 目前检查 `LessonMode` 的旧理论课时结构，将断言迁移为：文件存在 `ExplorationTheater`、当前年级提示、`今日探索` 或 `探索剧场` 文案，并保留课程/训练/线索库支持入口断言。

- [ ] **Step 2: Run integration tests and verify the new assertions fail**

Run: `npm test -- tests/experienceIntegration.test.mjs tests/curriculumUi.test.mjs`

Expected: 新增探索剧场断言 FAIL，现有旧功能断言保持通过。

- [ ] **Step 3: Add `openExploration()` to app state**

在 `src/state/appState.tsx`：

1. 在 `AppState` 接口和 Provider 状态中增加 `explorationUnitId`。
2. 实现：

```ts
const openExploration = useCallback(
  (unitId = 'jasmine', options?: RouteNavigationOptions) => {
    setExplorationUnitId(unitId)
    setNavigation((current) => applyRouteNavigation(current, 'lesson', options))
    setNavDirection('forward')
    setSidebarOpen(false)
  },
[])
```

3. 离开 `lesson` 时清理探索焦点；如果没有焦点，`LessonMode` 仍默认加载 `jasmine`。
4. 把 `openExploration` 和 `explorationUnitId` 加入 memoized context value 及依赖数组。

- [ ] **Step 4: Replace LessonMode's main planner with the exploration theater**

重写 `src/pages/LessonMode.tsx` 的主渲染和不再需要的理论课时本地状态。保留页面外层 `lesson-page`，改为：

- 页面头部：`音乐探索剧场`、当前年级、当前学生或投屏模式说明。
- 主体：`<ExplorationTheater unit={unit} studentId={currentStudentId} grade={effectiveGrade} onExit={() => navigate('home')} />`。
- 底部教师支持条：按钮分别前往 `course`、`training`、`theory`，文案为“换一首作品”“去听觉实验室”“查看音乐线索”。
- `onComplete` 仅用于在页面内显示“这张发现卡已经保存”的状态，不重复保存。

不要删除 `TrainingCenter` 的旧体验舞台，不要让 `LessonMode` 再默认显示大段理论概念或连续知识测验。

- [ ] **Step 5: Wire Home's main exploration actions**

在 `Home.tsx` 从 `useApp()` 读取 `openExploration`，把以下动作改为 `openExploration('jasmine')`：

- Hero 主按钮“开始今日探索/继续今日探索”。
- 推荐探索卡的主按钮“开始探索”。
- “今日音乐探险”中的三个旧入口按钮至少将主推荐卡指向探索剧场；旧训练入口仍可从教师支持条和挑战中心进入。

首页文案改为围绕“听见、找到依据、再听一次”，不在首屏把理论目录作为主动作。已有理论推荐和复习功能继续显示为次级入口，不删除其数据逻辑。

- [ ] **Step 6: Update lesson page styles and run tests**

在 `src/pages/lesson.css` 增加探索剧场外层和教师支持条样式，移除或保留旧样式均以不影响 `CourseCenter` 的 `.lesson-*` 样式为前提；新组件样式只放在 `explorationTheater.css`。

Run: `npm test -- tests/experienceIntegration.test.mjs tests/curriculumUi.test.mjs tests/homeSimplification.test.mjs`

Expected: PASS。

Run: `npm run build`

Expected: PASS。

- [ ] **Step 7: Commit the navigation integration**

```powershell
$ErrorActionPreference = 'Stop'
git add src/state/appState.tsx src/pages/LessonMode.tsx src/pages/lesson.css src/pages/Home.tsx tests/experienceIntegration.test.mjs tests/curriculumUi.test.mjs
git commit -m "feat: make exploration theater the lesson entry"
```

---

### Task 7: 完成发现卡回看入口与数据展示兼容

**Files:**

- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/AdventureMap.tsx`
- Modify: `tests/discoveries.test.mjs`
- Modify: `tests/experienceIntegration.test.mjs`
- Read: `src/state/discoveries.ts`
- Read: `src/state/reviewDeepLink.ts`

**Interfaces:**

- 新发现卡的 `unitId === 'jasmine'` 点击后调用 `openExploration('jasmine')`，而非把探索发现错误地送回纯理论目录。
- 旧发现卡无 `unitId` 时继续使用原有 `openTheory()` 回看路径。
- `AdventureMap` 在首阶段至少能显示“我的发现”入口和已保存发现数量，不要求本任务重做完整发现地图。

- [ ] **Step 1: Write failing source assertions**

```js
test('茉莉花发现卡回到探索剧场，旧发现卡保持理论回看兼容', () => {
  const home = readSource('src/pages/Home.tsx')
  assert.match(home, /discoverySummary\.latest\[0\]\.unitId/)
  assert.match(home, /openExploration\('jasmine'\)/)
  assert.match(home, /openTheory\(/)
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- tests/experienceIntegration.test.mjs`

Expected: FAIL on the new discovery-routing assertion。

- [ ] **Step 3: Implement conditional discovery routing**

`Home.tsx` 的最新发现卡按钮使用：

```tsx
onClick={() =>
  discoverySummary.latest[0].unitId === 'jasmine'
    ? openExploration('jasmine')
    : openTheory({ topicId: discoverySummary.latest[0].topicId })
}
```

在 `AdventureMap.tsx` 增加一个简短“我的发现”卡片：显示当前学生最新一条记录和“再听一次”按钮；同样按照 `unitId` 选择 `openExploration` 或旧 `openTheory`。如果没有发现，显示“完成一次探索后，这里会出现你的音乐证据”。

- [ ] **Step 4: Run discovery and integration tests**

Run: `npm test -- tests/discoveries.test.mjs tests/experienceIntegration.test.mjs`

Expected: PASS。

- [ ] **Step 5: Commit discovery replay routing**

```powershell
$ErrorActionPreference = 'Stop'
git add src/pages/Home.tsx src/pages/AdventureMap.tsx tests/discoveries.test.mjs tests/experienceIntegration.test.mjs
git commit -m "feat: replay exploration discoveries"
```

---

### Task 8: 全量验证、浏览器验收与交付记录

**Files:**

- Modify: `README.md` only if the quick-start or feature list now materially misstates the first-stage entry.
- Read: `docs/superpowers/specs/2026-09-05-music-exploration-theater-redesign.md`
- Read: `docs/superpowers/plans/2026-09-05-music-exploration-theater-phase-one.md`

- [ ] **Step 1: Run all automated checks**

Run in PowerShell:

```powershell
$ErrorActionPreference = 'Stop'
npm test
npm run lint
npm run format:check
npm run build
```

Expected: all commands exit with code 0；测试输出包含探索单元、音频片段、会话、发现卡和集成测试通过。

- [ ] **Step 2: Start the local app for browser verification**

Run in a dedicated PowerShell process:

```powershell
$ErrorActionPreference = 'Stop'
npm run dev -- --host 127.0.0.1
```

Use the browser tool to open the printed local URL. Do not use a production or remote URL for this verification。

- [ ] **Step 3: Verify the desktop flow visibly**

Perform and verify each action：

1. Open the home page and confirm the primary copy asks the student to start a music exploration。
2. Click “开始今日探索” or “开始探索”。
3. Confirm `LessonMode` shows “音乐探索剧场” and the jasmine question。
4. Click play, confirm the listen state changes, then continue。
5. Select a feeling, path and expression; confirm the chosen cards expose selected state。
6. Preview both evidence variants; confirm only the explicit confirmation advances the flow。
7. Confirm the concept card appears after evidence and contains a replay action。
8. Replay, choose a second-listen reflection, save the discovery, and confirm the success feedback。
9. Return home, confirm the latest discovery card appears。
10. Click the discovery card and confirm it returns to the jasmine exploration theater。

- [ ] **Step 4: Verify the responsive and degraded paths**

Set a narrow viewport and verify：

- No horizontal overflow blocks the primary controls。
- Stage navigation remains reachable。
- Path and evidence cards stack into one column。
- The reflection card can be saved without scrolling a button outside the viewport。

If the browser audio context is unavailable, verify the UI shows the non-blocking degradation message and still allows evidence selection and saving。

- [ ] **Step 5: Run a final source-contract scan**

Run:

```powershell
$ErrorActionPreference = 'Stop'
rg -n "未完成|待补充|临时实现" src tests
```

Expected: no new incomplete markers in the implementation or tests。

- [ ] **Step 6: Record the verification result**

In the final response report the exact commands run, whether browser verification passed, and any known limitation such as synthesized audio replacing a recorded source. Do not claim completion before all required commands have returned success。

---

## Plan self-review

### Spec coverage

- 产品定位和“听见—感受—证据—再听—总结”：Tasks 1, 3, 5, 6。
- 四条路径及“你是从音乐的哪里听出来的”：Tasks 1 and 5。
- 1—2、3—4、5—6 年级适配：Tasks 1 and 5。
- 《茉莉花》试点内容：Tasks 1, 2, 5。
- 乐理知识后置为音乐线索卡：Tasks 1 and 5。
- 二次聆听与发现卡：Tasks 3, 4, 5, 7。
- 旧数据、单文件和离线兼容：Tasks 2, 3, 4, 6, 8。
- Home / LessonMode / 探索舞台迁移：Task 6。
- 旧训练和理论入口保留：Tasks 6 and 7。
- 自动化测试、构建、lint、格式检查和浏览器验收：Task 8。

### Scope decision

本计划只覆盖一个相互依赖的第一阶段子项目：新内容模型、会话、发现记录、探索舞台和两个入口接入。`CourseCenter` 全量作品地图、`Theory` 全量线索卡迁移、教师看板和更多作品属于后续独立阶段，不在本计划中实现。

### Consistency check

- `ExplorationPath` 由 `src/music/explorationUnits.ts` 定义，`discoveries.ts` 只引用该类型。
- `ExplorationStageId` 由内容模型定义，`explorationSessions.ts` 使用同一类型；阶段顺序只在会话模块维护。
- `openExploration()` 的单元 id 与 `getExplorationUnit()` 对齐，默认值均为 `jasmine`。
- `MusicDiscovery.unitId` 与 Home / AdventureMap 的条件路由对齐；旧记录缺少该字段时走原有理论回看。
- 音频数据模块只返回纯数据，组件负责音频副作用，避免测试和音频上下文耦合。
- 新组件使用独立 CSS 命名空间，旧 `MusicExperienceStage` 的现有测试和入口不需要改变。

---

## Execution handoff

计划完成后，使用以下任一方式执行：

1. **Subagent-Driven（推荐）**：按任务逐个派发新代理，每个任务完成后做两阶段 review。
2. **Inline Execution**：在当前会话使用 `superpowers:executing-plans`，按任务批次执行并在每个检查点暂停复核。
