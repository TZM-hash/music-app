import type { ExperienceAgeBand } from './experienceActivities'

export type SoundAnswer = 'a' | 'b'

export type SoundPatch = 'piano' | 'musicbox' | 'strings' | 'organ'

export interface SoundCue {
  note: string
  duration: '2n' | '4n' | '8n'
  velocity: number
  patch: SoundPatch
  /** 播放下一音符前的等待时间；最后一个音符也会完整等待。 */
  waitMs: number
}

export interface SoundChallenge {
  id: string
  change: '音高' | '音色' | '力度' | '长短'
  prompt: string
  answer: SoundAnswer
  explanation: string
  cues: Record<SoundAnswer, readonly SoundCue[]>
}

const SOUND_WAIT_MS: Record<SoundCue['duration'], number> = {
  '2n': 1120,
  '4n': 620,
  '8n': 340,
}

function soundCue(
  note: string,
  duration: SoundCue['duration'] = '4n',
  patch: SoundPatch = 'piano',
  velocity = 0.72,
  waitMs = SOUND_WAIT_MS[duration]
): SoundCue {
  return { note, duration, patch, velocity, waitMs }
}

const SOUND_CHALLENGES: Record<ExperienceAgeBand, readonly SoundChallenge[]> = {
  'primary-1-2': [
    {
      id: 'low-pitch',
      change: '音高',
      prompt: '哪一段声音更高？',
      answer: 'b',
      explanation: '声音 B 的音高更高，像小鸟飞到树梢。',
      cues: {
        a: [soundCue('C4')],
        b: [soundCue('G4')],
      },
    },
    {
      id: 'low-length',
      change: '长短',
      prompt: '哪一段声音更长？',
      answer: 'a',
      explanation: '声音 A 延续得更久，听完后可以用手画一条长线。',
      cues: {
        a: [soundCue('E4', '2n', 'organ', 0.68, 1180)],
        b: [soundCue('E4', '8n', 'organ', 0.68, 360)],
      },
    },
    {
      id: 'low-timbre',
      change: '音色',
      prompt: '哪一段听起来更像铃铛？',
      answer: 'b',
      explanation: '声音 B 使用清亮的八音盒音色，尾音像小铃铛。',
      cues: {
        a: [soundCue('G4', '4n', 'strings')],
        b: [soundCue('G4', '4n', 'musicbox')],
      },
    },
  ],
  'primary-3-4': [
    {
      id: 'middle-pitch',
      change: '音高',
      prompt: '哪一段的音高向上跳进？',
      answer: 'b',
      explanation: '声音 B 从 C4 跳到 G4，音高向上跳进。',
      cues: {
        a: [soundCue('G4', '8n'), soundCue('E4', '8n')],
        b: [soundCue('C4', '8n'), soundCue('G4', '8n')],
      },
    },
    {
      id: 'middle-dynamic',
      change: '力度',
      prompt: '哪一段更有力度？',
      answer: 'a',
      explanation: '声音 A 的力度更强；注意听同一个音色的强弱变化。',
      cues: {
        a: [soundCue('E4', '8n', 'piano', 0.94), soundCue('G4', '8n', 'piano', 0.94)],
        b: [soundCue('E4', '8n', 'piano', 0.38), soundCue('G4', '8n', 'piano', 0.38)],
      },
    },
    {
      id: 'middle-timbre',
      change: '音色',
      prompt: '哪一段更像弦乐？',
      answer: 'a',
      explanation: '声音 A 的弦乐音色起音更柔和，声音 B 更像钢琴。',
      cues: {
        a: [soundCue('A4', '2n', 'strings')],
        b: [soundCue('A4', '2n', 'piano')],
      },
    },
  ],
  'primary-5-6': [
    {
      id: 'high-register',
      change: '音高',
      prompt: '哪一段的旋律线条整体向上？',
      answer: 'b',
      explanation: '声音 B 的三个音符连续向上走，形成更明显的上行线条。',
      cues: {
        a: [soundCue('G4', '8n'), soundCue('E4', '8n'), soundCue('D4', '8n')],
        b: [soundCue('C4', '8n'), soundCue('E4', '8n'), soundCue('G4', '8n')],
      },
    },
    {
      id: 'high-dynamic',
      change: '力度',
      prompt: '哪一段的强弱对比更明显？',
      answer: 'a',
      explanation: '声音 A 先轻后强，强弱变化让句子更有表情。',
      cues: {
        a: [soundCue('C4', '4n', 'strings', 0.34), soundCue('G4', '4n', 'strings', 0.94)],
        b: [soundCue('C4', '4n', 'strings', 0.62), soundCue('G4', '4n', 'strings', 0.62)],
      },
    },
    {
      id: 'high-timbre',
      change: '音色',
      prompt: '哪一段的音色更适合表现水面闪光？',
      answer: 'b',
      explanation: '声音 B 的八音盒颗粒更清脆，能突出闪烁的感觉。',
      cues: {
        a: [soundCue('A4', '4n', 'strings')],
        b: [soundCue('A4', '4n', 'musicbox')],
      },
    },
  ],
}

export interface AuditionDecision<T> {
  choice: T | null
  confirmed: boolean
  correct: boolean | null
}

export function createAuditionDecision<T>(): AuditionDecision<T> {
  return { choice: null, confirmed: false, correct: null }
}

