# 电脑端音乐学习工作区整合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. The user explicitly requested inline execution without subagents.

**Goal:** 将今日探索、音乐探索馆、互动课堂阶段导航和作品/素材入口整合为连续、可直接操作的电脑端学习工作区。

**Architecture:** 保留现有页面、路由和数据层，以页面级状态和桌面 CSS 覆盖完成信息架构调整。`CourseCenter` 作为“作品与素材”容器承载作品地图和可复用的素材库视图；`library` 继续作为兼容路由进入同一容器的素材视图。探索会话、发现卡、曲目和教材数据不变。

**Tech Stack:** React 18, TypeScript, Vite, CSS, Node test runner, ESLint.

**Spec:** `docs/superpowers/specs/2026-09-06-desktop-learning-workspace-design.md`

## Global Constraints

- 只修改电脑端布局和交互；不增加移动端断点规则。
- 不删除阶段一至四已有功能、入口、数据和保存逻辑。
- 互动课堂阶段 1—6 可以直接跳转，但只有原有“下一步”流程才能推进/完成探索记录。
- 不新增依赖、持久化 schema 或网络资源。
- 保留旧 `library` 路由兼容性。

---

### Task 1: 建立回归测试契约

**Files:**
- Modify: `tests/homeSimplification.test.mjs`
- Modify: `tests/curriculumUi.test.mjs`
- Modify: `tests/experienceIntegration.test.mjs`
- Modify: `tests/explorationTheater.test.mjs`

**Interfaces:**
- Consumes: 现有页面源码和探索剧场源码。
- Produces: 能分别捕获首页取消页面级分页、探索馆持续双栏、课堂作品选择、课堂阶段直达和作品/素材合并契约的测试。

- [ ] **Step 1: 写失败测试**

在 `tests/homeSimplification.test.mjs` 增加：

```js
test('今日探索在一个连续页面展示全部主要区块', () => {
  const home = readSource('src/pages/Home.tsx')
  assert.doesNotMatch(home, /HOME_PRESENTATION_PAGES/)
  assert.doesNotMatch(home, /<PagePager/)
  assert.match(home, /className="home-playground card"/)
  assert.match(home, /className="home-progress-card card"/)
  assert.match(home, /className="review-rail card today-task-card"/)
  assert.match(home, /className="portfolio-panel card home-recent-work"/)
})
```

在 `tests/curriculumUi.test.mjs` 增加：

```js
test('探索馆保持左侧筛选和线索卡、右侧具体内容', () => {
  const theory = read('src/pages/Theory.tsx')
  const presentation = read('src/presentation.css')
  assert.match(theory, /className="theory-nav card"/)
  assert.match(theory, /title="音乐方向"/)
  assert.match(theory, /title="教材来源"/)
  assert.match(theory, /side-group-title">线索卡/)
  assert.match(theory, /className="theory-main"/)
  assert.doesNotMatch(theory, /THEORY_PRESENTATION_PAGES/)
  assert.match(presentation, /route-theory[\s\S]*theory-layout[\s\S]*grid-template-columns/)
})

test('作品地图和素材库由同一工作区承载', () => {
  const app = read('src/App.tsx')
  const course = read('src/pages/CourseCenter.tsx')
  const sidebar = read('src/components/studentNavigation.ts')
  assert.match(app, /displayedRoute === 'library'[\s\S]*CourseCenter/)
  assert.match(course, /作品地图/)
  assert.match(course, /曲库与故事/)
  assert.match(course, /Library|library-view|素材库/)
  assert.match(sidebar, /作品与素材/)
})
```

在 `tests/experienceIntegration.test.mjs` 增加：

```js
test('互动课堂标题栏可以直接选择作品', () => {
  const lesson = readSource('src/pages/LessonMode.tsx')
  assert.match(lesson, /EXPLORATION_UNITS/)
  assert.match(lesson, /<select/)
  assert.match(lesson, /openExploration\(/)
  assert.doesNotMatch(lesson, />\s*换一首作品\s*</)
})
```

