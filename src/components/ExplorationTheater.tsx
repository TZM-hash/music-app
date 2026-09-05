import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PrimaryGrade } from '../music/zhejiangCurriculum'
import {
  getExplorationAgeBand,
  type ExplorationChoice,
  type ExplorationStageId,
  type ExplorationUnit,
} from '../music/explorationUnits'
import {
  getCueDurationMs,
  getEvidenceVariant,
  getSongFragment,
  type ExplorationCue,
} from '../music/explorationAudio'
import { ensureAudio, playNote, stopAllAudio } from '../music/audioEngine'
import {
  advanceExplorationStage,
  createExplorationSession,
  loadExplorationSession,
  saveExplorationSession,
  updateExplorationSession,
  type ExplorationSession,
  type RelistenChoice,
} from '../state/explorationSessions'
import { saveMusicDiscovery, type MusicDiscovery } from '../state/discoveries'
import './explorationTheater.css'

export interface ExplorationTheaterProps {
  unit: ExplorationUnit
  studentId?: string | null
  grade?: PrimaryGrade | null
  onExit?: () => void
  onComplete?: (discovery: MusicDiscovery) => void
}

const STAGES: { id: ExplorationStageId; label: string; hint: string }[] = [
  { id: 'listen', label: '先听', hint: '遇见一段声音' },
  { id: 'express', label: '说感受', hint: '留下第一印象' },
  { id: 'evidence', label: '找证据', hint: '比较音乐变化' },
  { id: 'concept', label: '音乐线索', hint: '听见一个词语' },
  { id: 'relisten', label: '再听', hint: '带着线索回去' },
  { id: 'reflect', label: '我的发现', hint: '保存这一刻' },
]

const FEELINGS: ExplorationChoice[] = [
  { id: 'gentle', label: '温柔安静', hint: '像花香轻轻飘过', color: '#f3c7c2' },
  { id: 'curious', label: '好奇期待', hint: '像发现了一朵新花', color: '#f3d37a' },
  { id: 'happy', label: '轻快愉悦', hint: '像在春风里微笑', color: '#b7d99b' },
  { id: 'peaceful', label: '平静舒展', hint: '像水面慢慢打开', color: '#acd1d9' },
]

function durationForBeats(beats: number): string {
  if (beats >= 4) return '1m'
  if (beats >= 2) return '2n'
  if (beats >= 1) return '4n'
  if (beats >= 0.5) return '8n'
  return '16n'
}

function choiceForRelisten(choice: string): RelistenChoice | undefined {
  if (choice === 'keep-feeling') return 'keep'
  if (choice === 'add-clue') return 'new-clue'
  if (choice === 'change-interpretation') return 'change'
  return undefined
}

function pathLabel(unit: ExplorationUnit, pathId?: string): string {
  return unit.paths.find((path) => path.id === pathId)?.label ?? '我的感受'
}

function reflectionFor(
  unit: ExplorationUnit,
  band: ReturnType<typeof getExplorationAgeBand>,
  feeling: string,
  evidence: string,
  reflection: string
): string {
  if (reflection.trim()) return reflection.trim()
  const prompt = unit.reflectionPrompts[band] ?? '我听到的音乐让我想到______，因为我听到了______。'
  return prompt
    .replace('______', feeling || '一种画面')
    .replace('______', evidence || '音乐里的变化')
}

