import { useEffect, useMemo, useState } from 'react'
import { classOverview, classStats, studentStat, GAME_META } from '../state/stats'
import { BarChart, LineChart, Donut, Radar, ProgressRing, SpectrumBars } from '../components/Charts'
import CountUp from '../components/CountUp'
import { useFillOnMount } from '../components/useFillOnMount'
import '../components/charts.css'
import { useApp } from '../state/appState'
import { buildDiscoveryAnalytics, loadMusicDiscoveries } from '../state/discoveries'
import PagePager, { type PagePagerItem } from '../components/PagePager'
import { getPageSlice } from '../components/presentation'
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

const DASHBOARD_DATA_PAGES: readonly PagePagerItem[] = [
  { id: 'overview', label: '班级概览', hint: '查看整体练习与能力分布' },
  { id: 'student', label: '学生画像', hint: '查看单个学生的能力表现' },
  { id: 'roster', label: '班级明细', hint: '查看全班练习明细' },
]

const DASHBOARD_EMPTY_PAGES: readonly PagePagerItem[] = [
  { id: 'overview', label: '班级概览', hint: '查看当前班级的练习状态' },
  { id: 'start', label: '开始记录', hint: '按步骤生成第一份能力图谱' },
]

const DASHBOARD_TABLE_PAGE_SIZE = 6

