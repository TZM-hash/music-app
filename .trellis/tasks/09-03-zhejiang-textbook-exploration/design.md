# 浙江人音版教材探索体系设计

## 1. 设计目标

在不增加顶层导航的前提下，把现有 `TheoryTopic -> 探索卡 -> 训练/乐器/混音` 链路变成教材可定位的学习闭环。教材元数据、推荐逻辑和学生发现记录分别放在独立模块，页面只负责组合和展示。

## 2. 模块边界

### 2.1 教材数据：`src/music/zhejiangCurriculum.ts`

定义小学年级、册次、教材来源和对照主题：

```ts
export type PrimaryGrade = 1 | 2 | 3 | 4 | 5 | 6
export type Semester = 1 | 2
export type CurriculumSource = 'textbook' | 'extension'

export interface TopicCurriculum {
  edition: 'zhejiang-renyin'
  province: '浙江省'
  publisher: '人民音乐出版社'
  subject: '小学音乐'
  track: '综合实践'
  source: CurriculumSource
  grades: PrimaryGrade[]
  semester: Semester
  unitId: string
  unitNumber: number
  unitTitle: string
  focus: string
}
```

该模块同时导出年级标签、对照主题表和 `alignTheoryTopic`。核心主题按现有 `TheoryStageId`、类别和少量主题 ID 覆盖映射到 1—6 年级；初中主题保留但标记 `extension`。这样以后更换印次只需要调整数据表。

### 2.2 主题模型：`src/music/theoryCatalog.ts`

给 `TheoryTopic` 增加必填的 `curriculum: TopicCurriculum`，在 `applyTopicContent` 完成教材对齐，再由 `filterTheoryTopics` 支持 `grade` 和 `source` 筛选。原有 `stage`、类别和题库 API 保持兼容。

### 2.3 推荐：`src/music/explorationRecommendations.ts`

导出：

```ts
export interface ExplorationRecommendationContext {
  grade?: PrimaryGrade
  semester?: Semester
  completedTopicIds?: string[]
  weakCategories?: string[]
  studentId?: string | null
  dayKey?: string
}

export interface ExplorationRecommendation {
  topic: TheoryTopic
  reason: string
}

export function recommendExplorationTopic(
  topics: TheoryTopic[],
  context: ExplorationRecommendationContext,
): ExplorationRecommendation | null
```

评分顺序为：年级匹配 > 教材同步 > 未完成 > 薄弱类别 > 稳定日期哈希。没有符合项时逐级放宽到同学段、全部小学核心、全部主题，确保首页永远有可执行卡片。

### 2.4 学生档案：`src/state/students.ts`

在 `Student` 上增加可选 `grade`、`semester` 字段；`addStudent` 增加可选 profile 参数；新增 `updateStudentProfile`，只更新允许的年级/册次字段并保留旧字段。名册页面提供年级和册次选择，旧 JSON 无字段时显示“未设置”并使用默认推荐。

### 2.5 发现记录：`src/state/discoveries.ts`

使用独立 localStorage key `music-edu-discoveries-v1`，定义 `MusicDiscovery`、`saveMusicDiscovery`、`loadMusicDiscoveries`、`buildDiscoverySummary` 和 `removeStudentDiscoveries`。记录上限 60 条，按学生隔离；所有读写失败返回空集合或不抛错，遵循现有 state 模块风格。

### 2.6 浙江拓展：`src/music/zhejiangExtensions.ts`

提供少量结构化拓展项，字段包含 `title`、`region`、`grades`、`category`、`connection`、`prompt` 和可选 `route`。`getZhejiangExtension(topic, grade)` 按主题类别和年级返回稳定的一条拓展。拓展是短文本和现有演示的引导，不内置受版权保护的整曲音频。

## 3. 页面数据流

1. `Home` 读取当前学生 profile、进度和错题类别。
2. `recommendExplorationTopic` 返回主题与推荐理由；首页探索卡显示年级/册次/教材来源。
3. `Theory` 通过学生年级初始化年级筛选；详情显示教材对照和浙江拓展卡。
4. 探索卡的“说一说”提供 3 个句式和一个简短输入框，调用 `saveMusicDiscovery`。
5. `Home` 在现有“本次进度”卡底部显示最近一条发现和总数。
6. `backup.ts` 增加 discoveries key；`removeStudent` 调用级联清理。

## 4. 兼容性与风险

- 旧学生数据：所有新字段可选，读取时不做破坏性迁移。
- 旧备份：缺少 discoveries key 时导入流程按 null 处理，不影响其余数据。
- 初中主题：不删除、不改题库，只在小学推荐中降低优先级并显示拓展标签。
- 版权：不复制教材歌曲全文、整页谱面或原版录音；对照主题采用能力描述和可替换素材。
- 离线：所有数据和文案打包进单文件，不依赖网络 API。

## 5. 测试策略

- 纯函数：教材映射、年级筛选、推荐稳定性、拓展选择。
- localStorage：发现记录 CRUD、学生级联删除、备份 key 兼容。
- 页面契约：Home/Theory/ClassRoster/CourseCenter 存在必要文案和 class，保留探索卡且无班级对战入口。
- 最终执行 `npm test`、`npm run lint`、`npm run build`、`git diff --check`，并核对单文件哈希。
