import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../state/appState'
import { ensureAudio, playNote } from '../music/audioEngine'
import { stopUISounds, uiLater } from '../music/uiSounds'
import { useMounted } from '../hooks/useTimers'
import { getCurrentStudent } from '../state/students'
import { recordResult } from '../state/progress'
import {
  DemoKind,
  THEORY_CATEGORIES,
  THEORY_TOPICS,
  TheoryTopic,
  filterTheoryTopics,
  getStageLabel,
} from '../music/theoryCatalog'
import {
  CurriculumSource,
  getCurriculumSourceLabel,
  getGradeLabel,
  getSemesterLabel,
  PrimaryGrade,
} from '../music/zhejiangCurriculum'
import { DemoControl, getDemoScene } from '../music/theoryDemos'
import { buildExplorationTaskCard } from '../music/explorationLoop'
import { getZhejiangExtension } from '../music/zhejiangExtensions'
import { saveMusicDiscovery } from '../state/discoveries'
import PagePager from '../components/PagePager'
import ReferenceActivityStage from '../components/reference/ReferenceActivityStage'
import GradeOneForestQuest from '../components/reference/GradeOneForestQuest'
import {
  getReferenceKnowledgePoints,
  type ReferenceGrade,
  type ReferenceKnowledgePoint,
} from '../music/referenceCourseware'
import { getReferenceActivities } from '../music/referenceActivityCatalog'
import type { JourneyStepId } from '../music/referenceCourseware'
import { loadReviewBook, recordReviewAnswer, saveReviewBook } from '../state/theoryReview'
import './theory.css'

type CategoryFilter = '全部' | string
type SourceFilter = '全部' | CurriculumSource | 'renyin-reference'
type TheoryPanel = 'knowledge' | 'discovery'

