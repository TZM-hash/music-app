import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../state/appState'
import { getCurrentStudent } from '../state/students'
import { JASMINE_EXPLORATION_UNIT, type ExplorationPath } from '../music/explorationUnits'
import { filterTheoryTopics, type TheoryStageId, type TheoryTopic } from '../music/theoryCatalog'
import {
  getCurriculumSourceLabel,
  getCurriculumUnits,
  getGradeLabel,
  getSemesterLabel,
  getStageForGrade,
  PRIMARY_GRADES,
  type CurriculumSource,
  type PrimaryGrade,
} from '../music/zhejiangCurriculum'
import './course.css'

type FilterValue = 'all'
type WorkFilter = PrimaryGrade | FilterValue

interface CourseUnit {
  id: TheoryStageId
  icon: string
  title: string
  stage: string
  goal: string
  duration: string
  color: string
  outcomes: string[]
}

const COURSES: CourseUnit[] = [
  {
    id: 'primary-lower',
    icon: '🌱',
    title: '小学低段：听见高低长短',
    stage: '小学 1-2 年级 / 启蒙',
    goal: '从听、拍、唱和模仿开始，慢慢形成对高低、长短、强弱和音色的直观感受。',
    duration: '10-15 分钟',
    color: '#2f9e44',
    outcomes: ['能分辨高低长短强弱', '能跟稳定拍做反应', '能唱出 1-5 的基本唱名'],
  },
  {
    id: 'primary-middle',
    icon: '🧭',
    title: '小学中段：读懂谱面基本信息',
    stage: '小学 3-4 年级 / 基础',
    goal: '把音名、线间、谱号、拍号、速度力度和反复记号变成看得懂、唱得出的音乐线索。',
    duration: '15-20 分钟',
    color: '#f59f00',
    outcomes: ['能读基本线间关系', '能说明 2/4、3/4、4/4', '能识别 p、f 和反复记号'],
  },
  {
    id: 'primary-upper',
    icon: '🎼',
    title: '小学高段：连接旋律、节奏与调式',
    stage: '小学 5-6 年级 / 提升',
    goal: '理解半音全音、低音谱号、附点切分三连音、五声音阶、音程和乐句呼吸。',
    duration: '20 分钟',
    color: '#d6336c',
    outcomes: ['能分析附点和切分', '能听出大小调基础色彩', '能描述问答乐句和旋律线'],
  },
]

interface WorkSummary {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string
  source: CurriculumSource
  grades: PrimaryGrade[]
  semester: 1 | 2
  stage: TheoryStageId
  unitTitle: string
  focus: string
  paths: ExplorationPath[]
  tags: string[]
  tools: string[]
  culture?: string
  topicId?: string
  explorationUnitId?: string
}

const PATH_LABELS: Record<ExplorationPath, string> = {
  emotion: '情绪',
  movement: '动作',
  story: '故事',
  culture: '文化',
}

const PATH_BY_CATEGORY: Record<string, ExplorationPath> = {
  节奏与节拍: 'movement',
  曲式结构: 'story',
  创作与编配: 'story',
  民族与音乐场景: 'culture',
}

const JASMINE_TOOL_LABELS = ['音乐显微镜', '乐器探秘台']

function topicPath(topic: TheoryTopic): ExplorationPath {
  return PATH_BY_CATEGORY[topic.category] ?? 'emotion'
}

function topicToWork(topic: TheoryTopic): WorkSummary {
  const curriculum = topic.curriculum
  return {
    id: `topic-${topic.id}`,
    title: topic.title,
    subtitle: topic.subtitle,
    icon: '🎵',
    color: '#007aff',
    source: curriculum.source,
    grades: curriculum.grades,
    semester: curriculum.semester,
    stage: topic.stage,
    unitTitle: curriculum.unitTitle,
    focus: curriculum.focus,
    paths: [topicPath(topic)],
    tags: Array.from(new Set([topic.category, ...topic.keyPoints.slice(0, 2)])),
    tools: topic.actions.slice(0, 2).map((action) => action.label),
    topicId: topic.id,
  }
}

