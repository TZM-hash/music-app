# 关键页稳定精致 + 最小信任修复

**日期**：2026-07-21  
**状态**：已确认（用户选择：A + 最小信任修复；P1 范围已确认）  
**分支**：`codex/v0.9a-smart-review-encyclopedia`

---

## 1. 背景与问题

乐动课堂已具备可用的课堂形态：单文件离线分发、教师/投屏/学生三模式、互动课 / 探索馆 / 挑战中心主轴、乐理内容与复习算法基础设施。

当前品质瓶颈不在“功能数量”，而在：

1. **界面**：`src/index.css` 约 8500 行，多轮桌面“layout pass”互相覆盖，叠加 page CSS 与 `responsive.css`，关键页在缩放/改窗口时易溢出、留白或遮挡。
2. **信任**：挑战中心部分“能力信号”由最高分推算，非真实子指标；文案“四类”与五模块数据不一致；`GAME_META` 缺少 `game-echo`。
3. **闭环断裂**：首页「今日挑战 / 回放点 / 再探索」与闯关岛发现卡点击后，多数只 `navigate('training'|'theory')`，不能落到对应主题或分类。

用户目标：**界面稳定精致（稳定 + 精致）**，并接受推荐路径 **A + 最小信任修复**。

---

## 2. 目标与成功标准

### 2.1 产品目标

- 课堂高频页在常见桌面分辨率与浏览器缩放下铺满、不溢出、不遮挡。
- 视觉层级更统一（卡片、标题、按钮、空状态），像成品应用。
- 推荐/复习入口不再“点了空转”；挑战中心数据诚实。

### 2.2 P1 可验收成功标准

1. **首页、挑战中心、探索馆、互动课** 在常见桌面分辨率与约 80%–125% 缩放下：铺满不溢出、不严重互相遮挡。
2. 挑战中心**不再展示伪能力子指标**；未练习显示空态，有记录只展示真实最高分/是否练过。
3. 首页「今日挑战 / 回放点 / 再探索」点击后进入**对应主题或分类**（通过既有 `openTheory`），不是一律进挑战中心。
4. 闯关岛发现卡 / 主探索 CTA 使用 `openTheory`，带上 `topicId`（及可得的 stage/category）。
5. 木琴、竖笛页显示「音名」开关；全屏按钮可进入/退出并反映状态。
6. 增加 5–8 个契约测试，锁定深链字段映射与 `GAME_META` 与训练模块对齐。

### 2.3 明确不在 P1

- 后端 / 账号体系
- 互动课练习写入错题本/进度（P2）
- 专用「今日挑战答题壳」完整 UI（P2；P1 只保证打开正确主题）
- 全站 CSS 大重构或再开一轮全局 layout pass
- 新 UI 框架 / 全局状态库
- 混音器、看板、乐器页大改

---

## 3. 方案选择

| 方案 | 内容 | 结论 |
|------|------|------|
| A 关键页稳定+精致 | 4 关键页布局与视觉收敛 | 主体 |
| B 布局系统先重构 | 先砍叠层 CSS 再建 token | 仅吸收“冻结 pass + 局部收敛”，不全做 |
| C 视觉皮肤优先 | 先统一色与圆角 | 不够，根因含布局与死链 |
| **A + 最小信任修复** | A + 伪数据/死链/顶栏小修/契约测试 | **已选** |

原则：

- 不再新增 `index.css` 桌面满屏 layout pass。
- 信任优先于装饰：无真实子指标不画假图。
- 深链复用 `openTheory(TheoryFocus)`，不新建路由体系。
- 最小改动闭环：首页/闯关改导航目标即可。

---

## 4. 架构与边界

### 4.1 布局

| 层 | 职责 |
|----|------|
| page CSS（`home` 相关在 `index.css` 中的 route 块 / `training.css` / `theory.css` / `lesson.css`） | 该页结构、桌面铺满网格、组件紧凑态 |
| `responsive.css` | 最后导入的断点兜底：短视口滚动、关键页强制不溢出/可铺满 |
| `index.css` 历史 pass | **冻结新增**；P1 只删除或改写与 4 关键页冲突且可安全替换的规则 |

