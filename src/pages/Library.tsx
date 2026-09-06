import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORY_INFO, SongCategory, Song } from '../music/songs'
import { allSongs, upsertCustomSong, newSongId, parseJianpu } from '../music/songLibrary'
import { ensureAudio } from '../music/audioEngine'
import { useMelodyPreview } from '../hooks/useMelodyPreview'
import { useMounted } from '../hooks/useTimers'
import { useApp } from '../state/appState'
import {
  ENCYCLOPEDIA_CATEGORIES,
  filterEncyclopediaEntries,
  type EncyclopediaEntry,
  type EncyclopediaType,
} from '../music/encyclopedia'
import { filterTheoryTopics, THEORY_STAGES, getStageLabel, type TheoryStageId } from '../music/theoryCatalog'
import { getGradeLabel } from '../music/zhejiangCurriculum'
import { loadReviewBook, recordReviewAnswer, saveReviewBook } from '../state/theoryReview'
import StaffView from '../components/StaffView'
import PagePager, { type PagePagerItem } from '../components/PagePager'
import { getPageSlice } from '../components/presentation'
import './library.css'

type Filter = SongCategory | 'all'
type LibraryView = 'songs' | 'encyclopedia'
type EncyclopediaTypeFilter = EncyclopediaType | 'all'
type StageFilter = TheoryStageId | 'all'

const LIBRARY_PANEL_PAGES: readonly PagePagerItem[] = [
  { id: 'list', label: '选择素材', hint: '筛选并选择一条音乐素材' },
  { id: 'detail', label: '查看详情', hint: '试听、看谱或完成互动题' },
]

const ENCYCLOPEDIA_DETAIL_PAGES: readonly PagePagerItem[] = [
  { id: 'story', label: '认识故事', hint: '了解音乐家或作品背景' },
  { id: 'feature', label: '听见特点', hint: '抓住最重要的音乐特点' },
  { id: 'listening', label: '作品与听赏', hint: '查看代表作品和听赏线索' },
  { id: 'practice', label: '课堂要点', hint: '把发现带回课堂活动' },
  { id: 'quiz', label: '小测验', hint: '用一道题检验自己的发现' },
]