在 `tests/explorationTheater.test.mjs` 增加：

```js
test('互动课堂阶段 1 到 6 都可以直接点击切换', () => {
  const source = readSource('src/components/ExplorationTheater.tsx')
  assert.match(source, /onClick=\{\(\) => goToStage\(stage\.id\)\}/)
  assert.doesNotMatch(source, /disabled=\{index > currentStageIndex\}/)
  assert.doesNotMatch(source, /targetIndex > currentIndex/)
})
```

- [ ] **Step 2: 运行定向测试确认失败**

Run: `node --test tests/homeSimplification.test.mjs tests/curriculumUi.test.mjs tests/experienceIntegration.test.mjs tests/explorationTheater.test.mjs`

Expected: FAIL because the current source still declares the home/theory page pagers, has the bottom lesson switch button, and disables future stage buttons.

---

### Task 2: 合并今日探索与探索馆的桌面信息架构

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Theory.tsx`
- Modify: `src/presentation.css`
- Modify: `src/pages/theory.css`

**Interfaces:**
- Consumes: `PagePager` removal tests from Task 1 and existing `filterTheoryTopics`/`activePanel` behavior。
- Produces: Home continuous page and Theory persistent left-filter/right-content desktop layout。

- [ ] **Step 1: 移除 Home 页面级分页状态和控件**

删除 `HOME_PRESENTATION_PAGES`、`homePage`、`PagePager` import/use 和 `data-home-page`，保留现有所有 section，根节点继续使用 `presentation-page` 以复用自然滚动容器。

- [ ] **Step 2: 移除 Theory 页面级分页和线索分页**

删除 `THEORY_PRESENTATION_PAGES`、`theoryPage`、页面级 `PagePager`、`topicPage`/`getPageSlice` 及线索列表分页。保留音乐方向、教材来源、线索卡选择、`activePanel`、右侧互动内容和空状态。点击线索卡只更新 `activeId`，不再调用 `setTheoryPage`。

- [ ] **Step 3: 写桌面自然布局覆盖**

在 `src/presentation.css` 文件末尾增加电脑端覆盖：Home 的所有 section 显示并按自然高度排列；Theory 的 `.theory-layout` 使用 `minmax(270px, 320px) minmax(0, 1fr)` 双栏，`.theory-nav` 和 `.theory-main` 可独立滚动但不裁切内容，旧的 `[data-theory-page]` 隐藏规则不再影响布局。同步在 `src/pages/theory.css` 解除 `height: 100%`/`overflow: hidden` 对桌面自然高度的限制。

- [ ] **Step 4: 运行定向测试确认通过**

Run: `node --test tests/homeSimplification.test.mjs tests/curriculumUi.test.mjs`

Expected: PASS with all Home and Theory layout assertions green。

---

### Task 3: 让互动课堂作品和六阶段都可直接操作

**Files:**
- Modify: `src/pages/LessonMode.tsx`
- Modify: `src/components/ExplorationTheater.tsx`
- Modify: `src/components/explorationTheater.css`
- Modify: `tests/experienceIntegration.test.mjs`
- Modify: `tests/explorationTheater.test.mjs`

**Interfaces:**
- Consumes: `EXPLORATION_UNITS`, `openExploration`, `ExplorationTheater` session navigation。
- Produces: 标题栏作品选择器和任意阶段可点击的 1—6 导航。

- [ ] **Step 1: 在课堂标题栏加入作品选择器**

从 `../music/explorationUnits` 引入 `EXPLORATION_UNITS`，在“音乐探索剧场”标题区域加入 `label` 和 `select`。选项使用每个单元的 `id`/`title`，`value` 使用当前 `unit.id`，`onChange` 调用 `openExploration(event.target.value)`。删除底部“换一首作品”按钮，保留其余支持入口。

- [ ] **Step 2: 允许阶段导航直接跳转**

在 `ExplorationTheater` 的 `goToStage` 中删除 `targetIndex > currentIndex` 的提前返回，只保留非法阶段保护、清理保存提示、清除旧完成时间并更新当前阶段。阶段按钮删除 `disabled={index > currentStageIndex}`，保留 `aria-current`、active/done 样式和现有“下一步”条件。

- [ ] **Step 3: 调整阶段按钮的桌面可点击反馈**

让六个阶段按钮始终显示 pointer/hover/focus 状态；不改变移动端断点规则和三栏结构。

- [ ] **Step 4: 运行课堂定向测试**

Run: `node --test tests/experienceIntegration.test.mjs tests/explorationTheater.test.mjs`

Expected: PASS，且现有 session、保存、音频中断等测试保持绿色。

---

### Task 4: 合并作品地图与素材库入口

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/CourseCenter.tsx`
- Modify: `src/pages/Library.tsx`
- Modify: `src/components/studentNavigation.ts`
- Modify: `src/pages/course.css`
- Modify: `src/pages/library.css`
- Modify: `tests/curriculumUi.test.mjs`

