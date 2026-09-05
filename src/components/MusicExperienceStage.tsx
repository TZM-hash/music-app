import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import type { Route } from '../state/appState'
import {
  canPersistExperience,
  createExperienceSession,
  getExperienceProgress,
  isExperienceComplete,
  recordExperienceStep,
  type ExperienceSession,
} from '../state/experienceSessions'
import { saveMusicDiscovery } from '../state/discoveries'
import { ensureAudio, playDrum, playNote, preloadPiano, stopAllAudio } from '../music/audioEngine'
import {
  auditionChoice,
  canSubmitCanvas,
  confirmAuditionChoice,
  createAuditionDecision,
  evaluateSoundAnswer,
  getRhythmPattern,
  getSoundChallenges,
  PlaybackTokenGate,
  runSoundCueSequence,
  undoCanvasMark,
  upsertCanvasMark,
  type AuditionDecision,
  type CanvasMark,
  type SoundAnswer,
  type SoundChallenge,
} from '../music/experienceGameLogic'
import type { PrimaryGrade } from '../music/zhejiangCurriculum'
import type {
  ExperienceJourney,
  ExperienceKind,
  ExperienceStepId,
} from '../music/experienceActivities'
import './musicExperience.css'

export interface MusicExperienceStageProps {
  journey: ExperienceJourney
  studentId?: string | null
  grade?: PrimaryGrade | null
  onNavigate?: (route: Route) => void
  onComplete?: (summary: string) => void
  compact?: boolean
}

type AudioEvent =
  | {
      kind: 'note'
      note: string
      duration: string
      velocity?: number
      patch?: 'piano' | 'musicbox' | 'strings' | 'organ'
    }
  | { kind: 'drum'; drum: 'kick' | 'tom' | 'clap' | 'hihat' }

interface SoundAnswerResult {
  answer: SoundAnswer
  correct: boolean
  points: number
}

const FEELINGS = ['像在下雨', '像小船出发', '像在跳舞', '像一阵风']
const MELODY_NOTES = [
  { note: 'C4', label: '1 Do', color: '#4b86f7' },
  { note: 'E4', label: '3 Mi', color: '#55b685' },
  { note: 'G4', label: '5 Sol', color: '#f2994a' },
  { note: 'A4', label: '6 La', color: '#8b6bd9' },
] as const
const RHYTHM_DRUMS = [
  { id: 'kick', label: '咚', hint: '低沉强拍', drum: 'kick' as const },
  { id: 'tom', label: '通', hint: '弹性回应', drum: 'tom' as const },
  { id: 'clap', label: '啪', hint: '清脆反拍', drum: 'clap' as const },
  { id: 'hihat', label: '嚓', hint: '细碎律动', drum: 'hihat' as const },
] as const
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
const CANVAS_MOODS = [
  { id: 'calm', label: '静谧', hint: '慢慢流动的线条', color: '#5b9df9' },
  { id: 'bright', label: '明亮', hint: '闪闪发光的点', color: '#f2994a' },
  { id: 'playful', label: '跳跃', hint: '有弹性的星星', color: '#8b6bd9' },
] as const
type CanvasMoodId = (typeof CANVAS_MOODS)[number]['id']
const CANVAS_MOOD_AUDIO: Record<CanvasMoodId, readonly { event: AudioEvent; gapMs: number }[]> = {
  calm: [
    {
      event: { kind: 'note', note: 'C4', duration: '4n', patch: 'strings', velocity: 0.58 },
      gapMs: 620,
    },
    {
      event: { kind: 'note', note: 'E4', duration: '4n', patch: 'strings', velocity: 0.56 },
      gapMs: 620,
    },
    {
      event: { kind: 'note', note: 'G4', duration: '2n', patch: 'strings', velocity: 0.54 },
      gapMs: 1080,
    },
  ],
  bright: [
    {
      event: { kind: 'note', note: 'C5', duration: '8n', patch: 'musicbox', velocity: 0.78 },
      gapMs: 300,
    },
    {
      event: { kind: 'note', note: 'E5', duration: '8n', patch: 'musicbox', velocity: 0.8 },
      gapMs: 300,
    },
    {
      event: { kind: 'note', note: 'G5', duration: '4n', patch: 'musicbox', velocity: 0.82 },
      gapMs: 580,
    },
  ],
  playful: [
    {
      event: { kind: 'note', note: 'C4', duration: '8n', patch: 'musicbox', velocity: 0.74 },
      gapMs: 230,
    },
    {
      event: { kind: 'note', note: 'G4', duration: '8n', patch: 'musicbox', velocity: 0.8 },
      gapMs: 180,
    },
    {
      event: { kind: 'note', note: 'E5', duration: '8n', patch: 'musicbox', velocity: 0.78 },
      gapMs: 360,
    },
  ],
}
const CANVAS_ROWS = 3
const CANVAS_COLUMNS = 6
const CANVAS_MIN_MARKS = 4
const MAX_MELODY_NOTES = 8
const RHYTHM_BEAT_MS = 360

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function routeForActivity(kind: ExperienceKind): Route {
  if (kind === 'rhythm-sprite') return 'game-taiko'
  if (kind === 'music-canvas') return 'mixer'
  return 'piano'
}

function drumForIndex(index: number): AudioEvent {
  const drums = ['kick', 'tom', 'clap', 'hihat'] as const
  return { kind: 'drum', drum: drums[index % drums.length] }
}

function noteForColumn(column: number): string {
  return ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'][column % 6]
}

function buildPatternChoices(target: readonly boolean[]): boolean[][] {
  const shifted = target.map((_, index) => target[(index + 1) % target.length])
  const syncopated = target.map((value, index) => (index % 2 === 0 ? value : !value))
  return [[...target], shifted, syncopated]
}

