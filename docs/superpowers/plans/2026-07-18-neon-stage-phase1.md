# 霓虹舞台 Phase 1：深色主题 + 基础动效 + 核心音效 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将整个 app 从浅色扁平风格改为深色霓虹舞台风格，添加页面转场动画、乐器按键动效、5 个核心 UI 音效。

**Architecture:** 纯 CSS 变量主题切换（改 `:root` token + 逐组件覆盖），Tone.js 合成 UI 音效层挂在现有 audioEngine 之上，CSS transition/animation 实现动效。

**Tech Stack:** React 18, TypeScript, Vite, Tone.js, 纯 CSS（零新依赖）

## Global Constraints

- 保持单文件构建（`vite-plugin-singlefile`），不引入任何新 npm 依赖
- 所有动画只用 `transform` + `opacity`（GPU 加速）
- 支持 `prefers-reduced-motion`
- UI 音效默认**关闭**，老师在 TopBar 手动开启
- 现有功能逻辑不改（只改表现层）

---

### Task 1: Design Token 系统 + 全局深色主题

**Files:**
- Modify: `src/index.css`（行 1-28 `:root`、行 2038-2062 末尾 `:root`、行 42-54 `body`、行 2064-2077 末尾 `body`/`body::before`）

**Interfaces:**
- Consumes: 无（纯 CSS 变量）
- Produces: 全站可用的霓虹 token（`--neon-cyan`、`--bg-deep` 等），后续 Task 依赖

- [ ] **Step 1: 替换 `:root` token（文件开头的第一个 `:root`，行 1-28）**

将行 1-28 的 `:root` 整个替换为：

```css
:root {
  --font: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', system-ui, sans-serif;

  /* 霓虹舞台 · 深色主题 */
  --bg-deep: #060814;
  --bg-panel: #0d1230;
  --bg-card: #131a3f;
  --bg-raised: #1c2452;
  --bg-soft: rgba(19, 26, 63, 0.72);
  --bg-solid: #131a3f;

  /* 霓虹主色 */
  --neon-cyan: #22e5ff;
  --neon-pink: #ff4fa3;
  --neon-gold: #ffd60a;
  --neon-purple: #a06bff;
  --neon-green: #3dffc0;

  /* 音符专属色 */
  --note-c: #22e5ff;
  --note-d: #3dffc0;
  --note-e: #ffd60a;
  --note-f: #ff4fa3;
  --note-g: #a06bff;
  --note-a: #ff8c42;
  --note-b: #4fc3ff;

  /* 语义色 */
  --primary: #22e5ff;
  --primary-2: #a06bff;
  --accent: #ff4fa3;
  --accent-2: #ffd60a;
  --hot: #ff4fa3;
  --success: #3dffc0;
  --danger: #ff5470;

  /* 文字 */
  --text: #eef2ff;
  --text-soft: #8a95c9;
  --text-faint: #4a5280;

  /* 线条 */
  --line: rgba(138, 149, 201, 0.22);
  --line-soft: rgba(138, 149, 201, 0.12);
  --line-neon: rgba(34, 229, 255, 0.3);

  /* 圆角 */
  --radius: 10px;
  --radius-lg: 16px;
  --radius-sm: 6px;

  /* 阴影 & 发光 */
  --shadow: 0 24px 70px rgba(0, 0, 0, 0.4);
  --shadow-soft: 0 10px 28px rgba(0, 0, 0, 0.3);
  --glow: 0 0 20px rgba(34, 229, 255, 0.3);
  --glow-primary: 0 0 24px rgba(34, 229, 255, 0.4), 0 0 60px rgba(34, 229, 255, 0.12);
  --glow-gold: 0 0 20px rgba(255, 214, 10, 0.4), 0 0 50px rgba(255, 214, 10, 0.15);
  --glow-pink: 0 0 20px rgba(255, 79, 163, 0.4), 0 0 50px rgba(255, 79, 163, 0.12);

  /* 动效 */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.27, 1.55);
  --motion: var(--ease-smooth);
  --dur-fast: 120ms;
  --dur-med: 240ms;
  --dur-slow: 480ms;

  /* 琴键 */
  --key-white: #1c2452;
  --key-black: #0a0e24;
}
```

- [ ] **Step 2: 替换文件末尾的第二个 `:root`（行 2038-2062，"Final polish" 注释后的那个）**

将行 2038-2062 整个替换为：

```css
/* ===== 霓虹舞台 · 深色主题（覆盖层） ===== */
:root {
  --bg: #060814;
  --bg-panel: rgba(13, 18, 48, 0.88);
  --bg-soft: rgba(19, 26, 63, 0.72);
  --bg-ink: #eef2ff;
  --primary: #22e5ff;
  --primary-2: #a06bff;
  --accent: #ff4fa3;
  --accent-2: #ffd60a;
  --joy: #ff4fa3;
  --mint: #3dffc0;
  --success: #3dffc0;
  --warning: #ffd60a;
  --danger: #ff5470;
  --text: #eef2ff;
  --text-soft: #8a95c9;
  --text-faint: #4a5280;
  --line: rgba(138, 149, 201, 0.22);
  --line-soft: rgba(138, 149, 201, 0.12);
  --shadow: 0 24px 58px rgba(0, 0, 0, 0.4);
  --shadow-soft: 0 12px 28px rgba(0, 0, 0, 0.3);
  --glow-primary: 0 0 24px rgba(34, 229, 255, 0.4), 0 0 60px rgba(34, 229, 255, 0.12);
  --glow-mint: 0 0 20px rgba(61, 255, 192, 0.3);
}
```

- [ ] **Step 3: 替换 body 背景（两处）**

将行 42-54 的 `body` 替换为：

```css
body {
  font-family: var(--font);
  background:
    radial-gradient(ellipse at 20% 50%, rgba(160, 107, 255, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(34, 229, 255, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(255, 79, 163, 0.05) 0%, transparent 50%),
    var(--bg-deep);
  color: var(--text);
  overflow: hidden;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.3s;
  touch-action: manipulation;
}
```

将行 2064-2077 的末尾 `body` 和 `body::before` 替换为：

```css
body {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(160, 107, 255, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(34, 229, 255, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(255, 79, 163, 0.05) 0%, transparent 50%),
    var(--bg-deep);
}

body::before {
  background-image:
    radial-gradient(circle at 25% 25%, rgba(34, 229, 255, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 79, 163, 0.03) 0%, transparent 50%);
  background-size: 100% 100%;
  opacity: 0.78;
  mask-image: none;
}
```

- [ ] **Step 4: 添加全局发光工具类和 reduced-motion 支持（追加到文件末尾）**

```css
/* ===== 霓虹舞台 · 全局工具 ===== */
.glow-cyan { box-shadow: var(--glow-primary); }
.glow-gold { box-shadow: var(--glow-gold); }
.glow-pink { box-shadow: var(--glow-pink); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: 验证构建**

Run: `cd D:\AI\music-app && npx tsc -b && npx vite build`
Expected: 构建成功，无 CSS 错误

- [ ] **Step 6: Commit**

```bash
git add src/index.css
git commit -m "feat: neon stage design tokens + dark theme base"
```

---

### Task 2: 通用组件深色适配（卡片、按钮、面板）

**Files:**
- Modify: `src/index.css`（`.card`、`.back-btn`、通用按钮样式块、`.app::after`）

**Interfaces:**
- Consumes: Task 1 的 token
- Produces: 所有用 `.card` 的页面自动获得深色卡片样式

- [ ] **Step 1: 修改 `.card`（行 421-428）**

```css
.card {
  background: var(--bg-card);
  border-radius: var(--radius);
  border: 1px solid var(--line-neon);
  box-shadow: var(--shadow-soft);
  padding: 20px;
  backdrop-filter: blur(12px);
}
```

- [ ] **Step 2: 修改末尾 `.card` 覆盖（行 1537-1544）**

```css
.card {
  border: 1px solid var(--line-neon);
  background:
    linear-gradient(180deg, rgba(19, 26, 63, 0.9), rgba(13, 18, 48, 0.78)),
    var(--bg-card);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
}
```

- [ ] **Step 3: 修改通用按钮样式（行 1622-1658）**

将 `/* 按钮通用 */` 到 `.primary-action` 的整段替换为：

```css
.hero-actions button,
.pro-actions button,
.quick-tools button,
.pro-student button,
.back-btn,
.step-action,
.lesson-secondary,
.lesson-main-head button,
.lesson-actions button {
  border: 1px solid var(--line-neon);
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.6);
  color: var(--text);
  font-weight: 900;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.16s var(--ease-spring), box-shadow 0.16s ease, filter 0.16s ease, border-color 0.16s ease;
}

.hero-actions button:hover,
.pro-actions button:hover,
.quick-tools button:hover,
.work-card:hover,
.training-card:hover,
.song-card:hover,
.course-tab:hover,
.station:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow), 0 0 16px rgba(34, 229, 255, 0.15);
  border-color: rgba(34, 229, 255, 0.5);
}

