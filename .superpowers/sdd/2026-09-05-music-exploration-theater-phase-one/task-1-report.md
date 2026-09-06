# Task 1 实现报告：探索单元内容模型与《茉莉花》配置

## 实现概览

本任务建立了第一阶段音乐探索剧场的纯内容基础，新增探索单元类型、年级支架映射和《茉莉花》默认探索单元配置。模块只包含类型、静态数据和无副作用查询函数，没有引入 React、音频调用、会话存储或导航逻辑。

## 文件变更

- `src/music/explorationUnits.ts`
  - 导出 `ExplorationPath`、`ExplorationStageId`、`ExplorationAgeBand` 及 brief 要求的全部接口。
  - 导出 `JASMINE_EXPLORATION_UNIT`、`EXPLORATION_UNITS`、`getExplorationUnit` 和 `getExplorationAgeBand`。
  - 配置四条按要求排序的路径：emotion、movement、story、culture；每条路径提供至少三个选择。
  - 配置 A/B 旋律证据比较，包含流动/级进与跳进变体的反馈、conceptId 和 isBest。
  - 配置低段平稳旋律/级进、中段旋律/级进/音色、高段五声音阶/地域色彩概念卡。
  - 配置江苏《茉莉花》与不同地域版本的文化文案、三种开放式再听选择和分段反思提示。
  - 使用 `pentatonic-scale`、`gong-shang-jue-zhi-yu`、`folk-song-region` 课程主题 id。
  - 未知或缺失单元 id 回退到 jasmine；年级 1–2、3–4、5–6 分别映射到低、中、高段，非法值回退低段。

- `tests/explorationUnits.test.mjs`
  - 按仓库既有 TypeScript transpile-loader 模式新增测试。
  - 覆盖单元标识、江南问题、路径顺序、证据选项、概念卡、文化文案、再听提示、年级映射、未知单元回退、路径选择数量及课程主题 id 类型。

## 测试与验证

- `npm test -- tests/explorationUnits.test.mjs`：通过，137 个测试通过，0 个失败；其中本任务新增的 4 个测试全部通过。由于仓库 test script 会展开 `tests/*.test.mjs`，该命令同时运行了现有测试。
- `npm run build`：通过；TypeScript strict build 与 Vite 单文件生产构建均成功。
- 纯数据边界检查：通过；目标模块未发现 React、Tone、音频调用、localStorage 或会话状态依赖。

## 设计决策

1. `EXPLORATION_UNITS` 当前只包含 jasmine，并让 `getExplorationUnit` 对未知 id 保持 jasmine 回退，满足 jasmine 作为第一阶段默认单元和后续扩展的稳定入口。
2. 四条路径都保留为可选认知入口，并使用多样化的主观表达，不把某一个情绪、动作或故事设为唯一正确答案。
3. A/B 证据选项将“流动的级进”标为最佳证据，但对“跳跃变体”提供观察性反馈，避免把学生的审美感受直接判错。
4. 概念卡按年龄段分配：低段只呈现平稳旋律/级进，中段补充旋律与音色，高段再引入五声音阶和地域色彩。
5. 文化文案保持简短，并同时说明江苏版本的婉转特点和地域版本差异，支持证据互动后再听的流程。

## 关注事项

- 本任务只建立内容模型；实际片段播放、证据变体生成、探索会话状态和 React 剧场由后续任务实现。
- `npm test -- tests/explorationUnits.test.mjs` 受现有 npm script 的 glob 影响，会运行整个测试目录；本次全量结果为 137/137 通过。
- 工作区原有未跟踪的设计规格和实施计划文件未参与本次提交：`docs/superpowers/specs/2026-09-05-music-exploration-theater-redesign.md`、`docs/superpowers/plans/2026-09-05-music-exploration-theater-phase-one.md`。