export default function ExplorationTheater({
  unit,
  studentId,
  grade,
  onExit,
  onComplete,
}: ExplorationTheaterProps) {
  const band = getExplorationAgeBand(grade)
  const [session, setSession] = useState<ExplorationSession>(() =>
    loadExplorationSession(studentId, unit.id) ?? createExplorationSession(unit.id, studentId, grade)
  )
  const [hasListened, setHasListened] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUnavailable, setAudioUnavailable] = useState(false)
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null)
  const [reflection, setReflection] = useState('')
  const [saveNotice, setSaveNotice] = useState('')
  const tokenRef = useRef(0)
  const savedRef = useRef(false)

  const fragment = useMemo(() => getSongFragment(unit.songId, 0, 12), [unit.songId])
  const currentStageIndex = Math.max(0, STAGES.findIndex((stage) => stage.id === session.stage))
  const currentStage = STAGES[currentStageIndex] ?? STAGES[0]
  const selectedPath = unit.paths.find((path) => path.id === session.pathId)
  const visibleConcepts = useMemo(
    () => unit.concepts.filter((concept) => concept.ageBands.includes(band)).slice(0, 2),
    [band, unit.concepts]
  )
  const selectedEvidence = unit.evidence.options.find((option) => option.id === session.evidenceId)
  const selectedFeeling = FEELINGS.find((feeling) => feeling.id === session.firstFeelingId)
  const selectedRelisten = unit.relisten.choices.find(
    (choice) => choiceForRelisten(choice.id) === session.relistenChoice
  )

  useEffect(() => {
    const restored = loadExplorationSession(studentId, unit.id)
    setSession(restored ?? createExplorationSession(unit.id, studentId, grade))
    setHasListened(false)
    setEvidencePreview(null)
    setReflection(restored?.relistenReflection ?? '')
    setSaveNotice('')
    savedRef.current = false
  }, [grade, studentId, unit.id])

  useEffect(() => {
    saveExplorationSession(session)
  }, [session])

  useEffect(() => {
    tokenRef.current += 1
    stopAllAudio()
    setIsPlaying(false)
    setAudioUnavailable(false)

    return () => {
      tokenRef.current += 1
      stopAllAudio()
    }
  }, [unit.id])

  const stopPlayback = useCallback(() => {
    tokenRef.current += 1
    stopAllAudio()
    setIsPlaying(false)
  }, [])

  const playCues = useCallback(
    async (cues: ExplorationCue[], onFinished?: () => void) => {
      stopAllAudio()
      const token = tokenRef.current + 1
      tokenRef.current = token
      setIsPlaying(true)
      setAudioUnavailable(false)
      try {
        const ready = await ensureAudio()
        if (!ready) {
          if (tokenRef.current === token) {
            setAudioUnavailable(true)
            setIsPlaying(false)
            onFinished?.()
          }
          return
        }
        for (const cue of cues) {
          if (tokenRef.current !== token) return
          playNote(cue.note, durationForBeats(cue.beats), cue.velocity, cue.patch)
          await new Promise<void>((resolve) => window.setTimeout(resolve, getCueDurationMs(cue, 72)))
        }
        if (tokenRef.current === token) {
          setIsPlaying(false)
          onFinished?.()
        }
      } catch {
        if (tokenRef.current === token) {
          setAudioUnavailable(true)
          setIsPlaying(false)
          onFinished?.()
        }
      }
    },
    []
  )

  const updateResponse = useCallback((response: Parameters<typeof updateExplorationSession>[1]) => {
    setSession((current) => updateExplorationSession(current, response))
  }, [])

  const canContinue =
    (session.stage === 'listen' && hasListened) ||
    (session.stage === 'express' && Boolean(session.firstFeelingId && session.pathId && session.expressionId)) ||
    (session.stage === 'evidence' && Boolean(session.evidenceId)) ||
    session.stage === 'concept' ||
    (session.stage === 'relisten' && Boolean(session.relistenChoice))

  const continueStage = useCallback(() => {
    if (!canContinue) return
    if (session.stage === 'concept' && visibleConcepts.length > 0) {
      updateResponse({ conceptIds: visibleConcepts.map((concept) => concept.id) })
    }
    const next = STAGES[currentStageIndex + 1]
    if (!next) return
    setSession((current) => advanceExplorationStage(current, next.id))
  }, [canContinue, currentStageIndex, session.stage, updateResponse, visibleConcepts])

  const goToStage = useCallback((stage: ExplorationStageId) => {
    const targetIndex = STAGES.findIndex((item) => item.id === stage)
    if (targetIndex < 0 || targetIndex > currentStageIndex) return
    if (targetIndex === currentStageIndex) return

    savedRef.current = false
    setSaveNotice('')

    setSession((current) => {
      const currentIndex = STAGES.findIndex((item) => item.id === current.stage)
      if (targetIndex > currentIndex || stage === current.stage) return current
      return {
        ...current,
        stage,
        completedAt: undefined,
        updatedAt: Date.now(),
      }
    })
  }, [currentStageIndex])

  const goToPreviousStage = useCallback(() => {
    const previous = STAGES[currentStageIndex - 1]
    if (previous) goToStage(previous.id)
  }, [currentStageIndex, goToStage])

  const selectRelisten = (choice: ExplorationChoice) => {
    const normalized = choiceForRelisten(choice.id)
    if (normalized) updateResponse({ relistenChoice: normalized })
  }

  const saveDiscovery = () => {
    if (savedRef.current || session.stage !== 'reflect') return
    const evidence = selectedEvidence?.label ?? '旋律里的平稳流动'
    const firstFeeling = selectedFeeling?.label ?? '自己的感受'
    const statement = reflectionFor(unit, band, firstFeeling, evidence, reflection)
    const discovery = saveMusicDiscovery({
      studentId,
      unitId: unit.id,
      unitTitle: unit.title,
      topicId: unit.curriculumTopicIds[0] ?? 'music-exploration',
      title: unit.title,
      statement,
      source: unit.source,
      grade: grade ?? undefined,
      path: session.pathId,
      firstFeeling,
      evidence: [evidence],
      concepts: visibleConcepts.map((concept) => concept.title),
      relistenChoice: session.relistenChoice,
      relistenReflection: reflection,
    })
    savedRef.current = true
    setSaveNotice('这张发现卡已经保存。你可以把自己的听见带回课堂。')
    onComplete?.(discovery)
  }

  const renderListen = () => (
    <section className="exploration-stage-card">
      <span className="exploration-eyebrow">第一遍，不急着找答案</span>
      <h2>先听一听，你的身体和心情有什么变化？</h2>
      <p className="exploration-prompt">{unit.question}</p>
      <button className="exploration-play-button" type="button" onClick={() => {
        if (isPlaying) stopPlayback()
        else void playCues(fragment, () => setHasListened(true))
      }}>
        {isPlaying ? '停止播放' : hasListened ? '再听一次' : '播放音乐片段'}
      </button>
      <p className="exploration-support">先听见自己的感觉，等一会儿再说它为什么这样。</p>
    </section>
  )

  const renderExpress = () => (
    <section className="exploration-stage-card">
      <span className="exploration-eyebrow">没有唯一答案</span>
      <h2>你听到了什么感受？</h2>
      <div className="exploration-choice-group">
        <h3>我的第一感觉</h3>
        <div className="exploration-choice-grid">
          {FEELINGS.map((feeling) => (
            <button key={feeling.id} type="button" aria-pressed={session.firstFeelingId === feeling.id} className={session.firstFeelingId === feeling.id ? 'selected' : ''} onClick={() => updateResponse({ firstFeelingId: feeling.id })}>
              <b>{feeling.label}</b><small>{feeling.hint}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="exploration-choice-group">
        <h3>从哪条路走进音乐？</h3>
        <div className="exploration-path-grid">
          {unit.paths.map((path) => (
            <button key={path.id} type="button" aria-pressed={session.pathId === path.id} className={session.pathId === path.id ? 'selected' : ''} onClick={() => updateResponse({ pathId: path.id })}>
              <b>{path.label}</b><small>{path.prompt}</small>
            </button>
          ))}
        </div>
      </div>
      {selectedPath && (
        <div className="exploration-choice-group">
          <h3>{selectedPath.prompt}</h3>
          <div className="exploration-choice-grid">
            {selectedPath.choices.map((choice) => (
              <button key={choice.id} type="button" aria-pressed={session.expressionId === choice.id} className={session.expressionId === choice.id ? 'selected' : ''} onClick={() => updateResponse({ expressionId: choice.id })}>
                <b>{choice.label}</b><small>{choice.hint}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="exploration-feedback" role="status">没有唯一答案，接下来一起找依据。</p>
    </section>
  )

  const renderEvidence = () => (
    <section className="exploration-stage-card">
      <span className="exploration-eyebrow">比较，而不是猜对错</span>
      <h2>{unit.evidence.prompt}</h2>
      <div className="exploration-evidence-grid">
        {(['flowing', 'jumping'] as const).map((variant) => {
          const option = unit.evidence.options.find((item) => item.id === variant) ?? unit.evidence.options[0]
          return (
            <article className={`exploration-evidence-card ${evidencePreview === variant ? 'previewing' : ''}`} key={variant}>
              <span>{variant === 'flowing' ? 'A' : 'B'}</span>
              <h3>{option?.label}</h3>
              <button type="button" aria-pressed={evidencePreview === variant} onClick={() => {
                setEvidencePreview(variant)
                void playCues(getEvidenceVariant(unit.id, variant))
              }}>试听这一段</button>
              <small>先试听，再确认你听到的音乐证据。</small>
            </article>
          )
        })}
      </div>
      <button className="exploration-confirm-button" type="button" disabled={!evidencePreview} onClick={() => updateResponse({ evidenceId: evidencePreview ?? undefined })}>确认我的听见</button>
      {selectedEvidence && <p className="exploration-feedback" role="status">{selectedEvidence.feedback} 你是从音乐的哪里听出来的？</p>}
    </section>
  )

  const renderConcept = () => (
    <section className="exploration-stage-card">
      <span className="exploration-eyebrow">你刚才听到的是……</span>
      <h2>把听见的现象，变成一个可以再次使用的词。</h2>
      <div className="exploration-concept-grid">
        {visibleConcepts.map((concept) => (
          <article className="exploration-concept-card" key={concept.id}>
            <span>音乐线索</span><h3>{concept.title}</h3><b>{concept.short}</b><p>{concept.body}</p>
            <button type="button" onClick={() => void playCues(fragment)}>再听一次：{concept.listenPrompt}</button>
          </article>
        ))}
      </div>
      {band === 'primary-5-6' && (
        <aside className="exploration-culture-card"><span>{unit.culture.title}</span><p>{unit.culture.ageBands[band] ?? unit.culture.body}</p><p>{unit.culture.body}</p><button type="button" onClick={() => void playCues(fragment)}>带着文化线索再听</button></aside>
      )}
    </section>
  )

  const renderRelisten = () => (
    <section className="exploration-stage-card">
      <span className="exploration-eyebrow">第二次聆听</span>
      <h2>{unit.relisten.prompt}</h2>
      <button className="exploration-play-button secondary" type="button" onClick={() => void playCues(fragment)}>再听一次</button>
      <div className="exploration-choice-grid relisten-grid">
        {unit.relisten.choices.map((choice) => (
          <button key={choice.id} type="button" aria-pressed={selectedRelisten?.id === choice.id} className={selectedRelisten?.id === choice.id ? 'selected' : ''} onClick={() => selectRelisten(choice)}><b>{choice.label}</b><small>{choice.hint}</small></button>
        ))}
      </div>
      {selectedRelisten && <p className="exploration-feedback" role="status">第二次你可能注意到：{selectedRelisten.hint}</p>}
    </section>
  )

  const renderReflect = () => (
    <section className="exploration-stage-card reflection-stage">
      <span className="exploration-eyebrow">把发现留下来</span>
      <h2>我的音乐发现</h2>
      <div className="exploration-discovery-preview">
        <span>{unit.icon} {unit.title}</span>
        <h3>{selectedFeeling?.label ?? '我的第一感觉'}</h3>
        <p>我从「{pathLabel(unit, session.pathId)}」走进这段音乐，听到了「{selectedEvidence?.label ?? '音乐里的变化'}」。</p>
        <small>音乐词语：{visibleConcepts.map((concept) => concept.title).join('、') || '旋律'}</small>
        <small>再听之后：{selectedRelisten?.label ?? '我还在整理自己的新线索'}</small>
      </div>
      <label className="exploration-reflection-field">我的新发现（可以写一句话，也可以请老师帮你记录）
        <textarea value={reflection} onChange={(event) => { setReflection(event.target.value); updateResponse({ relistenReflection: event.target.value }) }} maxLength={160} placeholder={reflectionFor(unit, band, selectedFeeling?.label ?? '', selectedEvidence?.label ?? '', '')} />
      </label>
      <button className="exploration-save-button" type="button" onClick={saveDiscovery}>保存我的音乐发现</button>
      {saveNotice && <p className="exploration-feedback" role="status">{saveNotice}</p>}
    </section>
  )

  const content = currentStage.id === 'listen' ? renderListen() : currentStage.id === 'express' ? renderExpress() : currentStage.id === 'evidence' ? renderEvidence() : currentStage.id === 'concept' ? renderConcept() : currentStage.id === 'relisten' ? renderRelisten() : renderReflect()

  return (
    <div className="exploration-theater" style={{ '--exploration-accent': unit.color } as React.CSSProperties}>
      <header className="exploration-theater-head">
        <div><span className="exploration-eyebrow">音乐探索剧场</span><h1>{unit.title}</h1><p>{unit.question}</p></div>
        {onExit && <button type="button" className="exploration-exit-button" onClick={onExit}>先离开</button>}
      </header>
      <div className="exploration-theater-layout exploration-theater__layout">
        <nav className="exploration-stage-nav" aria-label="探索阶段">
          {STAGES.map((stage, index) => <button key={stage.id} type="button" aria-current={stage.id === session.stage ? 'step' : undefined} disabled={index > currentStageIndex} onClick={() => goToStage(stage.id)} className={stage.id === session.stage ? 'active' : index < currentStageIndex ? 'done' : ''}><b>{index + 1}</b><span>{stage.label}</span><small>{stage.hint}</small></button>)}
        </nav>
        <main className="exploration-main">
          {audioUnavailable && <p className="exploration-audio-notice" aria-live="polite">设备暂时没有发出声音，但仍可以继续选择、比较和保存发现。</p>}
          {content}
          <div className="exploration-stage-actions">
            {currentStage.id !== 'listen' && <button type="button" className="exploration-previous-button" onClick={goToPreviousStage}>上一步</button>}
            {currentStage.id !== 'reflect' && <button type="button" className="exploration-next-button" disabled={!canContinue || isPlaying} onClick={continueStage}>{currentStage.id === 'listen' ? '开始表达' : currentStage.id === 'express' ? '找一找依据' : currentStage.id === 'evidence' ? '看看音乐线索' : currentStage.id === 'concept' ? '带着线索再听' : '整理我的发现'}</button>}
          </div>
        </main>
        <aside className="exploration-discovery-rail"><span className="exploration-eyebrow">本次发现</span><strong>{selectedFeeling?.label ?? '先听，再留下感觉'}</strong><p>{selectedEvidence ? `我从${selectedEvidence.label}听到了变化。` : '每个答案都可以从音乐里寻找依据。'}</p><small>进度 {Math.round(((currentStageIndex + (currentStage.id === 'reflect' ? 1 : 0)) / STAGES.length) * 100)}%</small></aside>
      </div>
    </div>
  )
}
