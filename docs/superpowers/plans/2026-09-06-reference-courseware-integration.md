# 人音版一至三年级上册互动课件融合实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. The user explicitly要求在当前会话内执行，不使用子代理。Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `E:\人音版小学音乐\软件` 中一至三年级上册的知识点、互动玩法、视觉资源和动画体验，融合为当前软件中的桌面端音乐欣赏与探索课程系统。

**Architecture:** 保留当前路由、阶段一至四功能、localStorage 兼容边界和已确认的桌面布局。新增一个数据驱动的参考课件领域层，使用统一的“情境—试听—感知—操作—反馈—总结—创编”学习旅程驱动可复用互动组件；参考 HTML/JS 只用于提取玩法，音频和图片只迁移被活动清单引用的资源。

**Tech Stack:** React 18、TypeScript、Vite、Tone.js/Web Audio、CSS、Node test runner、ESLint、Prettier、PowerShell 资源索引脚本。

**Spec:** `docs/superpowers/specs/2026-09-06-reference-courseware-integration-design.md`

## Global Constraints

- 只修改电脑端，不新增手机和平板布局规则。
- 保留今日探索两页、探索馆左侧筛选/右侧内容、互动课堂 1—6 直接切换、标题栏作品选择和作品/素材合并布局。
- 保留阶段一至四已有入口、数据、进度和互动逻辑；新内容通过兼容入口接入。
- 不新增第三方依赖，不整体复制 `E:\人音版小学音乐\软件` 的约 1.36GB 原始资料。
- 不把人音版参考内容标记为浙江教材原有内容；每项内容都必须带来源和年级映射。
- 不引入新的不可迁移持久化 schema；活动完成结果优先复用 `recordResult`，音乐发现复用 `MusicDiscovery`/`toolNotes`。
- 音频不可用时仍可完成选择、观察和保存；所有音频文案必须说明是示例或合成声音时，不能伪称真实录音。
- 每个任务先补定向测试，再实现最小变化，再运行定向测试、Lint 和 Build；任务完成后提交独立 commit。
- 当前未跟踪的 `旧版本/` 不纳入任何任务，不删除、不移动、不格式化。

## Roadmap

| 阶段 | 交付物 | 验收门 |
| --- | --- | --- |
| 阶段 0 | 参考目录索引、去重清单、知识点矩阵、玩法拆解 | 可以按年级/单元/活动找到来源和资源，不复制原始目录 |
| 阶段 1 | 统一数据模型、学习旅程、反馈、活动进度和通用活动容器 | 一个空活动和一个示例活动可完整走通并保存 |
| 阶段 2 | 一年级上册完整内容与森林/乐器/长短/强弱/节拍活动 | 一年级样板通过桌面体验验收 |
| 阶段 3 | 二年级上册唱名、时值、音色、节拍创编、多声部 | 二年级知识点全部有互动映射 |
| 阶段 4 | 三年级上册情绪、力度、演唱形式、声部、听音记谱 | 三年级知识点全部有互动映射 |
| 阶段 5 | 资源按需加载、导航整合、动画统一、全量回归 | 测试、Lint、Build 和桌面流程均通过 |

---

### Task 1: 建立参考课件索引和内容迁移台账

**Files:**

- Create: `scripts/reference-courseware-inventory.mjs`
- Create: `docs/reference-courseware/README.md`
- Create: `docs/reference-courseware/content-matrix.md`
- Create: `docs/reference-courseware/asset-manifest.json`
- Create: `tests/referenceCoursewareInventory.test.mjs`

**Interfaces:**

- Produces: `classifyReferenceFile(path)`, `buildReferenceInventory(entries)` 和可重复生成的资源清单。
- Consumes: `E:\人音版小学音乐\软件\一上`、`二上`、`三上`，只读扫描，不修改源目录。

- [ ] **Step 1: 写失败测试。**

为索引逻辑建立内存 fixture，覆盖目录名识别、扩展名分类、`__MACOSX`/备份排除、重复哈希归并和未知文件保留为待审条目：

```js
test('索引排除元数据和备份，并按哈希归并重复资源', () => {
  const entries = buildReferenceInventory([
    { path: '一上/森林/乐器.mp3', bytes: 'a', size: 10 },
    { path: '一上/备份/乐器.mp3', bytes: 'a', size: 10 },
    { path: '一上/__MACOSX/._乐器.mp3', bytes: 'b', size: 3 },
  ])
  assert.equal(entries.filter((item) => item.status === 'selected').length, 1)
  assert.equal(entries.filter((item) => item.status === 'excluded').length, 2)
})
```