桌面（宽 ≥1024 且高 ≥680 量级）：内容区作为高度容器，关键页 `height: 100%` + 内部 `minmax(0, fr)` / 可滚动子区。  
短视口或过窄：放弃钉死高度，改为自然高度 + 页面滚动。

### 4.2 导航与焦点

已有能力（不得平行再造）：

- `openTheory(focus?: TheoryFocus)`（`appState.tsx`）
- `TheoryFocus`: `{ stage?, category?, topicId? }`（`theoryFocus.ts`）
- `matchesTheoryFocus` / `createTheoryFocus`

深链约定：

```text
Home daily / wrong (source=theory)
  → openTheory({ topicId: item.itemId, category: item.category, stage: item.stage as stage if valid })

Home daily / wrong (source=encyclopedia)
  → 优先 openTheory({ category: item.category })；
    若产品已有百科详情入口且稳定，可进 library 并选中条目（实现时二选一，须在 PR 说明）
  → 禁止 navigate('training') 作为默认

Home weak category
  → openTheory({ category })

AdventureMap topic card / 进入探索馆
  → openTheory({ topicId, category?, stage? })

空态「进入挑战中心」
  → 仍可 navigate('training')
```

`ReviewQuestion.itemId`：theory 源为 topic id；encyclopedia 源为百科条目 id。映射必须分支处理。

### 4.3 数据诚实

| 区域 | 规则 |
|------|------|
| Training 模块详情 Spectrum | 禁止用 `activeBest - index * 14` 等推算假子指标 |
| 未练习 | 空态文案（如「还没有挑战记录」），不展示“看起来像能力”的假柱 |
| 有练习 | 只展示真实 `bestScores`、是否练过、可选进度条 |
| 文案 | 与 `MODULES.length` 一致（五类小游戏 / 听感·读谱·跟唱·节奏反应·节奏记忆） |
| `GAME_META` | 必须包含全部训练用 `game-*` 路由，含 `game-echo` |

### 4.4 顶栏

- `isInstrument`：`piano | drums | xylophone | recorder`
- 全屏：`requestFullscreen` / `exitFullscreen` 切换；按钮文案或 active 态反映当前是否全屏（监听 `fullscreenchange`）

---

## 5. P1 工作包

### WP1 · 关键页布局收敛

**页面**：`Home`、`TrainingCenter`、`Theory`、`LessonMode`

**任务**：

1. 明确每页桌面铺满与短视口滚动行为。
2. 统一卡片间距、标题层级、主/次按钮、空状态表现（在 4 页范围内一致即可）。
3. 将 4 页相关冲突规则收敛到 page CSS + `responsive.css`；删除失效/重复 override（能证明无用再删）。
4. 手测矩阵：1920×1080、1366×768、侧栏开合、约 100%/125% 缩放。

**交付**：布局稳定、视觉更整齐，无新全局 layout pass。

### WP2 · 挑战中心数据诚实

**文件**：`TrainingCenter.tsx`、`training.css`、`stats.ts`（及看板消费方若需）

**任务**：

1. 移除伪 `activeMetrics` 推算；UI 改为真实数据或空态。
2. 修正“四类/五模块”文案。
3. `GAME_META` 增加 `game-echo`（名称/图标/技能维与产品一致）。

### WP3 · 死链 → 深链

**文件**：`Home.tsx`、`AdventureMap.tsx`（必要时薄封装纯函数便于测试）

**任务**：

1. 首页 review-rail 三类入口按 §4.2 映射。
2. 闯关岛预览卡与主 CTA 使用 `openTheory`。
3. 保证 `Theory` 现有 `theoryFocus` 消费逻辑足以落到主题；若缺定位，补最小逻辑（不重做探索馆）。

### WP4 · 顶栏

**文件**：`TopBar.tsx`（必要时 `App.tsx` 的 instrument 判定若有重复则对齐）

**任务**：音名开关覆盖木琴/竖笛；全屏 toggle。