/** 试听只更新当前选择，并清除上一轮判定。 */
export function auditionChoice<T>(choice: T): AuditionDecision<T> {
  return { choice, confirmed: false, correct: null }
}

/** 只有显式确认才会产生判定；未选择时维持原状态。 */
export function confirmAuditionChoice<T>(
  current: AuditionDecision<T>,
  evaluate?: (choice: T) => boolean
): AuditionDecision<T> {
  if (current.choice === null) return current
  return {
    choice: current.choice,
    confirmed: true,
    correct: evaluate ? evaluate(current.choice) : null,
  }
}

/** 单调递增的播放令牌：新试听开始后，旧异步播放会立即失效。 */
export class PlaybackTokenGate {
  private currentToken = 0

  begin(): number {
    this.currentToken += 1
    return this.currentToken
  }

  cancel(): void {
    this.currentToken += 1
  }

  isCurrent(token: number): boolean {
    return this.currentToken === token
  }
}

export async function runSoundCueSequence(
  cues: readonly SoundCue[],
  token: number,
  gate: Pick<PlaybackTokenGate, 'isCurrent'>,
  prepareAudio: () => Promise<boolean>,
  emitCue: (cue: SoundCue) => void,
  pause: (milliseconds: number) => Promise<void>
): Promise<boolean> {
  try {
    const ready = await prepareAudio()
    if (!ready || !gate.isCurrent(token)) return false

    for (const cue of cues) {
      if (!gate.isCurrent(token)) return false
      emitCue(cue)
      await pause(cue.waitMs)
    }
    return gate.isCurrent(token)
  } catch {
    return false
  }
}

/** 学生、精确年级或活动任一变化，都应创建全新的探险实例。 */
export function buildExperienceInstanceKey(
  studentId: string | null | undefined,
  grade: number | null | undefined,
  activityId: string
): string {
  return `${studentId || 'guest'}:${grade ?? 'all'}:${activityId}`
}

/** 返回当前学段的三轮声音线索，复制数组避免调用方意外修改目录。 */
export function getSoundChallenges(ageBand: ExperienceAgeBand): SoundChallenge[] {
  return [...(SOUND_CHALLENGES[ageBand] ?? SOUND_CHALLENGES['primary-1-2'])]
}

export function evaluateSoundAnswer(
  challenge: Pick<SoundChallenge, 'answer'>,
  answer: SoundAnswer
): { correct: boolean; points: number } {
  const correct = challenge.answer === answer
  return { correct, points: correct ? 100 : 0 }
}

export interface RhythmScore {
  hits: number
  misses: number
  extras: number
  accuracy: number
  perfect: boolean
}

/** 比较目标节奏和学生输入；准确率按命中/(命中+漏拍+多拍)计算。 */
export function scoreRhythmInput(
  target: readonly boolean[],
  input: readonly boolean[]
): RhythmScore {
  const length = Math.max(target.length, input.length)
  let hits = 0
  let misses = 0
  let extras = 0
  for (let index = 0; index < length; index += 1) {
    const expected = Boolean(target[index])
    const actual = Boolean(input[index])
    if (expected && actual) hits += 1
    else if (expected) misses += 1
    else if (actual) extras += 1
  }
  const attempts = hits + misses + extras
  const accuracy = attempts === 0 ? 0 : hits / attempts
  return {
    hits,
    misses,
    extras,
    accuracy,
    perfect: target.length === input.length && misses === 0 && extras === 0,
  }
}

const RHYTHM_PATTERNS: Record<ExperienceAgeBand, readonly boolean[][]> = {
  'primary-1-2': [
    [true, false, true, false, true, false, true, false],
    [true, false, false, true, true, false, true, false],
    [true, false, true, true, false, true, false, true],
  ],
  'primary-3-4': [
    [true, false, false, true, true, false, true, false],
    [true, false, true, false, false, true, true, false],
    [true, false, true, true, false, false, true, true],
  ],
  'primary-5-6': [
    [true, false, true, false, false, true, true, false],
    [true, false, false, true, true, false, false, true],
    [true, false, true, true, false, true, false, true],
  ],
}

export function getRhythmPattern(ageBand: ExperienceAgeBand, round: number): boolean[] {
  const patterns = RHYTHM_PATTERNS[ageBand] ?? RHYTHM_PATTERNS['primary-1-2']
  const safeRound = Number.isFinite(round) ? Math.max(0, Math.floor(round)) : 0
  return [...patterns[safeRound % patterns.length]]
}

export interface CanvasMark {
  row: number
  column: number
  color: string
  shape: string
}

export function upsertCanvasMark(
  existing: readonly CanvasMark[],
  mark: CanvasMark,
  maxMarks = 12
): CanvasMark[] {
  const safeLimit = Number.isFinite(maxMarks) ? Math.max(1, Math.floor(maxMarks)) : 12
  const withoutCell = existing.filter(
    (item) => item.row !== mark.row || item.column !== mark.column
  )
  return [...withoutCell, mark].slice(-safeLimit)
}

export function undoCanvasMark(existing: readonly CanvasMark[]): CanvasMark[] {
  return existing.length > 0 ? existing.slice(0, -1) : []
}

export function canSubmitCanvas(existing: readonly CanvasMark[], minimum = 4): boolean {
  const safeMinimum = Number.isFinite(minimum) ? Math.max(1, Math.floor(minimum)) : 4
  return existing.length >= safeMinimum
}
