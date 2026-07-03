import { useMemo, useState } from 'react'
import { Route, useApp } from '../state/appState'
import { classOverview, classStats, GAME_META } from '../state/stats'
import { getCurrentStudent, loadRoster } from '../state/students'
import './course.css'

interface Station {
  id: string
  gameId: string
  route: Route
  icon: string
  title: string
  skill: string
  mission: string
  color: string
  target: number
}

const STATIONS: Station[] = [
  {
    id: 'ear',
    gameId: 'game-ear',
    route: 'game-ear',
    icon: '👂',
    title: '音高山',
    skill: '听音辨识',
    mission: '听出单音、音程和和弦色彩。',
    color: '#2f9e44',
    target: 8,
  },
  {
    id: 'read',
    gameId: 'game-read',
    route: 'game-read',
    icon: '🎼',
    title: '识谱城',
    skill: '谱面阅读',
    mission: '看五线谱选唱名，逐步挑战低音谱号。',
    color: '#f59f00',
    target: 8,
  },
  {
    id: 'sing',
    gameId: 'game-sing',
    route: 'game-sing',
    icon: '🎤',
    title: '歌唱谷',
    skill: '演唱音准',
    mission: '跟随目标旋律演唱，观察偏高和偏低。',
    color: '#d6336c',
    target: 6,
  },
  {
    id: 'taiko',
    gameId: 'game-taiko',
    route: 'game-taiko',
    icon: '🥁',
    title: '合奏舞台',
    skill: '反应律动',
    mission: '用咚和咔完成节奏挑战，适合点名上台。',
    color: '#f25050',
    target: 6,
  },
]

export default function AdventureMap() {
  const { navigate } = useApp()
  const overview = classOverview()
  const ranking = classStats()
  const roster = loadRoster()
  const current = getCurrentStudent()
  const [calledId, setCalledId] = useState<string | null>(current?.id ?? roster[0]?.id ?? null)

  const called = roster.find((s) => s.id === calledId) ?? null
  const nextStation = useMemo(() => {
    return STATIONS.find((s) => (overview.sessionsByGame[s.gameId] ?? 0) < s.target) ?? STATIONS[0]
  }, [overview.sessionsByGame])

  const randomCall = () => {
    if (roster.length === 0) return
    const next = roster[Math.floor(Math.random() * roster.length)]
    setCalledId(next.id)
  }

  return (
    <div className="adventure-page">
      <section className="course-head card adventure-head">
        <div>
          <span className="course-kicker">能力进阶</span>
          <h2>班级能力进阶</h2>
          <p>把节奏、听觉、读谱、演唱和律动训练整理为可观察的课堂进度。</p>
        </div>
        <div className="map-summary">
          <div><b>{overview.totalSessions}</b><small>全班练习</small></div>
          <div><b>{overview.totalStars}</b><small>全班星星</small></div>
          <div><b>{Math.round(overview.avgAccuracy * 100)}%</b><small>平均准确率</small></div>
        </div>
      </section>

      <section className="call-panel card">
        <div>
          <span className="course-kicker">课堂抽测</span>
          <h3>点名练习</h3>
          <p>
            {called
              ? `${called.avatar} ${called.name} 准备进行「${nextStation.title}」。`
              : '先在学生名册添加学生，再开始课堂抽测。'}
          </p>
        </div>
        <div className="call-actions">
          <button className="lesson-secondary" onClick={randomCall} disabled={roster.length === 0}>
            随机点名
          </button>
          <button className="big-start" onClick={() => navigate(nextStation.route)}>
            开始下一项
          </button>
        </div>
      </section>

      <div className="map-track">
        {STATIONS.map((station, index) => {
          const count = overview.sessionsByGame[station.gameId] ?? 0
          const pct = Math.min(100, Math.round((count / station.target) * 100))
          const unlocked = index === 0 || (overview.sessionsByGame[STATIONS[index - 1].gameId] ?? 0) > 0
          const meta = GAME_META[station.gameId]
          return (
            <button
              key={station.id}
              className={`station card ${pct >= 100 ? 'done' : ''} ${unlocked ? '' : 'locked'}`}
              onClick={() => unlocked && navigate(station.route)}
              disabled={!unlocked}
            >
              <span className="station-index">{index + 1}</span>
              <span className="station-icon" style={{ background: station.color }}>
                {station.icon}
              </span>
              <h3>{station.title}</h3>
              <p>{station.mission}</p>
              <div className="station-skill">{meta?.skill ?? station.skill}</div>
              <div className="station-progress">
                <span style={{ width: `${pct}%`, background: station.color }} />
              </div>
              <small>{count}/{station.target} 次班级练习</small>
            </button>
          )
        })}
      </div>

      <section className="leader-panel card">
        <div>
          <span className="course-kicker">课堂榜单</span>
          <h3>今日可表扬</h3>
        </div>
        <div className="leader-row">
          {ranking.slice(0, 5).map((r, index) => (
            <div key={r.student.id} className="leader-chip">
              <span>{index + 1}</span>
              <b>{r.student.avatar} {r.student.name}</b>
              <small>{r.totalStars} 星 · {Math.round(r.avgAccuracy * 100)}%</small>
            </div>
          ))}
          {ranking.length === 0 && <p>还没有练习记录，先从乐理课程开始第一节课。</p>}
        </div>
      </section>
    </div>
  )
}
