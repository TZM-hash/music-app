import { useApp, Route } from '../state/appState'
import StudentSelector from './StudentSelector'

const ROUTE_TITLE: Record<Route, string> = {
  home: '学习工作台',
  lesson: '课时模式',
  course: '课程路径',
  training: '专项练习',
  adventure: '能力进阶',
  piano: '钢琴示范',
  drums: '架子鼓',
  mixer: '混音创编',
  recorder: '竖笛指法',
  'game-ear': '听觉训练',
  'game-taiko': '节奏反应',
  'game-sing': '视唱训练',
  'game-read': '识谱训练',
  library: '曲库谱例',
  theory: '乐理知识库',
  class: '学生档案',
  dashboard: '教学评估',
}

const MODE_LABEL = {
  teacher: '教师',
  lecture: '讲解',
  student: '学生',
} as const

export default function TopBar() {
  const { mode, route, showNoteNames, setMode, toggleNoteNames, toggleSidebar } = useApp()
  const isInstrument = route === 'piano' || route === 'drums'

  return (
    <header className="topbar">
      <button className="hamburger" onClick={toggleSidebar} aria-label="打开菜单">
        <span />
        <span />
        <span />
      </button>

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

      {mode !== 'lecture' && <StudentSelector />}

      <div className="seg" title={`当前模式：${MODE_LABEL[mode]}`}>
        <button className={mode === 'teacher' ? 'on' : ''} onClick={() => setMode('teacher')}>
          教师
        </button>
        <button className={mode === 'lecture' ? 'on' : ''} onClick={() => setMode('lecture')}>
          讲解
        </button>
        <button className={mode === 'student' ? 'on' : ''} onClick={() => setMode('student')}>
          学生
        </button>
      </div>

      <button
        className="toolbtn"
        onClick={() => document.documentElement.requestFullscreen?.()}
        title="投屏全屏"
      >
        全屏
      </button>
    </header>
  )
}
