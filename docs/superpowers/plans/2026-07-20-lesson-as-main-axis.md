# C2 落地：lesson 作为学习主轴，course 降级为学段总览

决策（已与用户确认）：
- 主轴选 **B**：lesson 为唯一学习主入口，顶部加学段切换；course 降级为"学段总览"看板。
- 子问题 1 选 **a**：appState 加 `openLesson(stage)` + `lessonStage` 状态（仿 `openTheory`/`theoryFocus` 模式）。
- 子问题 2：course 的可点击 steps 列表**直接删**。
- 子问题 3：`game-echo` 从侧边栏主轴移除，并入 training（成为第 5 个挑战模块）。

不在本次范围：首页 C1 瘦身、B1/B2 BUG 修复、O 系列优化（后续单独做）。

---

## 目标结构

```
侧边栏
 ├─ 今日探索（home）
 ├─ 互动课堂（lesson）         ← 唯一学习主入口，顶部学段 tab
 ├─ 音乐探索馆（theory）  ┐
 │  挑战中心（training）   ├─ 工具页（随时进入）
 │  乐器 / 混音创作        ┘
 ├─ 学段总览（course）         ← 降级：只看目标/进度，进入即带学段跳 lesson
 ├─ 素材库 / 闯关地图
 └─ 班级陪伴（teacher only）
```

game-echo 不再独占侧边栏一项，改由 training 统一入口。

---

## 逐文件改动

### 1. `src/state/appState.tsx` —— 新增 openLesson / lessonStage

仿 `theoryFocus` 现有模式：
- import `TheoryStageId`（from `../music/theoryCatalog`）。
- 新增 state：`const [lessonStage, setLessonStage] = useState<TheoryStageId | null>(null)`
- 新增方法：
  ```ts
  const openLesson = useCallback((stage?: TheoryStageId, options?: RouteNavigationOptions) => {
    if (stage) setLessonStage(stage)
    setNavigation((current) => applyRouteNavigation(current, 'lesson', options))
    setNavDirection('forward')
    setSidebarOpen(false)
  }, [])
  ```
- 新增清理 effect（与 theoryFocus 的清理 effect 同位置）：
  ```ts
  useEffect(() => {
    if (route !== 'lesson' && lessonStage) setLessonStage(null)
  }, [route, lessonStage])
  ```
- `AppState` interface 加 `lessonStage: TheoryStageId | null` 与 `openLesson`。
- Provider value 补 `lessonStage`、`openLesson`。

### 2. `src/pages/LessonMode.tsx` —— 顶部学段 tab + 接收 lessonStage

- 顶部 hero 区下方加一排学段 segmented tab：`全部 / 小低 / 小中 / 小高 / 初基 / 初进`（用 `THEORY_STAGES` 渲染 + 一个"全部"）。替代当前埋在 `lesson-planner` 表单里的 `<select stage>`。
- tab 点击 → `setStage(value)` + 重置 `topicId` 到该学段第一个（已有 effect 会兜底，但显式重置更稳）。
- 挂载时读 `lessonStage`：把现有 `useState<StageChoice>('primary-lower')` 初值改为 `lessonStage ?? 'primary-lower'`；加一个 effect：`lessonStage` 变化时 `setStage(lessonStage)`（覆盖当前选择）。这样 course 点"3-4 年级"跳来后顶部 tab 自动落到小学中段。
- `lesson-planner` 里的学段 `<select>` 删除（已被顶部 tab 取代）；类别 `<select>` 和主题 `<select>` 保留。
- 底部「查看成长路线」按钮（`navigate('course')`）保留，文案可改为"查看学段总览"。

### 3. `src/pages/CourseCenter.tsx` —— 降级为学段总览

- **删掉 `active.steps` 的可点击流程列表**（`<div className="lesson-flow">…</div>` 整段，约 227-245 行），以及 `LessonStep` interface / COURSES 里每个学段的 `steps` 字段定义（保留数据无妨，但不再渲染；为干净起见连同字段一起删）。
- 保留：学段卡片列表、`goal / duration / stage`、`outcomes`、`categories`、进度环（`completedTopics`）、分类声谱。
- 每个学段卡片的 CTA：当前底部 `lesson-foot` 有三个按钮（开始互动课堂 / 进入探索馆 / 去挑战中心）。改为：主按钮「进入这个学段的课堂」调用 `openLesson(active.id)`（带学段跳转）；次按钮「进入探索馆」调用 `openTheory({ stage: active.id })` 保留；删掉「去挑战中心」（避免又变成三个并列入口，挑战从 lesson 流程内进入）。
- 页面 hero 标题/文案微调：标题"从小学到初中的互动探索地图"→"各学段音乐学习目标与进度"；副文案强调"查看目标与覆盖，点击进入对应学段的互动课堂"。
- `course-lab-strip` 里的 `course-node-preview`（现展示 steps 前 4 项）改为展示 `outcomes` 前 4 项，避免删 steps 后该区空掉。