const JASMINE_WORK: WorkSummary = {
  id: JASMINE_EXPLORATION_UNIT.id,
  title: '茉莉花 · 江南的味道',
  subtitle: JASMINE_EXPLORATION_UNIT.subtitle,
  icon: JASMINE_EXPLORATION_UNIT.icon,
  color: JASMINE_EXPLORATION_UNIT.color,
  source: JASMINE_EXPLORATION_UNIT.source,
  grades: [...PRIMARY_GRADES],
  semester: 1,
  stage: 'primary-middle',
  unitTitle: '中国民歌',
  focus: JASMINE_EXPLORATION_UNIT.question,
  paths: JASMINE_EXPLORATION_UNIT.paths.map((path) => path.id),
  tags: ['民歌', '江南', '五声音阶', '文化', '器乐'],
  tools: JASMINE_TOOL_LABELS,
  culture: JASMINE_EXPLORATION_UNIT.culture.title,
  explorationUnitId: 'jasmine',
}

const WORK_SUMMARIES: WorkSummary[] = [JASMINE_WORK, ...filterTheoryTopics().map(topicToWork)]

interface WorkFilters {
  gradeFilter: WorkFilter
  sourceFilter: CurriculumSource | FilterValue
  pathFilter: ExplorationPath | FilterValue
  tagFilter: string | FilterValue
}

function filterWorks(works: WorkSummary[], filters: WorkFilters): WorkSummary[] {
  return works.filter((work) => {
    const gradeMatches = filters.gradeFilter === 'all' || work.grades.includes(filters.gradeFilter)
    const sourceMatches = filters.sourceFilter === 'all' || work.source === filters.sourceFilter
    const pathMatches = filters.pathFilter === 'all' || work.paths.includes(filters.pathFilter)
    const tagMatches = filters.tagFilter === 'all' || work.tags.includes(filters.tagFilter)
    return gradeMatches && sourceMatches && pathMatches && tagMatches
  })
}