### WP5 · 契约测试

**文件**：`tests/*.test.mjs`（新增或扩展）

**最少覆盖**：

1. `GAME_META` keys 覆盖 Training 全部 `game-*` route（可维护一份共享 route 列表或从导出常量断言）。
2. 深链映射：给定 `ReviewQuestion` / weak category → 期望的 `TheoryFocus` 字段。
3. `matchesTheoryFocus` 对 topicId/category 的筛选行为（若映射函数抽出则测该函数）。
4. 可选：AdventureMap 打开焦点构造。

**命令**：`npm test` 全绿；`npm run build` 通过。

---

## 6. 错误处理与边界

| 场景 | 行为 |
|------|------|
| `itemId` 在 catalog 中不存在 | 降级 `openTheory({ category })` 或裸 `openTheory()`，不崩溃 |
| encyclopedia 源 | 不把百科 id 当 theory topicId 硬塞；走 category 或 library |
| localStorage 失败 | 保持现有静默策略（P1 不扩 toast，P2 再做） |
| 无学生 | 匿名 review book 逻辑保持；深链仍可用 |

---

## 7. 测试与验收

### 7.1 自动化

- 现有 suite 保持全绿。
- 新增 WP5 契约测试。

### 7.2 手测清单

1. 1920×1080、1366×768、125% 缩放：4 关键页不溢出、不严重留白。  
2. 有今日挑战时，点击条目进入探索馆相关主题/分类。  
3. 有回放点时，点击进入对应主题而非空白挑战中心。  
4. 薄弱方向 chip 进入对应 category 筛选。  
5. 闯关岛发现卡进入指定 topic。  
6. 挑战中心：未练模块无假柱；文案与模块数一致。  
7. 木琴/竖笛可见音名开关。  
8. 全屏可进可出。  
9. `npm test`、`npm run build` 通过。

---

## 8. 实施顺序建议

1. WP2 + WP5 部分（数据与测试，风险低、可先红后绿）  
2. WP3 深链 + 测试补齐  
3. WP4 顶栏  
4. WP1 布局收敛与视觉统一（改动面最大，放在信任修复之后，避免混杂回归）  
5. 手测矩阵 + 单文件构建同步（若需要本地 `乐动课堂.html`）

---

## 9. P2 登记（本 spec 不实施）

- 真正的今日挑战 / 错题答题壳（复用 MiniQuiz）  
- LessonMode practice → `recordReviewAnswer` / 轻量 progress  
- CSS token 化与按 route 拆分 `index.css`  
- 备份纳入 current-student、存储失败提示  
- 闯关解锁阈值与奖励兑现一致性  

---

## 10. 关键路径

| 区域 | 路径 |
|------|------|
| 首页 | `src/pages/Home.tsx` |
| 挑战中心 | `src/pages/TrainingCenter.tsx`, `src/pages/training.css` |
| 闯关 | `src/pages/AdventureMap.tsx` |
| 探索馆 | `src/pages/Theory.tsx` |
| 互动课 | `src/pages/LessonMode.tsx` |
| 状态 | `src/state/appState.tsx`, `theoryFocus.ts`, `theoryReview.ts`, `stats.ts` |
| 顶栏 | `src/components/TopBar.tsx` |
| 样式兜底 | `src/responsive.css`, `src/index.css`（冻结新 pass） |
| 测试 | `tests/*.test.mjs` |

---

## 11. 自检记录

- [x] 无 TBD/TODO 占位要求  
- [x] 范围与用户确认一致（4 关键页 + 伪数据/死链 + 音名/全屏 + 契约测试；不含 Lesson 落盘）  
- [x] 深链统一走 `openTheory`，与现有 `TheoryFocus` 一致  
- [x] 伪数据禁止规则写死  
- [x] P1/P2 边界清楚  
- [x] 验收标准可操作  

---

## 12. 批准

- 路径选择：A + 最小信任修复  
- P1 范围：用户确认  
- 本设计：用户回复「1」批准写 spec 并进入实施计划  