export default function Theory() {
  const { navigate, theoryFocus, currentStudentId, mode, selectedGrade } = useApp()
  const [category, setCategory] = useState<CategoryFilter>('全部')
  const [source, setSource] = useState<SourceFilter>(mode === 'student' ? 'textbook' : '全部')
  const [activeId, setActiveId] = useState(THEORY_TOPICS[0].id)
  const [activeDemoValue, setActiveDemoValue] = useState('')
  const [activePanel, setActivePanel] = useState<TheoryPanel>('knowledge')
  const [activeReferenceId, setActiveReferenceId] = useState('')
  const [showForestQuest, setShowForestQuest] = useState(false)
  const [referenceEvidence, setReferenceEvidence] = useState<string[]>([])
  const [referenceObservation, setReferenceObservation] = useState('')
  const [referenceNotice, setReferenceNotice] = useState('')

  // currentStudentId 由应用状态负责触发重渲染；直接读取可避免把外部存储读取包装成无效依赖的 useMemo。
  const currentStudent = getCurrentStudent()
  const effectiveGrade = selectedGrade ?? currentStudent?.grade

  const filtered = useMemo(
    () =>
      source === 'renyin-reference'
        ? []
        : filterTheoryTopics({
            category: category === '全部' ? undefined : category,
            grade: effectiveGrade,
            source: source === '全部' ? undefined : source,
          }),
    [category, effectiveGrade, source]
  )
  const referencePoints = useMemo(
    () =>
      getReferenceKnowledgePoints({
        grade:
          effectiveGrade && effectiveGrade <= 3
            ? (effectiveGrade as ReferenceGrade)
            : undefined,
      }),
    [effectiveGrade]
  )
  const activeReferencePoint: ReferenceKnowledgePoint | undefined =
    referencePoints.find((point) => point.id === activeReferenceId) ?? referencePoints[0]
  const activeReferenceActivity = activeReferencePoint
    ? getReferenceActivities({ knowledgePointId: activeReferencePoint.id })[0]
    : undefined
  const gradeTopics = useMemo(
    () => (effectiveGrade ? filterTheoryTopics({ grade: effectiveGrade }) : THEORY_TOPICS),
    [effectiveGrade]
  )
  const active = filtered.find((t) => t.id === activeId) ?? filtered[0] ?? gradeTopics[0] ?? THEORY_TOPICS[0]
  const demoScene = getDemoScene(active.demo.kind)
  const activeControl =
    demoScene.controls.find((control) => control.value === activeDemoValue) ?? demoScene.controls[0]

  // 切换主题时同步选中该主题的默认控件，避免一帧"旧主题+新控件"的错配
  useEffect(() => {
    setActiveDemoValue(demoScene.controls[0]?.value ?? '')
    setActivePanel('knowledge')
  }, [active.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((topic) => topic.id === activeId)) {
      setActiveId(filtered[0].id)
    }
  }, [activeId, filtered])

  useEffect(() => {
    if (source !== 'renyin-reference') {
      setShowForestQuest(false)
      return
    }
    if (referencePoints.length > 0 && !referencePoints.some((point) => point.id === activeReferenceId)) {
      setActiveReferenceId(referencePoints[0].id)
    }
  }, [activeReferenceId, referencePoints, source])

  useEffect(() => {
    if (!theoryFocus) return
    const nextCategory = theoryFocus.category ?? '全部'
    const focusedTopics = filterTheoryTopics({
      category: theoryFocus.category,
      stage: theoryFocus.stage,
      grade: effectiveGrade,
    })
    const nextTopic =
      (theoryFocus.topicId && focusedTopics.find((topic) => topic.id === theoryFocus.topicId)) ||
      focusedTopics[0]

    setCategory(nextCategory)
    if (nextTopic) setActiveId(nextTopic.id)
  }, [effectiveGrade, theoryFocus])

  const clearFilters = () => {
    setCategory('全部')
    setSource(mode === 'student' ? 'textbook' : '全部')
    setActiveId(gradeTopics[0]?.id ?? THEORY_TOPICS[0].id)
    setActiveReferenceId('')
    setShowForestQuest(false)
  }

  return (
    <div className="theory-lab presentation-page theory-presentation" data-theory-panel={activePanel}>
      <div className="presentation-slide theory-presentation-slide">
      <section className="theory-lab-head card">
        <div>
          <span className="theory-kicker">浙江人音版 · 互动音乐探索馆</span>
          <h2>小学 1—6 年级的音乐线索库</h2>
          <p>先从“我听到了什么”开始，再用一张短线索卡找到音乐名称；听、比较、表达之后，乐理才会自然出现。</p>
          <span className="theory-scope-note">{effectiveGrade ? `${getGradeLabel(effectiveGrade)}内容` : '全部年级内容'}</span>
        </div>
        <div className="theory-count">
          <b>{filtered.length}</b>
          <small>当前 / 共 {THEORY_TOPICS.length} 张</small>
        </div>
      </section>

      <div className="theory-layout">
        <aside className="theory-nav card">
          <FilterGroup
            title="音乐方向"
            value={category}
            options={['全部', ...THEORY_CATEGORIES]}
            onChange={(next) => setCategory(next)}
          />
          <FilterGroup
            title="教材来源"
            value={source}
            options={['全部', 'textbook', 'extension', 'renyin-reference']}
            getLabel={(value) =>
              value === '全部'
                ? '全部内容'
                : value === 'renyin-reference'
                  ? '人音版参考课件'
                  : getCurriculumSourceLabel(value as CurriculumSource)
            }
            onChange={(next) => setSource(next as SourceFilter)}
          />

          <div className="topic-select topic-list">
            {source === 'renyin-reference' ? (
              referencePoints.length === 0 ? (
                <div className="topic-empty">
                  <b>当前年级暂时没有参考课件</b>
                  <button type="button" onClick={clearFilters}>返回教材内容</button>
                </div>
              ) : (
                <label className="theory-filter-select">
                  <span className="side-group-title">参考课件知识点</span>
                  <select
                    aria-label="选择参考课件知识点"
                    value={activeReferencePoint?.id ?? ''}
                    onChange={(event) => {
                      setActiveReferenceId(event.target.value)
                      setShowForestQuest(false)
                      setReferenceEvidence([])
                      setReferenceObservation('')
                    }}
                  >
                    {referencePoints.map((point) => (
                      <option key={point.id} value={point.id}>
                        {point.title} · {getGradeLabel(point.grade)} · 上册
                      </option>
                    ))}
                  </select>
                  <small className="topic-select-hint">先听、再感受，最后用短卡片认识概念</small>
                </label>
              )
            ) : filtered.length === 0 ? (
              <div className="topic-empty">
                <b>没有匹配发现卡</b>
                <button type="button" onClick={clearFilters}>清除筛选</button>
              </div>
            ) : (
              <label className="theory-filter-select">
                <span className="side-group-title">线索卡</span>
                <select
                  aria-label="选择知识点"
                  value={active.id}
                  onChange={(event) => setActiveId(event.target.value)}
                >
                  {filtered.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title} · {topic.curriculum.grades.map(getGradeLabel).join(' / ')} · {getSemesterLabel(topic.curriculum.semester)}
                    </option>
                  ))}
                </select>
                <small className="topic-select-hint">共 {filtered.length} 个知识点，选择后查看右侧内容</small>
              </label>
            )}
          </div>
        </aside>

        <main className="theory-main">
          {source === 'renyin-reference' ? (
            <section className="reference-courseware-panel card" aria-labelledby="reference-courseware-title">
              <header className="reference-courseware-panel__header">
                <div>
                  <span className="theory-kicker">人音版参考课件 · 先听再探索</span>
                  <h2 id="reference-courseware-title">
                    {activeReferencePoint?.title ?? '选择一个参考课件知识点'}
                  </h2>
                  <p>{activeReferencePoint?.shortPrompt ?? '从声音、动作和故事开始。'}</p>
                </div>
                {effectiveGrade === 1 && activeReferenceActivity && (
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => setShowForestQuest((current) => !current)}
                  >
                    {showForestQuest ? '回到单个知识点' : '打开森林地图'}
                  </button>
                )}
              </header>
              {showForestQuest && effectiveGrade === 1 ? (
                <GradeOneForestQuest
                  onComplete={(activityId) =>
                    setReferenceNotice(`已完成一年级森林活动：${activityId}。`)
                  }
                />
              ) : activeReferenceActivity ? (
                <ReferenceActivityStage
                  activity={activeReferenceActivity}
                  onEvidence={(value) =>
                    setReferenceEvidence((current) => Array.from(new Set([...current, value])))
                  }
                  onObservation={setReferenceObservation}
                  onStepComplete={(step: JourneyStepId) => {
                    if (step === 'try' || step === 'reflect') {
                      setReferenceNotice('这条听觉线索已经留下，可以继续听下一个变化。')
                    }
                  }}
                />
              ) : (
                <div className="theory-empty-state">
                  <span className="theory-empty-icon" aria-hidden="true">🎧</span>
                  <h3>当前筛选没有可打开的参考活动</h3>
                  <p>请选择一年级、二年级或三年级，再从左侧知识点开始。</p>
                </div>
              )}
              {(referenceEvidence.length > 0 || referenceObservation || referenceNotice) && (
                <aside className="reference-courseware-panel__reflection" aria-live="polite">
                  <strong>我的听觉线索</strong>
                  <span>{referenceEvidence.join(' · ') || '还没有选择线索'}</span>
                  {referenceObservation && <small>{referenceObservation}</small>}
                  {referenceNotice && <p>{referenceNotice}</p>}
                </aside>
              )}
            </section>
          ) : filtered.length === 0 ? (
            <section className="topic-panel card theory-empty-panel" aria-live="polite">
              <div className="theory-empty-state">
                <span className="theory-empty-icon" aria-hidden="true">🎼</span>
                <span className="theory-kicker">调整筛选</span>
                <h2>暂时没有匹配的发现卡</h2>
                <p>当前年级与所选音乐方向、教材来源没有可展示内容，请更换筛选条件。</p>
                <button className="primary-action" type="button" onClick={clearFilters}>清除筛选</button>
              </div>
            </section>
          ) : (
            <section className="topic-panel card">
            <div className="theory-content-tabs" role="tablist" aria-label="主题内容页面">
              <button
                type="button"
                role="tab"
                aria-selected={activePanel === 'knowledge'}
                className={`theory-content-tab ${activePanel === 'knowledge' ? 'on' : ''}`}
                onClick={() => setActivePanel('knowledge')}
              >
                <span>📖</span>
                <b>知识学习</b>
                <small>理解概念与声音线索</small>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePanel === 'discovery'}
                className={`theory-content-tab ${activePanel === 'discovery' ? 'on' : ''}`}
                onClick={() => setActivePanel('discovery')}
              >
                <span>🧭</span>
                <b>探索发现</b>
                <small>听、玩、创作与分享</small>
              </button>
            </div>

            <div className="topic-title">
              <div>
                <span>{active.category} · {getStageLabel(active.stage)} · {active.level}</span>
                <h2>{active.title}</h2>
                <div className="topic-curriculum-meta" aria-label="教材对照">
                  <span>{active.curriculum.grades.map(getGradeLabel).join(' / ')}</span>
                  <span>{getSemesterLabel(active.curriculum.semester)}</span>
                  <span>{active.curriculum.unitTitle}</span>
                  <span>{getCurriculumSourceLabel(active.curriculum.source)}</span>
                </div>
              </div>
              <button className="demo-play" onClick={() => playDemo(active.demo.kind, activeControl)}>
                ▶ 听演示
              </button>
            </div>

            <div className="theory-presentation-block theory-presentation-learn">
              <DetailedExplanation topic={active} />

              <TheoryDemoLab
                topic={active}
                activeValue={activeControl.value}
                onChange={setActiveDemoValue}
              />
            </div>

            <div className="theory-presentation-block theory-presentation-play">
              <section className="inline-quiz-panel">
              <div className="inline-quiz-copy">
                <span className="theory-kicker">本关互动题</span>
                <h3>{active.title}声音挑战</h3>
                <p>听完演示后，用一题快速判断学生是否抓住声音变化。</p>
              </div>
              <MiniQuiz
                key={active.id}
                topic={active}
                studentId={currentStudentId ?? 'anonymous'}
                recordEnabled={mode !== 'lecture'}
              />
              </section>

              <ExplorationLoop
                topic={active}
                scene={demoScene}
                activeValue={activeControl.value}
                onChange={setActiveDemoValue}
                onPlay={() => playDemo(active.demo.kind, activeControl)}
                onNavigate={navigate}
                studentId={currentStudentId}
                recordEnabled={mode !== 'lecture'}
              />
            </div>

            <div className="theory-presentation-block theory-presentation-share">
              <ZhejiangExtensionCard
                topic={active}
                grade={effectiveGrade ?? active.curriculum.grades[0]}
                onNavigate={navigate}
              />

              <div className="point-grid">
                {active.keyPoints.map((p, i) => (
                  <div key={p} className="point-card">
                    <span>{i + 1}</span>
                    <p>{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          )}
        </main>
      </div>
      </div>
    </div>
  )
}