export default function CourseCenter() {
  const { openTheory, openLesson, openExploration, mode, selectedGrade, selectGrade } = useApp()
  const student = getCurrentStudent()
  const currentGrade = selectedGrade ?? student?.grade ?? null
  const [gradeFilter, setGradeFilter] = useState<WorkFilter>(currentGrade ?? 'all')
  const [sourceFilter, setSourceFilter] = useState<CurriculumSource | FilterValue>('all')
  const [pathFilter, setPathFilter] = useState<ExplorationPath | FilterValue>('all')
  const [tagFilter, setTagFilter] = useState<string | FilterValue>('all')
  const [selectedWorkId, setSelectedWorkId] = useState(JASMINE_WORK.id)
  const [activeCourseId, setActiveCourseId] = useState<TheoryStageId>(
    getStageForGrade(currentGrade ?? 1)
  )

  useEffect(() => {
    if (selectedGrade !== null) {
      setGradeFilter(selectedGrade)
      setActiveCourseId(getStageForGrade(selectedGrade))
    }
  }, [selectedGrade])

  const filteredWorks = useMemo(
    () => filterWorks(WORK_SUMMARIES, { gradeFilter, sourceFilter, pathFilter, tagFilter }),
    [gradeFilter, pathFilter, sourceFilter, tagFilter]
  )
  const selectedWork = useMemo(
    () => filteredWorks.find((work) => work.id === selectedWorkId) ?? filteredWorks[0] ?? null,
    [filteredWorks, selectedWorkId]
  )
  const tagOptions = useMemo(
    () => Array.from(new Set(WORK_SUMMARIES.flatMap((work) => work.tags))).sort(),
    []
  )
  const displayedGrade = gradeFilter === 'all' ? null : gradeFilter
  const detailGrade = selectedWork?.grades[0] ?? displayedGrade ?? 1
  const detailStage = getStageForGrade(detailGrade)
  const displayedUnits = displayedGrade ? getCurriculumUnits(displayedGrade) : []
  const gradeSummary = displayedGrade
    ? `${getGradeLabel(displayedGrade)} · ${displayedUnits.length} 个教材主题`
    : '全部小学年级 · 选择年级开始探索'
  const activeCourse = useMemo(
    () => COURSES.find((course) => course.id === activeCourseId) ?? COURSES[0],
    [activeCourseId]
  )

  const handleGradeChange = (value: string) => {
    const nextGrade = value === 'all' ? 'all' : (Number(value) as PrimaryGrade)
    setGradeFilter(nextGrade)
    selectGrade(nextGrade === 'all' ? null : nextGrade)
  }

  const handleStartExploration = (work: WorkSummary) => {
    if (work.explorationUnitId === 'jasmine') {
      openExploration('jasmine')
      return
    }
    if (work.topicId) {
      openTheory({ topicId: work.topicId })
      return
    }
    openLesson(work.stage)
  }

  const handleTheoryOpen = (work: WorkSummary) => {
    openTheory(work.topicId ? { topicId: work.topicId } : { stage: work.stage })
  }

  return (
    <div className="course-page">
      <section className="course-head card">
        <div>
          <span className="course-kicker">浙江人音版小学音乐 · 综合实践</span>
          <h2>作品地图</h2>
          <p>
            从一段作品开始，沿着声音、情绪、动作和文化线索进入互动课堂。
            {mode === 'teacher' ? '适合老师按年级备课与投屏。' : '适合学生按自己的问题选择作品。'}
          </p>
          <div className="course-current-grade" aria-label="当前年级摘要">
            <span>当前年级</span>
            <strong>{gradeSummary}</strong>
          </div>
        </div>
        <div className="course-current">
          <span>{student ? student.avatar : '👤'}</span>
          <b>{student ? student.name : '匿名练习'}</b>
          <small>{student ? '探索挑战会进入成长记录' : '匿名成绩不进入班级观察'}</small>
        </div>
      </section>

      <div className="course-works-map">
        <aside className="course-filter-rail card" aria-label="作品地图筛选">
          <div className="course-filter-heading">
            <span className="course-kicker">作品筛选</span>
            <strong>找到适合现在的作品</strong>
          </div>
          <label>
            <span>年级</span>
            <select value={gradeFilter} onChange={(event) => handleGradeChange(event.target.value)}>
              <option value="all">全部年级</option>
              {PRIMARY_GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {getGradeLabel(grade)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>来源</span>
            <select
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value as CurriculumSource | FilterValue)
              }
            >
              <option value="all">全部来源</option>
              <option value="textbook">{getCurriculumSourceLabel('textbook')}</option>
              <option value="extension">{getCurriculumSourceLabel('extension')}</option>
            </select>
          </label>
          <label>
            <span>路径</span>
            <select
              value={pathFilter}
              onChange={(event) =>
                setPathFilter(event.target.value as ExplorationPath | FilterValue)
              }
            >
              <option value="all">全部路径</option>
              {Object.entries(PATH_LABELS).map(([path, label]) => (
                <option key={path} value={path}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>标签</span>
            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
              <option value="all">全部标签</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
          <small className="course-filter-count">显示 {filteredWorks.length} 个作品</small>
        </aside>

        <section className="course-work-grid" aria-label="作品列表">
          <div className="course-section-heading">
            <div>
              <span className="course-kicker">听见一段，再走进去</span>
              <h2>可探索作品</h2>
            </div>
            <span>{gradeSummary}</span>
          </div>
          {filteredWorks.length > 0 ? (
            <div className="course-work-cards">
              {filteredWorks.map((work) => (
                <button
                  key={work.id}
                  type="button"
                  className={`course-work-card ${selectedWork?.id === work.id ? 'on' : ''}`}
                  onClick={() => setSelectedWorkId(work.id)}
                  aria-pressed={selectedWork?.id === work.id}
                >
                  <span className="course-work-icon" style={{ background: work.color }}>
                    {work.icon}
                  </span>
                  <span className="course-work-copy">
                    <strong>{work.title}</strong>
                    <small>{work.subtitle}</small>
                    <span className="course-work-meta">
                      {getCurriculumSourceLabel(work.source)} · {work.unitTitle}
                    </span>
                  </span>
                  <span className="course-work-tags">
                    {work.tools.slice(0, 2).map((tool) => (
                      <em key={tool}>{tool}</em>
                    ))}
                    {work.paths.slice(0, 2).map((path) => (
                      <em key={path}>{PATH_LABELS[path]}</em>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="course-empty-state">
              <strong>没有匹配的作品</strong>
              <p>换一个年级、来源、路径或标签，继续寻找可以进入的音乐线索。</p>
              <button
                type="button"
                className="lesson-secondary"
                onClick={() => {
                  setGradeFilter(gradeFilter)
                  setSourceFilter('all')
                  setPathFilter('all')
                  setTagFilter('all')
                }}
              >
                清除筛选
              </button>
            </div>
          )}
        </section>

        <aside className="course-work-detail card" aria-label="选中作品详情">
          {selectedWork ? (
            <>
              <div className="course-detail-heading">
                <span className="course-work-icon" style={{ background: selectedWork.color }}>
                  {selectedWork.icon}
                </span>
                <div>
                  <span className="course-kicker">选中作品</span>
                  <h2>{selectedWork.title}</h2>
                </div>
              </div>
              <p className="course-detail-subtitle">{selectedWork.subtitle}</p>
              <p className="course-detail-focus">{selectedWork.focus}</p>
              <div className="course-detail-facts">
                <span>{selectedWork.grades.map(getGradeLabel).join('、')}</span>
                <span>{getCurriculumSourceLabel(selectedWork.source)}</span>
                <span>
                  {getSemesterLabel(selectedWork.semester)} · {selectedWork.unitTitle}
                </span>
              </div>
              <div className="course-detail-group">
                <span>探索路径</span>
                <div className="course-detail-tags">
                  {selectedWork.paths.map((path) => (
                    <em key={path}>{PATH_LABELS[path]}</em>
                  ))}
                </div>
              </div>
              <div className="course-detail-group">
                <span>可用工具</span>
                <div className="course-detail-tags">
                  {selectedWork.tools.length > 0 ? (
                    selectedWork.tools.map((tool) => <em key={tool}>{tool}</em>)
                  ) : (
                    <em>音乐线索</em>
                  )}
                </div>
              </div>
              {selectedWork.culture && (
                <p className="course-culture-note">文化线索 · {selectedWork.culture}</p>
              )}
              <div className="course-detail-actions">
                <button
                  className="big-start"
                  type="button"
                  onClick={() => handleStartExploration(selectedWork)}
                >
                  开始探索
                </button>
                <button
                  className="lesson-secondary"
                  type="button"
                  onClick={() => handleTheoryOpen(selectedWork)}
                >
                  查看音乐线索
                </button>
              </div>
            </>
          ) : (
            <div className="course-empty-detail">
              <strong>还没有选中的作品</strong>
              <p>清除筛选后，从作品卡开始。</p>
            </div>
          )}
        </aside>
      </div>

      <section className="course-legacy-panel card" aria-label="课程入口">
        <div className="course-section-heading">
          <div>
            <span className="course-kicker">课程入口</span>
            <h2>按学段进入课堂</h2>
          </div>
          <span>
            {activeCourse.stage} · {activeCourse.duration}
          </span>
        </div>
        <div className="course-layout">
          <div className="course-list">
            {COURSES.map((course) => (
              <button
                key={course.id}
                type="button"
                className={`course-tab card ${course.id === activeCourse.id ? 'on' : ''}`}
                onClick={() => setActiveCourseId(course.id)}
                style={{ borderColor: course.id === activeCourse.id ? course.color : undefined }}
              >
                <span className="course-icon" style={{ background: course.color }}>
                  {course.icon}
                </span>
                <span>
                  <b>{course.title}</b>
                  <small>
                    {course.stage} · {course.duration}
                  </small>
                </span>
              </button>
            ))}
          </div>
          <section className="lesson-board card">
            <div className="lesson-title">
              <span className="course-icon big" style={{ background: activeCourse.color }}>
                {activeCourse.icon}
              </span>
              <div>
                <h2>{activeCourse.title}</h2>
                <p>{activeCourse.goal}</p>
              </div>
            </div>
            <div className="outcome-row">
              {activeCourse.outcomes.map((outcome) => (
                <span key={outcome}>{outcome}</span>
              ))}
            </div>
            <div className="lesson-foot">
              <button
                className="big-start"
                type="button"
                onClick={() => openLesson(activeCourse.id)}
              >
                进入这个学段的课堂
              </button>
              <button
                className="lesson-secondary"
                type="button"
                onClick={() => openTheory({ stage: activeCourse.id })}
              >
                进入音乐探索馆
              </button>
            </div>
          </section>
        </div>
      </section>

      <section className="course-support-bar card" aria-label="教师支持">
        <div>
          <span className="course-kicker">教师支持</span>
          <strong>保留课堂、理论和练习入口</strong>
          <small>
            {mode === 'teacher'
              ? '可以按当前年级备课、投屏，再把作品交给学生探索。'
              : '想换一种方式继续学习，也可以回到互动课堂或音乐探索馆。'}
          </small>
        </div>
        <div className="course-support-actions">
          <button type="button" onClick={() => openLesson(detailStage)}>
            进入互动课堂
          </button>
          <button type="button" onClick={() => openTheory({ stage: detailStage })}>
            进入音乐探索馆
          </button>
        </div>
      </section>
    </div>
  )
}
