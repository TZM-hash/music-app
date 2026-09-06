import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Route, useApp } from '../state/appState'
import { loadProgress } from '../state/progress'
import { getCurrentStudent } from '../state/students'
import { ProgressRing, SpectrumBars } from '../components/Charts'
import { useFillOnMount } from '../components/useFillOnMount'
import MusicExperienceStage from '../components/MusicExperienceStage'
import MusicMicroscope from '../components/MusicMicroscope'
import InstrumentExplorer from '../components/InstrumentExplorer'
import RhythmMovementLab from '../components/RhythmMovementLab'
import GradeOneForestQuest from '../components/reference/GradeOneForestQuest'
import { buildExperienceJourney, getRecommendedActivities } from '../music/experienceActivities'
import { buildExperienceInstanceKey } from '../music/experienceGameLogic'
import { getGradeLabel } from '../music/zhejiangCurriculum'
import { GRADE_ONE_ACTIVITIES } from '../music/referenceLessons/gradeOneUpper'
import {
  EXPLORATION_TOOL_CATALOG,
  JASMINE_INSTRUMENT_SAMPLES,
  JASMINE_MICROSCOPE_CUES,
  JASMINE_RHYTHM_PATTERN,
  type ExplorationToolId,
  type MusicDiscoveryToolNote,
} from '../music/explorationTools'
import PagePager, { type PagePagerItem } from '../components/PagePager'
import '../components/charts.css'
import './training.css'

const TRAINING_PRESENTATION_PAGES: readonly PagePagerItem[] = [
  { id: 'experience', label: '今日玩乐', hint: '三种短时音乐体验' },
  { id: 'auditory', label: '听觉实验室', hint: '比较声音、记录线索并回到作品' },
  { id: 'practice', label: '更多练习', hint: '听感、读谱、跟唱和节奏挑战' },
]

interface TrainingModule {
  id: string
  route: Route
  icon: string
  title: string
  former: string
  ability: string
  stage: string
  goal: string
  reason: string
  playHint: string
  metrics: string[]
  level: string
  color: string
}

interface AuditoryLabTool {
  id: ExplorationToolId
  icon: string
  title: string
  question: string
  focus: string
  grade: string
  color: string
}

const MODULES: TrainingModule[] = [
  {
    id: 'aural',
    route: 'game-ear',
    icon: '👂',
    title: '听感寻宝',
    former: '听感挑战',
    ability: '听感力',
    stage: '小学低段起',
    goal: '把音高、音程、和弦变成耳朵能抓住的线索，慢慢形成稳定的调性感受。',
    reason: '适合作为每节课的开场热身，先让耳朵进入状态。',
    playHint: '先听再选，不急着抢答；答错时回听一次再继续。',
    metrics: ['命中率', '回放点', '音程/和弦感'],
    level: 'L1-L3',
    color: '#2f9e44',
  },
  {
    id: 'reading',
    route: 'game-read',
    icon: '🎼',
    title: '谱面寻路',
    former: '读谱闯关',
    ability: '读谱力',
    stage: '小学中段起',
    goal: '把五线谱位置、谱号、唱名和简谱数字连起来，让符号变成能唱出来的音乐路线。',
    reason: '适合在探索馆学完谱面概念后，用短挑战检查是否真的看懂。',
    playHint: '先看谱号和位置，再找唱名；遇到不确定就放慢节奏。',
    metrics: ['音位命中', '谱号适应', '线间回放'],
    level: 'L1-L3',
    color: '#f59f00',
  },
  {
    id: 'intonation',
    route: 'game-sing',
    icon: '🎤',
    title: '跟唱冒险',
    former: '音准反馈',
    ability: '演唱音准',
    stage: '小学高段起',
    goal: '跟着目标旋律唱一唱，感受音阶、级进、跳进和稳定音，发现偏高偏低后再试一次。',
    reason: '适合把听到的旋律转成自己的声音，连接听感和演唱表达。',
    playHint: '先轻声跟唱，重点听偏高还是偏低，再用下一次修正。',
    metrics: ['音准率', '偏高/偏低', '唱准音数'],
    level: 'L2-L4',
    color: '#d6336c',
  },
  {
    id: 'reaction',
    route: 'game-taiko',
    icon: '🥁',
    title: '节奏反应派对',
    former: '节奏反应',
    ability: '节奏力',
    stage: '小学低段起',
    goal: '把拍号、强弱拍、音符时值和休止变成连续反应，让身体先找到稳定律动。',
    reason: '适合在课堂中段调动状态，也能快速看出节拍是否稳定。',
    playHint: '身体先跟拍，眼睛再看提示；休止时心里也要继续数拍。',
    metrics: ['反应命中', '连击', '律动稳定'],
    level: 'L2-L4',
    color: '#f25050',
  },
  {
    id: 'echo',
    route: 'game-echo',
    icon: '🔁',
    title: '节奏记忆',
    former: '节奏复制',
    ability: '节奏记忆',
    stage: '小学低段起',
    goal: '先听一段节奏再敲出来，训练节奏短时记忆与准确复现。',
    reason: '适合在节奏反应之外补充"听→记→复现"的闭环。',
    playHint: '先听完整段再敲，注意长短音的间隔。',
    metrics: ['节奏复现', '时值准确', '连击'],
    level: 'L1-L3',
    color: '#845ef7',
  },
]

