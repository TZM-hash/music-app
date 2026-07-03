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
    title: '学习主线',
    items: [
      { route: 'theory', icon: '📚', label: '分级乐理知识库' },
      { route: 'course', icon: '🧭', label: '完整课程路径' },
    ],
  },
  {
    title: '验证与素材',
    items: [
      { route: 'training', icon: '🎯', label: '专项练习中心' },
      { route: 'library', icon: '🎵', label: '曲库谱例' },
    ],
  },
  {
    title: '课堂管理',
    teacherOnly: true,
    items: [
      { route: 'class', icon: '👥', label: '学生档案' },
      { route: 'dashboard', icon: '📊', label: '教学评估' },
    ],
  },
]

export default function Sidebar() {
  const { route, navigate, mode } = useApp()

  return (
    <aside className="sidebar">
      <button className="side-logo" onClick={() => navigate('home')}>
        <span className="side-logo-icon">📚</span>
        <span className="side-logo-text">乐理课堂</span>
      </button>

      <nav className="side-nav">
        <button
          className={`side-item ${route === 'home' ? 'active' : ''}`}
          onClick={() => navigate('home')}
        >
          <span className="side-icon">🏠</span>
          <span className="side-label">学习工作台</span>
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

      <div className="side-foot">v0.5 · 分级乐理课程系统</div>
    </aside>
  )
}