.primary-action,
.hero-actions .primary-action,
.pro-actions .primary-action {
  border-color: transparent;
  background: linear-gradient(135deg, var(--neon-cyan), #1a9fd4);
  color: #060814;
  box-shadow: var(--glow-primary);
}
```

- [ ] **Step 4: 修改 `.app::after` 顶部光带（行 2079-2092）**

```css
.app::after {
  content: '';
  position: fixed;
  left: 292px;
  right: 0;
  top: 72px;
  height: 2px;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, var(--neon-cyan), var(--neon-purple), var(--neon-pink), transparent);
  background-size: 220% 100%;
  opacity: 0.5;
  animation: spectrumFlow 7s linear infinite;
  z-index: 9;
}
```

- [ ] **Step 5: 修改 review-list 等通用交互元素（行 1834-1856）**

```css
.review-list button,
.weak-chip-row button,
.topic-list button,
.demo-control-row button,
.lesson-steps button,
.lesson-card-grid > div,
.lesson-summary > div,
.quest-topic-grid button {
  border: 1px solid var(--line-neon);
  background: rgba(28, 36, 82, 0.5);
  box-shadow: var(--shadow-soft);
  transition: transform 0.15s var(--ease-spring), box-shadow 0.15s ease, border-color 0.15s ease;
}

.review-list button:hover,
.weak-chip-row button:hover,
.topic-list button:hover,
.demo-control-row button:hover,
.lesson-steps button:hover,
.quest-topic-grid button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow), 0 0 12px rgba(34, 229, 255, 0.12);
  border-color: rgba(34, 229, 255, 0.5);
}
```

- [ ] **Step 6: 验证构建**

Run: `cd D:\AI\music-app && npx vite build`
Expected: 构建成功

- [ ] **Step 7: Commit**

```bash
git add src/index.css
git commit -m "feat: dark theme cards, buttons, panels with neon borders"
```

---

### Task 3: 侧边栏深色霓虹化

**Files:**
- Modify: `src/index.css`（`.sidebar` 相关样式、`.side-logo`、`.side-item`、`.side-icon`、`.side-group-title`、`.side-foot`）

**Interfaces:**
- Consumes: Task 1 token
- Produces: 深色霓虹侧边栏

- [ ] **Step 1: 修改 `.sidebar`（行 111-124）**

```css
.sidebar {
  width: 248px;
  flex-shrink: 0;
  background: rgba(6, 8, 20, 0.92);
  border-right: 1px solid var(--line-neon);
  box-shadow: none;
  display: flex;
  flex-direction: column;
  padding: 18px 14px;
  overflow-y: auto;
  z-index: 20;
  backdrop-filter: blur(20px);
}
```

- [ ] **Step 2: 修改 `.side-logo-icon`（行 134-144）**

```css
.side-logo-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
  color: #060814;
  font-size: 1.2rem;
  box-shadow: var(--glow-primary);
}
```

- [ ] **Step 3: 修改 `.side-item` 和 `.side-item.active`（行 167-188）**

```css
.side-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border-radius: var(--radius);
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 750;
  text-align: left;
  transition: background 0.15s, color 0.15s, transform 0.1s, border-color 0.15s;
  border: 1px solid transparent;
}
.side-item:hover {
  background: rgba(28, 36, 82, 0.6);
  border-color: var(--line-neon);
}
.side-item.active {
  background: rgba(34, 229, 255, 0.1);
  color: var(--neon-cyan);
  box-shadow: inset 3px 0 0 var(--neon-cyan), 0 0 12px rgba(34, 229, 255, 0.1);
  border-color: rgba(34, 229, 255, 0.25);
}
```

- [ ] **Step 4: 修改 `.side-icon` 和 `.side-item.active .side-icon`（行 189-202）**

```css
.side-icon {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  background: rgba(138, 149, 201, 0.1);
  font-size: 1rem;
  text-align: center;
  transition: transform 0.15s var(--ease-spring), box-shadow 0.15s ease;
}
.side-item:hover .side-icon {
  transform: scale(1.1);
  box-shadow: 0 0 8px rgba(34, 229, 255, 0.2);
}
.side-item.active .side-icon {
  background: var(--neon-cyan);
  color: #060814;
  box-shadow: 0 0 12px rgba(34, 229, 255, 0.4);
}
```

- [ ] **Step 5: 修改 `.side-group-title`（行 159-166）**

```css
.side-group-title {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-faint);
  padding: 5px 12px 7px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-bottom: 1px solid;
  border-image: linear-gradient(90deg, var(--neon-cyan), transparent) 1;
  margin-bottom: 6px;
}
```

- [ ] **Step 6: 修改 `.side-foot` 和 `.side-foot span`（行 203-208 和 1403-1410）**

两处 `.side-foot` 都改为：

```css
.side-foot {
  padding: 14px 8px 4px;
  font-size: 0.72rem;
  color: var(--text-soft);
  text-align: left;
}
.side-foot span {
  color: var(--neon-cyan);
  font-weight: 950;
}
.side-foot b {
  font-size: 0.72rem;
  color: var(--text-faint);
}
```

- [ ] **Step 7: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx vite build
git add src/index.css
git commit -m "feat: neon sidebar with glowing active states"
```

---

### Task 4: 顶栏深色霓虹化 + UI 音效开关

**Files:**
- Modify: `src/index.css`（`.topbar` 相关、`.topbar-pulse`、`.seg`、`.toolbtn`、`.backbtn`、`.stu-current`）
- Modify: `src/components/TopBar.tsx`

**Interfaces:**
- Consumes: Task 1 token
- Produces: 深色顶栏 + 音效开关按钮（UI 音效逻辑在 Task 7 实现，这里先加按钮 UI）

- [ ] **Step 1: 修改 `.topbar`（行 211-223 和行 1412-1418 两处）**

两处都改为：

```css
.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 68px;
  padding: 12px 24px;
  background: rgba(6, 8, 20, 0.85);
  border-bottom: 1px solid var(--line-neon);
  box-shadow: none;
  z-index: 10;
  flex-shrink: 0;
  backdrop-filter: blur(20px);
}
```

第二处（行 1412 附近）覆盖层：

```css
.topbar {
  min-height: 72px;
  padding: 12px 24px;
  background: rgba(6, 8, 20, 0.85);
  border-bottom: 1px solid var(--line-neon);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
```

- [ ] **Step 2: 修改 `.topbar-pulse` 背景（行 1433-1441）**

```css
.topbar-pulse {
  display: flex;
  align-items: end;
  gap: 3px;
  height: 28px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
}
```

- [ ] **Step 3: 修改 `.topbar .backbtn`（行 243-268 和行 1492-1495 两处）**

行 243 附近：

```css
.topbar .backbtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: min(250px, 30vw);
  min-height: 38px;
  padding: 8px 12px;
  border: 1px solid var(--line-neon);
  border-radius: var(--radius);
  background: rgba(34, 229, 255, 0.08);
  color: var(--neon-cyan);
  font-size: 0.9rem;
  font-weight: 900;
  white-space: nowrap;
  transition: transform 0.1s, background 0.2s, border-color 0.2s;
}
```

行 1492 附近：

```css
.topbar .backbtn {
  background: rgba(34, 229, 255, 0.08);
  color: var(--neon-cyan);
}
```

- [ ] **Step 4: 修改 `.topbar .toolbtn`、`.topbar .seg`（行 272-312 和行 1476-1513）**

`.toolbtn`（两处都改）：

```css
.topbar .toolbtn {
  min-height: 38px;
  padding: 8px 14px;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 800;
  transition: transform 0.1s var(--ease-spring), background 0.2s, border-color 0.2s, box-shadow 0.15s ease;
}
.topbar .toolbtn:hover {
  transform: translateY(-1px);
  border-color: rgba(34, 229, 255, 0.5);
  box-shadow: 0 0 10px rgba(34, 229, 255, 0.15);
}
.topbar .toolbtn.active {
  background: rgba(34, 229, 255, 0.15);
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
  box-shadow: 0 0 12px rgba(34, 229, 255, 0.2);
}
```

`.seg` 和 `.seg button`（两处都改）：

```css
.topbar .seg {
  display: flex;
  min-height: 40px;
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  border-radius: var(--radius);
  padding: 3px;
  gap: 3px;
}
.topbar .seg button {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--text-soft);
  transition: color 0.15s, background 0.15s, box-shadow 0.15s;
}
.topbar .seg button.on {
  background: rgba(34, 229, 255, 0.15);
  color: var(--neon-cyan);
  box-shadow: 0 0 10px rgba(34, 229, 255, 0.2);
}
```

行 1476-1513 的覆盖层也同步改（`.toolbtn`、`.backbtn`、`.stu-current`、`.seg` 的玻璃背景改为深色）：

```css
.topbar .toolbtn,
.topbar .backbtn,
.stu-current,
.topbar .seg {
  border: 1px solid var(--line-neon);
  background: rgba(28, 36, 82, 0.5);
  box-shadow: var(--shadow-soft);
}

.topbar .toolbtn:hover,
.topbar .backbtn:hover,
.stu-current:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow), 0 0 12px rgba(34, 229, 255, 0.12);
}

.topbar .backbtn {
  background: rgba(34, 229, 255, 0.08);
  color: var(--neon-cyan);
}

.topbar .toolbtn.active,
.topbar .seg button.on,
.stu-option.on {
  background: rgba(34, 229, 255, 0.15);
  color: var(--neon-cyan);
  box-shadow: 0 0 12px rgba(34, 229, 255, 0.2);
}

.topbar .seg {
  min-height: 42px;
  padding: 4px;
}

.topbar .seg button {
  min-width: 54px;
  border-radius: 8px;
}
```

- [ ] **Step 5: 修改 `.stu-avatar`（行 1515-1525）**

```css
.stu-avatar {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  background: rgba(160, 107, 255, 0.15);
  color: var(--neon-purple);
  font-size: 0.8rem;
  font-weight: 950;
}
```

- [ ] **Step 6: 修改 `.stu-dropdown`（行 1527-1531）**

