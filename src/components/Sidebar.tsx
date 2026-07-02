import { useApp, Route } from '../state/appState'

interface NavItem {
  route: Route
  icon: string
  label: string
}

interface NavGroup {
  title: string
  items: NavItem[]
  teacherOnly?: boolean
}

const GROUPS: NavGroup[] = [
  {
    title: '乐器',
    items: [
      { route: 'piano', icon: '🎹', label: '虚拟钢琴' },
      { route: 'drums', icon: '🥁', label: '架子鼓' },
      { route: 'recorder', icon: '🎵', label: '竖笛' },
      { route: 'mixer', icon: '🎛️', label: '混音器' },
    ],
  },
  {
    title: '游戏',
    items: [
      { route: 'game-taiko', icon: '🥁', label: '咚咔鼓手' },
      { route: 'game-sing', icon: '🎤', label: '唱歌评分' },
      { route: 'game-rhythm', icon: '🕺', label: '节奏回响' },
      { route: 'game-ear', icon: '👂', label: '听音辨调' },
      { route: 'game-read', icon: '🎼', label: '识谱训练' },
    ],
  },
  {
    title: '曲目',
    items: [
      { route: 'library', icon: '🎵', label: '曲库' },
      { route: 'theory', icon: '📖', label: '乐理知识' },
    ],
  },
  {
    title: '班级',
    teacherOnly: true,
    items: [
      { route: 'class', icon: '👥', label: '学生名册' },
      { route: 'dashboard', icon: '📊', label: '数据看板' },
    ],
  },
]

export default function Sidebar() {
  const { route, navigate, mode } = useApp()

  return (
    <aside className="sidebar">
      <button className="side-logo" onClick={() => navigate('home')}>
        <span className="side-logo-icon">🎹</span>
        <span className="side-logo-text">乐动课堂</span>
      </button>

      <nav className="side-nav">
        <button
          className={`side-item ${route === 'home' ? 'active' : ''}`}
          onClick={() => navigate('home')}
        >
          <span className="side-icon">🏠</span>
          <span className="side-label">工作台</span>
        </button>

        {GROUPS.map((g) => {
          if (g.teacherOnly && mode !== 'teacher') return null
          return (
            <div key={g.title} className="side-group">
              <div className="side-group-title">{g.title}</div>
              {g.items.map((it) => (
                <button
                  key={it.route}
                  className={`side-item ${route === it.route ? 'active' : ''}`}
                  onClick={() => navigate(it.route)}
                >
                  <span className="side-icon">{it.icon}</span>
                  <span className="side-label">{it.label}</span>
                </button>
              ))}
            </div>
          )
        })}
      </nav>

      <div className="side-foot">v0.3 · 数智音乐教学</div>
    </aside>
  )
}
