import { useApp, Route } from '../state/appState'
import StudentSelector from './StudentSelector'

const ROUTE_TITLE: Record<Route, string> = {
  home: '学习工作台',
  course: '完整课程路径',
  training: '专项练习中心',
  adventure: '能力进阶',
  piano: '钢琴示范',
  drums: '架子鼓',
  mixer: '混音器',
  recorder: '竖笛',
  'game-ear': '听觉辨识训练',
  'game-taiko': '节奏反应训练',
  'game-sing': '音准与视唱训练',
  'game-read': '读谱训练',
  library: '曲库谱例',
  theory: '分级乐理知识库',
  class: '学生档案',
  dashboard: '教学评估',
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
        <span className="crumb-home">乐理课堂</span>
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

      {mode !== 'lecture' && <StudentSelector />}

      <div className="seg" title="使用模式">
        <button className={mode === 'teacher' ? 'on' : ''} onClick={() => setMode('teacher')}>
          👩‍🏫 教师
        </button>
        <button className={mode === 'lecture' ? 'on' : ''} onClick={() => setMode('lecture')}>
          🖥️ 讲解
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