```css
.stu-dropdown {
  border: 1px solid var(--line-neon);
  background: rgba(13, 18, 48, 0.92);
  backdrop-filter: blur(24px);
}
```

- [ ] **Step 7: 修改 `.hamburger`（行 98-106 和 1462-1474）**

```css
.hamburger {
  display: none;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  color: var(--text);
  font-size: 1.15rem;
  border: 1px solid var(--line-neon);
  background: rgba(28, 36, 82, 0.5);
}

.hamburger span {
  display: block;
  width: 18px;
  height: 2px;
  margin: 4px auto;
  border-radius: 999px;
  background: var(--text);
}
```

- [ ] **Step 8: 在 TopBar.tsx 加 UI 音效开关按钮**

Modify: `src/components/TopBar.tsx`

在 `MODE_LABEL` 后添加：

```tsx
const SOUND_PREF_KEY = 'music-edu-ui-sound-v1'
function loadSoundPref(): boolean {
  try {
    return localStorage.getItem(SOUND_PREF_KEY) === '1'
  } catch { return false }
}
function saveSoundPref(on: boolean): void {
  try { localStorage.setItem(SOUND_PREF_KEY, on ? '1' : '0') } catch { /* ignore */ }
}
```

在 TopBar 组件内 `isInstrument` 行后添加：

```tsx
const [uiSoundOn, setUiSoundOn] = useState(loadSoundPref)
const toggleUiSound = () => {
  setUiSoundOn((v) => {
    const next = !v
    saveSoundPref(next)
    return next
  })
}
```

（注意：需要在文件顶部添加 `import { useState } from 'react'`）

在 `{isInstrument && (...)}` 块后、`{mode !== 'lecture' && ...}` 前添加：

```tsx
<button
  className={`toolbtn ${uiSoundOn ? 'active' : ''}`}
  onClick={toggleUiSound}
  title={uiSoundOn ? '关闭交互音效' : '开启交互音效'}
>
  {uiSoundOn ? '🔊 音效' : '🔇 音效'}
</button>
```

- [ ] **Step 9: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx tsc -b && npx vite build
git add src/index.css src/components/TopBar.tsx
git commit -m "feat: neon topbar with UI sound toggle"
```

---

### Task 5: 首页 Hero 区霓虹化

**Files:**
- Modify: `src/index.css`（`.music-hero`、`.music-hero::before`、`.hero-console`、`.hero-wave`、`.hero-status-grid`、`.hero-note-strip`、`.pro-kicker`、`.home-entry-panel` 等）

**Interfaces:**
- Consumes: Task 1-2 token
- Produces: 深色霓虹首页 Hero

- [ ] **Step 1: 修改 `.music-hero`（行 1551-1559 和行 2099-2107 两处）**

行 1551 附近：

```css
.music-hero {
  position: relative;
  min-height: 360px;
  padding: 34px;
  background:
    linear-gradient(105deg, rgba(34, 229, 255, 0.08), transparent 34%),
    linear-gradient(62deg, transparent 44%, rgba(255, 79, 163, 0.08), transparent 72%),
    linear-gradient(135deg, rgba(19, 26, 63, 0.94), rgba(6, 8, 20, 0.85));
  overflow: hidden;
}
```

行 2099 附近：

```css
.music-hero {
  min-height: 390px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 430px);
  align-items: center;
  background:
    linear-gradient(135deg, rgba(19, 26, 63, 0.94), rgba(6, 8, 20, 0.85)),
    repeating-linear-gradient(0deg, transparent 0 34px, rgba(34, 229, 255, 0.04) 34px 35px);
}
```

- [ ] **Step 2: 修改 `.music-hero::before`（行 1562-1575 和行 2109-2121 两处）**

行 1562 附近：

```css
.music-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  width: auto;
  height: auto;
  border-radius: 0;
  background:
    repeating-linear-gradient(90deg, transparent 0 24px, rgba(34, 229, 255, 0.03) 24px 25px),
    linear-gradient(90deg, transparent, rgba(160, 107, 255, 0.06), transparent);
  filter: none;
  opacity: 0.76;
  animation: spectrumFlow 12s linear infinite;
}
```

行 2109 附近：

```css
.music-hero::before {
  inset: 0;
  width: auto;
  height: auto;
  border-radius: 0;
  background:
    linear-gradient(108deg, transparent 8%, rgba(34, 229, 255, 0.06) 22%, transparent 36%),
    linear-gradient(72deg, transparent 48%, rgba(255, 79, 163, 0.06) 62%, transparent 78%);
  filter: none;
  opacity: 1;
  animation: spectrumFlow 11s linear infinite;
  background-size: 180% 100%;
}
```

- [ ] **Step 3: 修改 `.hero-console`（行 1682-1698）**

```css
.hero-console {
  position: relative;
  width: min(370px, 100%);
  min-height: 268px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  border: 1px solid var(--line-neon);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(28, 36, 82, 0.74), rgba(13, 18, 48, 0.6)),
    repeating-linear-gradient(0deg, transparent 0 31px, rgba(34, 229, 255, 0.04) 31px 32px),
    linear-gradient(115deg, rgba(34, 229, 255, 0.06), transparent 42%, rgba(160, 107, 255, 0.06));
  box-shadow: var(--shadow);
  overflow: hidden;
}
```

- [ ] **Step 4: 修改 `.hero-console::before`（行 1700-1707）**

```css
.hero-console::before {
  content: '';
  position: absolute;
  inset: 20px;
  border: 1px solid rgba(34, 229, 255, 0.1);
  border-radius: var(--radius);
  background: linear-gradient(90deg, transparent, rgba(34, 229, 255, 0.04), transparent);
}
```

- [ ] **Step 5: 修改 `.hero-wave i`（行 1747-1753）**

```css
.hero-wave i {
  width: 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--neon-cyan), var(--neon-purple));
  box-shadow: 0 0 12px rgba(34, 229, 255, 0.25);
  animation: pulseBar 1s ease-in-out infinite;
}
```

- [ ] **Step 6: 修改 `.hero-status-grid span` 和 `.hero-status-grid b`（行 1771-1789）**

```css
.hero-status-grid span {
  display: flex;
  min-height: 60px;
  flex-direction: column;
  justify-content: center;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.6);
  color: var(--text-soft);
  font-size: 0.76rem;
  font-weight: 850;
  text-align: center;
  box-shadow: var(--shadow-soft);
  border: 1px solid var(--line-neon);
}

.hero-status-grid b {
  color: var(--neon-cyan);
  font-size: 1.35rem;
  line-height: 1.1;
}
```

- [ ] **Step 7: 修改 `.hero-note-strip span`（行 1797-1807）**

```css
.hero-note-strip span {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.7);
  color: var(--neon-cyan);
  font-weight: 950;
  box-shadow: var(--shadow-soft);
  border: 1px solid var(--line-neon);
}
```

- [ ] **Step 8: 修改 `.pro-kicker` 等标签色（行 1587-1594）**

```css
.pro-kicker,
.theory-kicker,
.course-kicker,
.training-kicker,
.lesson-kicker {
  color: var(--neon-cyan);
  letter-spacing: 0.12em;
}
```

- [ ] **Step 9: 修改 `.music-hero h1`（行 1596-1605）**

```css
.music-hero h1 {
  max-width: 720px;
  margin: 0 0 12px;
  color: var(--text);
  font-size: clamp(2.3rem, 4vw, 4.7rem);
  font-weight: 950;
  line-height: 1.02;
  letter-spacing: 0;
  text-wrap: balance;
  text-shadow: 0 0 30px rgba(34, 229, 255, 0.15), 0 0 80px rgba(34, 229, 255, 0.05);
}
```

- [ ] **Step 10: 修改 `.review-home` 和 `.review-block`（行 1822-1832）**

```css
.review-home {
  grid-template-columns: 1.1fr 1fr 1fr;
  background:
    linear-gradient(135deg, rgba(19, 26, 63, 0.88), rgba(13, 18, 48, 0.78)),
    var(--bg-card);
}

.review-block {
  border: 1px solid var(--line-neon);
  background: rgba(28, 36, 82, 0.5);
}
```

- [ ] **Step 11: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx vite build
git add src/index.css
git commit -m "feat: neon home hero with glowing console and waveform"
```

---

### Task 6: 钢琴琴键霓虹发光

**Files:**
- Modify: `src/index.css`（`.piano`、`.white-key`、`.black-key` 相关样式 —— 用 Grep 搜索 `.white-key` 和 `.black-key` 定位）
- Modify: `src/pages/piano.css`

**Interfaces:**
- Consumes: Task 1 token
- Produces: 按下发光 + 涟漪 + 粒子的钢琴键盘

- [ ] **Step 1: 查看现有琴键样式**

用 Grep 在 `src/index.css` 和 `src/pages/piano.css` 中搜索 `.white-key`、`.black-key`、`.piano`，了解现有样式结构。

- [ ] **Step 2: 修改 `src/pages/piano.css`**

将文件整个替换为：

