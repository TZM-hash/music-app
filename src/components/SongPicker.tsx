import { useMemo, useState } from 'react'
import { allSongs } from '../music/songLibrary'
import { CATEGORY_INFO, SongCategory, Song } from '../music/songs'
import { ensureAudio } from '../music/audioEngine'
import { useMelodyPreview } from '../hooks/useMelodyPreview'
import { useMounted } from '../hooks/useTimers'
import './songPicker.css'

interface DifficultyOption {
  level: number
  name: string
}

interface Props {
  /** 标题，如 "🥁 太鼓达人" */
  title: string
  /** 简介 */
  intro: string
  /** 难度选项 */
  difficulties: DifficultyOption[]
  /** 当前难度 */
  difficulty: number
  onDifficulty: (level: number) => void
  /** 只保留旋律长度 >= n 的曲子 */
  minMelody?: number
  /** 最高分 */
  best?: number
  /** 选定曲目并开始 */
  onStart: (song: Song) => void
  /** 初始选中曲目 id */
  initialSongId?: string | null
}

export default function SongPicker({
  title,
  intro,
  difficulties,
  difficulty,
  onDifficulty,
  minMelody = 1,
  best = 0,
  onStart,
  initialSongId,
}: Props) {
  const songs = useMemo(
    () => allSongs().filter((s) => s.melody.filter((n) => n.note !== 'rest').length >= minMelody),
    [minMelody]
  )
  const [cat, setCat] = useState<SongCategory | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string>(initialSongId ?? songs[0]?.id ?? '')
  const [previewing, setPreviewing] = useState<string | null>(null)
  // 统一的旋律试听：重复点击自动停掉上一段，切页自动静音
  const previewCtl = useMelodyPreview()
  const mounted = useMounted()

  const filtered = songs.filter((s) => cat === 'all' || s.category === cat)
  const selected = songs.find((s) => s.id === selectedId) ?? filtered[0] ?? songs[0]

  const preview = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation()
    await ensureAudio()
    if (!mounted.current) return
    // 再点同一首 = 停止；点另一首 = 先停上一段再放（绝不叠加）
    if (previewing === song.id) {
      previewCtl.stop()
      setPreviewing(null)
      return
    }
    setPreviewing(song.id)
    previewCtl.play(song.melody, {
      bpm: song.bpm,
      maxNotes: 8,
      onEnd: () => setPreviewing((cur) => (cur === song.id ? null : cur)),
    })
  }

  return (
    <div className="song-picker">
      <div className="picker-head">
        <h2>{title}</h2>
        <p>{intro}</p>
        {best > 0 && <p className="picker-best">🏆 最高分 {best}</p>}
      </div>

      <div className="picker-body">
        {/* 左侧：选曲 */}
        <div className="picker-songs">
          <div className="picker-cats">
            <button className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>
              全部
            </button>
            {(Object.keys(CATEGORY_INFO) as SongCategory[]).map((c) => (
              <button
                key={c}
                className={cat === c ? 'on' : ''}
                onClick={() => setCat(c)}
                style={cat === c ? { background: CATEGORY_INFO[c].color } : undefined}
              >
                {CATEGORY_INFO[c].icon} {CATEGORY_INFO[c].name}
              </button>
            ))}
          </div>

          <div className="picker-list">
            {filtered.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                aria-pressed={selectedId === s.id}
                className={`picker-song ${selectedId === s.id ? 'on' : ''}`}
                onClick={() => setSelectedId(s.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedId(s.id)
                  }
                }}
              >
                <span className="ps-icon" style={{ background: CATEGORY_INFO[s.category].color }}>
                  {CATEGORY_INFO[s.category].icon}
                </span>
                <span className="ps-info">
                  <b>
                    {s.custom ? '✏️ ' : ''}
                    {s.title}
                  </b>
                  <small>
                    {'★'.repeat(s.level)} · {s.bpm} BPM
                  </small>
                </span>
                <button
                  type="button"
                  className={`ps-preview ${previewing === s.id ? 'playing' : ''}`}
                  aria-label={previewing === s.id ? `停止试听 ${s.title}` : `试听 ${s.title}`}
                  onClick={(e) => preview(s, e)}
                >
                  {previewing === s.id ? '🎵' : '▶'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：难度 + 开始 */}
        <div className="picker-side">
          <div className="picker-selected card">
            <div className="sel-label">已选曲目</div>
            <div className="sel-title">
              {selected ? selected.title : '—'}
            </div>
            {selected && (
              <div className="sel-meta">
                {CATEGORY_INFO[selected.category].icon} {CATEGORY_INFO[selected.category].name} ·{' '}
                {'★'.repeat(selected.level)} · {selected.bpm} BPM ·{' '}
                {selected.melody.filter((n) => n.note !== 'rest').length} 音
              </div>
            )}
          </div>

          <div className="picker-diff">
            <div className="sel-label">选择难度</div>
            <div className="diff-btns">
              {difficulties.map((d) => (
                <button
                  key={d.level}
                  className={difficulty === d.level ? 'on' : ''}
                  onClick={() => onDifficulty(d.level)}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          <button
            className="picker-start"
            disabled={!selected}
            onClick={() => selected && onStart(selected)}
          >
            ▶ 开始游戏
          </button>
        </div>
      </div>
    </div>
  )
}
