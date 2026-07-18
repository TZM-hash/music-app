# 霓虹舞台 · 全面视觉/音效/动效升级设计

> **日期**：2026-07-18
> **范围**：全站 UI、音效、动效、游戏性、新增乐器与游戏
> **场景**：教室大屏 + 教师主导演示（投影到电子白板，学生远距离观看）

---

## 1. 背景与目标

当前版本功能完整但视觉"素"：浅色扁平风格在投影上对比度弱、UI 交互几乎全静音、动效极少、缺乏课堂"哇塞时刻"。

**目标**：让 app 变成"教室里的舞台"——深色霓虹发光、动效爆炸、关键音效反馈、游戏性更强、新增木琴乐器和节奏复制游戏。

---

## 2. 视觉语言（Design Tokens）

### 2.1 配色

```css
/* 背景层 */
--bg-deep:    #060814;   /* 深空黑蓝（主背景）*/
--bg-panel:   #0d1230;   /* 面板底 */
--bg-card:    #131a3f;   /* 卡片 */
--bg-raised:  #1c2452;   /* 浮起元素 */

/* 霓虹主色 */
--neon-cyan:    #22e5ff;   /* 主交互色 */
--neon-pink:    #ff4fa3;   /* 强调、得分 */
--neon-gold:    #ffd60a;   /* 星星、奖励、正确 */
--neon-purple:  #a06bff;   /* 次要交互 */
--neon-green:   #3dffc0;   /* 成功 */

/* 音符专属色 */
--note-c: #22e5ff;  --note-d: #3dffc0;  --note-e: #ffd60a;
--note-f: #ff4fa3;  --note-g: #a06bff;  --note-a: #ff8c42;
--note-b: #4fc3ff;

/* 语义色 */
--success: #3dffc0;  --danger: #ff5470;
--text:    #eef2ff;  --text-soft: #8a95c9;  --text-faint: #4a5280;
```

### 2.2 光效

- 可交互元素带外发光 `box-shadow: 0 0 20px color-glow`
- 主按钮：内发光 + 外发光，按下时光晕扩散
- 钢琴键：按下时键面点亮音符色，向上溢出光雾
- 卡片：1px 半透明霓虹描边，hover 变亮并浮起
- 得分/星星：金色光晕脉动

### 2.3 字体

- 标题字重 800+，主标题 ≥ 2.2rem
- 数字用 `tabular-nums`
- 正文 ≥ 1rem，投影关键信息 ≥ 1.25rem
- `letter-spacing: 0.02em`

### 2.4 圆角

- `--radius-lg: 16px`（卡片）、`--radius-md: 10px`（按钮）、`--radius-sm: 6px`
- 琴键/鼓垫 12px + 底部深色 3D 边缘

### 2.5 动效曲线

```css
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-smooth: cubic-bezier(0.2, 0.8, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.27, 1.55);
--dur-fast: 120ms;  --dur-med: 240ms;  --dur-slow: 480ms;
```

---

## 3. 音效系统

### 3.1 原则

课堂以乐器声和学生演唱声为主，UI 音效只保留关键正反馈，不喧宾夺主。

### 3.2 保留的 5 个 UI 音效

| 事件 | 音效 | 说明 |
|---|---|---|
| 答对 | 明亮上行琶音 C-E-G（300ms） | 正反馈核心 |
| 通关/新纪录 | 胜利号角（三和弦）+ 低频冲击 | 课堂高潮 |
| 倒计时 3-2-1 | 鼓点递进，最后一击加铜钹 | 游戏节奏感 |
| 获得星星 | 一声清脆"叮"（C6 musicbox） | 简短奖励 |
| 连击 x5/x10 | 金属铃声音高递进 | 里程碑激励 |

### 3.3 砍掉的 UI 音效

按钮悬停、按钮点击、页面转场、答错、连击中断、徽章解锁（合并到通关）。

### 3.4 技术架构

