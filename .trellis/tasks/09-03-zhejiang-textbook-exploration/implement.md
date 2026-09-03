# 浙江人音版教材探索体系实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有音乐探索链路对齐浙江人音版小学 1—6 年级，加入稳定推荐、我的发现和浙江声音拓展，并更新单文件构建。

**Architecture:** 用独立教材数据模块给所有 `TheoryTopic` 注入可校准的对照元数据；推荐函数只消费主题、学生 profile 和进度，不直接依赖 React。发现记录使用独立 localStorage store，并通过 Home/Theory/名册轻量接入。

**Tech Stack:** React 18、TypeScript、Vite、原生 localStorage、Node `node:test` + TypeScript transpile loader。

**Spec:** `.trellis/tasks/09-03-zhejiang-textbook-exploration/design.md`

## Global Constraints

- 保留现有“探索卡片”，不新增顶层导航。
- 班级对战入口、路由和渲染保持移除；不删除旧页面文件。
- 旧 localStorage 数据和备份必须可读取；新字段可选且读写失败不阻塞页面。
- 不复制受版权保护的教材整曲、整页谱面或原版录音。
- 每个行为改动先写失败测试并确认失败，再写最小实现。
- 使用 PowerShell 7 命令；脚本首行设置 `$ErrorActionPreference = 'Stop'`。

---

### Task 1: 教材数据和主题对齐

**Files:**
- Create: `src/music/zhejiangCurriculum.ts`
- Modify: `src/music/theoryCatalog.ts`
- Test: `tests/zhejiangCurriculum.test.mjs`

**Interfaces:**
- Produces `PrimaryGrade`, `Semester`, `TopicCurriculum`, `ZHEJIANG_RENYIN_UNITS`, `alignTheoryTopic`, `getGradeLabel`, `getCurriculumSourceLabel`.
- Extends `TheoryTopic` with `curriculum: TopicCurriculum` and `TheoryTopicFilter` with `grade?: PrimaryGrade`, `source?: CurriculumSource`.

- [x] 写测试：断言 1—6 年级有教材对照主题；小学主题来源为 `textbook`；初中主题来源为 `extension`；按年级和来源筛选有效。
- [x] 运行 `node --test tests/zhejiangCurriculum.test.mjs`，确认因模块/字段不存在而失败。
- [x] 实现年级、册次、36 个可校准对照主题和按阶段/类别的主题映射；在 `applyTopicContent` 注入 `curriculum`。
- [x] 重新运行该测试并确认通过，再运行现有 `tests/theoryCatalog.test.mjs`。

### Task 2: 学生年级/册次画像与名册 UI

**Files:**
- Modify: `src/state/students.ts`
- Modify: `src/pages/ClassRoster.tsx`
- Modify: `src/pages/class.css`
- Test: `tests/students.test.mjs`

**Interfaces:**
- `Student` gains `grade?: PrimaryGrade`, `semester?: Semester`.
- `addStudent(name, avatar?, profile?)` remains backward compatible.
- Produces `updateStudentProfile(id, profile): Student | null`.

- [x] 写失败测试：新增学生能保存 profile；更新只改年级/册次；旧学生无字段仍能查找。
- [x] 运行 `node --test tests/students.test.mjs` 确认失败。
- [x] 实现可选字段和安全更新函数；名册添加表单增加年级/册次选择，卡片显示并可修改。
- [x] 运行学生测试、lint 和类型检查。

### Task 3: 推荐算法和探索卡教材标签

**Files:**
- Create: `src/music/explorationRecommendations.ts`
- Modify: `src/music/explorationLoop.ts`
- Test: `tests/explorationRecommendations.test.mjs`, `tests/explorationLoop.test.mjs`

**Interfaces:**
- Produces `recommendExplorationTopic(topics, context): ExplorationRecommendation | null`.
- `ExplorationTaskCard` gains optional `curriculum` and `sourceLabel` fields without破坏旧调用。

- [x] 写失败测试：同一学生/日期推荐稳定；优先年级教材主题和薄弱类别；全部完成后有兜底；任务卡带教材标签。
- [x] 运行测试确认失败。
- [x] 实现稳定哈希和逐级放宽筛选；扩展任务卡元数据。
- [x] 运行推荐、探索循环及全量测试。

### Task 4: 我的音乐发现 store、备份和级联清理

**Files:**
- Create: `src/state/discoveries.ts`
- Modify: `src/state/students.ts`
- Modify: `src/state/backup.ts`
- Test: `tests/discoveries.test.mjs`, `tests/backup.test.mjs`（如需新增）

**Interfaces:**
- Produces `MusicDiscovery`, `saveMusicDiscovery`, `loadMusicDiscoveries`, `buildDiscoverySummary`, `removeStudentDiscoveries`.

- [x] 写失败测试：保存/读取按学生隔离、最新优先、摘要、删除学生清理；备份包含 discoveries key 且旧备份可导入。
- [x] 运行测试确认失败。
- [x] 实现 store、容量上限和安全 JSON 读写；接入学生删除和备份白名单/形状校验。
- [x] 运行发现、备份和全量测试。

### Task 5: 探索馆、首页与浙江拓展 UI

**Files:**
- Create: `src/music/zhejiangExtensions.ts`
- Modify: `src/pages/Theory.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/CourseCenter.tsx`
- Modify: `src/pages/theory.css`
- Modify: `src/index.css`
- Modify: `src/responsive.css`
- Test: `tests/homeSimplification.test.mjs`, `tests/curriculumUi.test.mjs`

**Interfaces:**
- `Theory` consumes `getZhejiangExtension` and discovery store.
- `Home` consumes `recommendExplorationTopic` and `buildDiscoverySummary`.

- [x] 写失败测试：探索馆出现年级筛选、教材对照、“浙江拓展”；首页仍有探索卡片并出现最近发现；学段总览标注浙江人音版和 1—6 年级。
- [x] 运行页面契约测试确认失败。
- [x] 实现拓展数据和轻量 UI；探索卡“说一说”提供可保存句式；首页不新增独立 KPI 卡。
- [x] 运行页面契约、lint、类型检查，并用浏览器检查桌面/手机无横向溢出。

### Task 6: 文档、构建和单文件交付

**Files:**
- Modify: `README.md`
- Generate: `dist/index.html`
- Generate: `乐动课堂.html`

- [x] 更新 README 功能说明、教材对照和备份说明。
- [x] 运行 `npm test`，确认全量测试通过。
- [x] 运行 `npm run lint` 和 `npm run build`。
- [x] 用 `Copy-Item -Force -LiteralPath 'dist\\index.html' -Destination '乐动课堂.html'` 更新单文件。
- [x] 用 SHA256 核对两个 HTML 完全一致，运行 `git diff --check`，并记录阶段提交与忽略的发布文件。