- [ ] **Step 2: 运行定向测试确认失败。**

Run: `npm test -- tests/referenceCoursewareInventory.test.mjs`

Expected: FAIL because the inventory helpers do not exist。

- [ ] **Step 3: 实现索引脚本和台账格式。**

脚本读取命令行参数 `--root E:\人音版小学音乐\软件 --out docs\reference-courseware`，按相对路径生成以下字段：`grade`、`semester`、`relativePath`、`extension`、`kind`、`size`、`sha256`、`status`、`duplicateOf`、`candidateUses`。文件类型使用 `audio`、`image`、`video`、`html`、`script`、`style`、`document`、`unknown`；排除路径包含 `__MACOSX`、`.DS_Store`、`backup`、`备份`、`副本` 的条目。脚本不存在源目录时退出并显示明确错误，不创建空台账。

运行命令：

```powershell
$ErrorActionPreference = 'Stop'
node scripts/reference-courseware-inventory.mjs --root 'E:\人音版小学音乐\软件' --out 'docs\reference-courseware'
```

同时把已识别的一至三年级知识点按“年级—主题—知识点—互动玩法—资源候选—当前入口—状态”写入 `content-matrix.md`，不把无法确认教材单元的条目标记为浙江教材同步。

- [ ] **Step 4: 运行测试并核对生成物。**

Run: `npm test -- tests/referenceCoursewareInventory.test.mjs`

Expected: PASS；`asset-manifest.json` 可以重复生成且排序稳定，`content-matrix.md` 包含一年级的歌唱姿势、节奏、强弱、拍子、长短、高低、乐器和复习，二年级的唱名/音符/乐器/节拍/多声部，三年级的情绪/力度/演唱形式/声部/听音记谱/伴奏和复习。

- [ ] **Step 5: 提交阶段 0 台账。**

```powershell
git add scripts/reference-courseware-inventory.mjs docs/reference-courseware tests/referenceCoursewareInventory.test.mjs
git commit -m "docs: index reference courseware assets"
```

### Task 2: 建立统一知识点、活动和资源数据模型

**Files:**

- Create: `src/music/referenceCourseware.ts`
- Create: `src/music/referenceActivityCatalog.ts`
- Create: `tests/referenceCourseware.test.mjs`
- Modify: `src/music/zhejiangCurriculum.ts` only if a type import is required; do not alter existing unit seeds

**Interfaces:**

```ts
export type ReferenceCourseSource = 'zhejiang' | 'renyin-reference' | 'original'
export type JourneyStepId = 'hook' | 'listen' | 'feel' | 'notice' | 'try' | 'explain' | 'create' | 'reflect'
export type ReferenceActivityKind =
  | 'listen-and-choose'
  | 'instrument-detective'
  | 'long-short-sort'
  | 'rhythm-tap'
  | 'rhythm-builder'
  | 'meter-movement'
  | 'note-ladder'
  | 'voice-form-guess'
  | 'layered-listening'
  | 'sound-dictation'
  | 'review-quest'

export interface ReferenceKnowledgePoint {
  id: string
  grade: 1 | 2 | 3
  semester: 1
  source: ReferenceCourseSource
  unitLabel: string
  title: string
  shortPrompt: string
  concepts: string[]
  activityIds: string[]
}

export interface ReferenceActivity {
  id: string
  kind: ReferenceActivityKind
  knowledgePointId: string
  title: string
  prompt: string
  steps: JourneyStepId[]
  audioIds: string[]
  assetIds: string[]
  feedback: { correct: string; retry: string; complete: string }
  summary: string
}
```

- [ ] **Step 1: 写失败测试。**

测试 `getReferenceKnowledgePoints({ grade, source, search })` 的年级、来源和关键词筛选；测试每个活动引用存在的知识点、至少包含 `listen`、`try`、`reflect`，并拒绝空的反馈文案。

- [ ] **Step 2: 运行定向测试确认失败。**

Run: `npm test -- tests/referenceCourseware.test.mjs`

Expected: FAIL because the new registry and validation helpers do not exist。

- [ ] **Step 3: 实现模型和注册表。**