```css
/* 钢琴页 · 霓虹舞台 */
.instrument-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.instrument-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border-radius: var(--radius);
  background: var(--bg-panel);
  border: 1px solid var(--line-neon);
}

.instrument-toolbar.row2 {
  gap: 10px;
}

.ctrl-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctrl-label {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--text-soft);
  white-space: nowrap;
}

.ctrl-val {
  font-weight: 900;
  color: var(--neon-cyan);
  min-width: 32px;
  text-align: center;
}

.rec-btn {
  min-height: 38px;
  padding: 8px 14px;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-weight: 800;
  font-size: 0.88rem;
  transition: transform 0.1s var(--ease-spring), box-shadow 0.15s ease, border-color 0.15s;
}
.rec-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(34, 229, 255, 0.5);
  box-shadow: 0 0 10px rgba(34, 229, 255, 0.12);
}
.rec-btn.on {
  background: rgba(255, 84, 112, 0.15);
  border-color: var(--danger);
  color: var(--danger);
  box-shadow: 0 0 10px rgba(255, 84, 112, 0.2);
}
.rec-btn.on-accent {
  background: rgba(34, 229, 255, 0.12);
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
  box-shadow: 0 0 10px rgba(34, 229, 255, 0.15);
}
.rec-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.mini-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-weight: 900;
  font-size: 1rem;
  display: grid;
  place-items: center;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.mini-btn:hover {
  border-color: rgba(34, 229, 255, 0.5);
  box-shadow: 0 0 8px rgba(34, 229, 255, 0.15);
}

select {
  min-height: 36px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-weight: 700;
  font-family: inherit;
}

input[type="range"] {
  accent-color: var(--neon-cyan);
  width: 100px;
}

/* 节拍器指示点 */
.beat-dots {
  display: flex;
  gap: 6px;
}
.beat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(138, 149, 201, 0.3);
  transition: background 0.1s, box-shadow 0.1s;
}
.beat-dot.on {
  background: var(--neon-cyan);
  box-shadow: 0 0 8px var(--neon-cyan);
}
.beat-dots.dim .beat-dot {
  opacity: 0.3;
}

/* 音色选择器 */
.patch-picker {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.patch-btn {
  min-height: 36px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-weight: 700;
  font-size: 0.85rem;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.patch-btn:hover {
  border-color: rgba(34, 229, 255, 0.5);
}
.patch-btn.on {
  background: rgba(34, 229, 255, 0.12);
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
  box-shadow: 0 0 10px rgba(34, 229, 255, 0.15);
}

/* 和弦按钮 */
.chord-group {
  gap: 6px;
}
.chord-btn {
  min-width: 44px;
  min-height: 36px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--neon-gold);
  font-weight: 900;
  font-size: 0.9rem;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s var(--ease-spring);
}
.chord-btn:hover {
  border-color: rgba(255, 214, 10, 0.5);
  box-shadow: 0 0 10px rgba(255, 214, 10, 0.15);
  transform: translateY(-1px);
}
.chord-btn:active {
  transform: scale(0.95);
}

/* 钢琴加载状态 */
.piano-load {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-faint);
}
.piano-load.sampled {
  color: var(--neon-green);
}
.piano-load.loading {
  color: var(--neon-gold);
}

/* 舞台区域 */
.piano-stage {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: var(--radius-lg);
  background: var(--bg-panel);
  border: 1px solid var(--line-neon);
  overflow: hidden;
}

/* 可视化层 */
.viz-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  overflow: hidden;
}
.viz-bubble {
  position: absolute;
  bottom: 40%;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 950;
  font-size: 0.85rem;
  color: #060814;
  transition: transform 0.9s var(--ease-smooth), opacity 0.9s ease;
  pointer-events: none;
}

/* 钢琴本体 */
.piano {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 16px;
  min-height: 0;
}

.white-row {
  flex: 1;
  display: flex;
  gap: 3px;
}

.white-key {
  flex: 1;
  position: relative;
  border-radius: 0 0 8px 8px;
  background: linear-gradient(180deg, #1c2452 0%, #141b42 85%, #0d1230 100%);
  border: 1px solid rgba(138, 149, 201, 0.2);
  border-top: none;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, transform 0.08s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  min-height: 120px;
}

.white-key:hover {
  background: linear-gradient(180deg, #242e5e 0%, #1a2249 85%, #101638 100%);
}

.white-key.active {
  background: var(--note-c);
  box-shadow: 0 0 20px currentColor, 0 0 60px currentColor, inset 0 0 20px rgba(255, 255, 255, 0.15);
  transform: scaleY(0.98);
  border-color: transparent;
}

.white-key.dim-key {
  opacity: 0.35;
}

.white-key.scale-key {
  border-bottom: 3px solid var(--neon-green);
}

.key-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  pointer-events: none;
}
.key-label b {
  font-size: 1rem;
  font-weight: 950;
  color: var(--text);
}
.key-label small {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-faint);
}
.white-key.active .key-label b,
.white-key.active .key-label small {
  color: #060814;
}

.black-row {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  gap: 3px;
  z-index: 3;
  pointer-events: none;
}

.black-slot {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  padding-right: calc(0.5% - 2px);
}

.black-key {
  width: 62%;
  height: 60%;
  min-height: 80px;
  border-radius: 0 0 6px 6px;
  background: linear-gradient(180deg, #0a0e24 0%, #060814 100%);
  border: 1px solid rgba(138, 149, 201, 0.15);
  border-top: none;
  cursor: pointer;
  pointer-events: auto;
  transition: background 0.15s, box-shadow 0.15s, transform 0.08s;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

.black-key:hover {
  background: linear-gradient(180deg, #121738 0%, #0a0e24 100%);
}

.black-key.active {
  background: var(--note-c);
  box-shadow: 0 0 20px currentColor, 0 0 50px currentColor;
  transform: scaleY(0.96);
  border-color: transparent;
}

.black-key.dim-key {
  opacity: 0.25;
}

/* 响应式：触屏加大琴键 */
@media (pointer: coarse) {
  .white-key {
    min-height: 160px;
  }
  .black-key {
    min-height: 100px;
  }
}
```

- [ ] **Step 3: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx vite build
git add src/pages/piano.css
git commit -m "feat: neon piano keys with glow feedback"
```

---

### Task 7: UI 音效引擎

**Files:**
- Create: `src/music/uiSounds.ts`
- Modify: `src/components/TopBar.tsx`（接入音效开关）

**Interfaces:**
- Consumes: `src/music/audioEngine.ts` 的 `ensureAudio`、`playNote`、`playDrum`
- Produces: `playUI(name: UISoundName)`、`setUISoundEnabled(on: boolean)`、`isUISoundEnabled(): boolean`

- [ ] **Step 1: 创建 `src/music/uiSounds.ts`**

```ts
// UI 音效引擎：课堂正反馈音效，只保留 5 个关键场景
// 默认关闭，老师在 TopBar 手动开启
import { ensureAudio, playNote, playDrum } from './audioEngine'

export type UISoundName = 'correct' | 'fanfare' | 'countdown' | 'star' | 'combo'

const PREF_KEY = 'music-edu-ui-sound-v1'
let enabled = loadPref()

function loadPref(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === '1'
  } catch {
    return false
  }
}

