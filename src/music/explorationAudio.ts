import { BUILTIN_SONGS } from './songs'

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

function copyCue(cue: ExplorationCue): ExplorationCue {
  return { ...cue }
}

function findSong(songId: string) {
  return BUILTIN_SONGS.find((song) => song.id === songId)
}

export function getSongMelody(songId: string): ExplorationCue[] {
  const song = findSong(songId)
  if (!song) return []

  return song.melody
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
  const flowing = getSongFragment('jasmine', 0, EVIDENCE_LENGTH)
  if (unitId !== 'jasmine' || variant === 'flowing' || variant !== 'jumping') return flowing

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
