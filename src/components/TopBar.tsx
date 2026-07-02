import { useApp, Route } from '../state/appState'
import StudentSelector from './StudentSelector'

const ROUTE_TITLE: Record<Route, string> = {
  home: '工作台',
  piano: '虚拟钢琴',
  drums: '架子鼓',
  mixer: '混音器',
  recorder: '竖笛',
  'game-rhythm': '节奏回响',
  'game-ear': '听音辨调',
  'game-taiko': '咚咔鼓手',
  'game-sing': '唱歌评分',
  'game-read': '识谱训练',
  library: '曲库',
  theory: '乐理知识',
  class: '学生名册',
  dashboard: '数据看板',
}

export default function TopBar() {
  const { mode, route, showNoteNames, setMode, toggleNoteNames, toggleSidebar } = useApp()
  const isInstrument = route === 'piano' || route === 'drums'

  return (
    <div className="topbar">
      <button className="hamburger" onClick={toggleSidebar} aria-label="菜单">
        ☰
      </button>
      <div className="breadcrumb">
        <span className="crumb-home">乐动课堂</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{ROUTE_TITLE[route]}</span>
      </div>

      <div className="spacer" />

      {isInstrument && (
        <button
          className={`toolbtn ${showNoteNames ? 'active' : ''}`}
          onClick={toggleNoteNames}
        >
          {showNoteNames ? '🏷️ 音名 开' : '🏷️ 音名 关'}
        </button>
      )}

      <StudentSelector />

      <div className="seg" title="使用模式">
        <button className={mode === 'teacher' ? 'on' : ''} onClick={() => setMode('teacher')}>
          👩‍🏫 教师
        </button>
        <button className={mode === 'student' ? 'on' : ''} onClick={() => setMode('student')}>
          🎒 学生
        </button>
      </div>

      <button
        className="toolbtn"
        onClick={() => document.documentElement.requestFullscreen?.()}
        title="投屏全屏"
      >
        ⛶ 全屏
      </button>
    </div>
  )
}
