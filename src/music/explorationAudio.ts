import { BUILTIN_SONGS, type MelodyNote } from './songs'

export type ExplorationPatch = 'piano' | 'musicbox' | 'strings'

export interface ExplorationCue {
  note: string
  beats: number
  velocity: number
  patch: ExplorationPatch
}

export type ExplorationCueVariant = 'flowing' | 'jumping'

const DEFAULT_VELOCITY = 0.8
const DEFAULT_PATCH: ExplorationPatch = 'piano'
const EVIDENCE_LENGTH = 8

// These are short, original classroom demonstration motifs. They are listening
// prompts for comparing musical clues, not recordings or transcriptions of the
// referenced works.
const EXPLORATION_MELODIES: Record<string, MelodyNote[]> = {
  'spring-festival-overture': [
    { note: 'E4', beats: 0.5 }, { note: 'G4', beats: 0.5 }, { note: 'A4', beats: 1 },
    { note: 'C5', beats: 1 }, { note: 'A4', beats: 1 }, { note: 'G4', beats: 0.5 },
    { note: 'A4', beats: 0.5 }, { note: 'C5', beats: 1 }, { note: 'D5', beats: 1 },
    { note: 'C5', beats: 2 },
  ],
  'jiangnan-sizhu': [
    { note: 'D4', beats: 1 }, { note: 'G4', beats: 1 }, { note: 'A4', beats: 0.5 },
    { note: 'B4', beats: 0.5 }, { note: 'A4', beats: 1 }, { note: 'G4', beats: 1 },
    { note: 'E4', beats: 1 }, { note: 'G4', beats: 1 }, { note: 'A4', beats: 1 },
    { note: 'G4', beats: 2 },
  ],
  'yue-opera': [
    { note: 'G4', beats: 1 }, { note: 'A4', beats: 0.5 }, { note: 'B4', beats: 0.5 },
    { note: 'A4', beats: 1.5 }, { note: 'G4', beats: 0.5 }, { note: 'E4', beats: 1 },
    { note: 'D4', beats: 0.5 }, { note: 'E4', beats: 0.5 }, { note: 'G4', beats: 2 },
  ],
  'liang-zhu': [
    { note: 'E4', beats: 1 }, { note: 'E4', beats: 1 }, { note: 'G4', beats: 1 },
    { note: 'E4', beats: 1 }, { note: 'A4', beats: 1 }, { note: 'A4', beats: 1 },
    { note: 'C5', beats: 2 }, { note: 'A4', beats: 1 }, { note: 'G4', beats: 1 },
  ],
  'dragon-boat-rhythm': [
    { note: 'C4', beats: 1 }, { note: 'C4', beats: 1 }, { note: 'G4', beats: 1 },
    { note: 'C4', beats: 1 }, { note: 'C4', beats: 1 }, { note: 'G4', beats: 1 },
    { note: 'A4', beats: 1 }, { note: 'G4', beats: 1 }, { note: 'C5', beats: 2 },
  ],
}

const EXPLORATION_UNIT_SONGS: Record<string, string> = {
  jasmine: 'jasmine',
  'spring-festival-overture': 'spring-festival-overture',
  'jiangnan-sizhu': 'jiangnan-sizhu',
  'yue-opera': 'yue-opera',
  'liang-zhu': 'liang-zhu',
  'dragon-boat-rhythm': 'dragon-boat-rhythm',
}

function copyCue(cue: ExplorationCue): ExplorationCue {
  return { ...cue }
}

function findSong(songId: string) {
  return BUILTIN_SONGS.find((song) => song.id === songId)
}

export function getSongMelody(songId: string): ExplorationCue[] {
  const song = findSong(songId)
  const melody = song?.melody ?? EXPLORATION_MELODIES[songId]
  if (!melody) return []

  return melody
    .filter((cue) => cue.note !== 'rest')
    .map((cue) => ({
      note: cue.note,
      beats: cue.beats,
      velocity: DEFAULT_VELOCITY,
      patch: DEFAULT_PATCH,
    }))
}

export function getSongFragment(songId: string, start: number, end: number): ExplorationCue[] {
  const melody = getSongMelody(songId)
  const boundedStart = Math.max(0, Math.trunc(start))
  const boundedEnd = Math.min(melody.length, Math.trunc(end))
  if (boundedEnd < boundedStart) return []
  return melody.slice(boundedStart, boundedEnd).map(copyCue)
}

export function getEvidenceVariant(
  unitId: string,
  variant: ExplorationCueVariant
): ExplorationCue[] {
  const songId = EXPLORATION_UNIT_SONGS[unitId] ?? 'jasmine'
  const flowing = getSongFragment(songId, 0, EVIDENCE_LENGTH)
  if (variant === 'flowing') return flowing
  if (variant !== 'jumping') return flowing

  const jumpingNotes = ['E4', 'C5', 'G4', 'C5', 'E4', 'A4', 'C5', 'E4']
  return flowing.map((cue, index) => ({
    ...cue,
    note: jumpingNotes[index] ?? cue.note,
    patch: 'strings',
  }))
}

export function getCueDurationMs(cue: ExplorationCue, bpm: number): number {
  const safeBpm = Number.isFinite(bpm) && bpm > 0 ? bpm : 60
  const beats = Math.max(0.125, cue.beats)
  return (60000 / safeBpm) * beats
}