const AUDITORY_LAB_TOOLS: AuditoryLabTool[] = [
  {
    id: 'microscope',
    icon: '◌',
    title: '音乐显微镜',
    question: '我说音乐变了，具体是哪里变了？',
    focus: '比较旋律片段，找到可以说清楚的变化。',
    grade: '小学 1—6 年级',
    color: '#6c9f83',
  },
  {
    id: 'instrument',
    icon: '♫',
    title: '乐器探秘台',
    question: '我听到的声音为什么有这样的颜色？',
    focus: '比较音色样本，记录声音的质感与延续。',
    grade: '小学 1—6 年级',
    color: '#b36b3e',
  },
  {
    id: 'rhythm',
    icon: '◒',
    title: '节奏与动作工作台',
    question: '音乐怎样让我想走、跳、摇或停？',
    focus: '跟随稳定拍，把动作和听到的线索连起来。',
    grade: '小学 1—6 年级',
    color: '#c27a38',
  },
]

export default function TrainingCenter() {
  const { navigate, openExploration, currentStudentId, selectedGrade } = useApp()
  const [trainingPage, setTrainingPage] = useState(0)
  const progress = loadProgress()
  const [gradeOneCompleted, setGradeOneCompleted] = useState<string[]>([])
  const [activeId, setActiveId] = useState(MODULES[0].id)
  const [activeExperienceId, setActiveExperienceId] = useState('sound-detective')
  const [activeAuditoryToolId, setActiveAuditoryToolId] = useState<ExplorationToolId | null>(null)
  const [auditoryLabNotice, setAuditoryLabNotice] = useState('')
  const filled = useFillOnMount()
  const currentStudent = getCurrentStudent()
  const effectiveGrade = selectedGrade ?? currentStudent?.grade
  const experienceActivities = useMemo(
    () => getRecommendedActivities(effectiveGrade),
    [effectiveGrade]
  )

  useEffect(() => {
    if (
      experienceActivities.length > 0 &&
      !experienceActivities.some((activity) => activity.id === activeExperienceId)
    ) {
      setActiveExperienceId(experienceActivities[0].id)
    }
  }, [activeExperienceId, experienceActivities])

  const activeExperience =
    experienceActivities.find((activity) => activity.id === activeExperienceId) ??
    experienceActivities[0]
  const experienceJourney = activeExperience
    ? buildExperienceJourney(activeExperience, effectiveGrade)
    : null
  const moduleSignals = MODULES.map((m) => ({
    label: m.former.slice(0, 2),
    value: progress.bestScores[m.route] ?? 0,
    color: m.color,
  }))
  const practicedCount = moduleSignals.filter((item) => item.value > 0).length
  const active = MODULES.find((m) => m.id === activeId) ?? MODULES[0]
  const activeBest = progress.bestScores[active.route] ?? 0
  const recommended =
    MODULES.map((m) => ({ module: m, best: progress.bestScores[m.route] ?? 0 })).sort(
      (a, b) => a.best - b.best
    )[0]?.module ?? MODULES[0]
  const totalBest = MODULES.reduce((sum, m) => sum + (progress.bestScores[m.route] ?? 0), 0)
  const averageBest = Math.round(totalBest / MODULES.length)
  const activeAuditoryTool = AUDITORY_LAB_TOOLS.find((tool) => tool.id === activeAuditoryToolId)

  const openAuditoryTool = (toolId: ExplorationToolId) => {
    const tool = AUDITORY_LAB_TOOLS.find((item) => item.id === toolId)
    setActiveAuditoryToolId(toolId)
    setAuditoryLabNotice(tool ? `正在使用${tool.title}。你的观察只保留在本次自由练习中。` : '')
  }

  const returnToJasmine = () => openExploration('jasmine')

  const handleGradeOneComplete = (activityId: string) => {
    setGradeOneCompleted((current) =>
      current.includes(activityId) ? current : [...current, activityId]
    )
  }

  const handleAuditoryLabNote = (note: MusicDiscoveryToolNote) => {
    const tool = AUDITORY_LAB_TOOLS.find((item) => item.id === note.toolId)
    setAuditoryLabNotice(
      `${tool?.title ?? '这个工具'}的观察已保留在本次自由练习中，回到作品后可以继续寻找依据。`
    )
  }

  const renderAuditoryLabTool = () => {
    if (activeAuditoryToolId === 'microscope') {
      return (
        <MusicMicroscope
          cues={JASMINE_MICROSCOPE_CUES}
          evidenceLabels={
            EXPLORATION_TOOL_CATALOG.find((tool) => tool.id === 'microscope')?.evidenceLabels ?? []
          }
          onNote={handleAuditoryLabNote}
          onReturn={returnToJasmine}
        />
      )
    }
    if (activeAuditoryToolId === 'instrument') {
      return (
        <InstrumentExplorer
          samples={JASMINE_INSTRUMENT_SAMPLES}
          onNote={handleAuditoryLabNote}
          onReturn={returnToJasmine}
        />
      )
    }
    if (activeAuditoryToolId === 'rhythm') {
      return (
        <RhythmMovementLab
          pattern={JASMINE_RHYTHM_PATTERN}
          onNote={handleAuditoryLabNote}
          onReturn={returnToJasmine}
        />
      )
    }
    return null
  }

  return (
    <div className="training-page presentation-page training-presentation" data-training-page={trainingPage}>
      <PagePager
        items={TRAINING_PRESENTATION_PAGES}
        activeIndex={trainingPage}
        onChange={setTrainingPage}
        ariaLabel="玩乐中心展示页面"
      />
      <div className="presentation-slide training-presentation-slide">
      <section className="training-auditory-lab card" aria-labelledby="training-auditory-lab-title">
        <div className="training-auditory-lab-hero">
          <div>
            <span className="training-kicker">主动聆听 · 桌面工作台</span>
            <h1 id="training-auditory-lab-title">听觉实验室</h1>
            <p>从一个具体的听觉问题开始，比较、记录，再把你的发现带回作品里。</p>
            <div className="training-current-grade" aria-label="当前年级">
              <span>当前年级</span>
              <strong>{effectiveGrade ? getGradeLabel(effectiveGrade) : '小学 1—6 年级'}</strong>
            </div>
          </div>
          <div className="training-auditory-lab-hero-actions">
            <span>想带着作品开始吗？</span>
            <button className="primary-action" type="button" onClick={returnToJasmine}>
              从一段作品开始
            </button>
          </div>
        </div>

        <div className="training-auditory-tool-grid" aria-label="听觉工具选择">
          {AUDITORY_LAB_TOOLS.map((tool) => (
            <article
              key={tool.id}
              className="training-auditory-tool"
              style={{ '--tool-color': tool.color } as CSSProperties}
            >
              <div className="training-auditory-tool-heading">
                <span aria-hidden="true">{tool.icon}</span>
                <div>
                  <strong>{tool.title}</strong>
                  <small>{tool.grade}</small>
                </div>
              </div>
              <p className="training-auditory-tool-question">“{tool.question}”</p>
              <p className="training-auditory-tool-focus">{tool.focus}</p>
              <button type="button" onClick={() => openAuditoryTool(tool.id)}>
                带入作品练习
              </button>
            </article>
          ))}
        </div>

        <div className="training-free-practice">
          <div>
            <span className="training-kicker">不绑定作品</span>
            <h2>自由练习</h2>
            <p>先试听和比较，留下你的观察；准备好后，再回到作品寻找依据。</p>
          </div>
          <div className="training-free-practice-note" role="status">
            <span>观察提示</span>
            <strong>没有唯一答案，先说出你听到的线索。</strong>
          </div>
          <div className="training-free-practice-actions" aria-label="自由练习工具">
            {AUDITORY_LAB_TOOLS.map((tool) => (
              <button key={tool.id} type="button" onClick={() => openAuditoryTool(tool.id)}>
                自由练习 {tool.title}
              </button>
            ))}
          </div>
          <button type="button" onClick={returnToJasmine}>
            回到作品
          </button>
        </div>
        {activeAuditoryTool && (
          <section
            className="training-auditory-tool-panel"
            aria-label={`${activeAuditoryTool.title}自由练习`}
          >
            <div className="training-auditory-tool-panel__head">
              <div>
                <span className="training-kicker">自由练习 · 茉莉花声音样本</span>
                <h2>{activeAuditoryTool.title}</h2>
              </div>
              <button type="button" onClick={returnToJasmine}>
                回到作品
              </button>
            </div>
            <p className="training-auditory-tool-panel__notice" role="status">
              {auditoryLabNotice}
            </p>
            {renderAuditoryLabTool()}
          </section>
        )}
      </section>

      <section className="training-reference-quest card" aria-labelledby="training-reference-quest-title">
        <div className="training-experience-intro">
          <div>
            <span className="training-kicker">参考课件 · 一年级上册</span>
            <h2 id="training-reference-quest-title">森林乐器大冒险</h2>
            <p>从故事、动作、乐器和节奏开始，完成一段先听再玩的音乐探索。</p>
          </div>
          <span className="training-grade-note">{gradeOneCompleted.length} 颗星已点亮</span>
        </div>
        <GradeOneForestQuest
          activities={GRADE_ONE_ACTIVITIES}
          completedActivityIds={gradeOneCompleted}
          onComplete={handleGradeOneComplete}
        />
      </section>

      <section className="training-experience-shell" aria-labelledby="training-experience-title">
        <div className="training-experience-intro">
          <div>
            <span className="training-kicker">今日玩乐</span>
            <h2 id="training-experience-title">音乐探险游乐场</h2>
            <p>
              {currentStudent?.name
                ? `${currentStudent.name}，挑一个声音游戏，先听见，再动手玩。`
                : '挑一个声音游戏，先听见，再动手玩。'}
            </p>
          </div>
          <span className="training-grade-note">
            {effectiveGrade ? `按${getGradeLabel(effectiveGrade)}调整` : '小学通用玩法'}
          </span>
        </div>

        <div className="training-experience-doors" role="tablist" aria-label="音乐探险类型">
          {experienceActivities.map((activity) => (
            <button
              key={activity.id}
              type="button"
              role="tab"
              aria-selected={activity.id === activeExperience?.id}
              className={`training-experience-door ${activity.id === activeExperience?.id ? 'active' : ''}`}
              style={{ '--door-color': activity.color } as CSSProperties}
              onClick={() => setActiveExperienceId(activity.id)}
            >
              <span aria-hidden="true">{activity.icon}</span>
              <strong>{activity.title}</strong>
              <small>{activity.subtitle}</small>
            </button>
          ))}
        </div>

        {experienceJourney && (
          <MusicExperienceStage
            key={buildExperienceInstanceKey(
              currentStudentId,
              effectiveGrade,
              experienceJourney.activity.id
            )}
            journey={experienceJourney}
            studentId={currentStudentId}
            grade={effectiveGrade}
            onNavigate={navigate}
            compact
          />
        )}
      </section>

      <section className="training-head card">
        <div>
          <span className="training-kicker">更多练习</span>
          <h2>挑战中心</h2>
          <p>
            这里统一管理听感、读谱、跟唱、节奏反应和节奏记忆五类小游戏。
            先看推荐和能力目标，再进入具体挑战，避免入口散落到不同页面里。
          </p>
        </div>
        <div className="training-head-actions">
          <button onClick={() => setActiveId(recommended.id)}>推荐练习：{recommended.title}</button>
          <button className="primary-action" onClick={() => navigate(recommended.route)}>
            开始推荐挑战
          </button>
        </div>
      </section>

      <section className="training-lab-strip card">
        <div>
          <span className="training-kicker">能力信号站</span>
          <h3>把每次挑战变成可追踪的音乐能力声谱</h3>
          <p>当前平均最高分 {averageBest}。优先从分数较低或尚未尝试的模块开始，让练习更均衡。</p>
        </div>
        <ProgressRing
          value={practicedCount / MODULES.length}
          label="模块激活"
          caption={`${practicedCount}/${MODULES.length}`}
          color="var(--accent)"
          size={106}
        />
        <div className="training-spectrum">
          <SpectrumBars values={moduleSignals} compact />
        </div>
      </section>

      <div className="training-workbench">
        <nav className="training-module-nav" aria-label="挑战模块列表">
          {MODULES.map((m) => {
            const best = progress.bestScores[m.route] ?? 0
            const isActive = m.id === active.id
            const isRecommended = m.id === recommended.id
            return (
              <button
                key={m.id}
                type="button"
                className={`training-nav-item ${isActive ? 'on' : ''} ${isRecommended ? 'recommended' : ''}`}
                onClick={() => setActiveId(m.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span
                  className="training-nav-icon"
                  style={{ background: m.color }}
                  aria-hidden="true"
                >
                  {m.icon}
                </span>
                <span className="training-nav-copy">
                  <strong>{m.title}</strong>
                  <small>
                    {m.ability} · {m.stage}
                  </small>
                </span>
                <span className="training-nav-meta">
                  <em>{isRecommended ? '推荐' : m.level}</em>
                  <b>{best > 0 ? best : '新'}</b>
                </span>
              </button>
            )
          })}
        </nav>

        <section className="training-module-stage card" style={{ borderColor: active.color }}>
          <div className="training-stage-head">
            <span
              className="training-icon training-stage-icon"
              style={{ background: active.color }}
            >
              {active.icon}
            </span>
            <div>
              <span className="training-kicker">
                {active.ability} / {active.stage} / {active.level}
              </span>
              <h2>{active.title}</h2>
              <p>{active.goal}</p>
            </div>
          </div>

          <div className="training-stage-brief">
            <div>
              <span>为什么推荐</span>
              <b>{active.id === recommended.id ? '当前优先练这一项' : '可作为补充练习'}</b>
              <p>
                {activeBest > 0
                  ? `已有最高分 ${activeBest}，下一步可以追求更稳定的表现。`
                  : active.reason}
              </p>
            </div>
            <div>
              <span>玩法提示</span>
              <b>{active.former}</b>
              <p>{active.playHint}</p>
            </div>
          </div>

          <div className="training-stage-visuals">
            <ProgressRing
              value={activeBest / 100}
              label="最高分"
              caption={activeBest > 0 ? `${activeBest}` : '待开始'}
              color={active.color}
              size={126}
            />
            <div className="training-stage-spectrum">
              <b>挑战能力信号</b>
              {activeBest > 0 ? (
                <p className="training-stage-signal-note">
                  本机最高分 {activeBest}（子项能力需分项练习后才展示）
                </p>
              ) : (
                <p className="training-stage-empty">还没有挑战记录，进入后会留下最高分。</p>
              )}
            </div>
          </div>

          <div className="training-stage-metrics">
            {active.metrics.map((metric) => (
              <span key={metric}>{metric}</span>
            ))}
          </div>

          <div className="training-stage-footer">
            <div>
              <b>{activeBest > 0 ? `历史最高 ${activeBest}` : '还没有挑战记录'}</b>
              <small>进入后会记录本机最高分，并同步到能力声谱和首页状态。</small>
              <div
                className="training-score-track"
                aria-label={`${active.title}最高分 ${activeBest}`}
              >
                <span
                  style={{
                    width: filled ? `${Math.min(100, activeBest)}%` : '0%',
                    background: active.color,
                  }}
                />
              </div>
            </div>
            <button className="big-start training-start" onClick={() => navigate(active.route)}>
              进入{active.former}
            </button>
          </div>
        </section>
      </div>
      </div>
    </div>
  )
}
