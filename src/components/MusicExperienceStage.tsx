import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Route } from '../state/appState'
import { canPersistExperience, createExperienceSession, getExperienceProgress, recordExperienceStep, type ExperienceSession } from '../state/experienceSessions'
import { saveMusicDiscovery } from '../state/discoveries'
import { ensureAudio, playDrum, playNote } from '../music/audioEngine'
import type { PrimaryGrade } from '../music/zhejiangCurriculum'
import type { ExperienceJourney, ExperienceKind, ExperienceStepId } from '../music/experienceActivities'
import './musicExperience.css'

export interface MusicExperienceStageProps {
  journey: ExperienceJourney
  studentId?: string | null
  grade?: PrimaryGrade | null
  onNavigate?: (route: Route) => void
  onComplete?: (summary: string) => void
  compact?: boolean
}

const FEELINGS = ['像在下雨', '像小船出发', '像在跳舞', '像一阵风']
const SOUND_CHOICES = [
  { id: 'a', label: '声音 A', note: 'C4', hint: '更轻、更低' },
  { id: 'b', label: '声音 B', note: 'G4', hint: '更亮、更高' },
] as const
const RHYTHM_CELLS = [true, false, true, true, false, true, false, true]
const CANVAS_SWATCHES = [
  { id: 'sky', label: '天空蓝', color: '#5b9df9' },
  { id: 'coral', label: '珊瑚橙', color: '#f2994a' },
  { id: 'mint', label: '薄荷绿', color: '#55b685' },
  { id: 'violet', label: '葡萄紫', color: '#8b6bd9' },
] as const
const CANVAS_SHAPES = [
  { id: 'dot', label: '圆点', glyph: '●' },
  { id: 'line', label: '线条', glyph: '／' },
  { id: 'star', label: '星星', glyph: '✦' },
] as const

function routeForActivity(kind: ExperienceKind): Route {
  if (kind === 'rhythm-sprite') return 'game-taiko'
  if (kind === 'music-canvas') return 'mixer'
  return 'piano'
}

async function playSound(kind: ExperienceKind, variant = 0): Promise<boolean> {
  try {
    const ready = await ensureAudio()
    if (!ready) return false
    if (kind === 'rhythm-sprite') {
      playDrum(variant % 4 === 0 ? 'kick' : variant % 2 === 0 ? 'tom' : 'clap')
      return true
    }
    if (kind === 'music-canvas') {
      playNote(variant % 2 === 0 ? 'E4' : 'A4', '8n', 0.62, 'musicbox')
      return true
    }
    playNote(variant === 0 ? 'C4' : 'G4', '4n', 0.7, variant === 0 ? 'piano' : 'strings')
    return true
  } catch {
    return false
  }
}

function SceneIllustration({ kind, activeIndex }: { kind: ExperienceKind; activeIndex: number }) {
  return (
    <div className={`experience-illustration ${kind}`} aria-hidden="true">
      <div className="experience-orbit orbit-one" />
      <div className="experience-orbit orbit-two" />
      <div className="experience-illustration-core">
        <span>{kind === 'sound-detective' ? '◖' : kind === 'rhythm-sprite' ? '♩' : '✦'}</span>
      </div>
      <div className="experience-beat-dots">
        {[0, 1, 2, 3].map((dot) => (
          <i key={dot} className={dot === activeIndex % 4 ? 'on' : ''} />
        ))}
      </div>
    </div>
  )
}

