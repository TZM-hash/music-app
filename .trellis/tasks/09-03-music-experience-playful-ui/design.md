# 音乐体验与童趣界面升级设计

## 1. 设计目标

项目已有丰富的乐器、游戏、教材主题和本地记录能力，主要问题是入口多、体验被页面切碎、学生需要先读大量说明才能开始。新设计不再增加“功能清单”，而是把现有能力包装成短时、连续、可回看的音乐体验。

核心闭环：

```text
主题/教材 → 听见 → 比较/寻找 → 身体或触控回应 → 乐器试玩 → 小创作 → 表达并保存发现
```

## 2. 信息架构

学生端的一级导航只有四项：

| 入口 | 默认页面 | 负责内容 |
|---|---|---|
| 今日 | `home` | 今日探险、探索卡、最近发现、轻量进度 |
| 探索 | `theory` | 教材主题、浙江拓展、声音演示和主题任务 |
| 玩乐 | `training` | 三种新互动类型，以及原有听辨/节奏/跟唱/读谱入口 |
| 我的 | `adventure` | 音乐发现、作品和成长路线 |

课程、素材库和具体乐器仍保留路由，但作为场馆内的次级入口出现；教师的 `class` 和 `dashboard` 不进入学生导航。

## 3. 体验数据契约

新增 `src/music/experienceActivities.ts`，只负责可配置的体验定义和纯函数，不直接依赖 React 或浏览器存储。

```ts
export type ExperienceKind = 'sound-detective' | 'rhythm-sprite' | 'music-canvas'
export type ExperienceAgeBand = 'primary-1-2' | 'primary-3-4' | 'primary-5-6'

export interface ExperienceActivity {
  id: string
  kind: ExperienceKind
  title: string
  subtitle: string
  icon: string
  color: string
  duration: string
  grades: PrimaryGrade[]
  prompts: { listen: string; play: string; create: string }
  curriculumTopicIds?: string[]
  zhejiangTag?: string
}

export interface ExperienceJourney {
  activity: ExperienceActivity
  ageBand: ExperienceAgeBand
  steps: Array<{ id: 'listen' | 'find' | 'move' | 'play' | 'create' | 'share'; label: string; prompt: string }>
}
```

`getAgeBand(grade)`、`getRecommendedActivities(grade)` 和 `buildExperienceJourney(activity, grade)` 负责稳定的年级适配。没有年级时回退到低门槛的小学通用体验。

## 4. 互动组件

新增 `src/components/MusicExperienceStage.tsx` 与同名 CSS。组件接收 `ExperienceJourney`、`studentId`、`onSaveDiscovery` 和 `onNavigate`，内部只管理临时交互状态；完成结果通过 `saveMusicDiscovery` 或已有作品接口写回。

三个场景：

1. 声音侦探：两个按钮播放不同的合成音型，学生选择“更高/更低、更多/更少、明亮/厚重”等感知词；选择后立即显示可回听的差异说明。
2. 节奏精灵：四拍或八拍的可点击格，播放示范后让学生跟拍；命中格子会改变颜色、角色表情和进度，不用竞争排行。
3. 音乐画布：学生点击颜色/线条/运动工具组成一段视觉表达，画布状态实时变化，可保存一句感受或跳转混音创作。

音频全部通过现有 `audioEngine` / `playNote` / `playDrum` 生成；按钮首次点击时调用 `ensureAudio`。任何音频失败都保留视觉和触控反馈。

## 5. 页面改造

- `Home.tsx`：增加“今日音乐探险”主卡和三扇玩乐入口；保留探索卡、本次进度和我的发现，弱化旧的统计文案。
- `TrainingCenter.tsx`：将新互动舞台放在首屏，旧模块下沉为“更多练习”，保持旧路由可达。
- `Theory.tsx`：在主题详情顶部提供“开始这张探险卡”的入口，后续可逐步把旧长页面拆成步骤，但本阶段不删除既有演示/测验。
- `Sidebar.tsx`：改为四个学生主入口和教师专属入口；`App.tsx` 增加移动端底部导航容器。
- 新增 `src/components/MobileNav.tsx`，仅窄屏显示，复用同一组路由和标签。

## 6. 视觉系统

新增 `src/playful.css` 并在 `main.tsx` 最后导入，用作用域覆盖逐步迁移旧 CSS，避免一次性改写 9000 多行 `index.css`。

- 背景：保持明亮但从冷灰改为柔和暖白；表面使用纸片层次和轻边框。
- 色彩：天空蓝（探索）、珊瑚橙（节奏）、薄荷绿（创作）、葡萄紫（发现）。
- 几何：20—28px 圆角、柔和偏移阴影、波浪分隔线和节奏点；每屏只保留一个主动画焦点。
- 字体：继续使用本地系统字体栈，不拉取外部字体；按钮、标签、移动导航均显式设置字号和行高。
- 动效：150—420ms 的弹性进入和点击反馈；`prefers-reduced-motion` 下关闭位移和循环动画。
- 互动可达性：触控目标至少 44px，键盘有 `:focus-visible`，颜色不作为唯一反馈。

## 7. 持久化和错误边界

发现记录继续调用 `src/state/discoveries.ts`，使用当前学生 ID 隔离；无学生时不写入个人记录，只显示临时完成态。互动组件捕获音频调用异常，显示“可以继续用点击完成”提示，不让音频权限阻断页面。

## 8. 验证策略

- 纯函数：Node test 覆盖年级适配、推荐稳定性、旅程步骤和空输入兜底。
- UI：本轮以桌面 1280×720 为验收视口，验证首页 → 玩乐 → 互动反馈 → 保存发现的路径；手机端保持现状，不主动调整。
- 工程：每阶段运行相关测试、lint 和 TypeScript；最终运行全量测试、构建和单文件比对。
- 浏览器验证优先使用 Browser/IAB；若当前环境没有可用 Browser 连接，则用已有 Playwright/静态 HTTP 方案，并记录原因。