export default function Dashboard() {
  const { navigate, selectedGrade, selectedClass } = useApp()
  const scope = useMemo(
    () => ({ grade: selectedGrade, className: selectedClass }),
    [selectedClass, selectedGrade]
  )
  const overview = useMemo(() => classOverview(scope), [scope])
  const filled = useFillOnMount()
  const ranking = useMemo(() => classStats(scope), [scope])
  const discoveryAnalytics = useMemo(() => {
    const studentIds = new Set(ranking.map((item) => item.student.id))
    return buildDiscoveryAnalytics(
      loadMusicDiscoveries().filter(
        (item) => item.studentId !== null && studentIds.has(item.studentId)
      )
    )
  }, [ranking])
  const [selected, setSelected] = useState<string | null>(ranking[0]?.student.id ?? null)
  const [focusGame, setFocusGame] = useState<FocusGame>('all')
  useEffect(() => {
    if (!ranking.some((item) => item.student.id === selected)) setSelected(ranking[0]?.student.id ?? null)
  }, [ranking, selected])
  const [dashboardPage, setDashboardPage] = useState(0)
  const [tablePage, setTablePage] = useState(0)
  const [isDesktopPresentation, setIsDesktopPresentation] = useState(
    () => typeof window === 'undefined' || window.innerWidth > 900
  )
  const detail = selected ? studentStat(selected) : null

  const gameSegments = GAME_IDS.map((g) => ({
    label: GAME_META[g].name,
    value: overview.sessionsByGame[g] ?? 0,
    color: GAME_COLORS[g],
  }))

  const rankingBars = ranking.slice(0, 8).map((r) => ({
    label: r.student.name,
    value: focusGame === 'all' ? r.totalStars : Math.round((r.skillByGame[focusGame] ?? 0) * 100),
    color: focusGame === 'all' ? 'var(--primary)' : GAME_COLORS[focusGame],
  }))

  const radarAxes = detail
    ? GAME_IDS.map((g) => ({
        label: GAME_META[g].skill,
        value: detail.skillByGame[g] ?? 0,
      }))
    : []

  const hasData = overview.totalSessions > 0
  const dashboardPages = hasData ? DASHBOARD_DATA_PAGES : DASHBOARD_EMPTY_PAGES
  const tablePageData = useMemo(
    () => getPageSlice(ranking, tablePage, DASHBOARD_TABLE_PAGE_SIZE),
    [ranking, tablePage]
  )
  const tablePagerItems = useMemo<readonly PagePagerItem[]>(
    () =>
      Array.from({ length: tablePageData.pageCount }, (_, index) => ({
        id: `dashboard-table-page-${index}`,
        label: `${index + 1}`,
        hint: `第 ${index + 1} 页班级明细`,
      })),
    [tablePageData.pageCount]
  )
  const visibleRanking = isDesktopPresentation ? tablePageData.items : ranking
  const processPaths = [
    { id: 'emotion', label: '情绪', icon: '🌈' },
    { id: 'movement', label: '动作', icon: '🕺' },
    { id: 'story', label: '故事', icon: '📖' },
    { id: 'culture', label: '文化', icon: '🏮' },
  ] as const
  const topEvidence = Object.entries(discoveryAnalytics.evidenceCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
  const topFeelings = Object.entries(discoveryAnalytics.feelingCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)')
    const update = () => setIsDesktopPresentation(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    setDashboardPage(0)
    setTablePage(0)
  }, [hasData])

  useEffect(() => {
    if (tablePageData.pageIndex !== tablePage) setTablePage(tablePageData.pageIndex)
  }, [tablePage, tablePageData.pageIndex])
  const strongestGame =
    GAME_IDS.map((g) => ({ id: g, count: overview.sessionsByGame[g] ?? 0 })).sort(
      (a, b) => b.count - a.count
    )[0]?.id ?? GAME_IDS[0]

  const signalValues = GAME_IDS.map((g) => ({
    label: GAME_META[g].skill,
    value: overview.sessionsByGame[g] ?? 0,
    color: GAME_COLORS[g],
  }))

  const trendPoints =
    overview.trend.length > 0
      ? overview.trend.map((item, index) => ({
          label: `第${index + 1}段`,
          value: item.count,
        }))
      : [{ label: '暂无', value: 0 }]

  const trendBars =
    overview.trend.length > 0
      ? overview.trend.map((item, index) => ({
          label: `第${index + 1}段`,
          value: item.count,
          color: 'var(--primary-2)',
        }))
      : GAME_IDS.map((g) => ({
          label: GAME_META[g].skill,
          value: overview.sessionsByGame[g] ?? 0,
          color: GAME_COLORS[g],
        }))

  return (
    <div
      className={`dashboard ${hasData ? 'has-data' : 'no-data'}`}
      data-dashboard-page={dashboardPage}
    >
      {isDesktopPresentation && (
        <PagePager
          items={dashboardPages}
          activeIndex={dashboardPage}
          onChange={setDashboardPage}
          ariaLabel="成长观察展示页面"
          className="dashboard-pager"
        />
      )}

      <div
        className="dashboard-presentation-page dashboard-page-overview"
        data-dashboard-page-index="0"
      >
        <section className="dash-lab-head card">
          <div className="dash-lab-copy">
            <span className="dash-kicker">数据声谱实验室</span>
            <h2>把班级练习数据变成可读的音乐能力图谱</h2>
            <p>
              通过声谱条、趋势线、能力雷达和排行榜，快速判断全班正在加强哪类能力，
              也能切到单个学生查看听辨、识谱、节奏和演唱的表现。
            </p>
            <small className="dash-scope-note">
              {selectedGrade ? `${selectedGrade}年级` : '全部年级'} · {selectedClass ?? '全部班级'}
            </small>
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
                <button
                  className={focusGame === 'all' ? 'on' : ''}
                  onClick={() => setFocusGame('all')}
                >
                  全部
                </button>
                {GAME_IDS.map((g) => (
                  <button
                    key={g}
                    className={focusGame === g ? 'on' : ''}
                    onClick={() => setFocusGame(g)}
                  >
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
            <div className="kpi-icon" style={{ background: '#4dabf7' }}>
              👥
            </div>
            <div>
              <div className="kpi-val">
                <CountUp target={overview.studentCount} />
              </div>
              <div className="kpi-label">班级学生</div>
            </div>
          </div>
          <div className="kpi card">
            <div className="kpi-icon" style={{ background: '#e64980' }}>
              🎮
            </div>
            <div>
              <div className="kpi-val">
                <CountUp target={overview.totalSessions} />
              </div>
              <div className="kpi-label">累计练习</div>
            </div>
          </div>
          <div className="kpi card">
            <div className="kpi-icon" style={{ background: '#f6c945' }}>
              ⭐
            </div>
            <div>
              <div className="kpi-val">
                <CountUp target={overview.totalStars} />
              </div>
              <div className="kpi-label">获得星星</div>
            </div>
          </div>
          <div className="kpi card">
            <div className="kpi-icon" style={{ background: '#20c997' }}>
              🎯
            </div>
            <div>
              <div className="kpi-val">
                <CountUp target={Math.round(overview.avgAccuracy * 100)} />%
              </div>
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

        {hasData && (
          <div className="dash-grid">
            <div className="dash-panel card">
              <h3>
                🏆{' '}
                {focusGame === 'all'
                  ? '班级排行榜（按星星）'
                  : `${GAME_META[focusGame].skill}能力排行`}
              </h3>
              <BarChart data={rankingBars} height={200} />
            </div>
            <div className="dash-panel card">
              <h3>🎲 各游戏练习分布</h3>
              <Donut segments={gameSegments} />
            </div>
            <div className="dash-panel card">
              <h3>📈 练习趋势</h3>
              <LineChart points={trendPoints} height={200} />
            </div>
          </div>
        )}
      </div>

      <div
        className="dashboard-presentation-page dashboard-page-student"
        data-dashboard-page-index="1"
      >
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
          <div className="dash-bottom dashboard-detail-shell">
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
                    <div className="ds-item">
                      <span>音乐发现</span>
                      <b>{detail.discoveryCount}</b>
                    </div>
                    <div className="ds-item">
                      <span>找到证据</span>
                      <b>{detail.evidenceCount}</b>
                    </div>
                    <div className="ds-item">
                      <span>再次聆听</span>
                      <b>{detail.relistenCount}</b>
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
                                width: filled
                                  ? `${Math.round((detail.skillByGame[g] ?? 0) * 100)}%`
                                  : '0%',
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
            <section className="dash-process-panel card" aria-label="班级音乐探索过程观察">
              <div className="dash-process-head">
                <span className="dash-kicker">过程观察</span>
                <h3>学生怎样在听音乐</h3>
                <p>这里看的是感受、证据和回听，不给主观答案排名。</p>
              </div>
              <div className="dash-process-kpis">
                <div>
                  <b>{discoveryAnalytics.total}</b>
                  <span>张发现卡</span>
                </div>
                <div>
                  <b>{discoveryAnalytics.withEvidence}</b>
                  <span>找到证据</span>
                </div>
                <div>
                  <b>{discoveryAnalytics.withRelisten}</b>
                  <span>完成回听</span>
                </div>
                <div>
                  <b>{discoveryAnalytics.cultureOpened}</b>
                  <span>打开文化换镜</span>
                </div>
              </div>
              <div className="dash-process-paths">
                <strong>学生从哪里进入</strong>
                {processPaths.map((path) => (
                  <div key={path.id}>
                    <span>{path.icon} {path.label}</span>
                    <div className="process-path-track">
                      <i
                        style={{
                          width: `${discoveryAnalytics.total ? Math.round((discoveryAnalytics.pathCounts[path.id] / discoveryAnalytics.total) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <b>{discoveryAnalytics.pathCounts[path.id]}</b>
                  </div>
                ))}
              </div>
              <div className="dash-process-tags">
                <div>
                  <strong>常出现的感受</strong>
                  <p>{topFeelings.length ? topFeelings.map(([label, count]) => `${label} ${count}`).join(' · ') : '还没有感受记录'}</p>
                </div>
                <div>
                  <strong>常被指出的线索</strong>
                  <p>{topEvidence.length ? topEvidence.map(([label, count]) => `${label} ${count}`).join(' · ') : '还没有证据记录'}</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <div
        className="dashboard-presentation-page dashboard-page-roster"
        data-dashboard-page-index="2"
      >
        {hasData && (
          <div className="dash-bottom dashboard-roster-shell">
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
                    {visibleRanking.map((r, i) => {
                      const rankIndex = isDesktopPresentation
                        ? tablePageData.pageIndex * DASHBOARD_TABLE_PAGE_SIZE + i
                        : i
                      return (
                        <tr key={r.student.id}>
                          <td>
                            {rankIndex === 0
                              ? '🥇'
                              : rankIndex === 1
                                ? '🥈'
                                : rankIndex === 2
                                  ? '🥉'
                                  : rankIndex + 1}
                          </td>
                          <td>
                            {r.student.avatar} {r.student.name}
                          </td>
                          <td>{r.totalSessions}</td>
                          <td>{r.totalStars} ⭐</td>
                          <td>{r.bestScore}</td>
                          <td>{Math.round(r.avgAccuracy * 100)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {isDesktopPresentation && tablePageData.pageCount > 1 && (
                <PagePager
                  items={tablePagerItems}
                  activeIndex={tablePageData.pageIndex}
                  onChange={setTablePage}
                  ariaLabel="班级明细分页"
                  compact
                  showTabs={false}
                  className="dashboard-table-pager"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