将“人音版参考”和“浙江课程”分开，先登记全部一至三年级知识点的稳定 ID；活动先登记活动 ID、类型、短提示、步骤和反馈，不把页面 JSX 写进数据文件。导出 `REFERENCE_KNOWLEDGE_POINTS`、`REFERENCE_ACTIVITIES`、`getReferenceKnowledgePoints()`、`getReferenceActivities()` 和 `validateReferenceCatalog()`。

- [ ] **Step 4: 运行测试和构建。**

Run: `npm test -- tests/referenceCourseware.test.mjs`; `npm run build`

Expected: PASS；旧的 `zhejiangCurriculum`、`theoryCatalog` 测试不受影响。

- [ ] **Step 5: 提交数据模型。**

```powershell
git add src/music/referenceCourseware.ts src/music/referenceActivityCatalog.ts tests/referenceCourseware.test.mjs
git commit -m "feat: add reference courseware data model"
```

### Task 3: 实现统一学习旅程和反馈进度边界

**Files:**

- Create: `src/music/learningJourney.ts`
- Create: `src/components/LearningJourney.tsx`
- Create: `src/components/learningJourney.css`
- Create: `tests/learningJourney.test.mjs`
- Modify: `src/state/progress.ts` only to use existing `recordResult` for reference activity IDs; do not change persisted field names

**Interfaces:**

```ts
export interface JourneyState {
  activityId: string
  stepIndex: number
  completedStepIds: JourneyStepId[]
  heardAudioIds: string[]
  selectedEvidence: string[]
  attempts: number
  status: 'active' | 'complete'
}

export function createJourneyState(activity: ReferenceActivity): JourneyState
export function completeJourneyStep(state: JourneyState, step: JourneyStepId): JourneyState
export function submitJourney(state: JourneyState, activity: ReferenceActivity): {
  next: JourneyState
  stars: number
  score: number
}
```

- [ ] **Step 1: 写状态转换失败测试。**

覆盖初始状态、重复完成步骤不重复计数、跳过试听不能直接完成、重试增加 attempts、完成后计算 1—3 星，并验证音频不可用时 `heardAudioIds` 不会阻塞保存观察。

- [ ] **Step 2: 运行定向测试确认失败。**

Run: `npm test -- tests/learningJourney.test.mjs`

Expected: FAIL because the state transition functions do not exist。

- [ ] **Step 3: 实现纯状态机。**

步骤推进只允许活动定义中的顺序；`reflect` 完成后才能提交。`submitJourney` 用已完成步骤、尝试次数和是否执行创编计算星级，不根据学生的情绪或主观选择判错。组件接收 `activity`、`onComplete`、`onReturn`，只负责流程外壳，不在其中写年级知识点。

- [ ] **Step 4: 接入已有进度保存。**

完成时调用：

```ts
recordResult(`reference-activity:${activity.id}`, 1, result.stars, result.score)
```

这样复用当前学生隔离、匿名范围、徽章和旧进度迁移逻辑；探索总结继续调用 `saveMusicDiscovery()`。

- [ ] **Step 5: 运行定向测试、Lint 和 Build。**

Run: `npm test -- tests/learningJourney.test.mjs tests/progress.test.mjs`; `npm run lint`; `npm run build`

Expected: PASS。

- [ ] **Step 6: 提交旅程基础。**

```powershell
git add src/music/learningJourney.ts src/components/LearningJourney.tsx src/components/learningJourney.css tests/learningJourney.test.mjs
git commit -m "feat: add guided music learning journey"
```

### Task 4: 实现可复用的听辨、动作、创编和复习活动

**Files:**

- Create: `src/components/reference/ReferenceActivityStage.tsx`
- Create: `src/components/reference/ListenChoiceActivity.tsx`
- Create: `src/components/reference/InstrumentDetectiveActivity.tsx`
- Create: `src/components/reference/RhythmBuilderActivity.tsx`
- Create: `src/components/reference/MovementActivity.tsx`
- Create: `src/components/reference/ReviewQuestActivity.tsx`
- Create: `src/components/reference/referenceActivities.css`
- Create: `tests/referenceActivityComponents.test.mjs`

**Interfaces:**

```ts
export interface ReferenceActivityStageProps {
  activity: ReferenceActivity
  onEvidence: (value: string) => void
  onStepComplete: (step: JourneyStepId) => void
  onObservation: (value: string) => void
  audioUnavailable?: boolean
}
```

