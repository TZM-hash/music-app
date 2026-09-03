import { useApp, type Route } from '../state/appState'
import { STUDENT_PRIMARY_NAV, STUDENT_SECONDARY_NAV } from './studentNavigation'

const TEACHER_ITEMS: Array<{ route: Route; icon: string; label: string; hint: string }> = [
  { route: 'class', icon: '👥', label: '学生档案', hint: '名单与个人记录' },
  { route: 'dashboard', icon: '📊', label: '成长观察', hint: '班级表现看板' },
]

export default function Sidebar() {
  const { route, navigate, mode } = useApp()
  const openMainRoute = (target: Route) => navigate(target, { history: 'reset' })

  return (
    <aside className="sidebar">
      <button className="side-logo" onClick={() => openMainRoute('home')}>
        <span className="side-logo-icon" aria-hidden="true">
          🎵
        </span>
        <span>
          <span className="side-logo-text">乐动课堂</span>
          <span className="side-logo-sub">课堂探索空间</span>
        </span>
      </button>

      <nav className="side-nav" aria-label="主导航">
        <div className="side-group side-primary-group">
          <div className="side-group-title">音乐空间</div>
          {STUDENT_PRIMARY_NAV.map((item) => (
            <button
              key={item.route}
              className={`side-item ${route === item.route ? 'active' : ''}`}
              onClick={() => openMainRoute(item.route)}
            >
              <span className="side-icon">{item.icon}</span>
              <span className="side-label">
                <b>{item.label}</b>
                <small>{item.hint}</small>
              </span>
            </button>
          ))}
        </div>

        <details className="side-more-group">
          <summary>更多入口</summary>
          <div className="side-more-list">
            {STUDENT_SECONDARY_NAV.map((item) => (
              <button
                key={item.route}
                className={`side-item ${route === item.route ? 'active' : ''}`}
                onClick={() => openMainRoute(item.route)}
              >
                <span className="side-icon">{item.icon}</span>
                <span className="side-label">
                  <b>{item.label}</b>
                  <small>{item.hint}</small>
                </span>
              </button>
            ))}
          </div>
        </details>

        {mode === 'teacher' && (
          <div className="side-group side-teacher-group">
            <div className="side-group-title">教师空间</div>
            {TEACHER_ITEMS.map((item) => (
              <button
                key={item.route}
                className={`side-item ${route === item.route ? 'active' : ''}`}
                onClick={() => openMainRoute(item.route)}
              >
                <span className="side-icon">{item.icon}</span>
                <span className="side-label">
                  <b>{item.label}</b>
                  <small>{item.hint}</small>
                </span>
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="side-foot">
        <span>v0.6</span>
        <b>互动课堂为学习主轴</b>
      </div>
    </aside>
  )
}
