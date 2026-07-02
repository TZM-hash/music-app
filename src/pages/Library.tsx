import { useMemo, useState } from 'react'
import { CATEGORY_INFO, SongCategory, Song } from '../music/songs'
import { allSongs, upsertCustomSong, newSongId, parseJianpu } from '../music/songLibrary'
import { ensureAudio, playNote } from '../music/audioEngine'
import { useApp } from '../state/appState'
import StaffView from '../components/StaffView'
import './library.css'

type Filter = SongCategory | 'all'

let previewTimer = 0

export default function Library() {
  const { playSongInGame } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [maxLevel, setMaxLevel] = useState(5)
  const [version, setVersion] = useState(0) // 触发重新读取
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [scoreSong, setScoreSong] = useState<Song | null>(null)
  const [scoreMode, setScoreMode] = useState<'staff' | 'jianpu'>('staff')
  const [showImport, setShowImport] = useState(false)
  const [impTitle, setImpTitle] = useState('')
  const [impText, setImpText] = useState('')
  const [impBpm, setImpBpm] = useState(100)

  const songs = useMemo(() => allSongs(), [version])

  const filtered = songs.filter((s) => {
    if (filter !== 'all' && s.category !== filter) return false
    if (s.level > maxLevel) return false
    if (search && !s.title.includes(search)) return false
    return true
  })

  const preview = async (song: Song) => {
    await ensureAudio()
    window.clearTimeout(previewTimer)
    setPreviewing(song.id)
    const spb = 60 / song.bpm
    let t = 0
    song.melody.forEach((n) => {
      if (n.note !== 'rest') {
        window.setTimeout(() => playNote(n.note, '8n'), t * 1000)
      }
      t += n.beats * spb
    })
    previewTimer = window.setTimeout(() => setPreviewing(null), t * 1000)
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: songs.length }
    for (const s of songs) c[s.category] = (c[s.category] ?? 0) + 1
    return c
  }, [songs])

  const importPreview = useMemo(() => parseJianpu(impText), [impText])

  const doImport = () => {
    const melody = parseJianpu(impText)
    if (melody.length === 0) return
    const song: Song = {
      id: newSongId(),
      title: impTitle.trim() || '导入曲目',
      category: 'custom',
      level: 2,
      bpm: impBpm,
      beatsPerBar: 4,
      melody,
      custom: true,
      desc: '教师导入',
    }
    upsertCustomSong(song)
    setShowImport(false)
    setImpTitle('')
    setImpText('')
    setVersion((v) => v + 1)
  }

  return (
    <div className="library">
      <div className="lib-header card">
        <div className="lib-search">
          <input
            placeholder="🔍 搜索曲目名称…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="lib-level">
          <span>难度上限：{'★'.repeat(maxLevel)}</span>
          <input
            type="range"
            min={1}
            max={5}
            value={maxLevel}
            onChange={(e) => setMaxLevel(Number(e.target.value))}
          />
        </div>
        <button className="lib-new" onClick={() => setShowImport(true)}>
          ＋ 导入曲目
        </button>
      </div>

      <div className="lib-tabs">
        <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
          🎼 全部 <span className="tab-count">{counts.all ?? 0}</span>
        </button>
        {(Object.keys(CATEGORY_INFO) as SongCategory[]).map((cat) => (
          <button
            key={cat}
            className={filter === cat ? 'on' : ''}
            onClick={() => setFilter(cat)}
            style={filter === cat ? { background: CATEGORY_INFO[cat].color } : undefined}
          >
            {CATEGORY_INFO[cat].icon} {CATEGORY_INFO[cat].name}
            <span className="tab-count">{counts[cat] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="song-grid">
        {filtered.length === 0 && <div className="lib-empty">没有匹配的曲目，换个筛选试试～</div>}
        {filtered.map((song) => {
          const cat = CATEGORY_INFO[song.category]
          return (
            <div key={song.id} className="song-card card">
              <div className="song-card-top" style={{ background: cat.color }}>
                <span className="song-cat-icon">{cat.icon}</span>
                {song.custom && <span className="song-custom-tag">我的创作</span>}
              </div>
              <div className="song-card-body">
                <h3>{song.title}</h3>
                <div className="song-meta">
                  <span>{'★'.repeat(song.level)}</span>
                  <span>· {song.bpm} BPM</span>
                  <span>· {song.melody.length} 音</span>
                </div>
                {song.desc && <p className="song-desc">{song.desc}</p>}
                <div className="song-actions">
                  <button
                    className={`sa-btn ${previewing === song.id ? 'playing' : ''}`}
                    onClick={() => preview(song)}
                  >
                    {previewing === song.id ? '🎵 播放中' : '▶ 试听'}
                  </button>
                  <button className="sa-btn" onClick={() => setScoreSong(song)}>
                    🎼 乐谱
                  </button>
                  <button
                    className="sa-btn primary"
                    onClick={() => playSongInGame(song.id, 'game-taiko')}
                  >
                    🎯 练习
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {scoreSong && (
        <div className="score-overlay" onClick={() => setScoreSong(null)}>
          <div className="score-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="score-modal-head">
              <h3>
                {CATEGORY_INFO[scoreSong.category].icon} {scoreSong.title}
              </h3>
              <div className="score-mode-seg">
                <button
                  className={scoreMode === 'staff' ? 'on' : ''}
                  onClick={() => setScoreMode('staff')}
                >
                  五线谱
                </button>
                <button
                  className={scoreMode === 'jianpu' ? 'on' : ''}
                  onClick={() => setScoreMode('jianpu')}
                >
                  简谱
                </button>
              </div>
              <button className="score-close" onClick={() => setScoreSong(null)}>
                ✕
              </button>
            </div>
            <div className="score-body">
              <StaffView melody={scoreSong.melody} mode={scoreMode} beatsPerBar={scoreSong.beatsPerBar} />
            </div>
            <div className="score-foot">
              <button className="sa-btn" onClick={() => preview(scoreSong)}>
                ▶ 试听
              </button>
              <button
                className="sa-btn primary"
                onClick={() => playSongInGame(scoreSong.id, 'game-taiko')}
              >
                🎯 去练习
              </button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="score-overlay" onClick={() => setShowImport(false)}>
          <div className="score-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="score-modal-head">
              <h3>＋ 导入曲目（粘贴简谱）</h3>
              <button className="score-close" onClick={() => setShowImport(false)}>
                ✕
              </button>
            </div>
            <div className="import-body">
              <input
                className="imp-title"
                placeholder="曲目名称"
                value={impTitle}
                onChange={(e) => setImpTitle(e.target.value)}
              />
              <label className="imp-bpm">
                速度 {impBpm} BPM
                <input
                  type="range"
                  min={60}
                  max={180}
                  value={impBpm}
                  onChange={(e) => setImpBpm(Number(e.target.value))}
                />
              </label>
              <textarea
                className="imp-text"
                placeholder="粘贴简谱数字，例如：&#10;1 1 5 5 6 6 5 | 4 4 3 3 2 2 1&#10;&#10;规则：1-7 是音符，0 是休止；数字后加 . 升八度、加 , 降八度；加 - 延长一拍、加 _ 变八分音符；| 或空格分隔。"
                value={impText}
                onChange={(e) => setImpText(e.target.value)}
                rows={5}
              />
              <div className="imp-preview">
                <span className="imp-preview-label">预览（{importPreview.filter((n) => n.note !== 'rest').length} 音）：</span>
                {importPreview.length > 0 ? (
                  <StaffView melody={importPreview} mode="jianpu" beatsPerBar={4} />
                ) : (
                  <span className="imp-empty">还没有可识别的音符</span>
                )}
              </div>
            </div>
            <div className="score-foot">
              <button className="sa-btn" onClick={() => setShowImport(false)}>
                取消
              </button>
              <button className="sa-btn primary" disabled={importPreview.length === 0} onClick={doImport}>
                💾 保存到曲库
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