export function setUISoundEnabled(on: boolean): void {
  enabled = on
  try {
    localStorage.setItem(PREF_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function isUISoundEnabled(): boolean {
  return enabled
}

/** 播放 UI 音效（只在开启时发声） */
export async function playUI(name: UISoundName): Promise<void> {
  if (!enabled) return
  await ensureAudio()
  switch (name) {
    case 'correct':
      // 明亮上行琶音 C-E-G（300ms 内完成）
      playNote('C5', '32n', 0.5)
      setTimeout(() => playNote('E5', '32n', 0.5), 80)
      setTimeout(() => playNote('G5', '32n', 0.5), 160)
      break
    case 'fanfare':
      // 胜利号角：三和弦 C-E-G-C + 低频冲击
      playNote('C4', '2n', 0.6)
      playNote('E4', '2n', 0.6)
      playNote('G4', '2n', 0.6)
      playNote('C5', '2n', 0.7)
      playDrum('kick')
      setTimeout(() => playDrum('crash'), 200)
      break
    case 'countdown':
      // 鼓点递进（最后一击加铜钹）
      playDrum('kick')
      setTimeout(() => playDrum('kick'), 400)
      setTimeout(() => {
        playDrum('kick')
        playDrum('crash')
      }, 800)
      break
    case 'star':
      // 清脆"叮"（C6 八音盒感）
      playNote('C6', '16n', 0.4, 'musicbox')
      break
    case 'combo':
      // 金属铃声音高递进
      playNote('C6', '32n', 0.4)
      setTimeout(() => playNote('E6', '32n', 0.4), 60)
      setTimeout(() => playNote('G6', '32n', 0.45), 120)
      break
  }
}
```

- [ ] **Step 2: 在 TopBar.tsx 接入音效开关**

将 Task 4 Step 8 中的本地 state 替换为使用 `uiSounds.ts`：

Modify `src/components/TopBar.tsx`：

在文件顶部 import 区域添加：

```tsx
import { setUISoundEnabled, isUISoundEnabled } from '../music/uiSounds'
```

将 Task 4 添加的 `SOUND_PREF_KEY`、`loadSoundPref`、`saveSoundPref` 函数**删除**，替换为：

```tsx
const [uiSoundOn, setUiSoundOn] = useState(isUISoundEnabled)
const toggleUiSound = () => {
  setUiSoundOn((v) => {
    const next = !v
    setUISoundEnabled(next)
    return next
  })
}
```

（按钮 JSX 保持不变）

- [ ] **Step 3: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx tsc -b && npx vite build
git add src/music/uiSounds.ts src/components/TopBar.tsx
git commit -m "feat: UI sound engine with 5 core feedback sounds"
```

---

### Task 8: 鼓垫/竖笛/混音器霓虹化

**Files:**
- Modify: `src/pages/drums.css`
- Modify: `src/pages/recorder.css`
- Modify: `src/pages/mixer.css`

**Interfaces:**
- Consumes: Task 1 token
- Produces: 深色鼓垫、竖笛、混音器

- [ ] **Step 1: 修改 `src/pages/drums.css`**

将文件整个替换为：

```css
/* 架子鼓 · 霓虹舞台 */
.drum-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.drum-pads {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  flex-wrap: wrap;
}

.drum-pad {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 950;
  font-size: 0.9rem;
  color: var(--text);
  cursor: pointer;
  border: 3px solid rgba(138, 149, 201, 0.25);
  background: linear-gradient(145deg, #1c2452, #131a3f);
  transition: transform 0.1s var(--ease-spring), box-shadow 0.15s ease, border-color 0.15s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.2);
  user-select: none;
}

.drum-pad:hover {
  border-color: rgba(34, 229, 255, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 16px rgba(34, 229, 255, 0.12);
}

.drum-pad.hit {
  transform: scale(0.9);
  box-shadow: 0 0 30px currentColor, 0 0 80px currentColor;
  border-color: currentColor;
}

.drum-pad small {
  font-size: 0.65rem;
  opacity: 0.6;
  font-weight: 700;
}

/* 循环机 */
.seq-section {
  padding: 16px;
  border-radius: var(--radius);
  background: var(--bg-panel);
  border: 1px solid var(--line-neon);
}

.seq-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.seq-header h3 {
  font-size: 1rem;
  color: var(--text);
}

.seq-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.seq-btn {
  min-height: 36px;
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-weight: 800;
  font-size: 0.85rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.seq-btn:hover {
  border-color: rgba(34, 229, 255, 0.5);
  box-shadow: 0 0 8px rgba(34, 229, 255, 0.12);
}
.seq-btn.playing {
  background: rgba(61, 255, 192, 0.12);
  border-color: var(--neon-green);
  color: var(--neon-green);
  box-shadow: 0 0 10px rgba(61, 255, 192, 0.15);
}

.preset-btn {
  min-height: 32px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(28, 36, 82, 0.4);
  border: 1px solid var(--line-soft);
  color: var(--text-soft);
  font-weight: 700;
  font-size: 0.78rem;
  transition: border-color 0.15s, color 0.15s;
}
.preset-btn:hover {
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
}

/* 音轨 */
.seq-track {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.seq-track-label {
  width: 50px;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--text-soft);
  text-align: right;
}

.seq-cells {
  display: flex;
  gap: 3px;
  flex: 1;
}

.seq-cell {
  flex: 1;
  min-height: 32px;
  border-radius: 4px;
  background: rgba(28, 36, 82, 0.3);
  border: 1px solid rgba(138, 149, 201, 0.1);
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s, box-shadow 0.1s;
}

.seq-cell:hover {
  border-color: rgba(34, 229, 255, 0.3);
}

.seq-cell.on {
  border-color: transparent;
}

.seq-cell.now {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.seq-cell.now.on {
  box-shadow: 0 0 16px currentColor, 0 0 40px currentColor;
}
```

- [ ] **Step 2: 修改 `src/pages/recorder.css`**

将文件整个替换为：

```css
/* 竖笛 · 霓虹舞台 */
.recorder-stage {
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 20px;
  min-height: 0;
}

.recorder-keys {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
}

.recorder-key {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 10px 20px;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-weight: 800;
  transition: background 0.15s, box-shadow 0.15s, border-color 0.15s, transform 0.1s var(--ease-spring);
  min-width: 200px;
}

.recorder-key:hover {
  border-color: rgba(34, 229, 255, 0.5);
  box-shadow: 0 0 10px rgba(34, 229, 255, 0.12);
}

.recorder-key.on {
  background: rgba(34, 229, 255, 0.15);
  border-color: var(--neon-cyan);
  box-shadow: 0 0 20px rgba(34, 229, 255, 0.3);
  transform: scale(1.02);
}

.recorder-key b {
  font-size: 1.3rem;
  font-weight: 950;
  color: var(--neon-cyan);
  min-width: 28px;
}

.recorder-key small {
  font-size: 0.82rem;
  color: var(--text-soft);
  font-weight: 700;
}

.rk-key {
  margin-left: auto;
  font-size: 0.72rem;
  color: var(--text-faint);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(138, 149, 201, 0.1);
}

/* 指法图 */
.fingering {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.fingering-title {
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--text);
}

.recorder-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(28, 36, 82, 0.6), rgba(13, 18, 48, 0.5));
  border: 1px solid var(--line-neon);
}

.recorder-mouth {
  width: 40px;
  height: 16px;
  border-radius: 8px 8px 4px 4px;
  background: rgba(138, 149, 201, 0.2);
  border: 1px solid var(--line-neon);
}

.hole {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  font-weight: 800;
  border: 2px solid rgba(138, 149, 201, 0.25);
  background: rgba(6, 8, 20, 0.6);
  color: var(--text-faint);
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, color 0.15s;
}

.hole.pressed {
  background: var(--neon-gold);
  border-color: var(--neon-gold);
  color: #060814;
  box-shadow: 0 0 12px rgba(255, 214, 10, 0.4);
}

.hole.thumb {
  width: 28px;
  height: 28px;
}

.hole.thumb span {
  font-size: 0.6rem;
}

.recorder-foot {
  width: 36px;
  height: 12px;
  border-radius: 4px 4px 8px 8px;
  background: rgba(138, 149, 201, 0.15);
}

.fingering-legend {
  display: flex;
  gap: 16px;
  font-size: 0.82rem;
  color: var(--text-soft);
  font-weight: 700;
}

.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(6, 8, 20, 0.6);
  border: 2px solid rgba(138, 149, 201, 0.25);
  margin-right: 6px;
  vertical-align: middle;
}

.legend-dot.pressed {
  background: var(--neon-gold);
  border-color: var(--neon-gold);
}

.hint {
  font-size: 0.85rem;
  color: var(--text-soft);
  font-weight: 700;
}
```

- [ ] **Step 3: 修改 `src/pages/mixer.css`**

将文件整个替换为：

```css
/* 混音创作 · 霓虹舞台 */
.mixer-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.mixer-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border-radius: var(--radius);
  background: var(--bg-panel);
  border: 1px solid var(--line-neon);
}

.mixer-toolbar h3 {
  font-size: 1rem;
  color: var(--text);
}

.mix-btn {
  min-height: 36px;
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-weight: 800;
  font-size: 0.85rem;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s var(--ease-spring);
}
.mix-btn:hover {
  border-color: rgba(34, 229, 255, 0.5);
  box-shadow: 0 0 8px rgba(34, 229, 255, 0.12);
}
.mix-btn.playing {
  background: rgba(61, 255, 192, 0.12);
  border-color: var(--neon-green);
  color: var(--neon-green);
  box-shadow: 0 0 10px rgba(61, 255, 192, 0.15);
}
.mix-btn.danger {
  border-color: rgba(255, 84, 112, 0.3);
  color: var(--danger);
}
.mix-btn.danger:hover {
  border-color: var(--danger);
  box-shadow: 0 0 8px rgba(255, 84, 112, 0.15);
}

/* 音轨区 */
.mix-tracks {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
}

.mix-track {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius);
  background: var(--bg-panel);
  border: 1px solid var(--line-neon);
}

.mix-track-head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 120px;
}

.mix-track-icon {
  font-size: 1.2rem;
}

.mix-track-name {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--text);
}

.mix-track-note {
  font-size: 0.72rem;
  color: var(--text-faint);
  font-weight: 700;
}

.mix-cells {
  display: flex;
  gap: 2px;
  flex: 1;
}

.mix-cell {
  flex: 1;
  min-height: 32px;
  border-radius: 4px;
  background: rgba(28, 36, 82, 0.3);
  border: 1px solid rgba(138, 149, 201, 0.08);
  cursor: pointer;
  transition: background 0.1s, box-shadow 0.1s, border-color 0.1s;
}

.mix-cell:hover {
  border-color: rgba(34, 229, 255, 0.3);
}

.mix-cell.on {
  border-color: transparent;
}

.mix-cell.now {
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.mix-cell.now.on {
  box-shadow: 0 0 12px currentColor, 0 0 30px currentColor;
}

/* 音轨控制 */
.mix-track-ctrl {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mix-track-ctrl button {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 800;
  background: rgba(28, 36, 82, 0.4);
  border: 1px solid var(--line-soft);
  color: var(--text-soft);
  transition: border-color 0.15s, color 0.15s;
}
.mix-track-ctrl button:hover {
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
}
.mix-track-ctrl button.on {
  border-color: var(--neon-gold);
  color: var(--neon-gold);
  background: rgba(255, 214, 10, 0.1);
}

/* 音源选择器弹窗 */
.voice-picker {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  background: rgba(6, 8, 20, 0.8);
  backdrop-filter: blur(8px);
}

.voice-picker-panel {
  background: var(--bg-card);
  border: 1px solid var(--line-neon);
  border-radius: var(--radius-lg);
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.voice-picker-panel h3 {
  margin-bottom: 16px;
  color: var(--text);
}

.voice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.voice-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.4);
  border: 1px solid var(--line-soft);
  color: var(--text);
  font-weight: 700;
  font-size: 0.85rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.voice-item:hover {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 10px rgba(34, 229, 255, 0.15);
}

.voice-item span:first-child {
  font-size: 1.5rem;
}

/* 项目保存 */
.save-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.save-row input {
  min-height: 36px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-family: inherit;
  font-weight: 700;
}

.save-row input::placeholder {
  color: var(--text-faint);
}
```

- [ ] **Step 4: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx vite build
git add src/pages/drums.css src/pages/recorder.css src/pages/mixer.css
git commit -m "feat: neon drums, recorder, mixer styles"
```

---

### Task 9: 游戏界面霓虹化

**Files:**
- Modify: `src/pages/games/taiko.css`
- Modify: `src/pages/games/ear.css`
- Modify: `src/pages/games/sing.css`
- Modify: `src/pages/games/read.css`
- Modify: `src/components/gameResult.css`

**Interfaces:**
- Consumes: Task 1 token
- Produces: 深色游戏界面

- [ ] **Step 1: 修改 `src/pages/games/taiko.css`**

读取现有文件，将所有白色/浅色背景替换为深色，判定圈/音符加上发光效果：

```css
/* 太鼓达人 · 霓虹舞台 */
.taiko-stage {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: var(--radius-lg);
  background: var(--bg-panel);
  border: 1px solid var(--line-neon);
  overflow: hidden;
}

.taiko-canvas {
  flex: 1;
  width: 100%;
}

.taiko-hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  gap: 16px;
}

.taiko-score {
  font-size: 2rem;
  font-weight: 950;
  color: var(--neon-gold);
  text-shadow: 0 0 20px rgba(255, 214, 10, 0.3);
  font-variant-numeric: tabular-nums;
}

.taiko-combo {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--neon-cyan);
  text-shadow: 0 0 16px rgba(34, 229, 255, 0.3);
}

.taiko-soul-bar {
  width: 120px;
  height: 12px;
  border-radius: 999px;
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  overflow: hidden;
}

.taiko-soul-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--neon-green), var(--neon-cyan));
  transition: width 0.3s var(--ease-smooth);
  box-shadow: 0 0 8px rgba(61, 255, 192, 0.4);
}