- [ ] **Step 1: 写组件契约测试。**

测试组件源码契约和可访问性：听辨活动必须有重播、候选试听、`aria-live`；乐器活动必须显示“示例声音”而不是“真实录音”；节奏活动必须支持点击和不重复的 Space；动作活动必须提供情绪/力度/拍子动作选项；复习活动必须显示星级和总结。

- [ ] **Step 2: 运行定向测试确认失败。**

Run: `npm test -- tests/referenceActivityComponents.test.mjs`

Expected: FAIL because the activity components do not exist。

- [ ] **Step 3: 实现通用活动渲染器。**

`ReferenceActivityStage` 按 `activity.kind` 选择子组件；子组件只回传证据和完成事件，不直接写 localStorage。播放统一调用 `ensureAudio`、`playNote` 或已有探索音频入口；异常时显示“设备暂时没有发出声音，但仍可以继续观察和保存”。

- [ ] **Step 4: 实现桌面视觉。**

复用参考课件的地图、角色对话、星级、音符飘动、节奏卡翻转、金蛋和庆祝粒子等视觉意图，但使用当前 CSS/React 状态实现。基础布局使用主舞台、操作区和反馈侧栏，不新增移动端媒体查询。

- [ ] **Step 5: 运行定向测试、Lint 和 Build。**

Run: `npm test -- tests/referenceActivityComponents.test.mjs`; `npm run lint`; `npm run build`

Expected: PASS。

- [ ] **Step 6: 提交活动容器。**

```powershell
git add src/components/reference tests/referenceActivityComponents.test.mjs
git commit -m "feat: add reusable reference music activities"
```

### Task 5: 完成一年级上册内容和第一个完整样板

**Files:**

- Create: `src/music/referenceLessons/gradeOneUpper.ts`
- Create: `src/components/reference/GradeOneForestQuest.tsx`
- Create: `tests/referenceGradeOne.test.mjs`
- Modify: `src/music/referenceCourseware.ts`
- Modify: `src/music/referenceActivityCatalog.ts`

**Interfaces:**

- Produces: 一年级上册全部知识点和活动定义，包含 `posture`、`x-xx-rhythm`、`dynamics`、`meter-2-3`、`duration`、`pitch`、`clappers`、`woodblock`、`bell`、`labor-rhythm`、`gong-drum-cymbal`、`concert-review` 对应的稳定 ID。
- Consumes: Task 2 的数据模型、Task 4 的活动组件和 Task 1 的资源候选 ID。

- [ ] **Step 1: 写内容完整性测试。**

测试一年级知识点 ID 全部存在、每个 ID 至少关联一个活动；测试活动步骤包含试听、操作和总结；测试森林关卡按序章、1—5 关、终章提供地图状态和星级输出。

- [ ] **Step 2: 运行测试确认失败。**

Run: `npm test -- tests/referenceGradeOne.test.mjs`

Expected: FAIL because the grade-one registry is incomplete。

- [ ] **Step 3: 登记一年级内容和参考玩法。**

将森林地图、角色对话、乐器听辨、节奏卡匹配、长短音、节奏创编、通关庆祝转为活动数据和 `GradeOneForestQuest` 编排器。知识卡每次只显示一个概念，复习活动把歌唱姿势、声音四要素和乐器名称作为简短回顾。

- [ ] **Step 4: 绑定清洗后的资源。**

只引用 `asset-manifest.json` 中 `status=selected` 的资源；资源缺失时使用现有合成音色、CSS/SVG 背景和文字降级，不在组件中硬编码 E 盘路径。

- [ ] **Step 5: 运行一年级测试、全量测试、Lint 和 Build。**

Run: `npm test -- tests/referenceGradeOne.test.mjs tests/referenceCourseware.test.mjs tests/learningJourney.test.mjs`; `npm run lint`; `npm run build`

Expected: PASS。

- [ ] **Step 6: 提交一年级样板。**

```powershell
git add src/music/referenceLessons/gradeOneUpper.ts src/components/reference/GradeOneForestQuest.tsx src/music/referenceCourseware.ts src/music/referenceActivityCatalog.ts tests/referenceGradeOne.test.mjs
git commit -m "feat: add grade one reference exploration"
```

### Task 6: 接入探索馆、互动课堂、今日探索和玩乐中心