**Interfaces:**
- Consumes: `CourseCenter` 的 `WORK_SUMMARIES`/作品地图筛选，以及 `Library` 的曲库、音乐故事、试听、导入和测验状态。
- Produces: 单一“作品与素材”页面容器，作品和素材两个视图均可用，旧 `library` 路由兼容。

- [ ] **Step 1: 提取素材库主体为可复用视图**

将 `Library` 的筛选、曲目/故事详情和弹窗逻辑保留在同一组件边界内，增加 `initialView?: 'songs' | 'encyclopedia'` 属性。`CourseCenter` 通过合并容器渲染该素材视图；不要复制试听、测验和导入逻辑。

- [ ] **Step 2: 在 CourseCenter 增加工作区视图切换**

增加 `workspaceView` 状态，视图为 `works` 或 `materials`；顶部显示“作品地图 / 曲库与故事”两个可访问 tab。`works` 显示现有作品地图与课程入口，`materials` 显示复用的素材库视图。

- [ ] **Step 3: 让旧 library 路由打开素材视图**

在 `src/App.tsx` 中让 `displayedRoute === 'library'` 渲染合并容器，并让 `CourseCenter` 根据当前 route 初始进入 `materials`。保持旧的 `navigate('library')` 不抛错；学生侧栏将“素材库”改名为“作品与素材”并指向合并入口。

- [ ] **Step 4: 只增加电脑端合并布局样式**

在课程样式中为工作区 tab 和素材视图容器增加桌面布局；素材详情、作品详情使用现有样式，不增加移动断点。

- [ ] **Step 5: 运行合并入口定向测试**

Run: `node --test tests/curriculumUi.test.mjs tests/experienceIntegration.test.mjs`

Expected: PASS，且旧课程、教师支持、作品筛选和素材交互契约仍存在。

---

### Task 5: 完整验证、同步单文件并推送

**Files:**
- Generated: `dist/index.html`
- Generated: `乐动课堂.html`

- [ ] **Step 1: 运行全部测试、lint 和构建**

Run: `npm test`; `npm run lint`; `npm run build`

Expected: 全部命令退出码为 0。

- [ ] **Step 2: 同步单文件并校验哈希**

Run:

```powershell
Copy-Item -LiteralPath 'dist/index.html' -Destination '乐动课堂.html' -Force
$distHash = (Get-FileHash -LiteralPath 'dist/index.html' -Algorithm SHA256).Hash
$singleHash = (Get-FileHash -LiteralPath '乐动课堂.html' -Algorithm SHA256).Hash
if ($distHash -ne $singleHash) { throw 'single file is out of sync' }
```

- [ ] **Step 3: 检查 diff 并提交**

只暂存本任务涉及的源码、测试和设计/计划文档，不暂存 `旧版本/`。提交信息使用：`feat: unify desktop music learning workspace`。

- [ ] **Step 4: 使用代理推送 master 并核对远端**

Run: `git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push origin master`，随后 fetch 并确认 `git rev-parse HEAD` 与 `git rev-parse origin/master` 相同。
