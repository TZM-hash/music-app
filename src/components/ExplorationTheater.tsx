import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ExplorationCue } from '../music/explorationAudio'
import {
  getCueDurationMs,
  getEvidenceVariant,
  getSongFragment,
} from '../music/explorationAudio'
import { ensureAudio, playNote, stopAllAudio } from '../music/audioEngine'
import {
  getExplorationAgeBand,
  type ExplorationChoice,
  type ExplorationPath,
  type ExplorationStageId,
  type ExplorationUnit,
} from '../music/explorationUnits'
import type { PrimaryGrade } from '../music/zhejiangCurriculum'
import {
  advanceExplorationStage,
  createExplorationSession,
  loadExplorationSession,
  saveExplorationSession,
  updateExplorationSession,
  type ExplorationResponse,
  type ExplorationSession,
  type RelistenChoice,
} from '../state/explorationSessions'
import {
  saveMusicDiscovery,
  type MusicDiscovery,
} from '../state/discoveries'
import './explorationTheater.css'

export interface ExplorationTheaterProps {
  unit: ExplorationUnit
  studentId?: string | null
  grade?: PrimaryGrade | null
  onExit?: () => void
  onComplete?: (discovery: MusicDiscovery) => void
}

const STAGES: readonly ExplorationStageId[] = [
  'listen',
  'express',
  'evidence',
  'concept',
  'relisten',
  'reflect',
]

const STAGE_LABELS: Record<ExplorationStageId, string> = {
  listen: '听一听',
  express: '说感受',
  evidence: '找依据',
  concept: '认识线索',
  relisten: '再听一次',
  reflect: '留下发现',
}

const AUDIO_FALLBACK = '设备暂时没有发出声音，但仍可以继续选择、比较和保存发现'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function cueDuration(cue: ExplorationCue): string {
  if (cue.beats <= 0.5) return '8n'
  if (cue.beats <= 1) return '4n'
  if (cue.beats <= 2) return '2n'
  return '1n'
}

function relistenValue(choiceId: string): RelistenChoice {
  if (choiceId === 'add-clue') return 'new-clue'
  if (choiceId === 'change-interpretation') return 'change'
  return 'keep'
}

function relistenLabel(choice?: RelistenChoice): string {
  if (choice === 'new-clue') return '增加新线索'
  if (choice === 'change') return '改变理解'
  return '保留原感受'
}

function choiceLabel(choices: ExplorationChoice[], id?: string): string {
  return choices.find((choice) => choice.id === id)?.label ?? '尚未选择'
}