```
src/music/uiSounds.ts    ← 新增：UI 音效引擎
  ├── initUISounds()          // 首次用户交互时初始化
  ├── playUI(name, opts?)     // 统一入口
  ├── setUIVolume(db)         // 独立音量
  └── 预制 Synth 池

src/state/soundPrefs.ts  ← 新增：音效偏好持久化
```

- UI 音效默认 **关闭**，老师在 TopBar 手动开启，状态持久化
- UI 音效和乐器音量完全独立
- TopBar 加 🔇 一键静音按钮

### 3.5 乐器音色升级

- 鼓组：kick 加 sub-bass 低频，snare 加 body 共鸣，镲片更清脆
- 太鼓：DON 加低频余震，KA 加木质脆响
- 竖笛：从 organ 换成 breathy sine + 轻微 noise 气声
- 新增木琴音色：sine + 短衰减 + 轻微泛音，清脆木质"叮"

---

## 4. 动效与粒子系统

### 4.1 页面转场

- 乐器页：琴键从下方 stagger 30ms 滑入
- 游戏页：中心缩放入场 + 光晕扩散
- 内容页：卡片从右往左 stagger 50ms 滑入
- 首页：Hero 淡入，下方卡片波浪式上浮
- 统一 240ms + `--ease-smooth`

### 4.2 乐器按键反馈

**钢琴**：按下键面点亮音符色 + 向上溢出光雾 + 涟漪扩散；按住持续发光脉动；松开 300ms 衰减；音符粒子飘出上浮 1.5s 消散；刮奏时粒子连成光带。

**鼓**：击打时弹跳压缩（scale 0.92→1，spring 120ms）+ 冲击波环 + 粒子溅射。

**竖笛**：指法图孔位按下亮金色 + 微微下沉；吹奏时笛身发光，音符从吹口飘出。

**混音器**：播放时当前步整列发光扫过；有音格子脉冲发光。

### 4.3 游戏特效

**判定**：良=金色环爆开+粒子+"良"字弹出放大；可=青色小环；不可=暗红微闪。

**连击**：数字随连击增大变色（白→金→彩虹）；x5 加火焰尾迹；x10 屏幕边缘金光+数字 3D 翻转；x20+ 全屏光晕脉动+粒子雨。

**倒计时**：3/2/1 从中央弹出（scale 3→1 spring）；"开始！"炸开成彩色碎片。

### 4.4 庆祝引擎（Celebration.tsx）

全局 canvas 覆盖层，挂在 App 根部：

| 级别 | 场景 | 效果 |
|---|---|---|
| small | 答对一题 | 彩色小星星簇 |
| medium | 获得星 | 星星从底部飞入，拖尾光迹 |
| large | 三星通关 | 彩带飘落 + 金粒子雨 + 奖杯旋转 |
| epic | 新纪录 | 全屏烟花（200+ 粒子）+ 屏幕微震 |

技术：单 canvas + rAF，非活动零开销。

### 4.5 微交互

- 卡片 hover 浮起 2px + 描边变亮（150ms）
- 按钮按下 scale 0.96 + 光晕扩散（120ms）
- 星星从灰到金翻转（rotateY 360°）
- 得分数字滚动递增
- 进度条发光扫过

### 4.6 性能

- 所有动画只用 `transform` + `opacity`
- Canvas 粒子非活动完全停止
- 支持 `prefers-reduced-motion`
- 目标低配白板 60fps

---

## 5. 各页面改造

### 5.1 首页 Home

- Hero 标题 2.8rem + 霓虹光晕；波形图改实时律动
- 精简首屏：Hero + 推荐路线 + 4 主入口卡片；其余滚动下方
- 主入口卡片配动态小图标
- 统计数字进入视口时从 0 滚动
- 背景极微弱星尘粒子漂浮（纯 CSS）

### 5.2 侧边栏

- 图标改霓虹发光 emoji + active 左侧 3px 亮青条
- hover 图标放大 + 发光
- 分组标题渐变下划线
- 背景半透明深色 + 毛玻璃

### 5.3 顶栏

