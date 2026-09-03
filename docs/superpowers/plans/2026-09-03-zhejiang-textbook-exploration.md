# 浙江人音版教材探索体系实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline execution is selected because the user asked to execute the approved design in this session). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有音乐探索空间对齐浙江人音版小学 1—6 年级，加入教材推荐、我的音乐发现和浙江声音拓展，并更新离线单文件。

**Architecture:** 新增可校准的教材元数据层，给现有理论主题注入年级/册次/来源；推荐算法保持纯函数并使用学生 profile 与进度；发现记录独立持久化，再由 Home、Theory、CourseCenter 和 ClassRoster 轻量消费。

**Tech Stack:** React 18 + TypeScript + Vite + `node:test` + localStorage。

**Spec:** `.trellis/tasks/09-03-zhejiang-textbook-exploration/design.md`

## Global Constraints

- 保留唯一“探索卡片”，不新增顶层导航。
- 班级对战入口、路由和渲染保持移除；旧页面文件不删除。
- 旧数据/旧备份可读；新 localStorage 读写失败不让页面崩溃。
- 不复制受版权保护的整曲、整页谱面或原版录音。
- 每项行为变更遵循先失败测试、再最小实现。

---

### Task 1 — 教材数据和主题对齐

**Files:** `src/music/zhejiangCurriculum.ts`, `src/music/theoryCatalog.ts`, `tests/zhejiangCurriculum.test.mjs`

- [ ] 先写并运行失败测试：验证 1—6 年级、来源标记、年级筛选。
- [ ] 实现 36 个可校准的年级/册次主题和主题映射。
- [ ] 给 `TheoryTopic` 注入 `curriculum`，保持原阶段/类别/题库 API。
- [ ] 跑教材测试和现有 catalog 测试。

### Task 2 — 学生年级与册次

**Files:** `src/state/students.ts`, `src/pages/ClassRoster.tsx`, `src/pages/class.css`, `tests/students.test.mjs`

- [ ] 先写 profile CRUD 失败测试。
- [ ] 增加可选 `grade`/`semester` 和 `updateStudentProfile`。
- [ ] 名册新增表单与卡片显示/编辑年级和册次。
- [ ] 跑学生测试、lint、tsc。

### Task 3 — 推荐和任务卡标签

**Files:** `src/music/explorationRecommendations.ts`, `src/music/explorationLoop.ts`, `tests/explorationRecommendations.test.mjs`, `tests/explorationLoop.test.mjs`

- [ ] 先写稳定推荐、完成兜底、薄弱类别优先测试。
- [ ] 实现评分/稳定哈希和推荐理由。
- [ ] 将教材标签挂到 `ExplorationTaskCard`。
- [ ] 跑探索相关测试和全量单测。

### Task 4 — 我的音乐发现与数据链路

**Files:** `src/state/discoveries.ts`, `src/state/students.ts`, `src/state/backup.ts`, `tests/discoveries.test.mjs`, `tests/backup.test.mjs`

- [ ] 先写隔离、摘要、级联清理和备份兼容失败测试。
- [ ] 实现安全 localStorage store，限制 60 条。
- [ ] 接入删除学生和备份白名单/形状校验。
- [ ] 跑发现、备份和全量测试。

### Task 5 — 页面接入和浙江拓展

**Files:** `src/music/zhejiangExtensions.ts`, `src/pages/Theory.tsx`, `src/pages/Home.tsx`, `src/pages/CourseCenter.tsx`, CSS files, UI tests

- [ ] 先写页面契约失败测试。
- [ ] 加入年级筛选、教材对照 chip、浙江拓展卡和“保存我的发现”。
- [ ] 首页使用年级推荐并在现有进度卡显示最近发现；保持探索卡片。
- [ ] 学段总览改为浙江人音版小学 1—6 年级视图。
- [ ] 浏览器检查桌面与移动端布局。

### Task 6 — 文档、构建与交付

**Files:** `README.md`, `dist/index.html`, `乐动课堂.html`

- [ ] 更新 README。
- [ ] 跑 `npm test`、`npm run lint`、`npm run build`。
- [ ] 复制构建结果覆盖单文件并核对 SHA256。
- [ ] 跑 `git diff --check`，按阶段保存本地 Git 提交，不推送远程。