/* 判定文字 */
.taiko-judge {
  position: absolute;
  left: 50%;
  top: 40%;
  transform: translate(-50%, -50%);
  font-size: 2.4rem;
  font-weight: 950;
  pointer-events: none;
  animation: taikoJudge 0.3s var(--ease-bounce);
  text-shadow: 0 0 20px currentColor;
}

.taiko-judge.great {
  color: var(--neon-gold);
}

.taiko-judge.good {
  color: var(--neon-cyan);
}

.taiko-judge.miss {
  color: var(--danger);
  opacity: 0.7;
}

@keyframes taikoJudge {
  0% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

/* 倒计时 */
.taiko-countdown {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 10;
  background: rgba(6, 8, 20, 0.6);
  backdrop-filter: blur(4px);
}

.taiko-countdown span {
  font-size: 6rem;
  font-weight: 950;
  color: var(--neon-cyan);
  text-shadow: 0 0 40px rgba(34, 229, 255, 0.4), 0 0 100px rgba(34, 229, 255, 0.15);
  animation: countPop 0.7s var(--ease-bounce);
}

@keyframes countPop {
  0% { transform: scale(3); opacity: 0; }
  60% { transform: scale(0.9); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* DON/KA 按钮 */
.taiko-buttons {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 16px 20px 20px;
}

.taiko-hit-btn {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
  font-weight: 950;
  border: 3px solid;
  cursor: pointer;
  transition: transform 0.08s var(--ease-spring), box-shadow 0.12s ease;
  user-select: none;
  color: var(--text);
}

.taiko-hit-btn.don {
  border-color: #f25050;
  background: radial-gradient(circle, rgba(242, 80, 80, 0.2), rgba(242, 80, 80, 0.05));
}

.taiko-hit-btn.don:active {
  transform: scale(0.9);
  box-shadow: 0 0 30px rgba(242, 80, 80, 0.5), 0 0 80px rgba(242, 80, 80, 0.2);
}

.taiko-hit-btn.ka {
  border-color: #5aa0f0;
  background: radial-gradient(circle, rgba(90, 160, 240, 0.2), rgba(90, 160, 240, 0.05));
}

.taiko-hit-btn.ka:active {
  transform: scale(0.9);
  box-shadow: 0 0 30px rgba(90, 160, 240, 0.5), 0 0 80px rgba(90, 160, 240, 0.2);
}

.taiko-hit-btn small {
  font-size: 0.65rem;
  font-weight: 700;
  opacity: 0.7;
}
```

保留文件其余部分不变（如果有游戏 HUD 通用样式）。

- [ ] **Step 2: 修改 `src/pages/games/ear.css`**

读取现有文件，将白色/浅色替换为深色：

```css
/* 练耳 · 霓虹舞台 */
.ear-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 24px;
  min-height: 0;
}

.ear-play-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 2rem;
  background: rgba(34, 229, 255, 0.1);
  border: 3px solid var(--neon-cyan);
  color: var(--neon-cyan);
  cursor: pointer;
  transition: transform 0.1s var(--ease-spring), box-shadow 0.15s ease;
  box-shadow: 0 0 20px rgba(34, 229, 255, 0.15);
}
.ear-play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(34, 229, 255, 0.3);
}
.ear-play-btn:active {
  transform: scale(0.95);
}

/* 琴键选项 */
.ear-keys {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.ear-key {
  min-width: 64px;
  min-height: 80px;
  border-radius: 0 0 8px 8px;
  background: linear-gradient(180deg, #1c2452 0%, #141b42 85%, #0d1230 100%);
  border: 1px solid rgba(138, 149, 201, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 8px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, transform 0.1s var(--ease-spring), border-color 0.15s;
  color: var(--text);
  font-weight: 800;
}
.ear-key:hover {
  border-color: rgba(34, 229, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 0 12px rgba(34, 229, 255, 0.15);
}
.ear-key.right {
  background: rgba(61, 255, 192, 0.2);
  border-color: var(--neon-green);
  box-shadow: 0 0 20px rgba(61, 255, 192, 0.3);
  color: var(--neon-green);
}
.ear-key.wrong {
  background: rgba(255, 84, 112, 0.15);
  border-color: var(--danger);
  box-shadow: 0 0 16px rgba(255, 84, 112, 0.2);
  color: var(--danger);
}

.ear-key b {
  font-size: 1.1rem;
}
.ear-key small {
  font-size: 0.68rem;
  color: var(--text-faint);
  font-weight: 700;
}

/* 选项按钮（音程/和弦模式） */
.ear-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.ear-option {
  min-height: 48px;
  padding: 10px 20px;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-weight: 800;
  font-size: 1rem;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s, transform 0.1s var(--ease-spring);
}
.ear-option:hover {
  border-color: rgba(34, 229, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 0 12px rgba(34, 229, 255, 0.12);
}
.ear-option.right {
  background: rgba(61, 255, 192, 0.15);
  border-color: var(--neon-green);
  color: var(--neon-green);
  box-shadow: 0 0 16px rgba(61, 255, 192, 0.25);
}
.ear-option.wrong {
  background: rgba(255, 84, 112, 0.1);
  border-color: var(--danger);
  color: var(--danger);
}
```

- [ ] **Step 3: 修改 `src/pages/games/sing.css`**

```css
/* 视唱 · 霓虹舞台 */
.sing-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: var(--radius-lg);
  background: var(--bg-panel);
  border: 1px solid var(--line-neon);
  overflow: hidden;
}

.sing-canvas {
  flex: 1;
  width: 100%;
}

.sing-hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  gap: 16px;
}

.sing-note {
  font-size: 1.8rem;
  font-weight: 950;
  color: var(--neon-gold);
  text-shadow: 0 0 16px rgba(255, 214, 10, 0.3);
}

.sing-progress {
  flex: 1;
  max-width: 300px;
  height: 8px;
  border-radius: 999px;
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  overflow: hidden;
}

.sing-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--neon-cyan), var(--neon-purple));
  transition: width 0.3s linear;
  box-shadow: 0 0 8px rgba(34, 229, 255, 0.3);
}

.sing-perm {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex: 1;
  color: var(--text-soft);
  font-size: 1.05rem;
}

.sing-perm button {
  min-height: 44px;
  padding: 10px 24px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, var(--neon-cyan), #1a9fd4);
  color: #060814;
  font-weight: 900;
  font-size: 1rem;
  border: none;
  box-shadow: var(--glow-primary);
  transition: transform 0.1s var(--ease-spring), box-shadow 0.15s;
}
.sing-perm button:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-primary), 0 4px 12px rgba(0, 0, 0, 0.2);
}
```

- [ ] **Step 4: 修改 `src/pages/games/read.css`**

```css
/* 读谱 · 霓虹舞台 */
.read-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 24px;
  min-height: 0;
}

.read-staff-area {
  padding: 24px 32px;
  border-radius: var(--radius-lg);
  background: var(--bg-panel);
  border: 1px solid var(--line-neon);
}

.read-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.read-option {
  min-width: 72px;
  min-height: 72px;
  border-radius: var(--radius);
  display: grid;
  place-items: center;
  font-size: 1.3rem;
  font-weight: 950;
  background: rgba(28, 36, 82, 0.5);
  border: 2px solid var(--line-neon);
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s, transform 0.1s var(--ease-spring);
}
.read-option:hover {
  border-color: rgba(34, 229, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 0 12px rgba(34, 229, 255, 0.12);
}
.read-option.right {
  background: rgba(61, 255, 192, 0.15);
  border-color: var(--neon-green);
  color: var(--neon-green);
  box-shadow: 0 0 20px rgba(61, 255, 192, 0.3);
}
.read-option.wrong {
  background: rgba(255, 84, 112, 0.1);
  border-color: var(--danger);
  color: var(--danger);
  box-shadow: 0 0 16px rgba(255, 84, 112, 0.2);
}
```

- [ ] **Step 5: 修改 `src/components/gameResult.css`**

```css
/* 结算页 · 霓虹舞台 */
.result-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  background: rgba(6, 8, 20, 0.85);
  backdrop-filter: blur(12px);
  animation: fade 0.3s ease;
}

