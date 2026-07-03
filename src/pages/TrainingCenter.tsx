import { Route, useApp } from '../state/appState'
import { loadProgress } from '../state/progress'
import './training.css'

interface TrainingModule {
  id: string
  route: Route
  icon: string
  title: string
  former: string
  goal: string
  metrics: string[]
  level: string
  color: string
}

const MODULES: TrainingModule[] = [
  {
    id: 'aural',
    route: 'game-ear',
    icon: '👂',
    title: '音高关系练习',
    former: '听觉辨识',
    goal: '把音高、音程、和弦这些乐理概念转化成可听见的判断，建立稳定的调性感知。',
    metrics: ['正确率', '错题类型', '音程/和弦掌握'],
    level: 'L1-L3',
    color: '#2f9e44',
  },
  {
    id: 'reading',
    route: 'game-read',
    icon: '🎼',
    title: '谱面识读练习',
    former: '读谱训练',
    goal: '练习五线谱位置、谱号、唱名和简谱数字的对应，让抽象符号变成可读的音乐信息。',
    metrics: ['音位正确率', '谱号适应', '线间错误'],
    level: 'L1-L3',
    color: '#f59f00',
  },
  {
    id: 'intonation',
    route: 'game-sing',
    icon: '🎤',
    title: '音阶与视唱练习',
    former: '音准反馈',
    goal: '用目标旋律验证音阶、级进、跳进和稳定音的理解，观察偏高偏低并进行分句修正。',
    metrics: ['音准率', '偏高/偏低', '唱准音数'],
    level: 'L2-L4',
    color: '#d6336c',
  },
  {
    id: 'reaction',
    route: 'game-taiko',
    icon: '🥁',
    title: '节拍时值练习',
    former: '节奏反应',
    goal: '把拍号、强弱拍、音符时值和休止这些节奏乐理落实到连续反应与节拍执行中。',
    metrics: ['反应准确率', '连击', '稳定完成度'],
    level: 'L2-L4',
    color: '#f25050',
  },
]

export default function TrainingCenter() {
  const { navigate } = useApp()
  const progress = loadProgress()

  return (
    <div className="training-page">
      <section className="training-head card">
        <div>
          <span className="training-kicker">乐理练习验证</span>
          <h2>乐理专项练习中心</h2>
          <p>
            这里把听辨、读谱、视唱和节拍反应整理成乐理知识的练习验证模块。
            每个模块都对应一个知识方向，帮助学生把“看懂、听懂、唱准、打稳”连接起来。
          </p>
        </div>
      </section>

      <div className="training-grid">
        {MODULES.map((m) => {
          const best = progress.bestScores[m.route] ?? 0
          return (
            <button key={m.id} className="training-card card" onClick={() => navigate(m.route)}>
              <div className="training-card-top">
                <span className="training-icon" style={{ background: m.color }}>
                  {m.icon}
                </span>
                <span className="training-level">{m.level}</span>
              </div>
              <h3>{m.title}</h3>
              <small>原模块：{m.former}</small>
              <p>{m.goal}</p>
              <div className="metric-row">
                {m.metrics.map((metric) => (
                  <span key={metric}>{metric}</span>
                ))}
              </div>
              <div className="training-foot">
                <b>{best > 0 ? `最高分 ${best}` : '尚未练习'}</b>
                <span>开始训练</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