function samePattern(left: readonly boolean[], right: readonly boolean[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function SceneIllustration({
  kind,
  activeIndex,
  playing,
}: {
  kind: ExperienceKind
  activeIndex: number
  playing: boolean
}) {
  return (
    <div
      className={`experience-illustration ${kind} ${playing ? 'playing' : ''}`}
      aria-hidden="true"
    >
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
  const [session, setSession] = useState<ExperienceSession>(() =>
    createExperienceSession(journey.activity.id)
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackIndex, setPlaybackIndex] = useState(-1)
  const [hasListened, setHasListened] = useState(false)
  const [soundRound, setSoundRound] = useState(0)
  const [soundDecision, setSoundDecision] = useState<AuditionDecision<SoundAnswer>>(() =>
    createAuditionDecision()
  )
  const [soundAnswers, setSoundAnswers] = useState<Record<number, SoundAnswerResult>>({})
  const [soundSequence, setSoundSequence] = useState<string[]>([])
  const [rhythmDecision, setRhythmDecision] = useState<AuditionDecision<number>>(() =>
    createAuditionDecision()
  )
  const [rhythmCreateInput, setRhythmCreateInput] = useState<boolean[]>(() => Array(8).fill(false))
  const [rhythmCreateSubmitted, setRhythmCreateSubmitted] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [canvasMoodDecision, setCanvasMoodDecision] = useState<AuditionDecision<CanvasMoodId>>(() =>
    createAuditionDecision()
  )
  const [canvasColor, setCanvasColor] = useState<string>(CANVAS_SWATCHES[0].color)
  const [canvasShape, setCanvasShape] = useState<string>(CANVAS_SHAPES[0].glyph)
  const [canvasMarks, setCanvasMarks] = useState<CanvasMark[]>([])
  const [feeling, setFeeling] = useState(FEELINGS[0])
  const [audioUnavailable, setAudioUnavailable] = useState(false)
  const [saveNotice, setSaveNotice] = useState('')
  const [createNotice, setCreateNotice] = useState('')
  const [playbackGate] = useState(() => new PlaybackTokenGate())
  const completionNotifiedRef = useRef(false)
  const savedRef = useRef(false)

  const soundChallenges = useMemo(() => getSoundChallenges(journey.ageBand), [journey.ageBand])
  const soundChallenge = soundChallenges[soundRound] ?? soundChallenges[0]
  const rhythmTarget = useMemo(() => getRhythmPattern(journey.ageBand, 0), [journey.ageBand])
  const rhythmChoices = useMemo(() => buildPatternChoices(rhythmTarget), [rhythmTarget])
  const progress = useMemo(
    () => getExperienceProgress(session, journey.steps.length),
    [journey.steps.length, session]
  )
  const activeStep = journey.steps[activeIndex] ?? journey.steps[0]
  const completed = Boolean(activeStep && session.completedStepIds.includes(activeStep.id))
  const soundScore = Object.values(soundAnswers).reduce((sum, result) => sum + result.points, 0)
  const soundChoice = soundDecision.choice
  const rhythmChoice = rhythmDecision.choice
  const rhythmChoiceCorrect = rhythmDecision.confirmed ? rhythmDecision.correct : null
  const canvasMood = canvasMoodDecision.choice
  const canvasMoodConfirmed = canvasMoodDecision.confirmed
  const rhythmScore = rhythmDecision.correct === true ? 100 : 0
  const canvasReady = canSubmitCanvas(canvasMarks, CANVAS_MIN_MARKS)

  const cancelPlayback = useCallback(() => {
    stopAllAudio()
    playbackGate.cancel()
    setIsPlaying(false)
    setPlaybackIndex(-1)
  }, [playbackGate])

  const beginPlayback = useCallback(() => {
    stopAllAudio()
    const token = playbackGate.begin()
    setIsPlaying(true)
    setPlaybackIndex(-1)
    return token
  }, [playbackGate])

  const finishPlayback = useCallback(
    (token: number) => {
      if (!playbackGate.isCurrent(token)) return
      setIsPlaying(false)
      setPlaybackIndex(-1)
    },
    [playbackGate]
  )

  const playEvent = useCallback(
    async (event: AudioEvent, token?: number): Promise<boolean> => {
      try {
        if (event.kind === 'note' && (event.patch ?? 'piano') === 'piano') preloadPiano()
        const ready = await ensureAudio()
        if (!ready) {
          setAudioUnavailable(true)
          return false
        }
        if (token !== undefined && !playbackGate.isCurrent(token)) return false
        if (event.kind === 'drum') playDrum(event.drum)
        else playNote(event.note, event.duration, event.velocity ?? 0.72, event.patch ?? 'piano')
        setAudioUnavailable(false)
        return true
      } catch {
        setAudioUnavailable(true)
        return false
      }
    },
    [playbackGate]
  )

  const completeStep = useCallback((stepId: ExperienceStepId) => {
    setSession((current) => recordExperienceStep(current, stepId))
  }, [])

  const resetExperience = useCallback(() => {
    cancelPlayback()
    completionNotifiedRef.current = false
    savedRef.current = false
    setSession(createExperienceSession(journey.activity.id))
    setActiveIndex(0)
    setHasListened(false)
    setSoundRound(0)
    setSoundDecision(createAuditionDecision())
    setSoundAnswers({})
    setSoundSequence([])
    setRhythmDecision(createAuditionDecision())
    setRhythmCreateInput(Array(8).fill(false))
    setRhythmCreateSubmitted(false)
    setPlayCount(0)
    setCanvasMoodDecision(createAuditionDecision())
    setCanvasColor(CANVAS_SWATCHES[0].color)
    setCanvasShape(CANVAS_SHAPES[0].glyph)
    setCanvasMarks([])
    setFeeling(FEELINGS[0])
    setAudioUnavailable(false)
    setSaveNotice('')
    setCreateNotice('')
  }, [cancelPlayback, journey.activity.id])

  useEffect(() => {
    resetExperience()
  }, [resetExperience, journey.ageBand])

  useEffect(() => {
    if (!isExperienceComplete(session, journey.steps.length) || completionNotifiedRef.current)
      return
    completionNotifiedRef.current = true
    onComplete?.(`完成了${journey.activity.title}，${feeling}。`)
  }, [feeling, journey.activity.title, journey.steps.length, onComplete, session])

  useEffect(() => {
    preloadPiano()
    return () => {
      stopAllAudio()
      playbackGate.cancel()
    }
  }, [playbackGate])

  const playSoundSide = useCallback(
    async (challenge: SoundChallenge, side: SoundAnswer, token: number): Promise<boolean> => {
      const cues = challenge.cues[side]
      if (cues.some((cue) => cue.patch === 'piano')) preloadPiano()
      const successful = await runSoundCueSequence(
        cues,
        token,
        playbackGate,
        ensureAudio,
        (cue) => playNote(cue.note, cue.duration, cue.velocity, cue.patch),
        wait
      )
      if (playbackGate.isCurrent(token)) setAudioUnavailable(!successful)
      return successful
    },
    [playbackGate]
  )

  const playRhythmPattern = useCallback(
    async (pattern: readonly boolean[], token: number): Promise<boolean> => {
      let successful = true
      for (let index = 0; index < pattern.length; index += 1) {
        if (!playbackGate.isCurrent(token)) return false
        setPlaybackIndex(index)
        if (pattern[index]) {
          successful = (await playEvent(drumForIndex(index), token)) && successful
        }
        await wait(RHYTHM_BEAT_MS)
      }
      return successful
    },
    [playEvent, playbackGate]
  )

  const playListenDemo = useCallback(async () => {
    if (isPlaying) {
      cancelPlayback()
      return
    }
    const token = beginPlayback()
    let successful = true
    try {
      if (journey.activity.kind === 'sound-detective') {
        setPlaybackIndex(0)
        successful = (await playSoundSide(soundChallenge, 'a', token)) && successful
        if (!playbackGate.isCurrent(token)) return
        setPlaybackIndex(1)
        successful = (await playSoundSide(soundChallenge, 'b', token)) && successful
      } else if (journey.activity.kind === 'rhythm-sprite') {
        successful = (await playRhythmPattern(rhythmTarget, token)) && successful
      } else {
        const notes = ['C4', 'E4', 'G4', 'A4']
        for (let index = 0; index < notes.length; index += 1) {
          if (!playbackGate.isCurrent(token)) return
          setPlaybackIndex(index)
          successful =
            (await playEvent(
              {
                kind: 'note',
                note: notes[index],
                duration: '8n',
                patch: 'musicbox',
              },
              token
            )) && successful
          await wait(280)
        }
      }
      if (!playbackGate.isCurrent(token)) return
      setHasListened(true)
      completeStep('listen')
      if (!successful) setAudioUnavailable(true)
    } finally {
      finishPlayback(token)
    }
  }, [
    beginPlayback,
    cancelPlayback,
    completeStep,
    finishPlayback,
    isPlaying,
    journey.activity.kind,
    playEvent,
    playbackGate,
    playRhythmPattern,
    playSoundSide,
    rhythmTarget,
    soundChallenge,
  ])

  const previewSoundAnswer = useCallback(
    async (answer: SoundAnswer) => {
      if (!soundChallenge || soundAnswers[soundRound]?.correct) return
      setSoundDecision(auditionChoice(answer))
      setSoundAnswers((current) => {
        if (!current[soundRound] || current[soundRound].correct) return current
        const next = { ...current }
        delete next[soundRound]
        return next
      })
      const token = beginPlayback()
      try {
        setPlaybackIndex(answer === 'a' ? 0 : 1)
        const successful = await playSoundSide(soundChallenge, answer, token)
        if (!playbackGate.isCurrent(token)) return
        if (!successful) setAudioUnavailable(true)
      } finally {
        finishPlayback(token)
      }
    },
    [
      beginPlayback,
      finishPlayback,
      playSoundSide,
      playbackGate,
      soundAnswers,
      soundChallenge,
      soundRound,
    ]
  )

  const confirmSoundAnswer = useCallback(() => {
    const choice = soundDecision.choice
    if (choice === null || isPlaying || soundAnswers[soundRound]?.correct) return
    const decision = confirmAuditionChoice(
      soundDecision,
      (selectedChoice) => evaluateSoundAnswer(soundChallenge, selectedChoice).correct
    )
    const result = evaluateSoundAnswer(soundChallenge, choice)
    const nextAnswers = {
      ...soundAnswers,
      [soundRound]: { answer: choice, ...result },
    }
    setSoundDecision(decision)
    setSoundAnswers(nextAnswers)
    if (soundChallenges.every((_, index) => nextAnswers[index]?.correct)) completeStep('find')
  }, [
    completeStep,
    isPlaying,
    soundAnswers,
    soundChallenge,
    soundChallenges,
    soundDecision,
    soundRound,
  ])

  const handleFreePlay = useCallback(
    async (event: AudioEvent) => {
      if (isPlaying) return
      await playEvent(event)
      setPlayCount((current) => current + 1)
      completeStep('play')
    },
    [completeStep, isPlaying, playEvent]
  )

  const previewRhythmChoice = useCallback(
    async (index: number) => {
      if (rhythmDecision.correct === true) return
      setRhythmDecision(auditionChoice(index))
      const token = beginPlayback()
      try {
        const successful = await playRhythmPattern(rhythmChoices[index] ?? [], token)
        if (playbackGate.isCurrent(token) && !successful) setAudioUnavailable(true)
      } finally {
        finishPlayback(token)
      }
    },
    [
      beginPlayback,
      finishPlayback,
      playRhythmPattern,
      playbackGate,
      rhythmChoices,
      rhythmDecision.correct,
    ]
  )

  const confirmRhythmChoice = useCallback(() => {
    if (rhythmDecision.choice === null || isPlaying || rhythmDecision.correct === true) return
    const decision = confirmAuditionChoice(rhythmDecision, (choice) =>
      samePattern(rhythmChoices[choice] ?? [], rhythmTarget)
    )
    setRhythmDecision(decision)
    if (decision.correct) completeStep('find')
  }, [completeStep, isPlaying, rhythmChoices, rhythmDecision, rhythmTarget])

  const toggleRhythmCreateCell = useCallback(
    async (index: number) => {
      if (isPlaying) return
      setRhythmCreateInput((current) =>
        current.map((value, cellIndex) => (cellIndex === index ? !value : value))
      )
      await playEvent(drumForIndex(index))
    },
    [isPlaying, playEvent]
  )

  const submitRhythmCreate = useCallback(() => {
    const hits = rhythmCreateInput.filter(Boolean).length
    if (hits < 2) {
      setCreateNotice('至少安排两个击拍，再提交你的节奏。')
      return
    }
    setRhythmCreateSubmitted(true)
    setCreateNotice(`已留下 ${hits} 个击拍，可以继续分享你的作品。`)
    completeStep('create')
  }, [completeStep, rhythmCreateInput])

  const clearRhythmCreate = useCallback(() => {
    setRhythmCreateInput(Array(8).fill(false))
    setRhythmCreateSubmitted(false)
    setCreateNotice('')
  }, [])

  const previewCanvasMood = useCallback(
    async (mood: CanvasMoodId) => {
      if (canvasMoodDecision.confirmed) return
      setCanvasMoodDecision(auditionChoice(mood))
      const token = beginPlayback()
      let successful = true
      try {
        for (let index = 0; index < CANVAS_MOOD_AUDIO[mood].length; index += 1) {
          if (!playbackGate.isCurrent(token)) return
          const item = CANVAS_MOOD_AUDIO[mood][index]
          setPlaybackIndex(index)
          successful = (await playEvent(item.event, token)) && successful
          await wait(item.gapMs)
        }
        if (playbackGate.isCurrent(token) && !successful) setAudioUnavailable(true)
      } finally {
        finishPlayback(token)
      }
    },
    [beginPlayback, canvasMoodDecision.confirmed, finishPlayback, playEvent, playbackGate]
  )

  const confirmCanvasMood = useCallback(() => {
    if (canvasMoodDecision.choice === null || isPlaying || canvasMoodDecision.confirmed) return
    setCanvasMoodDecision((current) => confirmAuditionChoice(current))
    completeStep('find')
  }, [canvasMoodDecision, completeStep, isPlaying])

  const handleCanvasCell = useCallback(
    async (row: number, column: number) => {
      if (isPlaying) return
      const mark: CanvasMark = { row, column, color: canvasColor, shape: canvasShape }
      setCanvasMarks((current) => upsertCanvasMark(current, mark))
      await playEvent({
        kind: 'note',
        note: noteForColumn(column),
        duration: '8n',
        patch: 'musicbox',
      })
    },
    [canvasColor, canvasShape, isPlaying, playEvent]
  )

  const playCanvasWork = useCallback(async () => {
    if (isPlaying) {
      cancelPlayback()
      return
    }
    if (canvasMarks.length === 0) return
    const token = beginPlayback()
    try {
      for (let index = 0; index < canvasMarks.length; index += 1) {
        if (!playbackGate.isCurrent(token)) return
        const mark = canvasMarks[index]
        setPlaybackIndex(index)
        await playEvent(
          {
            kind: 'note',
            note: noteForColumn(mark.column),
            duration: '8n',
            patch: 'musicbox',
          },
          token
        )
        await wait(280)
      }
    } finally {
      finishPlayback(token)
    }
  }, [
    beginPlayback,
    cancelPlayback,
    canvasMarks,
    finishPlayback,
    isPlaying,
    playEvent,
    playbackGate,
  ])

  const submitCanvas = useCallback(() => {
    if (!canvasReady) {
      setCreateNotice(
        `再画 ${Math.max(0, CANVAS_MIN_MARKS - canvasMarks.length)} 笔，就可以完成画作。`
      )
      return
    }
    setCreateNotice(`这张画有 ${canvasMarks.length} 个声音印记，完成得很棒。`)
    completeStep('create')
  }, [canvasMarks.length, canvasReady, completeStep])

  const addMelodyNote = useCallback(
    async (note: string) => {
      if (isPlaying) return
      setSoundSequence((current) => [...current, note].slice(-MAX_MELODY_NOTES))
      await playEvent({ kind: 'note', note, duration: '8n', patch: 'piano' })
    },
    [isPlaying, playEvent]
  )

  const playMelody = useCallback(async () => {
    if (isPlaying) {
      cancelPlayback()
      return
    }
    if (soundSequence.length === 0) return
    const token = beginPlayback()
    try {
      for (let index = 0; index < soundSequence.length; index += 1) {
        if (!playbackGate.isCurrent(token)) return
        setPlaybackIndex(index)
        await playEvent(
          {
            kind: 'note',
            note: soundSequence[index],
            duration: '8n',
            patch: 'piano',
          },
          token
        )
        await wait(280)
      }
    } finally {
      finishPlayback(token)
    }
  }, [
    beginPlayback,
    cancelPlayback,
    finishPlayback,
    isPlaying,
    playEvent,
    playbackGate,
    soundSequence,
  ])

  const submitMelody = useCallback(() => {
    if (soundSequence.length < 4) {
      setCreateNotice(`再添加 ${4 - soundSequence.length} 个音符，就能留下动机。`)
      return
    }
    setCreateNotice('四拍动机已留下，可以继续分享你的发现。')
    completeStep('create')
  }, [completeStep, soundSequence.length])

  const saveFeeling = useCallback(() => {
    if (savedRef.current) {
      setSaveNotice('这条发现已经保存过了。')
      return
    }
    completeStep('share')
    if (!canPersistExperience(studentId)) {
      setSaveNotice('选择一位学生后，就能把这条发现保存到“我的音乐”。')
      return
    }
    savedRef.current = true
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
  }, [
    completeStep,
    feeling,
    grade,
    journey.activity.curriculumTopicIds,
    journey.activity.id,
    journey.activity.source,
    journey.activity.subtitle,
    journey.activity.title,
    journey.activity.zhejiangTag,
    journey.ageBand,
    studentId,
  ])

  const getStepReady = useCallback(
    (stepId: ExperienceStepId): boolean => {
      if (stepId === 'listen') return hasListened
      if (stepId === 'find') {
        if (journey.activity.kind === 'sound-detective')
          return (
            Object.keys(soundAnswers).length >= soundChallenges.length &&
            Object.values(soundAnswers).every((result) => result.correct)
          )
        if (journey.activity.kind === 'rhythm-sprite') return rhythmChoiceCorrect === true
        return canvasMoodConfirmed
      }
      if (stepId === 'play') return playCount > 0
      if (stepId === 'create') {
        if (journey.activity.kind === 'sound-detective') return soundSequence.length >= 4
        if (journey.activity.kind === 'rhythm-sprite') return rhythmCreateSubmitted
        return canvasReady
      }
      return stepId === 'share' && Boolean(feeling)
    },
    [
      canvasMoodConfirmed,
      canvasReady,
      feeling,
      hasListened,
      journey.activity.kind,
      playCount,
      rhythmChoiceCorrect,
      rhythmCreateSubmitted,
      soundAnswers,
      soundChallenges.length,
      soundSequence.length,
    ]
  )

  const firstIncompleteIndex = journey.steps.findIndex(
    (step) => !session.completedStepIds.includes(step.id)
  )
  const lastAllowedIndex =
    firstIncompleteIndex === -1 ? journey.steps.length - 1 : firstIncompleteIndex

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= journey.steps.length || index > lastAllowedIndex) return
      cancelPlayback()
      setActiveIndex(index)
      setSaveNotice('')
      setCreateNotice('')
    },
    [cancelPlayback, journey.steps.length, lastAllowedIndex]
  )

  const handleAdvance = useCallback(() => {
    if (!activeStep) return
    if (!session.completedStepIds.includes(activeStep.id)) {
      if (!getStepReady(activeStep.id)) return
      completeStep(activeStep.id)
    }
    if (activeIndex < journey.steps.length - 1) {
      cancelPlayback()
      setActiveIndex((current) => current + 1)
    }
  }, [
    activeIndex,
    activeStep,
    cancelPlayback,
    completeStep,
    getStepReady,
    journey.steps.length,
    session.completedStepIds,
  ])

  const handleRhythmGridKeyDown = useCallback(
    (
      event: KeyboardEvent<HTMLDivElement>,
      input: readonly boolean[],
      onToggle: (index: number) => void
    ) => {
      if (event.target !== event.currentTarget || (event.key !== ' ' && event.key !== 'Enter'))
        return
      event.preventDefault()
      const nextIndex = input.findIndex((value) => !value)
      onToggle(nextIndex < 0 ? 0 : nextIndex)
    },
    []
  )

  const renderSoundFind = () => {
    const result = soundAnswers[soundRound]
    return (
      <div className="experience-sound-game">
        <div className="experience-round-head">
          <span>
            线索 {soundRound + 1} / {soundChallenges.length}
          </span>
          <b>
            {soundChallenge.change} · 得分 {soundScore}
          </b>
        </div>
        <p id={`sound-question-${soundRound}`} className="experience-question-prompt">
          {soundChallenge.prompt}
        </p>
        <div
          className="experience-choice-grid"
          role="group"
          aria-labelledby={`sound-question-${soundRound}`}
        >
          {(['a', 'b'] as const).map((choice) => (
            <button
              key={choice}
              type="button"
              className={`experience-choice ${soundChoice === choice ? 'selected' : ''} ${isPlaying && soundChoice === choice ? 'auditioning' : ''} ${result && result.answer === choice && result.correct ? 'correct' : ''} ${result && result.answer === choice && !result.correct ? 'incorrect' : ''}`}
              onClick={() => void previewSoundAnswer(choice)}
              disabled={result?.correct}
              aria-pressed={soundChoice === choice}
              aria-describedby={`sound-question-${soundRound}`}
            >
              <span className="experience-choice-note" aria-hidden="true">
                {choice === 'a' ? '♪' : '♫'}
              </span>
              <strong>声音 {choice.toUpperCase()}</strong>
              <small>
                {isPlaying && soundChoice === choice
                  ? '正在完整试听…'
                  : `点击试听 ${choice.toUpperCase()}`}
              </small>
            </button>
          ))}
        </div>
        <div className="experience-selection-actions">
          <p>两个声音都可以反复试听，选好后再确认。</p>
          <button
            type="button"
            className="experience-inline-action"
            onClick={confirmSoundAnswer}
            disabled={soundChoice === null || isPlaying || result?.correct}
          >
            {isPlaying ? '试听中…' : result?.correct ? '已确认' : '确定选择'}
          </button>
        </div>
        {result && (
          <div
            className={`experience-feedback ${result.correct ? 'success' : 'error'}`}
            role="status"
          >
            {result.correct
              ? `答对了！${soundChallenge.explanation}`
              : `再听一次：${soundChallenge.explanation}`}
          </div>
        )}
        {result?.correct && soundRound < soundChallenges.length - 1 && (
          <button
            type="button"
            className="experience-secondary-action"
            onClick={() => {
              cancelPlayback()
              setSoundRound((current) => current + 1)
              setSoundDecision(createAuditionDecision())
              setSaveNotice('')
              setCreateNotice('')
            }}
          >
            下一条线索
          </button>
        )}
      </div>
    )
  }

  const renderRhythmFind = () => (
    <div className="experience-rhythm-game">
      <div className="experience-round-head">
        <span>找出刚才听到的节奏</span>
        <b>八拍 · 点击选项可完整试听</b>
      </div>
      <div className="experience-pattern-choices" role="group" aria-label="节奏选项">
        {rhythmChoices.map((pattern, choiceIndex) => (
          <button
            key={choiceIndex}
            type="button"
            className={`experience-pattern-choice ${rhythmChoice === choiceIndex ? 'selected' : ''} ${isPlaying && rhythmChoice === choiceIndex ? 'auditioning' : ''} ${rhythmChoice === choiceIndex && rhythmChoiceCorrect ? 'correct' : ''} ${rhythmChoice === choiceIndex && rhythmChoiceCorrect === false ? 'incorrect' : ''}`}
            onClick={() => void previewRhythmChoice(choiceIndex)}
            disabled={rhythmChoiceCorrect === true}
            aria-pressed={rhythmChoice === choiceIndex}
          >
            <strong>
              {isPlaying && rhythmChoice === choiceIndex ? '▶ ' : ''}节奏{' '}
              {String.fromCharCode(65 + choiceIndex)}
            </strong>
            <span>
              {pattern.map((hit, index) => (
                <i key={index} className={hit ? 'hit' : ''} />
              ))}
            </span>
          </button>
        ))}
      </div>
      <div className="experience-selection-actions">
        <p>可在三个节奏间来回试听，听完整八拍后再确认。</p>
        <button
          type="button"
          className="experience-inline-action"
          onClick={confirmRhythmChoice}
          disabled={rhythmChoice === null || isPlaying || rhythmChoiceCorrect === true}
        >
          {isPlaying ? '试听中…' : rhythmChoiceCorrect ? '已确认' : '确定选择'}
        </button>
      </div>
      {rhythmChoiceCorrect !== null && (
        <p
          className={`experience-feedback ${rhythmChoiceCorrect ? 'success' : 'error'}`}
          role="status"
        >
          {rhythmChoiceCorrect ? '找到了！这就是刚才的八拍。' : '还差一点，听示范后再比较一次。'}
        </p>
      )}
    </div>
  )

  const renderCanvasFind = () => (
    <div className="experience-canvas-game">
      <div className="experience-round-head">
        <span>选择你的画面气质</span>
        <b>先试听三段音乐，再定创作方向</b>
      </div>
      <div className="experience-mood-grid" role="group" aria-label="音乐画面气质">
        {CANVAS_MOODS.map((mood) => (
          <button
            key={mood.id}
            type="button"
            className={`experience-mood-card ${canvasMood === mood.id ? 'selected' : ''} ${isPlaying && canvasMood === mood.id ? 'auditioning' : ''}`}
            onClick={() => void previewCanvasMood(mood.id)}
            disabled={canvasMoodConfirmed}
            aria-pressed={canvasMood === mood.id}
          >
            <span style={{ background: mood.color }} aria-hidden="true" />
            <strong>{mood.label}</strong>
            <small>{mood.hint}</small>
          </button>
        ))}
      </div>
      <div className="experience-selection-actions">
        <p>每张气质卡都有一段声音，可反复切换比较。</p>
        <button
          type="button"
          className="experience-inline-action"
          onClick={confirmCanvasMood}
          disabled={canvasMood === null || isPlaying || canvasMoodConfirmed}
        >
          {isPlaying ? '试听中…' : canvasMoodConfirmed ? '已确认' : '确定选择'}
        </button>
      </div>
      {canvasMoodConfirmed && canvasMood && (
        <p className="experience-feedback success" role="status">
          已选择“{CANVAS_MOODS.find((mood) => mood.id === canvasMood)?.label}
          ”，接下来把感觉放进画布。
        </p>
      )}
    </div>
  )

  const renderRhythmGrid = (
    input: boolean[],
    target: readonly boolean[],
    onToggle: (index: number) => void,
    label: string
  ) => (
    <div className="experience-rhythm-grid-wrap">
      <div
        className="experience-rhythm-grid"
        role="group"
        aria-label={label}
        tabIndex={0}
        onKeyDown={(event) => handleRhythmGridKeyDown(event, input, onToggle)}
      >
        {target.map((shouldSound, index) => (
          <button
            key={index}
            type="button"
            className={`rhythm-cell ${input[index] ? 'on' : ''} ${shouldSound ? 'suggested' : ''} ${playbackIndex === index ? 'playing' : ''}`}
            aria-label={`第 ${index + 1} 拍${shouldSound ? '建议击拍' : '留白'}`}
            aria-pressed={input[index]}
            onClick={() => onToggle(index)}
          >
            <span>{index + 1}</span>
            {shouldSound && <i aria-hidden="true" />}
          </button>
        ))}
      </div>
      <small className="experience-key-hint">
        点击格子，或聚焦节奏格后按空格 / Enter 记录下一拍
      </small>
    </div>
  )

  const renderCanvasEditor = () => (
    <div className="experience-canvas-editor">
      <div className="canvas-tool-row" aria-label="画布工具">
        {CANVAS_SWATCHES.map((swatch) => (
          <button
            key={swatch.id}
            type="button"
            className={`canvas-swatch ${canvasColor === swatch.color ? 'selected' : ''}`}
            style={{ '--swatch': swatch.color } as CSSProperties}
            aria-label={swatch.label}
            aria-pressed={canvasColor === swatch.color}
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
            aria-pressed={canvasShape === shape.glyph}
            onClick={() => setCanvasShape(shape.glyph)}
          >
            {shape.glyph}
          </button>
        ))}
      </div>
      <div className="experience-canvas-grid" role="grid" aria-label="音乐画布网格">
        {Array.from({ length: CANVAS_ROWS * CANVAS_COLUMNS }, (_, index) => {
          const row = Math.floor(index / CANVAS_COLUMNS)
          const column = index % CANVAS_COLUMNS
          const mark = canvasMarks.find((item) => item.row === row && item.column === column)
          const markIndex = mark ? canvasMarks.indexOf(mark) : -1
          return (
            <button
              key={`${row}-${column}`}
              type="button"
              role="gridcell"
              className={`canvas-cell ${mark ? 'marked' : ''} ${playbackIndex === markIndex ? 'playing' : ''}`}
              aria-label={`第 ${row + 1} 行第 ${column + 1} 列${mark ? '已有图形' : '空白'}`}
              onClick={() => void handleCanvasCell(row, column)}
            >
              {mark && <i style={{ color: mark.color }}>{mark.shape}</i>}
            </button>
          )
        })}
        {canvasMarks.length === 0 && (
          <span className="canvas-empty">点击格子，把听到的感觉放进去</span>
        )}
      </div>
      <div className="experience-editor-actions">
        <span>
          {canvasMarks.length} / {CANVAS_MIN_MARKS} 个声音印记
        </span>
        <button
          type="button"
          className="experience-secondary-action"
          onClick={() => setCanvasMarks((current) => undoCanvasMark(current))}
          disabled={canvasMarks.length === 0}
        >
          撤销
        </button>
        <button
          type="button"
          className="experience-secondary-action"
          onClick={() => setCanvasMarks([])}
          disabled={canvasMarks.length === 0}
        >
          清空
        </button>
        <button
          type="button"
          className="experience-secondary-action"
          onClick={() => void playCanvasWork()}
          disabled={canvasMarks.length === 0}
        >
          {isPlaying ? '⏹ 停止' : '▶ 播放作品'}
        </button>
        <button
          type="button"
          className="experience-inline-action"
          onClick={submitCanvas}
          disabled={!canvasReady}
        >
          完成画作
        </button>
      </div>
      {createNotice && (
        <p className="experience-feedback success" role="status">
          {createNotice}
        </p>
      )}
    </div>
  )

  const renderStepScene = () => {
    if (!activeStep) return null
    if (activeStep.id === 'listen')
      return (
        <div className="experience-listen-scene">
          <SceneIllustration
            kind={journey.activity.kind}
            activeIndex={playbackIndex >= 0 ? playbackIndex : activeIndex}
            playing={isPlaying}
          />
          <button
            type="button"
            className="experience-big-play"
            onClick={() => void playListenDemo()}
          >
            <span aria-hidden="true">{isPlaying ? '⏹' : '▶'}</span>
            <span>{isPlaying ? '停止播放' : hasListened ? '再听一次' : '播放示范'}</span>
          </button>
          <p className="experience-listen-status" role="status">
            {hasListened ? '已听过示范，可以进入下一步。' : '先听完整示范，留意声音的变化。'}
          </p>
        </div>
      )
    if (activeStep.id === 'find') {
      if (journey.activity.kind === 'sound-detective') return renderSoundFind()
      if (journey.activity.kind === 'rhythm-sprite') return renderRhythmFind()
      return renderCanvasFind()
    }
    if (activeStep.id === 'play') {
      if (journey.activity.kind === 'sound-detective')
        return (
          <div className="experience-pad-game">
            <div className="experience-round-head">
              <span>换一种音色</span>
              <b>已试听 {playCount} 次</b>
            </div>
            <div className="experience-play-pads">
              <button
                type="button"
                onClick={() =>
                  void handleFreePlay({ kind: 'note', note: 'C4', duration: '4n', patch: 'piano' })
                }
              >
                🎹 钢琴<small>清晰</small>
              </button>
              <button
                type="button"
                onClick={() =>
                  void handleFreePlay({
                    kind: 'note',
                    note: 'C4',
                    duration: '4n',
                    patch: 'strings',
                  })
                }
              >
                🎻 弦乐<small>柔和</small>
              </button>
              <button
                type="button"
                onClick={() =>
                  void handleFreePlay({
                    kind: 'note',
                    note: 'G4',
                    duration: '4n',
                    patch: 'musicbox',
                  })
                }
              >
                🔔 八音盒<small>清亮</small>
              </button>
            </div>
          </div>
        )
      if (journey.activity.kind === 'rhythm-sprite')
        return (
          <div className="experience-pad-game">
            <div className="experience-round-head">
              <span>自由敲击</span>
              <b>已敲 {playCount} 次</b>
            </div>
            <div className="experience-play-pads rhythm-pads">
              {RHYTHM_DRUMS.map((drum) => (
                <button
                  key={drum.id}
                  type="button"
                  onClick={() => void handleFreePlay({ kind: 'drum', drum: drum.drum })}
                >
                  {drum.label}
                  <small>{drum.hint}</small>
                </button>
              ))}
            </div>
          </div>
        )
      return (
        <div className="experience-pad-game">
          <div className="experience-round-head">
            <span>听一颗音符</span>
            <b>已试听 {playCount} 次</b>
          </div>
          <div className="experience-play-pads note-pads">
            {MELODY_NOTES.map((item) => (
              <button
                key={item.note}
                type="button"
                style={{ '--pad-color': item.color } as CSSProperties}
                onClick={() =>
                  void handleFreePlay({
                    kind: 'note',
                    note: item.note,
                    duration: '8n',
                    patch: 'musicbox',
                  })
                }
              >
                {item.label}
                <small>{item.note}</small>
              </button>
            ))}
          </div>
          {onNavigate && (
            <button
              type="button"
              className="experience-ghost-action"
              onClick={() => onNavigate(routeForActivity(journey.activity.kind))}
            >
              去完整混音创作页面
            </button>
          )}
        </div>
      )
    }
    if (activeStep.id === 'create') {
      if (journey.activity.kind === 'sound-detective')
        return (
          <div className="experience-melody-editor">
            <div className="experience-round-head">
              <span>拼出四拍动机</span>
              <b>{soundSequence.length} / 4 个音符</b>
            </div>
            <div className="melody-note-row" role="group" aria-label="旋律音符">
              {MELODY_NOTES.map((item) => (
                <button
                  key={item.note}
                  type="button"
                  style={{ '--pad-color': item.color } as CSSProperties}
                  onClick={() => void addMelodyNote(item.note)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="melody-sequence" aria-label="我的旋律">
              {soundSequence.length === 0 ? (
                <span>还没有音符，先点一个试试</span>
              ) : (
                soundSequence.map((note, index) => (
                  <i key={`${note}-${index}`} className={playbackIndex === index ? 'playing' : ''}>
                    {note.replace(/[0-9]/g, '')}
                  </i>
                ))
              )}
            </div>
            <div className="experience-editor-actions">
              <button
                type="button"
                className="experience-secondary-action"
                onClick={() => setSoundSequence((current) => current.slice(0, -1))}
                disabled={soundSequence.length === 0}
              >
                撤销
              </button>
              <button
                type="button"
                className="experience-secondary-action"
                onClick={() => setSoundSequence([])}
                disabled={soundSequence.length === 0}
              >
                清空
              </button>
              <button
                type="button"
                className="experience-secondary-action"
                onClick={() => void playMelody()}
                disabled={soundSequence.length === 0}
              >
                {isPlaying ? '⏹ 停止' : '▶ 播放动机'}
              </button>
              <button
                type="button"
                className="experience-inline-action"
                onClick={submitMelody}
                disabled={soundSequence.length < 4}
              >
                留下动机
              </button>
            </div>
            {createNotice && (
              <p className="experience-feedback success" role="status">
                {createNotice}
              </p>
            )}
          </div>
        )
      if (journey.activity.kind === 'rhythm-sprite')
        return (
          <div className="experience-rhythm-game">
            <div className="experience-round-head">
              <span>编一个八拍节奏</span>
              <b>{rhythmCreateInput.filter(Boolean).length} 个击拍</b>
            </div>
            {renderRhythmGrid(
              rhythmCreateInput,
              Array(8).fill(false),
              (index) => void toggleRhythmCreateCell(index),
              '创作节奏格'
            )}
            <div className="experience-editor-actions">
              <button
                type="button"
                className="experience-secondary-action"
                onClick={clearRhythmCreate}
              >
                清空重来
              </button>
              <button
                type="button"
                className="experience-inline-action"
                onClick={submitRhythmCreate}
                disabled={rhythmCreateSubmitted}
              >
                留下节奏
              </button>
            </div>
            {createNotice && (
              <p className="experience-feedback success" role="status">
                {createNotice}
              </p>
            )}
          </div>
        )
      return renderCanvasEditor()
    }
    return (
      <div className="experience-share-scene">
        <div className="experience-complete-badge" aria-hidden="true">
          ✦
        </div>
        <p>这段音乐给你的感觉是：</p>
        <div className="feeling-list" role="group" aria-label="音乐感受">
          {FEELINGS.map((item) => (
            <button
              key={item}
              type="button"
              className={feeling === item ? 'selected' : ''}
              onClick={() => setFeeling(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button type="button" className="experience-save-action" onClick={saveFeeling}>
          {savedRef.current ? '已保存发现' : '保存我的发现'}
        </button>
        {saveNotice && (
          <p className="experience-save-notice" role="status">
            {saveNotice}
          </p>
        )}
      </div>
    )
  }

  const isLastStep = activeIndex === journey.steps.length - 1
  const stepReady = activeStep ? getStepReady(activeStep.id) : false
  const canAdvance = completed || stepReady
  return (
    <section
      className={`music-experience-stage ${compact ? 'compact' : ''} activity-${journey.activity.kind}`}
      aria-labelledby={`experience-title-${journey.activity.id}`}
    >
      <header className="experience-stage-header">
        <div className="experience-stage-heading">
          <span
            className="experience-activity-icon"
            style={{ backgroundColor: journey.activity.color }}
            aria-hidden="true"
          >
            {journey.activity.icon}
          </span>
          <div>
            <span className="experience-stage-kicker">音乐探险 · {journey.activity.duration}</span>
            <h2 id={`experience-title-${journey.activity.id}`}>{journey.activity.title}</h2>
            <p>
              {journey.activity.subtitle} · {journey.activity.zhejiangTag}
            </p>
          </div>
        </div>
        <div className="experience-stage-tools">
          <div className="experience-scoreboard" aria-label="本局成绩">
            <span>
              <b>
                {journey.activity.kind === 'sound-detective'
                  ? soundScore
                  : journey.activity.kind === 'rhythm-sprite'
                    ? rhythmScore
                    : canvasMarks.length}
              </b>
              <small>{journey.activity.kind === 'music-canvas' ? '个印记' : '本局分'}</small>
            </span>
            <span>
              <b>{Math.round(progress * 100)}%</b>
              <small>探险进度</small>
            </span>
          </div>
          <button type="button" className="experience-reset-action" onClick={resetExperience}>
            ↺ 重置本局
          </button>
        </div>
      </header>
      <div className="experience-progress" aria-label={`已完成 ${Math.round(progress * 100)}%`}>
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <nav className="experience-stepper" aria-label="音乐探险步骤">
        {journey.steps.map((step, index) => {
          const isDone = session.completedStepIds.includes(step.id)
          const isAllowed = index <= lastAllowedIndex
          return (
            <button
              key={step.id}
              type="button"
              className={`${index === activeIndex ? 'active' : ''} ${isDone ? 'done' : ''} ${!isAllowed ? 'locked' : ''}`}
              onClick={() => goToStep(index)}
              disabled={!isAllowed}
              aria-current={index === activeIndex ? 'step' : undefined}
              aria-label={`${index + 1} ${step.label}${isDone ? '，已完成' : !isAllowed ? '，待解锁' : ''}`}
            >
              <span>{isDone ? '✓' : index + 1}</span>
              <b>{step.label}</b>
            </button>
          )
        })}
      </nav>
      <div className="experience-stage-body">
        <div className="experience-prompt">
          <span>{activeStep?.label}</span>
          <p>{activeStep?.prompt}</p>
        </div>
        <div className="experience-game-panel">{renderStepScene()}</div>
        <aside className="experience-status-panel" aria-label="本局提示">
          <div className="experience-status-card">
            <span className="experience-status-kicker">现在进行</span>
            <strong>{activeStep?.label}</strong>
            <p>
              {completed
                ? '这一步完成啦，可以回看或继续下一步。'
                : stepReady
                  ? '准备好了，点击右下角继续。'
                  : '完成操作后，下一步会自动解锁。'}
            </p>
          </div>
          <div className="experience-status-card">
            <span className="experience-status-kicker">声音状态</span>
            <strong>
              {audioUnavailable ? '可用降级模式' : isPlaying ? '正在播放' : '已准备好'}
            </strong>
            <p>
              {audioUnavailable
                ? '当前设备没有发出声音，但点击、评分和保存仍然可用。'
                : '点击播放按钮可以重听，播放中可随时停止。'}
            </p>
          </div>
          {journey.activity.kind === 'music-canvas' && (
            <div className="experience-status-card">
              <span className="experience-status-kicker">画布进度</span>
              <strong>
                {canvasMarks.length} / {CANVAS_MIN_MARKS} 印记
              </strong>
              <p>
                {canvasReady
                  ? '已经达到提交门槛，可以完成画作。'
                  : '至少留下四个印记，作品才会进入完成状态。'}
              </p>
            </div>
          )}
        </aside>
      </div>
      <footer className="experience-stage-footer">
        <button
          type="button"
          className="experience-back-action"
          onClick={() => goToStep(activeIndex - 1)}
          disabled={activeIndex === 0}
        >
          上一步
        </button>
        <div className="experience-footer-hint" aria-live="polite">
          {audioUnavailable
            ? '声音暂时不可用，也可以继续用点击完成。'
            : completed
              ? '这一步完成啦，可以继续探索。'
              : stepReady
                ? '操作完成，点击继续。'
                : '按提示完成当前小动作。'}
        </div>
        {!isLastStep ? (
          <button
            type="button"
            className="experience-next-action"
            onClick={handleAdvance}
            disabled={!canAdvance}
          >
            {completed ? '下一步' : (activeStep?.actionLabel ?? '完成并继续')}
          </button>
        ) : (
          <button
            type="button"
            className="experience-next-action"
            onClick={saveFeeling}
            disabled={!canAdvance}
          >
            {savedRef.current ? '已保存' : '保存发现'}
          </button>
        )}
      </footer>
    </section>
  )
}
