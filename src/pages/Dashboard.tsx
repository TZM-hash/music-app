import { useMemo, useState } from 'react'
import { classOverview, classStats, studentStat, GAME_META } from '../state/stats'
import { BarChart, LineChart, Donut, Radar } from '../components/Charts'
import '../components/charts.css'
import { useApp } from '../state/appState'
import './dashboard.css'

const GAME_COLORS: Record<string, string> = {
  'game-taiko': '#f25050',
  'game-sing': '#f783ac',
  'game-rhythm': '#e64980',
  'game-ear': '#2f9e44',
  'game-read': '#f59f00',
}

export default function Dashboard() {
  const { navigate } = useApp()
  const overview = useMemo(() => classOverview(), [])
  const ranking = useMemo(() => classStats(), [])
  const [selected, setSelected] = useState<string | null>(ranking[0]?.student.id ?? null)
  const detail = selected ? studentStat(selected) : null

  const gameSegments = Object.keys(GAME_META).map((g) => ({
    label: GAME_META[g].name,
    value: overview.sessionsByGame[g] ?? 0,
    color: GAME_COLORS[g],
  }))

  const rankingBars = ranking.slice(0, 8).map((r) => ({
    label: r.student.name,
    value: r.totalStars,
    color: 'var(--primary)',
  }))

  const radarAxes = detail
    ? Object.keys(GAME_META).map((g) => ({
        label: GAME_META[g].skill,
        value: detail.skillByGame[g] ?? 0,
      }))
    : []

  const hasData = overview.totalSessions > 0

  return (
    <div className="dashboard">
      {/* KPI 卡片 */}
      <div className="kpi-row">
        <div className="kpi card">
          <div className="kpi-icon" style={{ background: '#4dabf7' }}>👥</div>
          <div>
            <div className="kpi-val">{overview.studentCount}</div>
            <div className="kpi-label">班级学生</div>
          </div>
        </div>
        <div className="kpi card">
          <div className="kpi-icon" style={{ background: '#e64980' }}>🎮</div>
          <div>
            <div className="kpi-val">{overview.totalSessions}</div>
            <div className="kpi-label">累计练习</div>
          </div>
        </div>
        <div className="kpi card">
          <div className="kpi-icon" style={{ background: '#f6c945' }}>⭐</div>
          <div>
            <div className="kpi-val">{overview.totalStars}</div>
            <div className="kpi-label">获得星星</div>
          </div>
        </div>
        <div className="kpi card">
          <div className="kpi-icon" style={{ background: '#20c997' }}>🎯</div>
          <div>
            <div className="kpi-val">{Math.round(overview.avgAccuracy * 100)}%</div>
            <div className="kpi-label">平均正确率</div>
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="dash-empty card">
          <div style={{ fontSize: '3rem' }}>📭</div>
          <h3>还没有练习数据</h3>
          <p>
            先到「学生名册」选一个当前学生，然后去玩游戏，
            成绩就会自动记录并在这里生成统计图表。
          </p>
          <button className="big-start" onClick={() => navigate('class')}>
            前往学生名册
          </button>
        </div>
      )}

      {hasData && (
        <>
          <div className="dash-grid">
            <div className="dash-panel card">
              <h3>🏆 班级排行榜（按星星）</h3>
              <BarChart data={rankingBars} />
            </div>
            <div className="dash-panel card">
              <h3>🎲 各游戏练习分布</h3>
              <Donut segments={gameSegments} />
            </div>
            <div className="dash-panel card">
              <h3>📈 练习趋势</h3>
              <LineChart points={overview.trend.map((t) => ({ label: t.label, value: t.count }))} />
            </div>
          </div>

          {/* 学生详情 */}
          <div className="dash-detail card">
            <div className="detail-head">
              <h3>👤 学生能力画像</h3>
              <select value={selected ?? ''} onChange={(e) => setSelected(e.target.value)}>
                {ranking.map((r) => (
                  <option key={r.student.id} value={r.student.id}>
                    {r.student.avatar} {r.student.name}
                  </option>
                ))}
              </select>
            </div>
            {detail && (
              <div className="detail-body">
                <div className="detail-radar">
                  <Radar axes={radarAxes} />
                </div>
                <div className="detail-stats">
                  <div className="ds-item">
                    <span>练习次数</span>
                    <b>{detail.totalSessions}</b>
                  </div>
                  <div className="ds-item">
                    <span>累计星星</span>
                    <b>{detail.totalStars} ⭐</b>
                  </div>
                  <div className="ds-item">
                    <span>最高分</span>
                    <b>{detail.bestScore}</b>
                  </div>
                  <div className="ds-item">
                    <span>平均正确率</span>
                    <b>{Math.round(detail.avgAccuracy * 100)}%</b>
                  </div>
                  <div className="ds-skills">
                    {Object.keys(GAME_META).map((g) => (
                      <div key={g} className="skill-bar">
                        <span>
                          {GAME_META[g].icon} {GAME_META[g].skill}
                        </span>
                        <div className="skill-track">
                          <div
                            className="skill-fill"
                            style={{
                              width: `${Math.round((detail.skillByGame[g] ?? 0) * 100)}%`,
                              background: GAME_COLORS[g],
                            }}
                          />
                        </div>
                        <b>{Math.round((detail.skillByGame[g] ?? 0) * 100)}%</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 完整排行表 */}
          <div className="dash-table card">
            <h3>📋 全班明细</h3>
            <table>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>学生</th>
                  <th>练习</th>
                  <th>星星</th>
                  <th>最高分</th>
                  <th>正确率</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.student.id}>
                    <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                    <td>
                      {r.student.avatar} {r.student.name}
                    </td>
                    <td>{r.totalSessions}</td>
                    <td>{r.totalStars} ⭐</td>
                    <td>{r.bestScore}</td>
                    <td>{Math.round(r.avgAccuracy * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