@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-card {
  background: var(--bg-card);
  border: 1px solid var(--line-neon);
  border-radius: var(--radius-lg);
  padding: 32px;
  max-width: 480px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  text-align: center;
  box-shadow: var(--shadow), 0 0 40px rgba(34, 229, 255, 0.1);
  animation: pop 0.4s var(--ease-bounce);
}

.result-card.wide {
  max-width: 640px;
  text-align: left;
}

@keyframes pop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.result-card h2 {
  color: var(--text);
  font-size: 1.4rem;
  margin-bottom: 12px;
}

.result-stars {
  font-size: 2.4rem;
  margin: 12px 0;
}

.result-score {
  font-size: 2rem;
  font-weight: 950;
  color: var(--neon-gold);
  text-shadow: 0 0 20px rgba(255, 214, 10, 0.3);
  font-variant-numeric: tabular-nums;
  margin-bottom: 8px;
}

.new-best {
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--neon-pink);
  text-shadow: 0 0 16px rgba(255, 79, 163, 0.3);
  margin: 8px 0;
}

.best-line {
  color: var(--text-soft);
  font-size: 0.9rem;
  font-weight: 700;
}

.result-advice {
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.5;
  margin: 12px 0;
}

.result-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}

.result-actions .btn-primary {
  min-height: 44px;
  padding: 10px 24px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, var(--neon-cyan), #1a9fd4);
  color: #060814;
  font-weight: 900;
  border: none;
  box-shadow: var(--glow-primary);
  transition: transform 0.1s var(--ease-spring), box-shadow 0.15s;
}
.result-actions .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-primary), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.result-actions .btn-secondary {
  min-height: 44px;
  padding: 10px 24px;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-weight: 800;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.result-actions .btn-secondary:hover {
  border-color: rgba(34, 229, 255, 0.5);
  box-shadow: 0 0 10px rgba(34, 229, 255, 0.12);
}

.result-actions .btn-ghost {
  min-height: 44px;
  padding: 10px 24px;
  border-radius: var(--radius);
  background: transparent;
  border: 1px solid var(--line-soft);
  color: var(--text-soft);
  font-weight: 700;
  transition: border-color 0.15s, color 0.15s;
}
.result-actions .btn-ghost:hover {
  border-color: var(--text-soft);
  color: var(--text);
}

/* 回顾面板 */
.review-link {
  margin-top: 12px;
  color: var(--neon-cyan);
  font-weight: 800;
  font-size: 0.9rem;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
}
.review-link:hover {
  text-decoration: underline;
}

.review-stats {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 16px 0;
}

.review-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.4);
  border: 1px solid var(--line-neon);
}
.review-stat b {
  font-size: 1.3rem;
  color: var(--neon-cyan);
}
.review-stat small {
  font-size: 0.75rem;
  color: var(--text-soft);
  font-weight: 700;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 16px 0;
  max-height: 300px;
  overflow-y: auto;
}

.review-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 700;
}
.review-row.ok {
  background: rgba(61, 255, 192, 0.08);
  color: var(--neon-green);
}
.review-row.bad {
  background: rgba(255, 84, 112, 0.08);
  color: var(--danger);
}

.rr-mark {
  font-weight: 950;
  font-size: 1rem;
}
.rr-label {
  flex: 1;
}
.rr-got {
  font-weight: 800;
}
.rr-want {
  color: var(--text-soft);
  font-size: 0.8rem;
}

/* 诊断 */
.diagnosis-mini {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 10px 0;
}
.diagnosis-mini span {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 800;
}
.diagnosis-mini span.good {
  background: rgba(61, 255, 192, 0.1);
  color: var(--neon-green);
}
.diagnosis-mini span.warn {
  background: rgba(255, 214, 10, 0.1);
  color: var(--neon-gold);
}
.diagnosis-mini span.focus {
  background: rgba(255, 84, 112, 0.1);
  color: var(--danger);
}

.diagnosis-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  margin: 16px 0;
}

.diagnosis-card {
  padding: 12px;
  border-radius: var(--radius);
  text-align: center;
}
.diagnosis-card.good {
  background: rgba(61, 255, 192, 0.08);
  border: 1px solid rgba(61, 255, 192, 0.2);
}
.diagnosis-card.warn {
  background: rgba(255, 214, 10, 0.08);
  border: 1px solid rgba(255, 214, 10, 0.2);
}
.diagnosis-card.focus {
  background: rgba(255, 84, 112, 0.08);
  border: 1px solid rgba(255, 84, 112, 0.2);
}
.diagnosis-card small {
  display: block;
  color: var(--text-soft);
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 4px;
}
.diagnosis-card b {
  font-size: 0.95rem;
  color: var(--text);
}

/* 能力条 */
.ability-mini {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 12px 0;
}
.ability-mini span {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 48px;
}
.ability-mini i {
  width: 100%;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
}
.ability-mini span.good i {
  background: var(--neon-green);
  box-shadow: 0 0 6px rgba(61, 255, 192, 0.4);
}
.ability-mini span.warn i {
  background: var(--neon-gold);
  box-shadow: 0 0 6px rgba(255, 214, 10, 0.4);
}
.ability-mini span.focus i {
  background: var(--danger);
  box-shadow: 0 0 6px rgba(255, 84, 112, 0.4);
}
.ability-mini b {
  font-size: 0.7rem;
  color: var(--text-soft);
  font-weight: 700;
}
.ability-mini small {
  font-size: 0.68rem;
  color: var(--text-faint);
  font-weight: 700;
}

.ability-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
}

.ability-card {
  padding: 12px;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.4);
  border: 1px solid var(--line-neon);
}
.ability-card div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ability-card small {
  color: var(--text-soft);
  font-weight: 700;
}
.ability-card b {
  color: var(--text);
}
.ability-card span {
  display: block;
  height: 6px;
  border-radius: 999px;
  background: rgba(138, 149, 201, 0.15);
  overflow: hidden;
  margin-bottom: 6px;
}
.ability-card span i {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s var(--ease-smooth);
}
.ability-card.good span i {
  background: var(--neon-green);
  box-shadow: 0 0 6px rgba(61, 255, 192, 0.4);
}
.ability-card.warn span i {
  background: var(--neon-gold);
  box-shadow: 0 0 6px rgba(255, 214, 10, 0.4);
}
.ability-card.focus span i {
  background: var(--danger);
  box-shadow: 0 0 6px rgba(255, 84, 112, 0.4);
}
.ability-card p {
  font-size: 0.78rem;
  color: var(--text-soft);
  line-height: 1.4;
}

/* 徽章 */
.badge-row {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 12px 0;
}

.badge-pop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border-radius: var(--radius);
  background: rgba(255, 214, 10, 0.08);
  border: 1px solid rgba(255, 214, 10, 0.2);
  animation: pop 0.4s var(--ease-bounce);
}
.badge-pop span {
  font-size: 1.8rem;
}
.badge-pop small {
  font-size: 0.75rem;
  color: var(--neon-gold);
  font-weight: 800;
}
```

- [ ] **Step 6: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx vite build
git add src/pages/games/taiko.css src/pages/games/ear.css src/pages/games/sing.css src/pages/games/read.css src/components/gameResult.css
git commit -m "feat: neon game interfaces with glowing judgments"
```

---

### Task 10: 内容页霓虹化 + 页面转场

**Files:**
- Modify: `src/index.css`（`.content`、`.home-entry-panel`、`.pro-status`、`.pro-kpi`、`.portfolio-panel` 等）
- Modify: `src/App.tsx`（加页面转场 class）

**Interfaces:**
- Consumes: Task 1-2 token
- Produces: 所有内容页深色 + 路由切换淡入

- [ ] **Step 1: 修改 `.content`（行 415-419 和行 1533-1535 两处）**

两处都改为：