export default function MusicExperienceStage({
  journey,
  studentId,
  grade,
  onNavigate,
  onComplete,
  compact = false,
}: MusicExperienceStageProps) {
  const [session, setSession] = useState<ExperienceSession>(() => createExperienceSession(journey.activity.id))
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  const [rhythmInput, setRhythmInput] = useState<boolean[]>(() => RHYTHM_CELLS.map(() => false))
  const [canvasColor, setCanvasColor] = useState<string>(CANVAS_SWATCHES[0].color)
  const [canvasShape, setCanvasShape] = useState<string>(CANVAS_SHAPES[0].glyph)
  const [canvasMarks, setCanvasMarks] = useState<Array<{ color: string; shape: string }>>([])
  const [feeling, setFeeling] = useState(FEELINGS[0])
  const [audioUnavailable, setAudioUnavailable] = useState(false)
  const [saveNotice, setSaveNotice] = useState('')

  useEffect(() => {
    setSession(createExperienceSession(journey.activity.id))
    setActiveIndex(0)
    setSelectedSound(null)
    setRhythmInput(RHYTHM_CELLS.map(() => false))
    setCanvasMarks([])
    setSaveNotice('')
  }, [journey.activity.id])

  const activeStep = journey.steps[activeIndex] ?? journey.steps[0]
  const progress = useMemo(
    () => getExperienceProgress(session, journey.steps.length),
    [journey.steps.length, session]
  )
  const completed = session.completedStepIds.includes(activeStep?.id)

  const completeStep = (stepId: ExperienceStepId) => {
    setSession((current) => {
      const next = recordExperienceStep(current, stepId)
      if (next.completedStepIds.length >= journey.steps.length && current.completedStepIds.length < journey.steps.length) {
        onComplete?.(`完成了${journey.activity.title}，${feeling}。`)
      }
      return next
    })
  }

  const handlePlaySound = async (variant = activeIndex) => {
    const ready = await playSound(journey.activity.kind, variant)
    if (!ready) setAudioUnavailable(true)
    return ready
  }

  const handleSoundChoice = async (choiceId: string) => {
    setSelectedSound(choiceId)
    await handlePlaySound(choiceId === 'b' ? 1 : 0)
    completeStep('find')
  }

  const toggleRhythmCell = async (index: number) => {
    setRhythmInput((current) => current.map((value, cellIndex) => cellIndex === index ? !value : value))
    await handlePlaySound(index)
    completeStep('move')
  }

  const addCanvasMark = async () => {
    setCanvasMarks((current) => [...current, { color: canvasColor, shape: canvasShape }].slice(-12))
    await handlePlaySound(canvasMarks.length)
    completeStep('create')
  }

  const saveFeeling = () => {
    completeStep('share')
    if (!canPersistExperience(studentId)) {
      setSaveNotice('选择一位学生后，就能把这条发现保存到“我的音乐”。')
      return
    }
    saveMusicDiscovery({
      studentId,
      topicId: journey.activity.curriculumTopicIds[0] ?? `experience:${journey.activity.id}`,
      title: `${journey.activity.title} · ${journey.activity.zhejiangTag}`,
      statement: `我发现：${journey.activity.subtitle}，${feeling}。`,
      source: journey.activity.source,
      grade: grade ?? undefined,
      tags: [journey.activity.title, journey.activity.zhejiangTag, journey.ageBand],
    })
    setSaveNotice('已保存到“我的音乐发现”，下次可以再听一遍。')
  }

  const goToStep = (index: number) => {
    if (index < 0 || index >= journey.steps.length) return
    setActiveIndex(index)
    setSaveNotice('')
  }

  const renderStepScene = () => {
    if (!activeStep) return null
    if (activeStep.id === 'listen') {
      return (
        <div className="experience-listen-scene">
          <SceneIllustration kind={journey.activity.kind} activeIndex={activeIndex} />
          <button type="button" className="experience-big-play" onClick={() => handlePlaySound()}>
            <span aria-hidden="true">▶</span>
            <span>播放这一段</span>
          </button>
        </div>
      )
    }
    if (activeStep.id === 'find') {
      return (
        <div className="experience-choice-scene">
          <div className="experience-choice-grid">
            {SOUND_CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={`experience-choice ${selectedSound === choice.id ? 'selected' : ''}`}
                onClick={() => void handleSoundChoice(choice.id)}
              >
                <span className="experience-choice-note" aria-hidden="true">{choice.id === 'a' ? '♪' : '♫'}</span>
                <strong>{choice.label}</strong>
                <small>{choice.hint}</small>
              </button>
            ))}
          </div>
          {selectedSound && <p className="experience-feedback">你选择了 {selectedSound === 'a' ? '声音 A' : '声音 B'}，再听一次，看看你的理由有没有变化。</p>}
        </div>
      )
    }
    if (activeStep.id === 'move') {
      return (
        <div className="experience-rhythm-scene">
          <div className="experience-rhythm-grid" role="group" aria-label="八拍节奏格">
            {RHYTHM_CELLS.map((shouldSound, index) => (
              <button
                key={index}
                type="button"
                className={`rhythm-cell ${rhythmInput[index] ? 'on' : ''} ${shouldSound ? 'suggested' : ''}`}
                aria-label={`第 ${index + 1} 拍${shouldSound ? '建议击拍' : '留白'}`}
                onClick={() => void toggleRhythmCell(index)}
              >
                <span>{index + 1}</span>
              </button>
            ))}
          </div>
          <button type="button" className="experience-inline-action" onClick={() => void handlePlaySound(0)}>
            ▶ 先听示范
          </button>
        </div>
      )
    }
    if (activeStep.id === 'play') {
      return (
        <div className="experience-play-scene">
          <SceneIllustration kind={journey.activity.kind} activeIndex={activeIndex + 1} />
          <button type="button" className="experience-inline-action" onClick={() => void handlePlaySound(activeIndex + 1)}>
            {journey.activity.kind === 'rhythm-sprite' ? '敲一下节奏' : journey.activity.kind === 'music-canvas' ? '听一颗音符' : '试试不同音色'}
          </button>
          {onNavigate && <button type="button" className="experience-ghost-action" onClick={() => onNavigate(routeForActivity(journey.activity.kind))}>去完整乐器页面</button>}
        </div>
      )
    }
    if (activeStep.id === 'create') {
      return (
        <div className="experience-canvas-scene">
          <div className="canvas-tool-row" aria-label="画布工具">
            {CANVAS_SWATCHES.map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                className={`canvas-swatch ${canvasColor === swatch.color ? 'selected' : ''}`}
                style={{ '--swatch': swatch.color } as CSSProperties}
                aria-label={swatch.label}
                onClick={() => setCanvasColor(swatch.color)}
              />
            ))}
            <span className="canvas-tool-divider" />
            {CANVAS_SHAPES.map((shape) => (
              <button
                key={shape.id}
                type="button"
                className={`canvas-shape ${canvasShape === shape.glyph ? 'selected' : ''}`}
                aria-label={shape.label}
                onClick={() => setCanvasShape(shape.glyph)}
              >
                {shape.glyph}
              </button>
            ))}
          </div>
          <button type="button" className="music-canvas" aria-label="音乐画布，点击添加图形" onClick={() => void addCanvasMark()}>
            {canvasMarks.length === 0 && <span className="canvas-empty">点击画一笔</span>}
            {canvasMarks.map((mark, index) => (
              <i key={`${mark.shape}-${index}`} style={{ color: mark.color, '--mark-index': index } as CSSProperties}>{mark.shape}</i>
            ))}
          </button>
        </div>
      )
    }
    return (
      <div className="experience-share-scene">
        <p>这段音乐给你的感觉是：</p>
        <div className="feeling-list" role="group" aria-label="音乐感受">
          {FEELINGS.map((item) => (
            <button key={item} type="button" className={feeling === item ? 'selected' : ''} onClick={() => setFeeling(item)}>{item}</button>
          ))}
        </div>
        <button type="button" className="experience-save-action" onClick={saveFeeling}>保存我的发现</button>
        {saveNotice && <p className="experience-save-notice" role="status">{saveNotice}</p>}
      </div>
    )
  }

  const isLastStep = activeIndex === journey.steps.length - 1
  return (
    <section className={`music-experience-stage ${compact ? 'compact' : ''}`} aria-labelledby={`experience-title-${journey.activity.id}`}>
      <header className="experience-stage-header">
        <div className="experience-stage-heading">
          <span className="experience-activity-icon" style={{ backgroundColor: journey.activity.color }} aria-hidden="true">{journey.activity.icon}</span>
          <div>
            <span className="experience-stage-kicker">音乐探险 · {journey.activity.duration}</span>
            <h2 id={`experience-title-${journey.activity.id}`}>{journey.activity.title}</h2>
            <p>{journey.activity.subtitle} · {journey.activity.zhejiangTag}</p>
          </div>
        </div>
        <div className="experience-progress" aria-label={`已完成 ${Math.round(progress * 100)}%`}>
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </header>

      <nav className="experience-stepper" aria-label="音乐探险步骤">
        {journey.steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={`${index === activeIndex ? 'active' : ''} ${session.completedStepIds.includes(step.id) ? 'done' : ''}`}
            onClick={() => goToStep(index)}
            aria-current={index === activeIndex ? 'step' : undefined}
          >
            <span>{session.completedStepIds.includes(step.id) ? '✓' : index + 1}</span>
            <b>{step.label}</b>
          </button>
        ))}
      </nav>

      <div className="experience-stage-body">
        <div className="experience-prompt">
          <span>{activeStep?.label}</span>
          <p>{activeStep?.prompt}</p>
        </div>
        {renderStepScene()}
      </div>

      <footer className="experience-stage-footer">
        <button type="button" className="experience-back-action" onClick={() => goToStep(activeIndex - 1)} disabled={activeIndex === 0}>上一步</button>
        <div className="experience-footer-hint">
          {audioUnavailable ? '声音暂时不可用，也可以继续用点击完成。' : completed ? '这一步完成啦，可以继续探索。' : '完成当前小动作，再进入下一步。'}
        </div>
        {!isLastStep ? (
          <button type="button" className="experience-next-action" onClick={() => { completeStep(activeStep.id); goToStep(activeIndex + 1) }}>
            {activeStep?.actionLabel ?? '继续'}
          </button>
        ) : (
          <button type="button" className="experience-next-action" onClick={saveFeeling}>保存发现</button>
        )}
      </footer>
    </section>
  )
}
