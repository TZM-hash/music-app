import { useState } from 'react'
import { classOverview, classStats, studentStat, GAME_META } from '../state/stats'
import { BarChart, LineChart, Donut, Radar, ProgressRing, SpectrumBars } from '../components/Charts'
import CountUp from '../components/CountUp'
import { useFillOnMount } from '../components/useFillOnMount'
import '../components/charts.css'
import { useApp } from '../state/appState'
import './dashboard.css'

const GAME_COLORS: Record<string, string> = {
  'game-taiko': '#f25050',
  'game-echo': '#845ef7',
  'game-sing': '#f783ac',
  'game-ear': '#2f9e44',
  'game-read': '#f59f00',
}

const GAME_IDS = Object.keys(GAME_META) as Array<keyof typeof GAME_META>
type FocusGame = 'all' | keyof typeof GAME_META

export default function Dashboard() {
  const { navigate } = useApp()
  const overview = classOverview()
  const filled = useFillOnMount()
  const ranking = classStats()
  const [selected, setSelected] = useState<string | null>(ranking[0]?.student.id ?? null)
  const [focusGame, setFocusGame] = useState<FocusGame>('all')
  const detail = selected ? studentStat(selected) : null

  const gameSegments = GAME_IDS.map((g) => ({
    label: GAME_META[g].name,
    value: overview.sessionsByGame[g] ?? 0,
    color: GAME_COLORS[g],
  }))

  const rankingBars = ranking.slice(0, 8).map((r) => ({
    label: r.student.name,
    value:
      focusGame === 'all'
        ? r.totalStars
        : Math.round((r.skillByGame[focusGame] ?? 0) * 100),
    color: focusGame === 'all' ? 'var(--primary)' : GAME_COLORS[focusGame],
  }))

  const radarAxes = detail
    ? GAME_IDS.map((g) => ({
        label: GAME_META[g].skill,
        value: detail.skillByGame[g] ?? 0,
      }))
    : []

  const hasData = overview.totalSessions > 0
  const strongestGame =
    GAME_IDS
      .map((g) => ({ id: g, count: overview.sessionsByGame[g] ?? 0 }))
      .sort((a, b) => b.count - a.count)[0]?.id ?? GAME_IDS[0]
  const focusLabel = focusGame === 'all' ? '全班综合' : GAME_META[focusGame].skill
  const signalValues = GAME_IDS.map((g) => ({
    label: GAME_META[g].skill,
    value: overview.sessionsByGame[g] ?? 0,
    color: GAME_COLORS[g],
  }))
  const trendBars =
    overview.trend.length > 0
      ? overview.trend.map((item) => ({ label: item.label, value: item.count, color: 'var(--primary-2)' }))
      : GAME_IDS.map((g) => ({ label: GAME_META[g].skill, value: overview.sessionsByGame[g] ?? 0, color: GAME_COLORS[g] }))

  return (
    <div className={`dashboard ${hasData ? 'has-data' : 'no-data'}`}>
      <section className="dash-lab-head card">
        <div className="dash-lab-copy">
          <span className="dash-kicker">数据声谱实验室</span>
          <h2>把班级练习数据变成可读的音乐能力图谱</h2>
          <p>
            通过声谱条、趋势线、能力雷达和排行榜，快速判断全班正在加强哪类能力，
            也能切到单个学生查看听辨、识谱、节奏和演唱的表现。
          </p>
        </div>
        <div className="dash-command">
          <ProgressRing
            value={overview.avgAccuracy}
            label="平均正确率"
            caption={hasData ? GAME_META[strongestGame].skill : '等待数据'}
            color="var(--accent)"
          />
          <div className="dash-focus">
            <b>观察维度</b>
            <div>
              <button className={focusGame === 'all' ? 'on' : ''} onClick={() => setFocusGame('all')}>
                全部
              </button>
              {GAME_IDS.map((g) => (
                <button key={g} className={focusGame === g ? 'on' : ''} onClick={() => setFocusGame(g)}>
                  {GAME_META[g].skill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KPI 卡片 */}
      <div className="kpi-row">
        <div className="kpi card">
          <div className="kpi-icon" style={{ background: '#4dabf7' }}>👥</div>
          <div>
            <div className="kpi-val"><CountUp target={overview.studentCount} /></div>
            <div className="kpi-label">班级学生</div>
          </div>
        </div>
        <div className="kpi card">
          <div className="kpi-icon" style={{ background: '#e64980' }}>🎮</div>
          <div>
            <div className="kpi-val"><CountUp target={overview.totalSessions} /></div>
            <div className="kpi-label">累计练习</div>
          </div>
        </div>
        <div className="kpi card">
          <div className="kpi-icon" style={{ background: '#f6c945' }}>⭐</div>
          <div>
            <div className="kpi-val"><CountUp target={overview.totalStars} /></div>
            <div className="kpi-label">获得星星</div>
          </div>
        </div>
        <div className="kpi card">
          <div className="kpi-icon" style={{ background: '#20c997' }}>🎯</div>
          <div>
            <div className="kpi-val"><CountUp target={Math.round(overview.avgAccuracy * 100)} />%</div>
            <div className="kpi-label">平均正确率</div>
          </div>
        </div>
      </div>

      {!hasData && (
        <section className="dash-signal-board card">
          <div className="dash-signal-copy">
            <span className="dash-kicker">班级能力声谱</span>
            <h3>完成练习后生成能力声谱</h3>
            <p>声谱条表示不同练习能力的出现频率。先选学生并完成练习，这里会亮起来。</p>
          </div>
          <div className="dash-spectrum">
            <SpectrumBars values={signalValues} />
          </div>
          <div className="dash-trend-mini">
            <b>练习节奏</b>
            <SpectrumBars values={trendBars} compact />
          </div>
        </section>
      )}

      {!hasData && (
        <div className="dash-empty card">
          <div className="dash-empty-main">
            <div className="dash-empty-icon">📭</div>
            <div>
              <h3>还没有练习数据</h3>
              <p>
                先到「学生名册」选一个当前学生，然后去玩游戏，
                成绩就会自动记录并在这里生成统计图表。
              </p>
            </div>
          </div>
          <div className="dash-empty-steps" aria-label="生成数据步骤">
            <span>
              <b>1</b>
              选学生
            </span>
            <span>
              <b>2</b>
              完成练习
            </span>
            <span>
              <b>3</b>
              看能力图谱
            </span>
          </div>
          <div className="dash-empty-actions">
            <button className="big-start" onClick={() => navigate('class')}>
              前往学生名册
            </button>
            <button className="lesson-secondary" onClick={() => navigate('training')}>
              进入练习中心
            </button>
          </div>
        </div>
      )}

      {hasData && (
        <>
          <div className="dash-grid">
            <div className="dash-panel card dash-panel-rank">
              <h3>🏆 {focusGame === 'all' ? '班级排行榜（按星星）' : `${GAME_META[focusGame].skill}能力排行`}</h3>
              <BarChart data={rankingBars} height={220} />
            </div>
            <div className="dash-panel card dash-panel-donut">
              <h3>🎲 各游戏练习分布</h3>
              <Donut segments={gameSegments} />
            </div>
            <div className="dash-panel card dash-panel-trend">
              <h3>📈 练习趋势</h3>
              <LineChart points={overview.trend.map((t) => ({ label: t.label, value: t.count }))} height={180} />
            </div>
            <div className="dash-panel card dash-panel-signal">
              <div className="dash-signal-copy">
                <span className="dash-kicker">班级能力声谱</span>
                <h3>{focusLabel}正在被观察</h3>
              </div>
              <div className="dash-spectrum">
                <SpectrumBars values={signalValues} />
              </div>
              <div className="dash-trend-mini">
                <b>练习节奏</b>
                <SpectrumBars values={trendBars} compact />
              </div>
            </div>
          </div>

          <div className="dash-bottom">
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
                      {GAME_IDS.map((g) => (
                        <div key={g} className="skill-bar">
                          <span>
                            {GAME_META[g].icon} {GAME_META[g].skill}
                          </span>
                          <div className="skill-track">
                            <div
                              className="skill-fill"
                              style={{
                                width: filled ? `${Math.round((detail.skillByGame[g] ?? 0) * 100)}%` : '0%',
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

            <div className="dash-table card">
              <h3>📋 全班明细</h3>
              <div className="dash-table-scroll">
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
            </div>
          </div>
        </>
      )}
    </div>
  )
}