export default function Library() {
  const { playSongInGame, currentStudentId, mode, selectedGrade } = useApp()
  const [view, setView] = useState<LibraryView>('songs')
  const [filter, setFilter] = useState<Filter>('all')
  const [encyclopediaType, setEncyclopediaType] = useState<EncyclopediaTypeFilter>('all')
  const [encyclopediaStage, setEncyclopediaStage] = useState<StageFilter>('all')
  const [search, setSearch] = useState('')
  const [maxLevel, setMaxLevel] = useState(5)
  const [version, setVersion] = useState(0) // 触发重新读取
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [quizPicks, setQuizPicks] = useState<Record<string, number>>({})
  const [scoreSong, setScoreSong] = useState<Song | null>(null)
  const [scoreMode, setScoreMode] = useState<'staff' | 'jianpu'>('staff')
  const [showImport, setShowImport] = useState(false)
  const [impTitle, setImpTitle] = useState('')
  const [impText, setImpText] = useState('')
  const [impBpm, setImpBpm] = useState(100)
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [songPage, setSongPage] = useState(0)
  const [encyclopediaPage, setEncyclopediaPage] = useState(0)
  const [libraryPanel, setLibraryPanel] = useState(0)
  const [encyclopediaDetailPage, setEncyclopediaDetailPage] = useState(0)
  const [isDesktopPresentation, setIsDesktopPresentation] = useState(
    () => typeof window === 'undefined' || window.innerWidth > 900
  )
  const resultScrollRef = useRef<HTMLDivElement | null>(null)
  // 统一的旋律试听：重复点击自动停掉上一段，切页自动静音
  const previewCtl = useMelodyPreview()
  const mounted = useMounted()

  const resetResultScroll = () => {
    window.requestAnimationFrame(() => {
      resultScrollRef.current?.scrollTo({ top: 0, left: 0 })
    })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- version 自增作为缓存失效键：曲库变更后重读
  const songs = useMemo(() => allSongs(), [version])
  const gradeTopicIds = useMemo(
    () => new Set(filterTheoryTopics(selectedGrade ? { grade: selectedGrade } : {}).map((topic) => topic.id)),
    [selectedGrade]
  )
  const gradeSongs = useMemo(
    () => selectedGrade
      ? songs.filter((song) =>
          song.custom ||
          !song.relatedTopics ||
          song.relatedTopics.length === 0 ||
          song.relatedTopics.some((topicId) => gradeTopicIds.has(topicId))
        )
      : songs,
    [gradeTopicIds, selectedGrade, songs]
  )

  const filtered = useMemo(
    () =>
      gradeSongs.filter((s) => {
        if (filter !== 'all' && s.category !== filter) return false
        if (s.level > maxLevel) return false
        if (search && !s.title.includes(search)) return false
        return true
      }),
    [filter, gradeSongs, maxLevel, search]
  )

  const encyclopediaEntries = useMemo(
    () =>
      filterEncyclopediaEntries({
        type: encyclopediaType === 'all' ? undefined : encyclopediaType,
        stage: encyclopediaStage === 'all' ? undefined : encyclopediaStage,
        grade: selectedGrade ?? undefined,
        search,
      }),
    [encyclopediaStage, encyclopediaType, search, selectedGrade]
  )
  const songPageData = useMemo(() => getPageSlice(filtered, songPage, 5), [filtered, songPage])
  const songPagerItems = useMemo(
    () => Array.from({ length: songPageData.pageCount }, (_, index) => ({
      id: `song-page-${index}`,
      label: `${index + 1}`,
      hint: `第 ${index + 1} 页曲目`,
    })),
    [songPageData.pageCount]
  )
  const encyclopediaPageData = useMemo(
    () => getPageSlice(encyclopediaEntries, encyclopediaPage, 4),
    [encyclopediaEntries, encyclopediaPage]
  )
  const encyclopediaPagerItems = useMemo(
    () => Array.from({ length: encyclopediaPageData.pageCount }, (_, index) => ({
      id: `encyclopedia-page-${index}`,
      label: `${index + 1}`,
      hint: `第 ${index + 1} 页音乐故事`,
    })),
    [encyclopediaPageData.pageCount]
  )

  useEffect(() => {
    if (songPageData.pageIndex !== songPage) setSongPage(songPageData.pageIndex)
  }, [songPage, songPageData.pageIndex])

  useEffect(() => {
    if (encyclopediaPageData.pageIndex !== encyclopediaPage) {
      setEncyclopediaPage(encyclopediaPageData.pageIndex)
    }
  }, [encyclopediaPage, encyclopediaPageData.pageIndex])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)')
    const update = () => setIsDesktopPresentation(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const preview = async (song: Song) => {
    await ensureAudio()
    if (!mounted.current) return
    // 重复点击同一首 = 停止；点另一首自动停掉上一段，绝不叠加
    if (previewing === song.id) {
      previewCtl.stop()
      setPreviewing(null)
      return
    }
    setPreviewing(song.id)
    previewCtl.play(song.melody, {
      bpm: song.bpm,
      onEnd: () => setPreviewing((cur) => (cur === song.id ? null : cur)),
    })
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: gradeSongs.length }
    for (const s of gradeSongs) c[s.category] = (c[s.category] ?? 0) + 1
    return c
  }, [gradeSongs])

  const importPreview = useMemo(() => parseJianpu(impText), [impText])
  const selectedSong = useMemo(
    () => filtered.find((song) => song.id === selectedSongId) ?? filtered[0] ?? null,
    [filtered, selectedSongId]
  )
  const selectedEntry = useMemo(
    () => encyclopediaEntries.find((entry) => entry.id === selectedEntryId) ?? encyclopediaEntries[0] ?? null,
    [encyclopediaEntries, selectedEntryId]
  )
  const encyclopediaDetailParts = useMemo(
    () => selectedEntry?.detail?.split('\n\n') ?? [],
    [selectedEntry]
  )
  const encyclopediaDetailSections = useMemo(
    () => [
      encyclopediaDetailParts.slice(0, 1),
      encyclopediaDetailParts.slice(1, 2),
      encyclopediaDetailParts.slice(2, 5),
    ],
    [encyclopediaDetailParts]
  )
  const selectedSongCat = selectedSong ? CATEGORY_INFO[selectedSong.category] : null

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
    setSelectedSongId(song.id)
    setVersion((v) => v + 1)
  }

  const selectView = (nextView: LibraryView) => {
    setView(nextView)
    setSongPage(0)
    setEncyclopediaPage(0)
    setLibraryPanel(0)
    setEncyclopediaDetailPage(0)
    resetResultScroll()
  }

  const selectSongFilter = (nextFilter: Filter) => {
    setFilter(nextFilter)
    setSelectedSongId(null)
    setSongPage(0)
    setLibraryPanel(0)
    setEncyclopediaDetailPage(0)
    resetResultScroll()
  }

  const selectEncyclopediaType = (nextType: EncyclopediaTypeFilter) => {
    setEncyclopediaType(nextType)
    setSelectedEntryId(null)
    setEncyclopediaPage(0)
    setLibraryPanel(0)
    setEncyclopediaDetailPage(0)
    resetResultScroll()
  }

  const selectEncyclopediaStage = (nextStage: StageFilter) => {
    setEncyclopediaStage(nextStage)
    setSelectedEntryId(null)
    setEncyclopediaPage(0)
    setLibraryPanel(0)
    setEncyclopediaDetailPage(0)
    resetResultScroll()
  }

  const answerEncyclopediaQuiz = (entry: EncyclopediaEntry, questionIndex: number, selectedAnswer: number) => {
    const item = entry.quiz[questionIndex]
    const pickKey = `${entry.id}:${questionIndex}`
    if (quizPicks[pickKey] !== undefined) return
    setQuizPicks((current) => ({ ...current, [pickKey]: selectedAnswer }))
    if (mode !== 'lecture') {
      const book = loadReviewBook(currentStudentId ?? 'anonymous')
      saveReviewBook(
        recordReviewAnswer(book, {
          source: 'encyclopedia',
          itemId: entry.id,
          itemTitle: entry.title,
          category: entry.category,
          stage: entry.stage,
          question: item.question,
          options: item.options,
          correctAnswer: item.answer,
          selectedAnswer,
          explanation: item.explanation,
          timestamp: Date.now(),
        })
      )
    }
  }

  const renderEncyclopediaQuiz = (entry: EncyclopediaEntry) => (
    <div className="encyclopedia-quiz">
      {entry.quiz.slice(0, 1).map((q, questionIndex) => {
        const pickKey = `${entry.id}:${questionIndex}`
        const picked = quizPicks[pickKey]
        return (
          <div key={q.question}>
            <strong>{q.question}</strong>
            <div>
              {q.options.map((option, optionIndex) => {
                const answered = picked !== undefined
                const cls = answered
                  ? optionIndex === q.answer
                    ? 'right'
                    : optionIndex === picked
                      ? 'wrong'
                      : ''
                  : ''
                return (
                  <button
                    key={option}
                    className={cls}
                    disabled={answered}
                    onClick={() => answerEncyclopediaQuiz(entry, questionIndex, optionIndex)}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div
      className={`library library-${view} presentation-page library-presentation`}
      data-library-panel={libraryPanel}
    >
      <div className="lib-header card">
        <div className="lib-search">
          <input
            placeholder={view === 'songs' ? '🔍 搜索曲目名称…' : '🔍 搜索音乐故事或关键词…'}
            aria-label={view === 'songs' ? '搜索曲目名称' : '搜索音乐故事或关键词'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedSongId(null)
              setSelectedEntryId(null)
              setSongPage(0)
              setEncyclopediaPage(0)
              setEncyclopediaDetailPage(0)
              resetResultScroll()
            }}
            />
          </div>
        {selectedGrade && <span className="lib-scope-note">当前：{getGradeLabel(selectedGrade)}</span>}
        {view === 'songs' && (
          <div className="lib-level">
            <span>难度上限：{'★'.repeat(maxLevel)}</span>
            <input
              type="range"
              min={1}
              max={5}
              value={maxLevel}
              aria-label="难度上限"
              onChange={(e) => {
                setMaxLevel(Number(e.target.value))
                setSelectedSongId(null)
                resetResultScroll()
              }}
            />
          </div>
        )}
        {view === 'songs' && (
          <button className="lib-new" onClick={() => setShowImport(true)}>
            ＋ 导入曲目
          </button>
        )}
      </div>

      <div className="lib-view-tabs">
        <button className={view === 'songs' ? 'on' : ''} onClick={() => selectView('songs')}>
          曲库谱例 <span>{gradeSongs.length}</span>
        </button>
        <button className={view === 'encyclopedia' ? 'on' : ''} onClick={() => selectView('encyclopedia')}>
          音乐故事 <span>{encyclopediaEntries.length}</span>
        </button>
      </div>
      <PagePager
        items={LIBRARY_PANEL_PAGES}
        activeIndex={libraryPanel}
        onChange={setLibraryPanel}
        ariaLabel="素材库展示区域"
        compact
        className="library-panel-pager"
      />

      {view === 'songs' ? (
        <>
          <div className="lib-tabs">
            <button className={filter === 'all' ? 'on' : ''} onClick={() => selectSongFilter('all')}>
              🎼 全部 <span className="tab-count">{counts.all ?? 0}</span>
            </button>
            {(Object.keys(CATEGORY_INFO) as SongCategory[]).map((cat) => (
              <button
                key={cat}
                className={filter === cat ? 'on' : ''}
                onClick={() => selectSongFilter(cat)}
                style={filter === cat ? { background: CATEGORY_INFO[cat].color } : undefined}
              >
                {CATEGORY_INFO[cat].icon} {CATEGORY_INFO[cat].name}
                <span className="tab-count">{counts[cat] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="library-browser">
            <div className="library-list-column">
            <div className="library-list song-menu" ref={resultScrollRef}>
              {filtered.length === 0 && <div className="lib-empty">没有匹配的曲目，换个筛选试试～</div>}
              {songPageData.items.map((song) => {
                const cat = CATEGORY_INFO[song.category]
                const selected = selectedSong?.id === song.id
                return (
                  <button
                    key={song.id}
                    className={`song-menu-row ${selected ? 'active' : ''}`}
                    style={{ borderLeftColor: cat.color }}
                    onClick={() => {
                      setSelectedSongId(song.id)
                      setEncyclopediaDetailPage(0)
                      setLibraryPanel(1)
                    }}
                  >
                    <span className="song-menu-icon" style={{ background: cat.color }}>
                      {cat.icon}
                    </span>
                    <span className="song-menu-main">
                      <span className="song-menu-title">
                        <b>{song.title}</b>
                        {song.custom && <span className="song-custom-tag">我的创作</span>}
                      </span>
                      {song.desc && <small>{song.desc}</small>}
                    </span>
                    <span className="song-menu-meta">
                      <span>{cat.name}</span>
                      <span>{'★'.repeat(song.level)}</span>
                      <span>{song.bpm} BPM</span>
                      <span>{song.melody.length} 音</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <PagePager
              items={songPagerItems}
              activeIndex={songPageData.pageIndex}
              onChange={setSongPage}
              ariaLabel="曲目列表分页"
              compact
              showTabs={false}
            />
            </div>

            <aside className="library-detail card">
              {selectedSong && selectedSongCat ? (
                <>
                  <div className="library-detail-head">
                    <span className="course-kicker">当前曲目</span>
                    <div className="song-detail-title">
                      <span style={{ background: selectedSongCat.color }}>{selectedSongCat.icon}</span>
                      <div>
                        <h3>{selectedSong.title}</h3>
                        <p>{selectedSong.desc ?? '跟着旋律听一听，再试着拍一拍或演奏出来。'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="library-detail-meta">
                    <span><b>{selectedSongCat.name}</b><small>素材分类</small></span>
                    <span><b>{'★'.repeat(selectedSong.level)}</b><small>难度星级</small></span>
                    <span><b>{selectedSong.bpm}</b><small>BPM</small></span>
                    <span><b>{selectedSong.melody.length}</b><small>旋律音数</small></span>
                  </div>

                  <div className="detail-score-preview">
                    <StaffView melody={selectedSong.melody} mode="jianpu" beatsPerBar={selectedSong.beatsPerBar} />
                  </div>

                  <div className="song-actions library-detail-actions">
                    <button
                      className={`sa-btn ${previewing === selectedSong.id ? 'playing' : ''}`}
                      onClick={() => preview(selectedSong)}
                    >
                      {previewing === selectedSong.id ? '🎵 播放中' : '▶ 试听'}
                    </button>
                    <button className="sa-btn" onClick={() => setScoreSong(selectedSong)}>
                      🎼 乐谱
                    </button>
                    <button
                      className="sa-btn primary"
                      onClick={() => playSongInGame(selectedSong.id, 'game-taiko')}
                    >
                      🎯 挑战
                    </button>
                  </div>
                </>
              ) : (
                <div className="library-detail-empty">左侧选择一条素材，这里会出现可互动的详情。</div>
              )}
            </aside>
          </div>
        </>
      ) : (
        <>
          <div className="lib-tabs encyclopedia-tabs">
            <button className={encyclopediaType === 'all' ? 'on' : ''} onClick={() => selectEncyclopediaType('all')}>
              全部 <span className="tab-count">{encyclopediaEntries.length}</span>
            </button>
            {ENCYCLOPEDIA_CATEGORIES.map((cat) => (
              <button
                key={cat.type}
                className={encyclopediaType === cat.type ? 'on' : ''}
                onClick={() => selectEncyclopediaType(cat.type)}
              >
                {cat.label}
                <span className="tab-count">
                  {encyclopediaEntries.filter((entry) => entry.type === cat.type).length}
                </span>
              </button>
            ))}
          </div>
          <div className="encyclopedia-stage-row">
            <button className={encyclopediaStage === 'all' ? 'on' : ''} onClick={() => selectEncyclopediaStage('all')}>
              全学段
            </button>
            {THEORY_STAGES.map((stage) => (
              <button
                key={stage.id}
                className={encyclopediaStage === stage.id ? 'on' : ''}
                onClick={() => selectEncyclopediaStage(stage.id)}
              >
                {getStageLabel(stage.id)}
              </button>
            ))}
          </div>
          <div className="library-browser">
            <div className="library-list-column">
            <div className="library-list encyclopedia-menu" ref={resultScrollRef}>
              {encyclopediaEntries.length === 0 && <div className="lib-empty">没有匹配的音乐故事，换个筛选试试～</div>}
              {encyclopediaPageData.items.map((entry) => (
                <button
                  key={entry.id}
                  className={`encyclopedia-menu-row ${selectedEntry?.id === entry.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedEntryId(entry.id)
                    setEncyclopediaDetailPage(0)
                    setLibraryPanel(1)
                  }}
                >
                  <span className="encyclopedia-menu-main">
                    <span className="encyclopedia-menu-head">
                      <span>{entry.category}</span>
                      <small>{getStageLabel(entry.stage)}</small>
                    </span>
                    <b>{entry.title}</b>
                    <small>{entry.subtitle}</small>
                  </span>
                  <span className="encyclopedia-menu-summary">{entry.summary}</span>
                  <span className="related-count">相关发现 {entry.relatedTheoryIds.length} 个</span>
                </button>
              ))}
            </div>
            <PagePager
              items={encyclopediaPagerItems}
              activeIndex={encyclopediaPageData.pageIndex}
              onChange={setEncyclopediaPage}
              ariaLabel="音乐故事列表分页"
              compact
              showTabs={false}
            />
            </div>

            <aside className="library-detail card encyclopedia-detail">
              {selectedEntry ? (
                isDesktopPresentation ? (
                  <>
                    <PagePager
                      items={ENCYCLOPEDIA_DETAIL_PAGES}
                      activeIndex={encyclopediaDetailPage}
                      onChange={setEncyclopediaDetailPage}
                      ariaLabel="音乐故事详情分页"
                      compact
                      className="encyclopedia-detail-pager"
                    />
                    <div className="library-detail-head">
                      <span className="course-kicker">{selectedEntry.category} · {getStageLabel(selectedEntry.stage)}</span>
                      <h3>{selectedEntry.title}</h3>
                      <b>{selectedEntry.subtitle}</b>
                      <p>{selectedEntry.summary}</p>
                    </div>
                    <div className="encyclopedia-detail-pages" data-detail-page={encyclopediaDetailPage}>
                      <div className="encyclopedia-detail-story">
                        {encyclopediaDetailSections.map((section, pageIndex) => (
                          <div
                            key={`story-${pageIndex}`}
                            className="encyclopedia-detail-page"
                            data-detail-page-index={pageIndex}
                          >
                            {section.length > 0 && (
                              <div className="encyclopedia-detail-body">
                                {section.map((para, paragraphIndex) => (
                                  <p key={`${pageIndex}-${paragraphIndex}`}>{para}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="encyclopedia-detail-page" data-detail-page-index="3">
                        <div className="fact-list">
                          {selectedEntry.keyFacts.map((fact) => (
                            <span key={fact}>{fact}</span>
                          ))}
                        </div>
                        <div className="classroom-prompt">{selectedEntry.prompt}</div>
                        <small className="related-count">相关发现 {selectedEntry.relatedTheoryIds.length} 个</small>
                      </div>
                      <div className="encyclopedia-detail-page" data-detail-page-index="4">
                        {renderEncyclopediaQuiz(selectedEntry)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="library-detail-head">
                      <span className="course-kicker">{selectedEntry.category} · {getStageLabel(selectedEntry.stage)}</span>
                      <h3>{selectedEntry.title}</h3>
                      <b>{selectedEntry.subtitle}</b>
                      <p>{selectedEntry.summary}</p>
                    </div>
                    {selectedEntry.detail && (
                      <div className="encyclopedia-detail-body">
                        {selectedEntry.detail.split('\n\n').map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                    )}
                    <div className="fact-list">
                      {selectedEntry.keyFacts.map((fact) => (
                        <span key={fact}>{fact}</span>
                      ))}
                    </div>
                    <div className="classroom-prompt">{selectedEntry.prompt}</div>
                    <small className="related-count">相关发现 {selectedEntry.relatedTheoryIds.length} 个</small>
                    {renderEncyclopediaQuiz(selectedEntry)}
                  </>
                )
              ) : (
                <div className="library-detail-empty">左侧选择一个音乐故事，这里会出现可互动的详情。</div>
              )}
            </aside>
          </div>
        </>
      )}

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
                🎯 去挑战
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
                {impText.trim() && importPreview.length === 0 && (
                  <span className="imp-empty">⚠️ 未识别到有效音符：请检查格式（提示：八分和增时线不能混用，如 1_- 会被跳过）</span>
                )}
                {impText.trim() && importPreview.length > 0 && (
                  <button
                    type="button"
                    className="sa-btn"
                    onClick={async () => {
                      await ensureAudio()
                      if (!mounted.current) return
                      previewCtl.play(importPreview, { bpm: impBpm })
                    }}
                  >
                    ▶ 试听导入效果
                  </button>
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