- 面包屑当前页发光
- 脉冲波形更明显的律动
- 模式切换按钮霓虹高亮边框
- 新增 UI 音效开关（🔊/🔇）

### 5.4 钢琴

- 琴键按下发光 + 粒子 + 涟漪（见 4.2）
- 琴键加大高度
- 工具栏重新排布，视觉分组
- 节拍器 beat dots 改脉冲光环
- 和弦按钮按下时对应琴键也亮

### 5.5 鼓

- 鼓垫加大（≥80px），圆形发光边框
- 击打弹跳压缩 + 冲击波 + 粒子（见 4.2）
- 循环机播放头整列发光扫过

### 5.6 竖笛

- 吹奏时笛身发光，音符从吹口飘出
- 指法图孔位按下亮金 + 下沉

### 5.7 混音器

- 播放头整列发光扫过
- 有音格子播放时脉冲发光（颜色对应音源色）
- 音轨标签 emoji + 颜色标识

### 5.8 四个游戏

**太鼓**：判定圈旋转光环；判定文字弹出放大+光晕；魂值条改火焰能量条；连击超大显示；背景日式波纹。

**练耳**：琴键选项加大+发光；答对金光爆闪+星粒子；听音按钮声波动画。

**唱歌**：音高轨迹彩虹渐变色带；唱准变金+粒子；目标音符发光；实时音高仪表盘。

**读谱**：五线谱加发光；目标音符脉动；答对音符跳出变金星；选项按钮加大。

### 5.9 结算页 GameResult

- 三星依次翻转弹入（stagger 200ms）+ 金光爆闪
- 新纪录触发庆祝引擎 epic 级
- 分数滚动递增
- 诊断/能力条左滑入场
- "再练一次"脉动光晕

### 5.10 乐理/课程/闯关

- 卡片 hover 发光 + 浮起
- 岛屿浮动动画
- 进度环发光扫过
- 解锁新主题卡片翻转入场

### 5.11 教师页

- 图表入场动画（柱状升起、环形旋转填充）
- 学生头像发光边框
- 数据卡片 hover 微微放大

---

## 6. 新增乐器：木琴 Xylophone

**位置**：`src/pages/Xylophone.tsx` + `src/pages/xylophone.css`

- 8-15 根彩色琴条，C 大调，颜色对应音符色
- 敲击：琴条下沉弹回 + 发光 + 音符粒子
- 音色：Tone.js sine + 短衰减 + 轻微泛音（木质"叮"）
- 键盘映射：A-K 白键，W-U 半音
- 音阶高亮（复用钢琴逻辑）
- 录制/回放（复用钢琴逻辑）
- 侧边栏"创作工具"组加入，路由 `/xylophone`

**audioEngine 新增**：
```ts
// 新增木琴音色
function getXylophoneSynth(): Tone.PolySynth {
  // sine + attack 0.001, decay 0.3, sustain 0, release 0.5
  // + 轻微 detune 泛音
}
```

---

## 7. 新增游戏：节奏复制 Rhythm Echo

**位置**：`src/pages/games/EchoGame.tsx` + `src/pages/games/echo.css`

### 玩法

1. 屏幕播放一段节奏（DON/KA 组合）
2. 节奏谱面滚动展示
3. 学生跟着敲 DON/KA
4. 判定：良/可/不可（复用太鼓判定窗口）

### 与太鼓的区别

太鼓 = 实时看谱敲；节奏复制 = 先听一遍再跟着敲（训练记忆+模仿）。

### 关卡

| 级别 | 长度 | 音符 | 速度 |
|---|---|---|---|
| 1 | 2 拍 | 只有 DON | 80bpm |
| 2 | 4 拍 | DON + KA | 90bpm |
| 3 | 8 拍 | DON + KA + 休止 | 100bpm |

### 视觉

- 播放阶段：大鼓发光震动 + 音符粒子
- 跟敲阶段：谱面滚动 + 判定圈发光
- 回放：对/错用金/红标记

路由 `/game-echo`，侧边栏"挑战中心"加入。

---

## 8. 游戏性系统

### 8.1 连击系统

