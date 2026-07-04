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
    title: '学习主线',
    items: [
      { route: 'lesson', icon: '课', label: '课时模式', hint: '完整课堂流程' },
      { route: 'theory', icon: '谱', label: '乐理知识库', hint: '分级讲解与测验' },
      { route: 'course', icon: '阶', label: '课程路径', hint: '阶段化教学计划' },
      { route: 'training', icon: '练', label: '专项练习', hint: '节奏、听辨、识谱' },
    ],
  },
  {
    title: '演奏工坊',
    items: [
      { route: 'piano', icon: '琴', label: '钢琴示范', hint: '音高与和弦' },
      { route: 'drums', icon: '鼓', label: '架子鼓', hint: '节拍互动' },
      { route: 'mixer', icon: '混', label: '混音创编', hint: '编曲节奏格' },
      { route: 'recorder', icon: '笛', label: '竖笛指法', hint: '指法与旋律' },
    ],
  },
  {
    title: '素材与闯关',
    items: [
      { route: 'library', icon: '库', label: '曲库谱例', hint: '歌曲与百科素材' },
      { route: 'adventure', icon: '图', label: '能力进阶', hint: '成长地图' },
      { route: 'game-ear', icon: '听', label: '听觉训练', hint: '音程与和弦' },
      { route: 'game-taiko', icon: '拍', label: '节奏反应', hint: '双键节奏游戏' },
      { route: 'game-sing', icon: '唱', label: '视唱训练', hint: '音准反馈' },
      { route: 'game-read', icon: '读', label: '识谱训练', hint: '音符位置' },
    ],
  },
  {
    title: '课堂管理',
    teacherOnly: true,
    items: [
      { route: 'class', icon: '班', label: '学生档案', hint: '名单与个人记录' },
      { route: 'dashboard', icon: '评', label: '教学评估', hint: '班级表现看板' },
    ],
  },
]

export default function Sidebar() {
  const { route, navigate, mode } = useApp()

  return (
    <aside className="sidebar">
      <button className="side-logo" onClick={() => navigate('home')}>
        <span className="side-logo-icon" aria-hidden="true">
          ♪
        </span>
        <span>
          <span className="side-logo-text">乐动课堂</span>
          <span className="side-logo-sub">Music Lab</span>
        </span>
      </button>

      <nav className="side-nav" aria-label="主导航">
        <button
          className={`side-item ${route === 'home' ? 'active' : ''}`}
          onClick={() => navigate('home')}
        >
          <span className="side-icon">台</span>
          <span className="side-label">
            <b>学习工作台</b>
            <small>今日任务与快捷入口</small>
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
                  onClick={() => navigate(item.route)}
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
        <b>轻量音乐教学工作台</b>
      </div>
    </aside>
  )
}