export default function ExplorationTheater({
  unit,
  studentId,
  grade,
  onExit,
  onComplete,
}: ExplorationTheaterProps) {
  const [session, setSession] = useState<ExplorationSession>(() =>
    loadExplorationSession(studentId, unit.id) ?? createExplorationSession(unit.id, studentId, grade)
  )
  const [hasListened, setHasListened] = useState(() => session.stage !== 'listen')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingLabel, setPlayingLabel] = useState('')
  const [audioUnavailable, setAudioUnavailable] = useState(false)
  const [audioMessage, setAudioMessage] = useState('')
  const [evidencePreview, setEvidencePreview] = useState<'flowing' | 'jumping' | null>(null)
  const [evidenceConfirmed, setEvidenceConfirmed] = useState(() => Boolean(session.evidenceId))
  const [relistenReflection, setRelistenReflection] = useState(session.relistenReflection ?? '')
  const [saved, setSaved] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const playbackTokenRef = useRef(0)
  const savedRef = useRef(false)

  const ageBand = getExplorationAgeBand(grade ?? session.grade)
  const stageIndex = Math.max(0, STAGES.indexOf(session.stage))
  const fragment = useMemo(() => getSongFragment(unit.songId, 0, 10), [unit.songId])
  const feelingPath = unit.paths.find((path) => path.id === 'emotion')
  const selectedPath = unit.paths.find((path) => path.id === session.pathId)
  const expressionChoices = selectedPath?.choices ?? []
  const selectedEvidence = unit.evidence.options.find((option) => option.id === session.evidenceId)
  const conceptCards = unit.concepts.filter((card) => card.ageBands.includes(ageBand))
  const firstFeeling = choiceLabel(feelingPath?.choices ?? [], session.firstFeelingId)
  const expression = choiceLabel(expressionChoices, session.expressionId)
  const pathLabel = selectedPath?.label ?? '尚未选择'
  const currentStage = session.stage

  const persist = useCallback((next: ExplorationSession) => {
    setSession(next)
    saveExplorationSession(next)
  }, [])

  const updateResponse = useCallback(
    (response: ExplorationResponse) => {
      setSession((current) => {
        const next = updateExplorationSession(current, response)
        saveExplorationSession(next)
        return next
      })
    },
    []
  )

  const stopPlayback = useCallback(() => {
    playbackTokenRef.current += 1
    stopAllAudio()
    setIsPlaying(false)
    setPlayingLabel('')
  }, [])

  const playCues = useCallback(
    async (cues: ExplorationCue[], label: string): Promise<boolean> => {
      const token = playbackTokenRef.current + 1
      playbackTokenRef.current = token
      stopAllAudio()
      setPlayingLabel(label)
      setAudioMessage('')

      const ready = await ensureAudio()
      if (token !== playbackTokenRef.current) return false
      if (!ready) {
        setAudioUnavailable(true)
        setAudioMessage(AUDIO_FALLBACK)
        setIsPlaying(false)
        setPlayingLabel('')
        return true
      }

      setAudioUnavailable(false)
      setIsPlaying(true)
      try {
        for (const cue of cues) {
          if (token !== playbackTokenRef.current) return false
          playNote(cue.note, cueDuration(cue), cue.velocity, cue.patch)
          await wait(getCueDurationMs(cue, 84))
        }
        return true
      } catch {
        if (token === playbackTokenRef.current) {
          setAudioUnavailable(true)
          setAudioMessage(AUDIO_FALLBACK)
        }
        return true
      } finally {
        if (token === playbackTokenRef.current) {
          setIsPlaying(false)
          setPlayingLabel('')
        }
      }
    },
    []
  )

  useEffect(() => () => stopPlayback(), [stopPlayback])

  const playListen = useCallback(async () => {
    if (isPlaying) {
      stopPlayback()
      return
    }
    const completed = await playCues(fragment, '茉莉花片段')
    if (completed) setHasListened(true)
  }, [fragment, isPlaying, playCues, stopPlayback])

  const playEvidence = useCallback(
    async (variant: 'flowing' | 'jumping') => {
      setEvidencePreview(variant)
      await playCues(getEvidenceVariant(unit.id, variant), variant === 'flowing' ? 'A 段' : 'B 段')
    },
    [playCues, unit.id]
  )

  const playRelisten = useCallback(async () => {
    if (isPlaying) {
      stopPlayback()
      return
    }
    await playCues(fragment, '第二次聆听')
  }, [fragment, isPlaying, playCues, stopPlayback])

  const selectPath = useCallback(
    (pathId: ExplorationPath) => {
      setSession((current) => {
        const next = updateExplorationSession(current, { pathId })
        next.expressionId = undefined
        saveExplorationSession(next)
        return next
      })
    },
    []
  )

  const handleContinue = useCallback(() => {
    if (!canContinue) return
    const nextStage = STAGES[stageIndex + 1]
    if (!nextStage) return
    setSession((current) => {
      let next = current
      if (current.stage === 'concept') {
        next = updateExplorationSession(next, { conceptIds: conceptCards.map((card) => card.id) })
      }
      next = advanceExplorationStage(next, nextStage)
      saveExplorationSession(next)
      return next
    })
  }, [conceptCards, stageIndex])

  const goBack = useCallback(() => {
    const previousStage = STAGES[stageIndex - 1]
    if (!previousStage) return
    persist({ ...session, stage: previousStage, completedAt: undefined, updatedAt: Date.now() })
  }, [persist, session, stageIndex])

  const goToStage = useCallback(
    (index: number) => {
      if (index < 0 || index > stageIndex || index === stageIndex) return
      persist({
        ...session,
        stage: STAGES[index],
        completedAt: undefined,
        updatedAt: Date.now(),
      })
    },
    [persist, session, stageIndex]
  )

  const confirmEvidence = useCallback(() => {
    if (!evidencePreview) return
    setEvidenceConfirmed(true)
    updateResponse({ evidenceId: evidencePreview })
  }, [evidencePreview, updateResponse])

  const selectRelisten = useCallback(
    (choice: ExplorationChoice) => {
      updateResponse({ relistenChoice: relistenValue(choice.id) })
    },
    [updateResponse]
  )

  const saveDiscovery = useCallback(() => {
    if (savedRef.current || !session.relistenChoice) return
    savedRef.current = true
    const discovery = saveMusicDiscovery({
      studentId,
      topicId: unit.curriculumTopicIds[0] ?? unit.id,
      title: unit.title,
      statement: `我发现：${firstFeeling}，因为${selectedEvidence?.feedback ?? '我在音乐中找到了一条自己的线索'}。`,
      source: unit.source,
      grade: grade ?? session.grade ?? undefined,
      unitId: unit.id,
      unitTitle: unit.title,
      path: session.pathId,
      firstFeeling: firstFeeling === '尚未选择' ? undefined : firstFeeling,
      evidence: selectedEvidence ? [selectedEvidence.feedback] : [],
      concepts: conceptCards.map((card) => card.title),
      relistenChoice: relistenLabel(session.relistenChoice),
      relistenReflection: relistenReflection.trim() || undefined,
      tags: [unit.title, ageBand, pathLabel],
    })
    setSession((current) => {
      const next = updateExplorationSession(current, { relistenReflection })
      saveExplorationSession(next)
      return next
    })
    setSaved(true)
    setSaveMessage('已保存到“我的音乐发现”。')
    onComplete?.(discovery)
  }, [
    ageBand,
    conceptCards,
    firstFeeling,
    grade,
    onComplete,
    pathLabel,
    relistenReflection,
    selectedEvidence,
    session.grade,
    session.pathId,
    session.relistenChoice,
    studentId,
    unit,
  ])

  const canContinue =
    currentStage === 'listen'
      ? hasListened
      : currentStage === 'express'
        ? Boolean(session.firstFeelingId && session.pathId && session.expressionId)
        : currentStage === 'evidence'
          ? evidenceConfirmed
          : currentStage === 'concept'
            ? conceptCards.length > 0
            : currentStage === 'relisten'
              ? Boolean(session.relistenChoice)
              : Boolean(session.relistenChoice)

  const renderListen = () => (
    <div className="exploration-theater__scene exploration-theater__scene--listen">
      <p className="exploration-theater__eyebrow">第一遍，先让耳朵认识它</p>
      <h3>一朵花，为什么能唱出江南的味道？</h3>
      <p>先听完整的茉莉花片段，留意旋律怎样向前走。</p>
      <button
        type="button"
        className="exploration-theater__play"
        onClick={() => void playListen()}
        aria-pressed={isPlaying}
      >
        <span aria-hidden="true">{isPlaying ? '■' : '▶'}</span>
        {isPlaying ? '停止播放' : hasListened ? '再听一次' : '播放茉莉花片段'}
      </button>
      <p className="exploration-theater__audio-status" role="status">
        {playingLabel ? `正在播放：${playingLabel}` : hasListened ? '已经听过完整片段，可以继续。' : '听完后，继续按钮会亮起。'}
      </p>
    </div>
  )

  const renderExpress = () => (
    <div className="exploration-theater__scene">
      <p className="exploration-theater__eyebrow">没有唯一答案，接下来一起找依据</p>
      <div className="exploration-theater__choice-block">
        <h3>{feelingPath?.prompt ?? '第一遍听到这段音乐时，你有什么感受？'}</h3>
        <div className="exploration-theater__choices" role="group" aria-label="我的感受">
          {(feelingPath?.choices ?? []).map((choice) => (
            <button
              key={choice.id}
              type="button"
              className={session.firstFeelingId === choice.id ? 'is-selected' : ''}
              aria-pressed={session.firstFeelingId === choice.id}
              onClick={() => updateResponse({ firstFeelingId: choice.id })}
            >
              <strong>{choice.label}</strong>
              {choice.hint && <small>{choice.hint}</small>}
            </button>
          ))}
        </div>
      </div>
      <div className="exploration-theater__choice-block">
        <h3>你想从哪条路进入音乐？</h3>
        <div className="exploration-theater__path-grid" role="list">
          {unit.paths.map((path) => (
            <button
              key={path.id}
              type="button"
              className={session.pathId === path.id ? 'is-selected' : ''}
              aria-pressed={session.pathId === path.id}
              onClick={() => selectPath(path.id)}
            >
              <strong>{path.label}</strong>
              <small>{path.prompt}</small>
            </button>
          ))}
        </div>
      </div>
      {selectedPath && (
        <div className="exploration-theater__choice-block">
          <h3>用一个画面、动作或故事表达</h3>
          <div className="exploration-theater__choices" role="group" aria-label="表达方式">
            {expressionChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={session.expressionId === choice.id ? 'is-selected' : ''}
                aria-pressed={session.expressionId === choice.id}
                onClick={() => updateResponse({ expressionId: choice.id })}
              >
                <strong>{choice.label}</strong>
                {choice.hint && <small>{choice.hint}</small>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderEvidence = () => (
    <div className="exploration-theater__scene">
      <p className="exploration-theater__eyebrow">先试听，再做自己的判断</p>
      <h3>{unit.evidence.prompt}</h3>
      <p>你是从音乐的哪里听出来的？选择后还可以反复试听，确认才会留下依据。</p>
      <div className="exploration-theater__evidence-grid" role="group" aria-label="证据试听">
        {(['flowing', 'jumping'] as const).map((variant) => {
          const option = unit.evidence.options.find((item) => item.id === variant)
          if (!option) return null
          return (
            <article key={variant} className={evidencePreview === variant ? 'is-previewing' : ''}>
              <span className="exploration-theater__evidence-tag">{variant === 'flowing' ? 'A' : 'B'}</span>
              <p>{option.label}</p>
              <button
                type="button"
                onClick={() => void playEvidence(variant)}
                aria-pressed={evidencePreview === variant}
              >
                {isPlaying && evidencePreview === variant ? '停止这段' : `试听${variant === 'flowing' ? ' A' : ' B'}`}
              </button>
              <button
                type="button"
                className="exploration-theater__text-button"
                onClick={() => setEvidencePreview(variant)}
                aria-pressed={evidencePreview === variant}
              >
                选作我的依据
              </button>
            </article>
          )
        })}
      </div>
      {evidencePreview && (
        <div className="exploration-theater__confirmation" role="status">
          <strong>你选择了 {evidencePreview === 'flowing' ? 'A 段' : 'B 段'}。</strong>
          <button type="button" onClick={confirmEvidence} disabled={evidenceConfirmed}>
            {evidenceConfirmed ? '已确认这条依据' : '确认我的音乐证据'}
          </button>
          {evidenceConfirmed && selectedEvidence && (
            <p>{selectedEvidence.feedback}</p>
          )}
        </div>
      )}
    </div>
  )

  const renderConcept = () => (
    <div className="exploration-theater__scene">
      <p className="exploration-theater__eyebrow">你刚才听到的是……</p>
      <h3>把耳朵里的发现，换成音乐词语</h3>
      <div className="exploration-theater__concept-grid">
        {conceptCards.map((card) => (
          <article key={card.id} className="exploration-theater__concept-card">
            <span>音乐线索</span>
            <h4>{card.title}</h4>
            <strong>{card.short}</strong>
            <p>{card.body}</p>
            <button type="button" onClick={() => void playCues(fragment, '线索回听')}>
              {card.listenPrompt}
            </button>
          </article>
        ))}
      </div>
      {ageBand === 'primary-5-6' && (
        <aside className="exploration-theater__culture-card">
          <span>高段文化信息</span>
          <h4>{unit.culture.title}</h4>
          <p>{unit.culture.body}</p>
          <p>{unit.culture.ageBands[ageBand]}</p>
          <button type="button" onClick={() => void playCues(fragment, '带着地域色彩回听')}>
            回听：带着文化线索再找一次
          </button>
        </aside>
      )}
    </div>
  )

  const renderRelisten = () => (
    <div className="exploration-theater__scene">
      <p className="exploration-theater__eyebrow">第二次聆听，发现可以更新</p>
      <h3>{unit.relisten.prompt}</h3>
      <button
        type="button"
        className="exploration-theater__play"
        onClick={() => void playRelisten()}
        aria-pressed={isPlaying}
      >
        <span aria-hidden="true">{isPlaying ? '■' : '▶'}</span>
        {isPlaying ? '停止播放' : '再听一次'}
      </button>
      <div className="exploration-theater__choices" role="group" aria-label="二次聆听变化">
        {unit.relisten.choices.map((choice) => {
          const value = relistenValue(choice.id)
          return (
            <button
              key={choice.id}
              type="button"
              className={session.relistenChoice === value ? 'is-selected' : ''}
              aria-pressed={session.relistenChoice === value}
              onClick={() => selectRelisten(choice)}
            >
              <strong>{choice.label}</strong>
              {choice.hint && <small>{choice.hint}</small>}
            </button>
          )
        })}
      </div>
      {session.relistenChoice && (
        <p className="exploration-theater__feedback" role="status">
          第二次你可能注意到：{session.relistenChoice === 'keep' ? '原来的感受仍然成立，也有了新的理由。' : session.relistenChoice === 'new-clue' ? '旋律的走向、音色或地域线索变得更清楚。' : '新的音乐线索让原来的画面出现了另一种理解。'}
        </p>
      )}
      <label className="exploration-theater__reflection-input">
        <span>给这次变化留一句话（可选）</span>
        <textarea
          value={relistenReflection}
          maxLength={240}
          onChange={(event) => {
            setRelistenReflection(event.target.value)
            updateResponse({ relistenReflection: event.target.value })
          }}
          placeholder="我又听到了……"
        />
      </label>
    </div>
  )

  const renderReflect = () => (
    <div className="exploration-theater__scene">
      <p className="exploration-theater__eyebrow">把一次聆听，变成自己的发现</p>
      <h3>我的音乐发现</h3>
      <article className="exploration-theater__discovery-card">
        <span>{unit.icon} {unit.title}</span>
        <h4>{unit.question}</h4>
        <dl>
          <div><dt>初始感受</dt><dd>{firstFeeling}</dd></div>
          <div><dt>入口路径</dt><dd>{pathLabel} · {expression}</dd></div>
          <div><dt>音乐证据</dt><dd>{selectedEvidence?.feedback ?? '已留下自己的试听判断'}</dd></div>
          <div><dt>音乐词语</dt><dd>{conceptCards.map((card) => card.title).join('、') || '正在形成'}</dd></div>
          <div><dt>二次聆听变化</dt><dd>{relistenLabel(session.relistenChoice)}{relistenReflection ? `：${relistenReflection}` : ''}</dd></div>
        </dl>
      </article>
      <button
        type="button"
        className="exploration-theater__save"
        onClick={saveDiscovery}
        disabled={saved || !session.relistenChoice}
      >
        {saved ? '已保存我的音乐发现' : '保存我的音乐发现'}
      </button>
      {saveMessage && <p className="exploration-theater__feedback" role="status">{saveMessage}</p>}
    </div>
  )

  const renderScene = () => {
    if (currentStage === 'listen') return renderListen()
    if (currentStage === 'express') return renderExpress()
    if (currentStage === 'evidence') return renderEvidence()
    if (currentStage === 'concept') return renderConcept()
    if (currentStage === 'relisten') return renderRelisten()
    return renderReflect()
  }

  return (
    <section className="exploration-theater" aria-labelledby="exploration-theater-title">
      <header className="exploration-theater__header">
        <div>
          <p className="exploration-theater__kicker">音乐探索剧场 · {ageBand === 'primary-5-6' ? '高段' : ageBand === 'primary-3-4' ? '中段' : '低段'}</p>
          <h2 id="exploration-theater-title">{unit.icon} {unit.title}</h2>
          <p>{unit.subtitle}</p>
        </div>
        {onExit && <button type="button" className="exploration-theater__exit" onClick={onExit}>退出探索</button>}
      </header>

      <div className="exploration-theater__progress" aria-label={`已完成 ${Math.round((stageIndex / STAGES.length) * 100)}%`}>
        <span style={{ width: `${Math.round((stageIndex / STAGES.length) * 100)}%` }} />
      </div>

      <div className="exploration-theater__layout">
        <nav className="exploration-theater__steps" aria-label="探索阶段">
          {STAGES.map((stage, index) => (
            <button
              key={stage}
              type="button"
              className={index === stageIndex ? 'is-current' : index < stageIndex ? 'is-done' : ''}
              onClick={() => goToStage(index)}
              disabled={index > stageIndex}
              aria-current={index === stageIndex ? 'step' : undefined}
            >
              <span>{index < stageIndex ? '✓' : index + 1}</span>
              <strong>{STAGE_LABELS[stage]}</strong>
            </button>
          ))}
        </nav>

        <main className="exploration-theater__main">
          {renderScene()}
          {audioMessage && <p className="exploration-theater__audio-fallback" aria-live="polite">{audioMessage}</p>}
        </main>

        <aside className="exploration-theater__aside" aria-label="本次发现">
          <p className="exploration-theater__eyebrow">本次发现</p>
          <h3>{firstFeeling === '尚未选择' ? '先听，再留下感觉' : firstFeeling}</h3>
          <p>{session.pathId ? `从${pathLabel}进入，慢慢找到音乐里的依据。` : '选择一条入口路径，让感受有一个方向。'}</p>
          <div className="exploration-theater__aside-row"><span>证据</span><strong>{selectedEvidence ? (selectedEvidence.isBest ? '旋律平稳流动' : '旋律跳进') : '待试听'}</strong></div>
          <div className="exploration-theater__aside-row"><span>词语</span><strong>{conceptCards[0]?.title ?? '待发现'}</strong></div>
          <div className="exploration-theater__aside-row"><span>变化</span><strong>{relistenLabel(session.relistenChoice)}</strong></div>
        </aside>
      </div>

      <footer className="exploration-theater__footer">
        <button type="button" className="exploration-theater__secondary" onClick={goBack} disabled={stageIndex === 0}>上一步</button>
        <p className="exploration-theater__footer-status" role="status">
          {audioUnavailable ? AUDIO_FALLBACK : canContinue ? '当前阶段已完成，可以继续。' : '完成当前选择后再继续。'}
        </p>
        {currentStage === 'reflect' ? (
          <button type="button" className="exploration-theater__primary" onClick={saveDiscovery} disabled={saved || !session.relistenChoice}>
            {saved ? '已保存' : '保存我的音乐发现'}
          </button>
        ) : (
          <button type="button" className="exploration-theater__primary" onClick={handleContinue} disabled={!canContinue}>
            继续：{STAGE_LABELS[STAGES[stageIndex + 1] ?? 'reflect']}
          </button>
        )}
      </footer>
    </section>
  )
}
