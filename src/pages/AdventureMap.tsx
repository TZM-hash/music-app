import { useEffect, useMemo, useState } from 'react'
import { Route, useApp } from '../state/appState'
import { loadProgress } from '../state/progress'
import { getCurrentStudent } from '../state/students'
import { filterTheoryTopics, getTheoryTopic } from '../music/theoryCatalog'
import { THEORY_QUESTS } from '../music/theoryQuests'
import { focusFromTheoryTopic } from '../state/reviewDeepLink'
import { getGradeLabel } from '../music/zhejiangCurriculum'
import { buildDiscoverySummary, loadMusicDiscoveries } from '../state/discoveries'
import PagePager, { type PagePagerItem } from '../components/PagePager'
import { getPageSlice } from '../components/presentation'
import './course.css'

const ADVENTURE_PRESENTATION_PAGES: readonly PagePagerItem[] = [
  { id: 'mission', label: '当前任务', hint: '查看当前小岛和下一步行动' },
  { id: 'map', label: '音乐地图', hint: '分组查看九座音乐岛屿' },
  { id: 'cards', label: '我的发现', hint: '回看感受、证据和再次聆听' },
]

const DISCOVERY_PATH_LABELS: Record<string, string> = {
  emotion: '情绪入口',
  movement: '动作入口',
  story: '故事入口',
  culture: '文化入口',
}

function routeLabel(route: Route): string {
  const labels: Partial<Record<Route, string>> = {
    theory: '探索馆',
    course: '学段总览',
    training: '挑战中心',
    library: '音乐素材',
    mixer: '混音创作',
    'game-ear': '听辨挑战',
    'game-taiko': '节奏挑战',
    'game-sing': '视唱挑战',
    'game-read': '读谱挑战',
  }
  return labels[route] ?? '开始'
}

