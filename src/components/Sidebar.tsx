import { useApp, Route } from '../state/appState'

interface NavItem {
  route: Route
  icon: string
  label: string
  hint?: string
}

interface NavGroup {
  title: string
  items: NavItem[]
  teacherOnly?: boolean
}

const GROUPS: NavGroup[] = [
  {
    title: '学习主轴',
    items: [
      { route: 'lesson', icon: '📖', label: '互动课堂', hint: '听玩创一节课' },
    ],
  },
  {
    title: '工具与乐器',
    items: [
      { route: 'theory', icon: '🎵', label: '音乐探索馆', hint: '分级发现与挑战' },
      { route: 'training', icon: '🎯', label: '挑战中心', hint: '听辨、读谱、跟唱、节奏' },
      { route: 'piano', icon: '🎹', label: '钢琴', hint: '音高、音阶与和弦' },
      { route: 'drums', icon: '🥁', label: '架子鼓', hint: '节拍互动' },
      { route: 'mixer', icon: '🎛️', label: '混音创作', hint: '编曲节奏格' },
      { route: 'recorder', icon: '🪈', label: '竖笛', hint: '指法与旋律' },
      { route: 'xylophone', icon: '🎶', label: '木琴', hint: '清脆打击旋律' },
    ],
  },
  {
    title: '素材与记录',
    items: [
      { route: 'library', icon: '📚', label: '素材库', hint: '歌曲与故事素材' },
      { route: 'course', icon: '🗺️', label: '学段总览', hint: '各学段目标与进度' },
      { route: 'adventure', icon: '🏝️', label: '闯关地图', hint: '音乐岛成长路线' },
    ],
  },
  {
    title: '班级陪伴',
    teacherOnly: true,
    items: [
      { route: 'class', icon: '👥', label: '学生档案', hint: '名单与个人记录' },
      { route: 'dashboard', icon: '📊', label: '成长观察', hint: '班级表现看板' },
    ],
  },
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
        <button
          className={`side-item ${route === 'home' ? 'active' : ''}`}
          onClick={() => openMainRoute('home')}
        >
          <span className="side-icon">🏠</span>
          <span className="side-label">
            <b>今日探索</b>
            <small>推荐路线与最近记录</small>
          </span>
        </button>

        {GROUPS.map((group) => {
          if (group.teacherOnly && mode !== 'teacher') return null
          return (
            <div key={group.title} className="side-group">
              <div className="side-group-title">{group.title}</div>
              {group.items.map((item) => (
                <button
                  key={item.route}
                  className={`side-item ${route === item.route ? 'active' : ''}`}
                  onClick={() => openMainRoute(item.route)}
                >
                  <span className="side-icon">{item.icon}</span>
                  <span className="side-label">
                    <b>{item.label}</b>
                    {item.hint && <small>{item.hint}</small>}
                  </span>
                </button>
              ))}
            </div>
          )
        })}
      </nav>

      <div className="side-foot">
        <span>v0.6</span>
        <b>互动课堂为学习主轴</b>
      </div>
    </aside>
  )
}