```css
.content {
  flex: 1;
  overflow: auto;
  padding: 26px;
  animation: contentFadeIn 0.3s var(--ease-smooth);
}

@keyframes contentFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 2: 修改 `.pro-status` 和 `.pro-kpi`（行 674-691 和行 1858 附近）**

```css
.pro-status {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.pro-kpi {
  padding: 18px;
}
.pro-kpi b {
  display: block;
  color: var(--neon-cyan);
  font-size: 1.9rem;
  line-height: 1;
}
.pro-kpi span {
  color: var(--text-soft);
  font-weight: 700;
}
```

- [ ] **Step 3: 修改 `.portfolio-panel`（行 692-698）**

```css
.portfolio-panel {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(0, 1.35fr) auto;
  gap: 16px;
  align-items: stretch;
  border-left: 4px solid var(--neon-purple);
}
```

- [ ] **Step 4: 修改 `.portfolio-count`（行 716-734）**

```css
.portfolio-count {
  display: grid;
  min-width: 74px;
  min-height: 74px;
  place-items: center;
  align-content: center;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.5);
  color: var(--neon-cyan);
  border: 1px solid var(--line-neon);
}
.portfolio-count b {
  font-size: 1.9rem;
  line-height: 1;
}
.portfolio-count span {
  color: var(--text-soft);
  font-size: 0.78rem;
  font-weight: 850;
}
```

- [ ] **Step 5: 修改 `.portfolio-chip-row span`（行 742-749）**

```css
.portfolio-chip-row span {
  padding: 7px 10px;
  border-radius: 8px;
  background: rgba(28, 36, 82, 0.4);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 850;
  border: 1px solid var(--line-soft);
}
```

- [ ] **Step 6: 修改 `.portfolio-work-list button`（行 756-767）**

```css
.portfolio-work-list button {
  display: grid;
  min-height: 118px;
  min-width: 0;
  align-content: start;
  gap: 5px;
  padding: 12px;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.4);
  color: var(--text);
  text-align: left;
  border: 1px solid var(--line-soft);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s var(--ease-spring);
}
.portfolio-work-list button:hover {
  border-color: rgba(34, 229, 255, 0.4);
  box-shadow: 0 0 12px rgba(34, 229, 255, 0.1);
  transform: translateY(-2px);
}
```

- [ ] **Step 7: 修改 `.home-hero` 标题色（行 441-448）**

```css
.home-hero h1 {
  font-size: 2.4rem;
  color: var(--neon-cyan);
}
```

- [ ] **Step 8: 修改 `.tile`（行 468-492）**

```css
.tile {
  border-radius: var(--radius-lg);
  padding: 28px 20px;
  color: #fff;
  text-align: center;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s var(--ease-spring), box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.tile:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(34, 229, 255, 0.15);
}
```

- [ ] **Step 9: 修改 `.status-chip`（行 538-554）**

```css
.status-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--bg-card);
  border: 1px solid var(--line-neon);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  font-size: 0.95rem;
  color: var(--text-soft);
}
.status-chip b {
  color: var(--neon-cyan);
}
```

- [ ] **Step 10: 修改 `.teaching-panel`（行 560-567）**

```css
.teaching-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1100px;
  margin: 0 auto 28px;
  border-left: 4px solid var(--neon-cyan);
}
```

- [ ] **Step 11: 修改 `.accomp-btn`（行 508-526）**

```css
.accomp-btn {
  padding: 8px 16px;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  box-shadow: var(--shadow-soft);
  color: var(--text);
  font-weight: 700;
  font-size: 0.9rem;
  transition: background 0.15s, transform 0.1s var(--ease-spring), box-shadow 0.15s;
}
.accomp-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 10px rgba(34, 229, 255, 0.12);
}
.accomp-btn.on {
  background: rgba(255, 214, 10, 0.15);
  border-color: var(--neon-gold);
  color: var(--neon-gold);
  box-shadow: 0 0 10px rgba(255, 214, 10, 0.15);
}
```

- [ ] **Step 12: 修改 `.stu-option`（行 373-404）**

```css
.stu-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text);
  font-weight: 600;
  text-align: left;
  transition: background 0.15s;
}
.stu-option:hover {
  background: rgba(28, 36, 82, 0.6);
}
.stu-option.on {
  background: rgba(34, 229, 255, 0.15);
  color: var(--neon-cyan);
}
.stu-option.on .stu-option-main small {
  color: rgba(34, 229, 255, 0.6);
}
```

- [ ] **Step 13: 修改 `.stu-manage`（行 405-413）**

```css
.stu-manage {
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(28, 36, 82, 0.4);
  color: var(--text);
  font-weight: 700;
  border: 1px solid var(--line-soft);
  transition: border-color 0.15s;
}
.stu-manage:hover {
  border-color: var(--neon-cyan);
}
```

- [ ] **Step 14: 修改 `.back-btn`（行 430-438）**

```css
.back-btn {
  padding: 8px 18px;
  border-radius: var(--radius);
  background: rgba(28, 36, 82, 0.5);
  border: 1px solid var(--line-neon);
  color: var(--text);
  font-weight: 700;
  box-shadow: var(--shadow-soft);
  transition: transform 0.1s var(--ease-spring), box-shadow 0.15s;
}
.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 10px rgba(34, 229, 255, 0.12);
}
```

- [ ] **Step 15: 修改 focus-visible 样式（行 314-323）**

```css
.topbar .seg button:focus-visible,
.topbar .toolbtn:focus-visible,
.topbar .backbtn:focus-visible,
.side-item:focus-visible,
.stu-current:focus-visible,
.stu-option:focus-visible,
button:focus-visible {
  outline: 3px solid rgba(34, 229, 255, 0.3);
  outline-offset: 2px;
}
```

- [ ] **Step 16: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx vite build
git add src/index.css
git commit -m "feat: neon content pages + route transition fade"
```

---

### Task 11: 乐理/课程/训练中心霓虹化

**Files:**
- Modify: `src/pages/theory.css`
- Modify: `src/pages/course.css`
- Modify: `src/pages/training.css`
- Modify: `src/pages/lesson.css`
- Modify: `src/pages/class.css`
- Modify: `src/pages/dashboard.css`

**Interfaces:**
- Consumes: Task 1 token
- Produces: 所有学习类页面深色

- [ ] **Step 1: 修改 `src/pages/theory.css`**

读取现有文件，做全局替换：
- `background: var(--bg-panel)` → `background: var(--bg-card)`
- `background: #fff` / `background: white` → `background: rgba(28, 36, 82, 0.5)`
- `border: 1px solid var(--line)` → `border: 1px solid var(--line-neon)`
- `color: var(--primary)` → `color: var(--neon-cyan)`
- `background: var(--bg-soft)` → `background: rgba(28, 36, 82, 0.4)`
- `background: var(--primary)` → `background: linear-gradient(135deg, var(--neon-cyan), #1a9fd4)`
- `color: #fff` on primary buttons → `color: #060814`

- [ ] **Step 2: 修改 `src/pages/course.css`**

同上替换策略。

- [ ] **Step 3: 修改 `src/pages/training.css`**

同上替换策略。

- [ ] **Step 4: 修改 `src/pages/lesson.css`**

同上替换策略。

- [ ] **Step 5: 修改 `src/pages/class.css`**

同上替换策略。

- [ ] **Step 6: 修改 `src/pages/dashboard.css`**

同上替换策略。

- [ ] **Step 7: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx vite build
git add src/pages/theory.css src/pages/course.css src/pages/training.css src/pages/lesson.css src/pages/class.css src/pages/dashboard.css
git commit -m "feat: neon theory, course, training, lesson, class, dashboard styles"
```

---

### Task 12: 乐器音色升级

**Files:**
- Modify: `src/music/audioEngine.ts`

**Interfaces:**
- Consumes: 现有 audioEngine 结构
- Produces: 更丰富的鼓组音色、竖笛音色、新增木琴音色 `playXylophone(note: string)`

- [ ] **Step 1: 升级鼓组音色**

在 `initDrums()` 中，给 kick 加一层 sub-bass：

```ts
function initDrums() {
  if (kick) return
  // 底鼓：低频冲击 + 弹性
  kick = new Tone.MembraneSynth({
    octaves: 8,
    pitchDecay: 0.06,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 },
  }).toDestination()
  kick.volume.value = -2

  // 嗵鼓
  tom = new Tone.MembraneSynth({
    octaves: 4,
    pitchDecay: 0.1,
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
  }).toDestination()
  tom.volume.value = -4

  // 军鼓：白噪声 + body 共鸣
  snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
  }).toDestination()
  snare.volume.value = -6

  // 踩镲：更清脆
  hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
    harmonicity: 6.1,
    resonance: 5000,
  }).toDestination()
  hihat.volume.value = -14

  // 吊镲：更持久的 shimmer
  crash = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 1.2, release: 0.4 },
    harmonicity: 5.1,
    resonance: 3500,
  }).toDestination()
  crash.volume.value = -14
}
```

- [ ] **Step 2: 升级太鼓音色**

```ts
export function taikoDON(): void {
  if (!donSynth) {
    donSynth = new Tone.MembraneSynth({
      octaves: 10,
      pitchDecay: 0.03,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.15 },
    }).toDestination()
    donSynth.volume.value = -1
  }
  donSynth.triggerAttackRelease('C2', '4n')
}

export function taikoKA(): void {
  if (!kaSynth) {
    kaSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0 },
    }).toDestination()
    kaSynth.volume.value = -3
  }
  kaSynth.triggerAttackRelease('8n', Tone.now())
}
```

- [ ] **Step 3: 新增木琴音色**

在 `mixSynths` 区域后添加：

```ts
// —— 木琴音色 ——
let xylophoneSynth: Tone.PolySynth | null = null

function getXylophoneSynth(): Tone.PolySynth {
  if (!xylophoneSynth) {
    xylophoneSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.5 },
    }).toDestination()
    xylophoneSynth.volume.value = -4
  }
  return xylophoneSynth
}

/** 播放木琴音 */
export function playXylophone(note: string): void {
  getXylophoneSynth().triggerAttackRelease(note, '8n')
}
```

- [ ] **Step 4: 验证构建 + Commit**

```bash
cd D:\AI\music-app && npx tsc -b && npx vite build
git add src/music/audioEngine.ts
git commit -m "feat: richer drum timbres + xylophone voice"
```

---

### Task 13: 全局构建验证 + 最终检查

**Files:**
- 所有已修改文件

- [ ] **Step 1: TypeScript 编译检查**

Run: `cd D:\AI\music-app && npx tsc -b`
Expected: 无类型错误

- [ ] **Step 2: 构建检查**

Run: `cd D:\AI\music-app && npx vite build`
Expected: 构建成功

- [ ] **Step 3: 启动 dev server 快速验证**

Run: `cd D:\AI\music-app && npx vite`
Expected: dev server 启动成功

- [ ] **Step 4: 最终 Commit**

```bash
git add -A
git commit -m "feat: Phase 1 complete — neon stage dark theme"
```