- `src/state/combo.ts`：跨游戏统一连击逻辑
- 连击数屏幕上方大字体显示
- x5/x10/x20 不同级别视觉+音效庆祝
- 中断时数字抖动 + 变暗

### 8.2 每日挑战升级

- 翻牌抽奖形式：3 张牌盖着，点开一张是随机挑战
- 连续打卡火焰图标（streak）
- 连续 N 天额外星星奖励

### 8.3 班级对战模式（教师专属）

- 大屏分左蓝/右红两区，两组学生轮流答题/演奏
- 实时比分条 + 中央 VS 标志
- 答对时自己阵营加分 + 对方区域微震
- 结束胜利方全屏金烟花 + "冠军"字
- `src/state/teamBattle.ts`

### 8.4 进度可视化升级

- 已通关岛金色光环 vs 未解锁暗色+锁
- 岛屿间发光虚线路径
- 当前岛脉动光环
- 全通关"音乐大师"奖杯动画

---

## 9. 文件变更清单

### 新增文件

```
src/music/uiSounds.ts          ← UI 音效引擎
src/state/soundPrefs.ts        ← 音效偏好
src/state/combo.ts             ← 连击系统
src/state/teamBattle.ts        ← 班级对战
src/components/Celebration.tsx ← 庆祝引擎
src/components/celebration.css
src/pages/Xylophone.tsx        ← 木琴
src/pages/xylophone.css
src/pages/games/EchoGame.tsx   ← 节奏复制
src/pages/games/echo.css
src/styles/tokens.css          ← 设计 Token（可选拆分）
```

### 修改文件

```
src/index.css                  ← 全局主题改为深色霓虹（大量改动）
src/App.tsx                    ← 加路由（xylophone, game-echo）+ Celebration 挂载
src/music/audioEngine.ts       ← 加木琴音色 + 鼓组音色升级 + 竖笛音色
src/components/Sidebar.tsx     ← 加新入口 + 视觉升级
src/components/TopBar.tsx      ← 加音效开关 + 视觉升级
src/components/GameResult.tsx  ← 庆祝动画
src/pages/Home.tsx             ← Hero + 精简 + 动效
src/pages/Piano.tsx            ← 按键发光 + 粒子
src/pages/Drums.tsx            ← 击打反馈
src/pages/Recorder.tsx         ← 吹奏发光
src/pages/Mixer.tsx            ← 播放头发光
src/pages/games/TaikoGame.tsx  ← 判定特效 + 连击
src/pages/games/EarGame.tsx    ← 反馈动画
src/pages/games/SingGame.tsx   ← 轨迹美化
src/pages/games/ReadGame.tsx   ← 谱面发光
src/pages/Theory.tsx           ← 卡片发光
src/pages/AdventureMap.tsx     ← 岛屿动画
src/pages/CourseCenter.tsx     ← 进度发光
src/pages/Dashboard.tsx        ← 图表入场
src/pages/ClassRoster.tsx      ← 头像发光
所有页面 css 文件               ← 适配深色主题
```

---

## 10. 实施阶段

| 阶段 | 内容 | 核心交付 |
|---|---|---|
| **Phase 1** | 设计 Token + 深色主题 + 转场 + 乐器按键动效 + 5 个核心音效 | 视觉基础改天换地 |
| **Phase 2** | 庆祝引擎 + 游戏特效 + 结算页 + 连击系统 + 木琴 | 课堂哇塞时刻 + 新乐器 |
| **Phase 3** | 节奏复制游戏 + 班级对战 + 每日挑战升级 + 进度可视化 | 游戏性深度 |

---

## 11. 不做的事（YAGNI）

- 不引入 framer-motion / GSAP 等动画库（纯 CSS + WAAPI 足够）
- 不加载外部音频文件（保持单文件离线）
- 不做用户系统/后端（保持 localStorage）
- 不做响应式手机端优化（场景是教室大屏 + 桌面）
- 不改路由结构（沿用现有 state-based 路由）
- 不做主题切换（一套深色霓虹主题走到底）