**Files:**

- Modify: `src/pages/Theory.tsx`
- Modify: `src/pages/LessonMode.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/TrainingCenter.tsx`
- Modify: `src/components/ExplorationTheater.tsx`
- Modify: `src/music/explorationUnits.ts`
- Modify: `tests/curriculumUi.test.mjs`
- Modify: `tests/experienceIntegration.test.mjs`
- Modify: `tests/explorationTheater.test.mjs`

**Interfaces:**

- 探索馆使用 `getReferenceKnowledgePoints()` 的教材来源和知识点下拉筛选，右侧打开 `LearningJourney`。
- 互动课堂保留 `EXPLORATION_UNITS` 和作品下拉，增加参考活动入口，不删除原有茉莉花和阶段一至四流程。
- 今日探索保留两页结构，第二页可打开当天参考活动；首页其它区块和现有进度卡不改变。
- 玩乐中心显示一年级小游戏入口，原有 `MusicExperienceStage`、听觉实验室和 legacy games 继续存在。

- [ ] **Step 1: 写布局和入口回归测试。**

新增断言：`Theory.tsx` 有教材来源/知识点下拉；`LessonMode.tsx` 有标题栏作品选择和参考活动入口；`Home.tsx` 保留两页而不是四页；`TrainingCenter.tsx` 保留旧活动；`ExplorationTheater.tsx` 允许阶段 1—6 直接切换。

- [ ] **Step 2: 运行定向测试确认失败或建立缺口清单。**

Run: `npm test -- tests/curriculumUi.test.mjs tests/experienceIntegration.test.mjs tests/explorationTheater.test.mjs`

Expected: 只允许新增参考入口相关断言失败；已有阶段功能测试不得被删除或静默跳过。

- [ ] **Step 3: 接入筛选和活动入口。**

通过 `referenceSource`、`referenceGrade`、`referenceKnowledgePointId` 页面状态驱动右侧内容；无匹配内容显示可理解的空状态。入口跳转使用现有 `openExploration`/`navigate`，不新增路由枚举。

- [ ] **Step 4: 接入一年级样板。**

从探索馆、互动课堂和玩乐中心分别打开同一个稳定 activity ID，完成后统一调用 `recordResult` 并更新发现卡预览；刷新页面后能够重新加载进度，不要求从首页重新开始。

- [ ] **Step 5: 运行定向测试、Lint 和 Build。**

Run: `npm test -- tests/curriculumUi.test.mjs tests/experienceIntegration.test.mjs tests/explorationTheater.test.mjs`; `npm run lint`; `npm run build`

Expected: PASS；旧页面入口和阶段一至四测试保持绿色。

- [ ] **Step 6: 提交一年级桌面整合。**

```powershell
git add src/pages/Theory.tsx src/pages/LessonMode.tsx src/pages/Home.tsx src/pages/TrainingCenter.tsx src/components/ExplorationTheater.tsx src/music/explorationUnits.ts tests/curriculumUi.test.mjs tests/experienceIntegration.test.mjs tests/explorationTheater.test.mjs
git commit -m "feat: connect grade one exploration to desktop learning flows"
```

### Task 7: 完成二年级上册内容

**Files:**

- Create: `src/music/referenceLessons/gradeTwoUpper.ts`
- Create: `tests/referenceGradeTwo.test.mjs`
- Modify: `src/music/referenceActivityCatalog.ts`
- Modify: `src/components/reference/ReferenceActivityStage.tsx`

**Interfaces:**

- Produces: `do-mi-sol`、`135-polyphony`、`fast-rhythm`、`solfege-listen`、`135-hearing`、`meter-creation`、`note-values-2-4-8-16`、`violin-piano-flute`、`fa-si-high-do`、`meter-2-3`、`percussion-family`、`grade-two-review`。
- Reuses: `note-ladder`、`rhythm-builder`、`instrument-detective`、`layered-listening`、`review-quest`。

- [ ] **Step 1: 写二年级知识点覆盖测试。**

逐项断言知识点、活动引用、试听和反馈；音符时值活动必须区分二分、四分、八分和十六分，不能只用一个“节奏”标签代替。

- [ ] **Step 2: 运行测试确认缺口。**

Run: `npm test -- tests/referenceGradeTwo.test.mjs`

Expected: FAIL until the complete registry is added。