function DetailedExplanation({ topic }: { topic: TheoryTopic }) {
  return (
    <div className="topic-explanation">
      <div className="theory-clue-card-grid" aria-label="音乐线索卡">
        <article className="theory-clue-card">
          <span>先听</span>
          <b>{topic.subtitle}</b>
          <p>{topic.concept}</p>
        </article>
        <article className="theory-clue-card">
          <span>找依据</span>
          <b>{topic.keyPoints[0] ?? '听出一个变化'}</b>
          <p>点击演示做一次比较，说说你是从哪里听出来的。</p>
        </article>
        <article className="theory-clue-card">
          <span>再命名</span>
          <b>{topic.title}</b>
          <p>听到现象以后，再把它和音乐名称、符号或动作连起来。</p>
        </article>
      </div>
      {topic.detail && (
        <details className="explain-detail">
          <summary>想知道这个线索的乐理名字？</summary>
          {topic.detail.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </details>
      )}
    </div>
  )
}

function FilterGroup({
  title,
  value,
  options,
  getLabel = (item) => item,
  onChange,
}: {
  title: string
  value: string
  options: string[]
  getLabel?: (item: string) => string
  onChange: (value: string) => void
}) {
  return (
    <div className="theory-filter-group">
      <label className="theory-filter-select">
        <span className="side-group-title">{title}</span>
        <select aria-label={`选择${title}`} value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {getLabel(option)}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function TheoryDemoLab({
  topic,
  activeValue,
  onChange,
}: {
  topic: TheoryTopic
  activeValue: string
  onChange: (value: string) => void
}) {
  const scene = getDemoScene(topic.demo.kind)
  const activeControl = scene.controls.find((control) => control.value === activeValue) ?? scene.controls[0]

  return (
    <div className="theory-demo-lab">
      <div className="demo-control-head">
        <div>
          <b>{scene.title}</b>
          <p>{scene.prompt}</p>
        </div>
        <span>{activeControl.detail}</span>
      </div>
      <div className="demo-control-row">
        {scene.controls.map((control) => (
          <button
            key={control.value}
            className={control.value === activeControl.value ? 'on' : ''}
            onClick={() => onChange(control.value)}
          >
            <b>{control.label}</b>
            <small>{control.detail}</small>
          </button>
        ))}
      </div>
      <DemoView topic={topic} control={activeControl} />
      <div className="demo-observations">
        {scene.observations.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  )
}

function ExplorationLoop({
  topic,
  scene,
  activeValue,
  onChange,
  onPlay,
  onNavigate,
  studentId,
  recordEnabled,
}: {
  topic: TheoryTopic
  scene: ReturnType<typeof getDemoScene>
  activeValue: string
  onChange: (value: string) => void
  onPlay: () => void
  onNavigate: ReturnType<typeof useApp>['navigate']
  studentId: string | null
  recordEnabled: boolean
}) {
  const task = buildExplorationTaskCard(topic, scene)
  const steps = task.steps
  const [stepIndex, setStepIndex] = useState(0)
  const activeStep = steps[stepIndex] ?? steps[0]
  const stepPagerItems = useMemo(
    () => steps.map((step) => ({ id: step.id, label: step.badge, hint: step.prompt })),
    [steps]
  )
  const guessControls = scene.controls.slice(0, 2)
  const speakStarters = [
    `我听到：${topic.subtitle}`,
    `我发现：${topic.keyPoints[0]}`,
    '我想把它变成一段小作品',
  ]

  useEffect(() => {
    setStepIndex(0)
  }, [topic.id])

  return (
    <div className="exploration-loop">
      <div className="exploration-head">
        <div>
          <span className="theory-kicker">声音探险卡</span>
          <h3>{task.title}</h3>
          <p>{task.mission}</p>
        </div>
        <button className="demo-play" onClick={onPlay}>
          ▶ 先听一遍
        </button>
      </div>
      <div className="task-checkpoints" aria-label="本次探索检查点">
        {task.checkpoints.map((checkpoint) => (
          <span key={checkpoint}>{checkpoint}</span>
        ))}
      </div>
      <PagePager
        items={stepPagerItems}
        activeIndex={stepIndex}
        onChange={setStepIndex}
        ariaLabel="声音探险步骤"
        compact
      />
      <div className="exploration-steps">
        {activeStep && (
          <div key={activeStep.id} className={`exploration-step step-${activeStep.id}`}>
            <div className="exploration-step-top">
              <span className="exploration-index">{stepIndex + 1}</span>
              <span className="task-badge">{activeStep.badge}</span>
            </div>
            <div>
              <b>{activeStep.title}</b>
              <p>{activeStep.prompt}</p>
              <small>{activeStep.microGoal}</small>
            </div>
            {activeStep.id === 'listen' && (
              <button onClick={onPlay}>{activeStep.actionLabel}</button>
            )}
            {activeStep.id === 'guess' && (
              <div className="exploration-choice-row">
                {guessControls.map((control) => (
                  <button
                    key={control.value}
                    className={control.value === activeValue ? 'on' : ''}
                    onClick={() => onChange(control.value)}
                  >
                    {control.label}
                  </button>
                ))}
              </div>
            )}
            {activeStep.id === 'play' && (
              <div className="exploration-choice-row wrap">
                {scene.controls.slice(0, 4).map((control) => (
                  <button
                    key={control.value}
                    className={control.value === activeValue ? 'on' : ''}
                    onClick={() => onChange(control.value)}
                  >
                    {control.label}
                  </button>
                ))}
                {activeStep.route && (
                  <button className="primary" onClick={() => onNavigate(activeStep.route!)}>
                    {activeStep.actionLabel}
                  </button>
                )}
              </div>
            )}
            {activeStep.id === 'speak' && (
              <DiscoveryCapture
                topic={topic}
                starters={speakStarters}
                studentId={studentId}
                recordEnabled={recordEnabled}
              />
            )}
            {activeStep.id === 'create' && (
              <div className="exploration-choice-row wrap">
                <button className="primary" onClick={() => onNavigate(activeStep.route ?? 'mixer')}>
                  {activeStep.actionLabel}
                </button>
                {topic.actions.filter((action) => action.route !== activeStep.route).slice(0, 2).map((action) => (
                  <button key={action.label} onClick={() => onNavigate(action.route)}>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DiscoveryCapture({
  topic,
  starters,
  studentId,
  recordEnabled,
}: {
  topic: TheoryTopic
  starters: string[]
  studentId: string | null
  recordEnabled: boolean
}) {
  const [statement, setStatement] = useState(starters[0] ?? `我发现：${topic.subtitle}`)
  const [saved, setSaved] = useState(false)

  const save = () => {
    const trimmed = statement.trim()
    if (!trimmed || !recordEnabled) return
    saveMusicDiscovery({
      studentId,
      topicId: topic.id,
      title: topic.title,
      statement: trimmed,
      source: topic.curriculum.source,
      grade: topic.curriculum.grades[0],
      semester: topic.curriculum.semester,
      unitId: topic.curriculum.unitId,
      unitTitle: topic.curriculum.unitTitle,
      tags: [topic.category, ...topic.curriculum.focus.split('、').slice(0, 2)],
    })
    setSaved(true)
  }

  return (
    <div className="discovery-capture">
      <div className="exploration-choice-row wrap">
        {starters.map((starter) => (
          <button
            key={starter}
            type="button"
            className={statement === starter ? 'on' : ''}
            onClick={() => {
              setStatement(starter)
              setSaved(false)
            }}
          >
            {starter}
          </button>
        ))}
      </div>
      <label className="discovery-input-label">
        <span>我的发现</span>
        <textarea
          value={statement}
          maxLength={160}
          rows={2}
          onChange={(event) => {
            setStatement(event.target.value)
            setSaved(false)
          }}
          placeholder="用一句话说说你听到了什么变化"
          disabled={!recordEnabled}
        />
      </label>
      <div className="discovery-capture-foot">
        <button type="button" className="primary" onClick={save} disabled={!recordEnabled || !statement.trim()}>
          {saved ? '✓ 已保存发现' : '保存我的发现'}
        </button>
        {!recordEnabled && <small>投屏模式不记录个人发现</small>}
      </div>
    </div>
  )
}

function ZhejiangExtensionCard({
  topic,
  grade,
  onNavigate,
}: {
  topic: TheoryTopic
  grade: PrimaryGrade
  onNavigate: ReturnType<typeof useApp>['navigate']
}) {
  const extension = getZhejiangExtension(topic, grade)
  return (
    <section className="zhejiang-extension-card" aria-label="浙江拓展">
      <div>
        <span className="theory-kicker">教材外拓展 · 浙江声音</span>
        <h3>{extension.title}</h3>
        <p>{extension.connection}</p>
      </div>
      <div className="zhejiang-extension-prompt">
        <span>试试看</span>
        <p>{extension.prompt}</p>
        <div className="extension-actions">
          {extension.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
          {extension.route && (
            <button type="button" onClick={() => onNavigate(extension.route!)}>
              去体验
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function DemoView({ topic, control }: { topic: TheoryTopic; control: DemoControl }) {
  const kind = topic.demo.kind
  return (
    <div className={`lab-demo ${kind}`}>
      {kind === 'pitch' && <KeyboardDemo active={control.notes.map(noteName)} />}
      {kind === 'duration' && <DurationDemo control={control} />}
      {kind === 'meter' && <MeterDemo control={control} />}
      {kind === 'staff' && <StaffDemo control={control} />}
      {kind === 'jianpu' && <JianpuDemo control={control} />}
      {kind === 'scale' && <ScaleDemo control={control} />}
      {kind === 'interval' && <IntervalDemo control={control} />}
      {kind === 'chord' && <ChordDemo control={control} />}
      {kind === 'tempo' && <TempoDemo active={control.value} />}
      {kind === 'dynamics' && <DynamicsDemo active={control.value} />}
      {kind === 'articulation' && <ArticulationDemo active={control.value} />}
      {kind === 'repeat' && <RepeatDemo control={control} />}
      {kind === 'form' && <FormDemo control={control} />}
    </div>
  )
}

function noteName(note: string) {
  return note.replace(/[0-9]/g, '').replace('#', '♯')
}

function KeyboardDemo({ active }: { active: string[] }) {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const solfege = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti']
  return (
    <div className="lab-keyboard">
      {notes.map((n, i) => (
        <div key={n} className={`lab-key ${active.includes(n) ? 'active' : ''}`}>
          <b>{i + 1}</b>
          <span>{n}</span>
          <small>{solfege[i]}</small>
        </div>
      ))}
    </div>
  )
}

function DurationDemo({ control }: { control: DemoControl }) {
  const symbols = control.symbols ?? ['♩']
  return (
    <div className="duration-demo">
      {symbols.map((symbol, i) => (
        <div key={`${symbol}${i}`} className={i === 0 ? 'active' : ''}>
          <b>{symbol}</b>
          <span>{control.label}</span>
          <small>{control.detail}</small>
        </div>
      ))}
    </div>
  )
}

function MeterDemo({ control }: { control: DemoControl }) {
  const beats = control.beats ?? ['1', '2', '3', '4']
  const accent = control.accentPattern ?? [1, 0, 0.6, 0]
  return (
    <div className="meter-demo">
      {beats.map((n, i) => (
        <span key={n} className={accent[i] === 1 ? 'strong' : accent[i] ? 'medium' : ''}>{n}</span>
      ))}
      <p>{control.detail}</p>
    </div>
  )
}

function StaffDemo({ control }: { control: DemoControl }) {
  const positions: Record<string, [number, number]> = {
    C: [130, 110],
    D: [165, 101],
    E: [200, 92],
    F: [235, 83],
    G: [270, 74],
    A: [305, 65],
    B: [340, 56],
  }
  const notes = control.notes.map(noteName)
  return (
    <svg className="staff-demo" viewBox="0 0 420 150">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="28" x2="390" y1={38 + i * 18} y2={38 + i * 18} />
      ))}
      <text x="42" y="105" className="clef">𝄞</text>
      {notes.map((label, index) => {
        const [x, y] = positions[label] ?? [150 + index * 48, 92 - index * 8]
        return (
        <g key={label}>
          <ellipse cx={Number(x)} cy={Number(y)} rx="13" ry="9" transform={`rotate(-20 ${x} ${y})`} />
          <text x={Number(x)} y="135">{label}</text>
        </g>
        )
      })}
    </svg>
  )
}

function JianpuDemo({ control }: { control: DemoControl }) {
  const symbols = control.symbols ?? ['1', '2', '3', '4', '5', '6', '7']
  return (
    <div className="jianpu-demo">
      {symbols.map((n, i) => (
        <span key={n}>
          <b>{n}</b>
          <small>{['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'][Number(n) - 1] ?? control.notes[i]}</small>
        </span>
      ))}
    </div>
  )
}

function ScaleDemo({ control }: { control: DemoControl }) {
  return (
    <div className="scale-demo">
      {control.notes.map((n, i) => (
        <span key={`${n}${i}`} style={{ height: 36 + i * 8 }}>
          {noteName(n)}
        </span>
      ))}
    </div>
  )
}

function IntervalDemo({ control }: { control: DemoControl }) {
  return (
    <div className="interval-demo">
      <KeyboardDemo active={control.notes.map(noteName)} />
      <div className="interval-line">{control.detail}</div>
    </div>
  )
}

function ChordDemo({ control }: { control: DemoControl }) {
  return (
    <div className="chord-demo">
      <KeyboardDemo active={control.notes.map(noteName)} />
      <div className="chord-label">{control.detail}</div>
    </div>
  )
}

function TempoDemo({ active }: { active: string }) {
  return (
    <div className="tempo-demo">
      <div className={active === 'slow' ? 'active' : ''}><b>慢速</b><span>60 BPM</span></div>
      <div className={active === 'medium' ? 'active' : ''}><b>中速</b><span>100 BPM</span></div>
      <div className={active === 'fast' ? 'active' : ''}><b>快速</b><span>140 BPM</span></div>
    </div>
  )
}

function DynamicsDemo({ active }: { active: string }) {
  return (
    <div className="dynamics-demo">
      {[
        ['soft', 'p'],
        ['medium', 'mf'],
        ['strong', 'f'],
        ['crescendo', '<'],
      ].map(([key, d], i) => (
        <span key={key} className={active === key ? 'active' : ''} style={{ fontSize: 24 + i * 9 }}>{d}</span>
      ))}
    </div>
  )
}

function ArticulationDemo({ active }: { active: string }) {
  return (
    <div className="articulation-demo">
      <div className={active === 'legato' ? 'active' : ''}><b>连音</b><span>do - re - mi</span></div>
      <div className={active === 'staccato' ? 'active' : ''}><b>跳音</b><span>do · re · mi</span></div>
      <div className={active === 'accent' ? 'active' : ''}><b>重音</b><span>&gt; do re mi</span></div>
    </div>
  )
}

function RepeatDemo({ control }: { control: DemoControl }) {
  const symbols = control.symbols ?? ['A', 'A', 'B']
  return (
    <div className="repeat-demo">
      {symbols.map((symbol, index) => (
        <span key={`${symbol}${index}`}>{symbol}</span>
      ))}
      <small>{control.detail}</small>
    </div>
  )
}

function FormDemo({ control }: { control: DemoControl }) {
  const symbols = control.symbols ?? ['A', 'B', 'A']
  return (
    <div className="form-demo">
      {symbols.map((symbol, index) => (
        <span key={`${symbol}${index}`}>{symbol}</span>
      ))}
      <small>{control.detail}</small>
    </div>
  )
}

function MiniQuiz({
  topic,
  studentId,
  recordEnabled,
}: {
  topic: TheoryTopic
  studentId: string
  recordEnabled: boolean
}) {
  const [pickedByQuestion, setPickedByQuestion] = useState<Record<number, number>>({})
  const [quizPage, setQuizPage] = useState(0)
  const mounted = useMounted()
  const questionsPerPage = 1
  const pageCount = Math.ceil(topic.quiz.length / questionsPerPage)
  const visibleQuestions = topic.quiz.slice(
    quizPage * questionsPerPage,
    quizPage * questionsPerPage + questionsPerPage
  )
  const correctCount = topic.quiz.reduce(
    (total, q, questionIndex) => total + (pickedByQuestion[questionIndex] === q.answer ? 1 : 0),
    0
  )

  const choose = async (questionIndex: number, selectedAnswer: number) => {
    if (pickedByQuestion[questionIndex] !== undefined) return
    const q = topic.quiz[questionIndex]
    const ok = selectedAnswer === q.answer
    const nextPicked = { ...pickedByQuestion, [questionIndex]: selectedAnswer }
    setPickedByQuestion(nextPicked)

    if (recordEnabled) {
      const book = loadReviewBook(studentId)
      saveReviewBook(
        recordReviewAnswer(book, {
          source: 'theory',
          itemId: topic.id,
          itemTitle: topic.title,
          category: topic.category,
          stage: topic.stage,
          question: q.q,
          options: q.options,
          correctAnswer: q.answer,
          selectedAnswer,
          explanation: topic.concept,
          timestamp: Date.now(),
        })
      )
    }

    await ensureAudio()
    if (!mounted.current) return
    playNote(ok ? 'C5' : 'F3', '8n')

    if (recordEnabled && Object.keys(nextPicked).length === topic.quiz.length) {
      const finalCorrect = topic.quiz.reduce(
        (total, item, itemIndex) => total + (nextPicked[itemIndex] === item.answer ? 1 : 0),
        0
      )
      const acc = finalCorrect / topic.quiz.length
      recordResult(`theory-${topic.id}`, 1, acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : 1, finalCorrect * 100, { accuracy: acc })
    }
  }

  return (
    <div className="mini-quiz">
      <div className="quiz-summary">
        <div>
          <h4>本关小挑战</h4>
          <p>每次 1 题，适合投屏时听完马上判断。</p>
        </div>
        <strong>{correctCount}/{topic.quiz.length}</strong>
      </div>
      <div className="quiz-grid">
        {visibleQuestions.map((q, localIndex) => {
          const questionIndex = quizPage * questionsPerPage + localIndex
          const picked = pickedByQuestion[questionIndex]
          return (
            <div key={q.q} className="quiz-card">
              <span>第 {questionIndex + 1} 题</span>
              <h5>{q.q}</h5>
              <div className="quiz-options">
                {q.options.map((opt, optionIndex) => {
                  const answered = picked !== undefined
                  const cls = answered
                    ? optionIndex === q.answer
                      ? 'right'
                      : optionIndex === picked
                        ? 'wrong'
                        : ''
                    : ''
                  return (
                    <button
                      key={`${q.q}-${opt}`}
                      className={cls}
                      disabled={answered}
                      onClick={() => choose(questionIndex, optionIndex)}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {pageCount > 1 && (
        <div className="quiz-pager">
          <button disabled={quizPage === 0} onClick={() => setQuizPage((page) => Math.max(0, page - 1))}>
            上一组
          </button>
          <span>{quizPage + 1}/{pageCount}</span>
          <button
            disabled={quizPage >= pageCount - 1}
            onClick={() => setQuizPage((page) => Math.min(pageCount - 1, page + 1))}
          >
            下一组
          </button>
        </div>
      )}
    </div>
  )
}

async function playDemo(kind: DemoKind, control: DemoControl) {
  await ensureAudio()
  // 经 uiLater 登记：连续点击自动清掉上一段的未触发音符（不叠加），切页时统一静音
  stopUISounds()
  const later = (ms: number, fn: () => void) => uiLater(fn, ms)

  if (kind === 'chord') {
    control.notes.forEach((note) => playNote(note, '2n', control.value === 'dominant7' ? 0.55 : 0.65))
    return
  }

  if (kind === 'tempo') {
    const gap = control.value === 'slow' ? 620 : control.value === 'fast' ? 260 : 390
    control.notes.forEach((note, i) => later(i * gap, () => playNote(note, '16n')))
    return
  }

  if (kind === 'dynamics') {
    if (control.value === 'crescendo') {
      [0.3, 0.55, 0.9].forEach((volume, i) => later(i * 360, () => playNote('C4', '8n', volume)))
    } else {
      playNote('C4', '4n', control.value === 'soft' ? 0.3 : control.value === 'strong' ? 0.95 : 0.62)
    }
    return
  }

  if (kind === 'articulation') {
    control.notes.forEach((note, i) => {
      const duration = control.value === 'staccato' ? '16n' : '4n'
      const volume = control.value === 'accent' && i === 0 ? 0.95 : 0.62
      later(i * (control.value === 'staccato' ? 230 : 410), () => playNote(note, duration, volume))
    })
    return
  }

  if (kind === 'meter') {
    const accent = control.accentPattern ?? []
    control.notes.forEach((note, i) => later(i * 360, () => playNote(note, '16n', accent[i] ? 0.9 : 0.45)))
    return
  }

  if (kind === 'duration') {
    control.notes.forEach((note, i) => later(i * 520, () => playNote(note, i === 0 ? '4n' : '8n')))
    return
  }

  if (kind === 'interval') {
    control.notes.forEach((note, i) => later(i * 520, () => playNote(note, '4n')))
    later(1180, () => control.notes.forEach((note) => playNote(note, '2n', 0.55)))
    return
  }

  if (kind === 'repeat' || kind === 'form') {
    control.notes.forEach((note, i) => later(i * 250, () => playNote(note, '8n')))
    return
  }

  control.notes.forEach((note, i) => later(i * 280, () => playNote(note, '8n')))
}