export default function AdventureMap() {
  const { navigate, openTheory, openExploration, currentStudentId, selectedGrade } = useApp()
  const [adventurePage, setAdventurePage] = useState(0)
  const [questPage, setQuestPage] = useState(0)
  const [discoveryPage, setDiscoveryPage] = useState(0)
  const progress = loadProgress()
  const student = getCurrentStudent()
  const effectiveGrade = selectedGrade ?? student?.grade
  const discoveries = useMemo(() => loadMusicDiscoveries(currentStudentId), [currentStudentId])
  const discoverySummary = useMemo(() => buildDiscoverySummary(discoveries), [discoveries])
  const scopedTopicIds = useMemo(
    () =>
      new Set(
        filterTheoryTopics(effectiveGrade ? { grade: effectiveGrade } : {}).map((topic) => topic.id)
      ),
    [effectiveGrade]
  )
  const scopedQuests = useMemo(
    () =>
      effectiveGrade
        ? THEORY_QUESTS.map((quest) => ({
            ...quest,
            topicIds: quest.topicIds.filter((id) => scopedTopicIds.has(id)),
          })).filter((quest) => quest.topicIds.length > 0)
        : THEORY_QUESTS,
    [effectiveGrade, scopedTopicIds]
  )
  const [activeQuestId, setActiveQuestId] = useState(THEORY_QUESTS[0].id)
  const activeQuest =
    scopedQuests.find((quest) => quest.id === activeQuestId) ?? scopedQuests[0] ?? THEORY_QUESTS[0]

  useEffect(() => {
    if (activeQuest.id !== activeQuestId) setActiveQuestId(activeQuest.id)
  }, [activeQuest.id, activeQuestId])

  const questStats = useMemo(() => {
    return scopedQuests.map((quest, index) => {
      const completed = quest.topicIds.filter(
        (id) => (progress.bestScores[`theory-${id}`] ?? 0) > 0
      ).length
      const pct = Math.round((completed / quest.topicIds.length) * 100)
      const previous = index === 0 ? null : scopedQuests[index - 1]
      const previousStarted = previous
        ? previous.topicIds.some((id) => (progress.bestScores[`theory-${id}`] ?? 0) > 0)
        : true
      return { quest, completed, pct, unlocked: index === 0 || previousStarted }
    })
  }, [progress.bestScores, scopedQuests])

  const previewTopics = activeQuest.topicIds
    .map((id) => getTheoryTopic(id))
    .filter(Boolean)
    .slice(0, 6)
  const questPageData = useMemo(() => getPageSlice(questStats, questPage, 6), [questPage, questStats])
  const questPagerItems = useMemo(
    () => Array.from({ length: questPageData.pageCount }, (_, index) => ({
      id: `quest-page-${index}`,
      label: `${index + 1}`,
      hint: `第 ${index + 1} 组音乐岛屿`,
    })),
    [questPageData.pageCount]
  )
  const discoveryPageData = useMemo(
    () => getPageSlice(discoveries, discoveryPage, 4),
    [discoveries, discoveryPage]
  )
  const discoveryPagerItems = useMemo<readonly PagePagerItem[]>(
    () => Array.from({ length: discoveryPageData.pageCount }, (_, index) => ({
      id: `discovery-page-${index}`,
      label: `${index + 1}`,
      hint: `第 ${index + 1} 页我的发现`,
    })),
    [discoveryPageData.pageCount]
  )

  useEffect(() => {
    if (discoveryPageData.pageIndex !== discoveryPage) setDiscoveryPage(discoveryPageData.pageIndex)
  }, [discoveryPage, discoveryPageData.pageIndex])

  const openExploreTheory = () => {
    const first = previewTopics[0]
    if (first) {
      openTheory(
        focusFromTheoryTopic({
          id: first.id,
          category: first.category,
          stage: first.stage,
        })
      )
    } else {
      openTheory()
    }
  }

  return (
    <div className="adventure-page quest-page presentation-page adventure-presentation" data-adventure-page={adventurePage}>
      <PagePager
        items={ADVENTURE_PRESENTATION_PAGES}
        activeIndex={adventurePage}
        onChange={setAdventurePage}
        ariaLabel="我的展示页面"
      />
      <div className="presentation-slide adventure-presentation-slide">
      <section className="course-head card adventure-head adventure-presentation-mission">
        <div>
          <span className="course-kicker">快乐教学 · 边玩边学</span>
          <h2>音乐闯关岛</h2>
          <p>
            把音乐发现卡整理成一座座小岛：先听一听、玩一玩，再进入挑战或创编任务。
            {effectiveGrade ? ` 当前只显示与${getGradeLabel(effectiveGrade)}匹配的关卡。` : ''}
          </p>
        </div>
        <div className="map-summary">
          <div>
            <b>{scopedQuests.length}</b>
            <small>音乐岛屿</small>
          </div>
          <div>
            <b>{questStats.reduce((sum, item) => sum + item.completed, 0)}</b>
            <small>已闯发现卡</small>
          </div>
          <div>
            <b>{student ? student.avatar : '🎒'}</b>
            <small>{student ? student.name : '匿名冒险'}</small>
          </div>
        </div>
      </section>

      <section className="call-panel card quest-spotlight adventure-presentation-mission">
        <div>
          <span className="course-kicker">当前任务</span>
          <h3>
            {activeQuest.icon} {activeQuest.title}
          </h3>
          <p>{activeQuest.mission}</p>
          <div className="quest-reward">完成奖励：{activeQuest.reward}</div>
        </div>
        <div className="call-actions">
          <button className="lesson-secondary" onClick={() => navigate('lesson')}>
            互动课堂
          </button>
          <button className="lesson-secondary" onClick={() => navigate(activeQuest.practiceRoute)}>
            {routeLabel(activeQuest.practiceRoute)}
          </button>
          <button className="big-start" onClick={openExploreTheory}>
            探索发现
          </button>
        </div>
      </section>

      <div className="adventure-presentation-map">
      <div className="map-track quest-track">
        {questPageData.items.map(({ quest, completed, pct, unlocked }) => (
          <button
            key={quest.id}
            className={`station quest-card card ${pct >= 100 ? 'done' : ''} ${unlocked ? '' : 'locked'} ${quest.id === activeQuest.id ? 'active' : ''}`}
            onClick={() => unlocked && setActiveQuestId(quest.id)}
            disabled={!unlocked}
            title={`${quest.title}：${quest.mood}。${quest.topicIds.length} 张发现卡 · ${routeLabel(quest.practiceRoute)}`}
          >
            <span className="station-index">{questStats.findIndex((item) => item.quest.id === quest.id) + 1}</span>
            <span className="station-icon" style={{ background: quest.color }}>
              {quest.icon}
            </span>
            <h3>{quest.title}</h3>
            <p>{quest.mood}</p>
            <div className="station-skill">
              {quest.topicIds.length} 张发现卡 · {routeLabel(quest.practiceRoute)}
            </div>
            <div className="station-progress">
              <span style={{ width: `${pct}%`, background: quest.color }} />
            </div>
            <small>
              {completed}/{quest.topicIds.length} 张发现卡已点亮
            </small>
          </button>
        ))}
      </div>
      <PagePager
        items={questPagerItems}
        activeIndex={questPageData.pageIndex}
        onChange={setQuestPage}
        ariaLabel="音乐岛屿分页"
        compact
        showTabs={false}
      />
      </div>

      <section className="leader-panel card quest-topic-panel adventure-presentation-cards discovery-library-panel">
        <div>
          <span className="course-kicker">我的音乐发现</span>
          <h3>把感受、证据和再次聆听留下来</h3>
          <p className="discovery-library-intro">
            {discoverySummary.total > 0
              ? discoverySummary.headline
              : '完成一次探索后，这里会出现你的音乐证据，也会生成你的第一张发现卡。'}
          </p>
        </div>
        {discoveryPageData.items.length > 0 ? (
          <div className="discovery-card-grid">
            {discoveryPageData.items.map((discovery) => (
              <button
                key={discovery.id}
                className="discovery-card"
                type="button"
                onClick={() =>
                  discoverySummary.latest[0] &&
                  discoverySummary.latest[0].id === discovery.id &&
                  discoverySummary.latest[0].unitId === 'jasmine'
                    ? openExploration('jasmine')
                    : discovery.unitId
                    ? openExploration(discovery.unitId)
                    : openTheory({ topicId: discovery.topicId })
                }
              >
                <span className="discovery-card-topline">
                  {discovery.path ? DISCOVERY_PATH_LABELS[discovery.path] : '音乐线索'}
                  {discovery.grade ? ` · ${getGradeLabel(discovery.grade)}` : ''}
                </span>
                <b>{discovery.title}</b>
                <p>“{discovery.statement}”</p>
                <small>
                  {discovery.evidence?.length
                    ? `证据：${discovery.evidence.slice(0, 2).join('、')}`
                    : '还可以再找一条音乐证据'}
                  {discovery.relistenChoice ? ' · 已再次聆听' : ''}
                </small>
              </button>
            ))}
          </div>
        ) : (
          <div className="discovery-library-empty">
            <span aria-hidden="true">🎧</span>
            <div>
              <b>先听见，再留下自己的话</b>
              <p>从茉莉花探索剧场开始，选择一种感受或动作，找到音乐里的依据。</p>
            </div>
          </div>
        )}
        <PagePager
          items={discoveryPagerItems}
          activeIndex={discoveryPageData.pageIndex}
          onChange={setDiscoveryPage}
          ariaLabel="我的发现分页"
          compact
          showTabs={false}
        />
        <div className="discovery-next-step">
          <div>
            <span className="course-kicker">继续探索</span>
            <b>{activeQuest.title}：先找一条可听见的线索</b>
            <small>{activeQuest.mission}</small>
          </div>
          <div className="lesson-foot">
            <button className="big-start" onClick={openExploreTheory}>
              进入探索馆
            </button>
            <button className="lesson-secondary" onClick={() => openExploration('jasmine')}>
              再听茉莉花
            </button>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}
