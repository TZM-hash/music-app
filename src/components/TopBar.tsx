import { useEffect, useState } from 'react'
import { useApp, Route } from '../state/appState'
import { ROUTE_LABELS } from '../state/navigationHistory'
import { setUISoundEnabled, isUISoundEnabled } from '../music/uiSounds'
import StudentSelector from './StudentSelector'

const ROUTE_TITLE: Record<Route, string> = ROUTE_LABELS

const MODE_LABEL = {
  teacher: '教师',
  lecture: '互动投屏',
  student: '学生',
} as const

export default function TopBar() {
  const {
    mode,
    route,
    showNoteNames,
    canGoBack,
    backLabel,
    setMode,
    toggleNoteNames,
    toggleSidebar,
    goBack,
  } = useApp()
  const isInstrument =
    route === 'piano' ||
    route === 'drums' ||
    route === 'xylophone' ||
    route === 'recorder'
  const [uiSoundOn, setUiSoundOn] = useState(isUISoundEnabled)
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && !!document.fullscreenElement
  )

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleUiSound = () => {
    setUiSoundOn((v) => {
      const next = !v
      setUISoundEnabled(next)
      return next
    })
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.()
    } else {
      void document.documentElement.requestFullscreen?.()
    }
  }

  return (
    <header className="topbar">
      <button className="hamburger" onClick={toggleSidebar} aria-label="打开菜单">
        <span />
        <span />
        <span />
      </button>

      {canGoBack && (
        <button className="backbtn" onClick={goBack} aria-label={backLabel}>
          <span aria-hidden="true">←</span>
          <span>{backLabel}</span>
        </button>
      )}

      <div className="breadcrumb" aria-label="当前位置">
        <span className="crumb-home">乐动课堂</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{ROUTE_TITLE[route]}</span>
      </div>

      <div className="topbar-pulse" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>

      <div className="spacer" />

      {isInstrument && (
        <button
          className={`toolbtn ${showNoteNames ? 'active' : ''}`}
          onClick={toggleNoteNames}
        >
          音名 {showNoteNames ? '开' : '关'}
        </button>
      )}

      <button
        className={`toolbtn ${uiSoundOn ? 'active' : ''}`}
        onClick={toggleUiSound}
        title={uiSoundOn ? '关闭交互音效' : '开启交互音效'}
      >
        {uiSoundOn ? '🔊 音效' : '🔇 音效'}
      </button>

      {mode !== 'lecture' && <StudentSelector />}

      <div className="seg" title={`当前模式：${MODE_LABEL[mode]}`}>
        <button className={mode === 'teacher' ? 'on' : ''} onClick={() => setMode('teacher')}>
          教师
        </button>
        <button className={mode === 'lecture' ? 'on' : ''} onClick={() => setMode('lecture')}>
          投屏
        </button>
        <button className={mode === 'student' ? 'on' : ''} onClick={() => setMode('student')}>
          学生
        </button>
      </div>

      <button
        className={`toolbtn ${isFullscreen ? 'active' : ''}`}
        onClick={toggleFullscreen}
        title={isFullscreen ? '退出全屏' : '投屏全屏'}
      >
        {isFullscreen ? '退出全屏' : '全屏'}
      </button>
    </header>
  )
}
