import { useState } from 'react'
import { Route, useApp } from '../state/appState'
import { loadProgress } from '../state/progress'
import { ProgressRing, SpectrumBars } from '../components/Charts'
import '../components/charts.css'
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
  const [activeId, setActiveId] = useState(MODULES[0].id)
  const moduleSignals = MODULES.map((m) => ({
    label: m.former.slice(0, 2),
    value: progress.bestScores[m.route] ?? 0,
    color: m.color,
  }))
  const practicedCount = moduleSignals.filter((item) => item.value > 0).length
  const active = MODULES.find((m) => m.id === activeId) ?? MODULES[0]
  const activeBest = progress.bestScores[active.route] ?? 0
  const activeMetrics = active.metrics.map((metric, index) => ({
    label: metric.slice(0, 2),
    value: activeBest > 0 ? Math.max(12, activeBest - index * 14) : 16 + (active.metrics.length - index) * 6,
    color: active.color,
  }))

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

      <section className="training-lab-strip card">
        <div>
          <span className="training-kicker">能力信号站</span>
          <h3>把专项训练变成可追踪的能力声谱</h3>
          <p>每个训练模块对应一个音乐能力，最高分会形成声谱条，方便判断下一次练习该从哪里切入。</p>
        </div>
        <ProgressRing
          value={practicedCount / MODULES.length}
          label="模块激活"
          caption={`${practicedCount}/${MODULES.length}`}
          color="var(--accent)"
          size={106}
        />
        <div className="training-spectrum">
          <SpectrumBars values={moduleSignals} compact />
        </div>
      </section>

      <div className="training-workbench">
        <div className="training-grid training-module-list" aria-label="训练模块列表">
        {MODULES.map((m) => {
          const best = progress.bestScores[m.route] ?? 0
          return (
            <button
              key={m.id}
              className={`training-card card ${m.id === active.id ? 'on' : ''}`}
              onClick={() => setActiveId(m.id)}
              type="button"
            >
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
              <div className="training-score-track" aria-label={`${m.title}最高分 ${best}`}>
                <span style={{ width: `${Math.min(100, best)}%`, background: m.color }} />
              </div>
              <div className="training-foot">
                <b>{best > 0 ? `最高分 ${best}` : '尚未练习'}</b>
                <span>{m.id === active.id ? '正在查看' : '查看模块'}</span>
              </div>
            </button>
          )
        })}
        </div>

        <section className="training-module-stage card" style={{ borderColor: active.color }}>
          <div className="training-stage-head">
            <span className="training-icon training-stage-icon" style={{ background: active.color }}>
              {active.icon}
            </span>
            <div>
              <span className="training-kicker">{active.former} / {active.level}</span>
              <h2>{active.title}</h2>
              <p>{active.goal}</p>
            </div>
          </div>

          <div className="training-stage-visuals">
            <ProgressRing
              value={activeBest / 100}
              label="最高分"
              caption={activeBest > 0 ? `${activeBest}` : '待开始'}
              color={active.color}
              size={126}
            />
            <div className="training-stage-spectrum">
              <b>模块能力信号</b>
              <SpectrumBars values={activeMetrics} compact />
            </div>
          </div>

          <div className="training-stage-metrics">
            {active.metrics.map((metric) => (
              <span key={metric}>{metric}</span>
            ))}
          </div>

          <div className="training-stage-footer">
            <div>
              <b>{activeBest > 0 ? `历史最高 ${activeBest}` : '还没有训练记录'}</b>
              <small>进入后会记录本机最高分，并同步到能力声谱。</small>
            </div>
            <button className="big-start training-start" onClick={() => navigate(active.route)}>
              开始训练
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