### 4. `src/components/Sidebar.tsx` —— 重新分组

- 「课堂主线」分组：只留 `lesson`。
- 删除该分组里的 `game-echo` 项。
- 新增「工具」分组（或复用「创作工具」并改名），放入：`theory`、`training`、`piano`、`drums`、`mixer`、`recorder`、`xylophone`。即把原「创作工具」分组扩展为"工具与乐器"，theory/training 归入此组。
- 「素材与记录」分组：`library`、`adventure`、`course`（course 从原课堂主线挪到这里，hint 改"各学段目标与进度"）。
- 「班级陪伴」保持 teacher only 不变。
- 底部 `side-foot` 文案"入口已按课堂主线收拢"→"lesson 为学习主轴"或类似。

### 5. `src/pages/TrainingCenter.tsx` —— 接收 echo 为第 5 个模块

- `MODULES` 数组新增第 5 项：
  ```ts
  {
    id: 'echo',
    route: 'game-echo',
    icon: '🔁',
    title: '节奏记忆',
    former: '节奏复制',
    ability: '节奏记忆',
    stage: '小学低段起',
    goal: '先听一段节奏再敲出来，训练节奏短时记忆与准确复现。',
    reason: '适合在节奏反应之外补充"听→记→复现"的闭环。',
    playHint: '先听完整段再敲，注意长短音的间隔。',
    metrics: ['节奏复现', '时值准确', '连击'],
    level: 'L1-L3',
    color: '#845ef7',
  }
  ```
- 注意：`recordResult(GAME_ID='game-echo', level, ...)` 已存在，progress.bestScores['game-echo'] 能正常联动。
- TrainingCenter 的 4→5 模块布局 CSS（`training-grid`）检查是否需要调整列数；若现为固定 2 列，5 项也能排，先不动 CSS。

### 6. `src/pages/Home.tsx` —— 入口文案对齐

- `MAIN_ENTRIES` 中 `course` 的 desc：由"按学段选择一条连续的课堂路线"改为"查看各学段目标与覆盖进度"。
- hero 主 CTA「开始互动课」→ `navigate('lesson')` 保留（可考虑改 `openLesson()` 不带 stage，等同）。
- 「推荐探索路线」区块的「查看成长路线」按钮文案改为"查看学段总览"。
- 「成长轨道」「指挥台」「课堂主线」三区块的重复合并属于 C1，本次不动，仅保证文案不与新定位矛盾。

### 7. `src/pages/AdventureMap.tsx` —— 链接修正

- 第 73 行 `navigate('course')` 改为 `navigate('lesson')`（闯关岛回到主轴课堂，而非学段总览）。
- 其余不动（adventure 仍作为游戏化补充入口）。

---

## 不改动的部分

- `theory.tsx` / `training` 各游戏页 / 乐器页 / `Library` / `Dashboard` / `ClassRoster` / `TeamBattle`：不受影响。
- `navigationHistory.ts` 的 `ROUTE_LABELS`：`course` 标签"成长路线"可保留或改"学段总览"——建议改为"学段总览"以匹配新定位（TopBar 面包屑、返回按钮都会用上）。
- `Route` 类型、`App.tsx` 路由表：不变（course 仍是有效路由）。
- 数据层 / 音频层：完全不动。

---

## 验证

1. `npx tsc -b` 零错误（重点：appState 新字段、LessonMode/CourseCenter 删字段后无悬空引用）。
2. `npm test` 38 项全绿（现有测试不涉及 lesson/course UI 结构，应不受影响；若 navigationHistory 测试涉及 course 标签则同步更新）。
3. 手动验证闭环：侧边栏进 course → 点"3-4 年级"「进入这个学段的课堂」→ lesson 顶部 tab 自动落到"小学中段"，主题列表过滤到该学段。
4. 手动验证 game-echo：侧边栏不再有该项；training 页能看到"节奏记忆"卡片，点击进入 EchoGame 正常。
5. 手动验证 lesson 顶部 tab 切换学段后主题列表与 5 步流程随之更新。

## 风险

- CourseCenter 删 `steps` 后，若有外部引用 `COURSES[].steps`——已 grep 确认仅 CourseCenter 内部使用，安全。
- TrainingCenter 5 模块若 CSS 网格排版异常，需微调 `training.css`（预计 2-4 行）。
- 侧边栏分组重排可能影响 `sidebar.css` 的分组间距，视觉验收时留意。