- [ ] **Step 3: 实现二年级内容。**

把 `do/mi/sol` 和 `fa/si/高音 do` 放入音高阶梯与听辨；把 135 多声部做成可开关的声部层；把四种时值做成可拖拽节奏卡；小提琴、钢琴、笛子使用音色样本比较，明确文化或演奏方式线索；打击乐器提供分类和再次试听。

- [ ] **Step 4: 运行二年级测试、全量测试、Lint 和 Build。**

Run: `npm test -- tests/referenceGradeTwo.test.mjs tests/referenceCourseware.test.mjs`; `npm run lint`; `npm run build`

Expected: PASS。

- [ ] **Step 5: 提交二年级内容。**

```powershell
git add src/music/referenceLessons/gradeTwoUpper.ts src/music/referenceActivityCatalog.ts src/components/reference/ReferenceActivityStage.tsx tests/referenceGradeTwo.test.mjs
git commit -m "feat: add grade two reference exploration"
```

### Task 8: 完成三年级上册内容

**Files:**

- Create: `src/music/referenceLessons/gradeThreeUpper.ts`
- Create: `tests/referenceGradeThree.test.mjs`
- Modify: `src/components/reference/ReferenceActivityStage.tsx`
- Modify: `src/music/referenceActivityCatalog.ts`

**Interfaces:**

- Produces: `solfege-note-names`、`dynamics-marks`、`music-emotion`、`low-567-high-1`、`labor-chant`、`sound-dictation`、`ostinato-accompaniment`、`voice-ranges`、`two-part`、`unison-chorus-round`、`polyphony`、`crescendo-diminuendo`、`grade-three-review`。
- Reuses: `listen-and-choose`、`meter-movement`、`voice-form-guess`、`layered-listening`、`sound-dictation`、`review-quest`。

- [ ] **Step 1: 写三年级知识点覆盖测试。**

测试情绪活动允许主观选择并要求学生选择听觉依据；演唱形式活动至少包含齐唱、合唱、轮唱；声部活动可以单独试听和叠加；力度活动包含强、弱、渐强、渐弱；听音记谱和固定节奏伴奏都有试听后操作。

- [ ] **Step 2: 运行测试确认缺口。**

Run: `npm test -- tests/referenceGradeThree.test.mjs`

Expected: FAIL until the complete registry is added。

- [ ] **Step 3: 实现三年级内容。**

把情绪、动作、劳动场景和文化故事作为活动线索；把男高、男低、女高、女中、童声标记为听辨线索，不要求学生只依赖文字记忆；渐强/渐弱用音量轨迹和再次试听表现；多声部使用可视化层叠和关闭/打开声部；总结卡同时显示主观感受和听觉证据。

- [ ] **Step 4: 运行三年级测试、全量测试、Lint 和 Build。**

Run: `npm test -- tests/referenceGradeThree.test.mjs tests/referenceGradeOne.test.mjs tests/referenceGradeTwo.test.mjs`; `npm run lint`; `npm run build`

Expected: PASS。

- [ ] **Step 5: 提交三年级内容。**

```powershell
git add src/music/referenceLessons/gradeThreeUpper.ts src/music/referenceActivityCatalog.ts src/components/reference/ReferenceActivityStage.tsx tests/referenceGradeThree.test.mjs
git commit -m "feat: add grade three reference exploration"
```

### Task 9: 资源按需加载和参考视觉统一

**Files:**

- Create: `src/music/referenceAssets.ts`
- Create: `src/components/reference/referenceAnimations.css`
- Create: `tests/referenceAssets.test.mjs`
- Add: `public/reference-courseware/` only for selected, deduplicated assets referenced by the manifest
- Modify: `src/components/learningJourney.css`
- Modify: `src/components/reference/referenceActivities.css`

**Interfaces:**

```ts
export interface ReferenceAsset {
  id: string
  kind: 'audio' | 'image' | 'video'
  src: string
  alt?: string
  preload: 'none' | 'metadata'
  source: ReferenceCourseSource
}

export function getReferenceAsset(id: string): ReferenceAsset | undefined
export function getActivityAssets(activityId: string): ReferenceAsset[]
```

- [ ] **Step 1: 写资源访问测试。**

测试活动只能取得清单内资源、路径为项目相对路径、默认 `preload='none'`，缺失资源返回 `undefined` 而不是抛出异常。

- [ ] **Step 2: 运行测试确认失败。**

Run: `npm test -- tests/referenceAssets.test.mjs`

Expected: FAIL because the asset registry does not exist。

- [ ] **Step 3: 生成项目资源映射。**

从 Task 1 的 manifest 选出一年级样板实际引用的音频、角色、背景和图标，复制到 `public/reference-courseware/g1/s1/`；二、三年级在对应阶段再加入。所有复制动作必须使用明确文件列表，禁止把 E 盘目录作为 glob 直接复制。

- [ ] **Step 4: 实现动画和加载状态。**

加入地图解锁、角色对话、音符浮动、节奏卡翻转、乐器发光、金蛋开启和庆祝粒子等桌面动画；为音频和图片提供加载中、不可用和再次尝试状态；不新增移动端媒体查询。

- [ ] **Step 5: 运行资源测试、Lint 和 Build。**

Run: `npm test -- tests/referenceAssets.test.mjs`; `npm run lint`; `npm run build`

Expected: PASS，构建产物不包含未引用的参考目录大文件。

- [ ] **Step 6: 提交资源和动画。**

```powershell
git add src/music/referenceAssets.ts src/components/reference public/reference-courseware tests/referenceAssets.test.mjs
git commit -m "feat: add lazy reference courseware assets"
```

### Task 10: 全量验证、桌面验收和执行记录

**Files:**

- Create: `docs/reference-courseware/verification-log.md`
- Modify: `docs/superpowers/plans/2026-09-06-reference-courseware-integration.md` to mark completed checkboxes and record commit IDs
- Read: `docs/superpowers/specs/2026-09-06-reference-courseware-integration-design.md`
- Read: `docs/reference-courseware/content-matrix.md`

- [ ] **Step 1: 运行全量检查。**

```powershell
$ErrorActionPreference = 'Stop'
npm test
npm run lint
npm run format:check
npm run build
```

Expected: four commands all exit 0；记录实际测试数量和构建输出。

- [ ] **Step 2: 做源码完整性扫描。**

使用 `rg` 扫描 `src`、`tests` 和 `docs/reference-courseware`，确认没有新增未完成标记、E 盘绝对资源路径和把人音版标记为浙江教材的错误来源标签。

- [ ] **Step 3: 做电脑端主流程验收。**

按以下路径逐项验证：探索馆教材来源下拉 → 一年级知识点下拉 → 森林/乐器活动 → 试听和反馈 → 发现卡保存 → 刷新恢复；互动课堂标题栏作品选择 → 左侧 1—6 阶段切换 → 二年级音符时值 → 三年级情绪/演唱形式；今日探索第一页 → 第二页 → 复习总结；玩乐中心 → 独立小游戏。只验收 1280×720、1440×900、1920×1080 桌面尺寸，不做手机和平板视觉验收。

- [ ] **Step 4: 验证旧功能不受影响。**

运行现有 `phaseThree.test.mjs`、`phaseFour.test.mjs`、`experienceIntegration.test.mjs`、`explorationSessions.test.mjs`、`progress.test.mjs` 和全部测试；确认旧 `library` 路由、理论入口、乐器页、游戏页、教师入口仍能打开。

- [ ] **Step 5: 写验证记录。**

在 `verification-log.md` 中记录日期、提交 ID、命令、结果、桌面尺寸、音频不可用降级结果、资源清单数量和未处理源文件数量；失败项必须写明原因和下一步，不用“已完成”掩盖失败。

- [ ] **Step 6: 提交最终执行记录。**

```powershell
git add docs/reference-courseware/verification-log.md docs/superpowers/plans/2026-09-06-reference-courseware-integration.md
git commit -m "chore: record reference courseware verification"
```

## Plan Self-Review

- 内容清洗、知识点矩阵和资源去重由 Task 1 覆盖。
- 统一数据模型、学习流程、反馈、星级和进度由 Task 2—3 覆盖。
- 参考课件的游戏互动和动画由 Task 4、5、9 覆盖。
- 一至三年级知识点分别由 Task 5、7、8 覆盖。
- 探索馆、互动课堂、今日探索、玩乐中心和旧入口兼容由 Task 6 覆盖。
- 全量测试、桌面验收、来源检查和文档留痕由 Task 10 覆盖。
- 计划中没有未完成占位、空泛的“适当处理”或依赖未定义接口的步骤。
