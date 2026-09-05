import { useEffect, useMemo, useState } from 'react'
import { Route, useApp } from '../state/appState'
import { loadProgress } from '../state/progress'
import { getCurrentStudent } from '../state/students'
import { filterTheoryTopics, getTheoryTopic } from '../music/theoryCatalog'
import { THEORY_QUESTS } from '../music/theoryQuests'
import { focusFromTheoryTopic } from '../state/reviewDeepLink'
import { getGradeLabel } from '../music/zhejiangCurriculum'
import { buildDiscoverySummary, loadMusicDiscoveries } from '../state/discoveries'
import './course.css'

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
  const progress = loadProgress()
  const student = getCurrentStudent()
  const effectiveGrade = selectedGrade ?? student?.grade
  const discoverySummary = useMemo(
    () => buildDiscoverySummary(loadMusicDiscoveries(currentStudentId)),
    [currentStudentId]
  )
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
    <div className="adventure-page quest-page">
      <section className="course-head card adventure-head">
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

      <section className="call-panel card quest-spotlight">
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

      <section className="leader-panel card discovery-replay-panel" aria-label="我的发现">
        <div>
          <span className="course-kicker">我的发现</span>
          <h3>把听到的证据再听一次</h3>
          <p>
            {discoverySummary.total > 0
              ? `已经留下 ${discoverySummary.total} 条音乐发现。`
              : '完成一次探索后，这里会出现你的音乐证据。'}
          </p>
        </div>
        {discoverySummary.latest[0] ? (
          <button
            className="big-start"
            type="button"
            onClick={() =>
              discoverySummary.latest[0].unitId === 'jasmine'
                ? openExploration('jasmine')
                : openTheory({ topicId: discoverySummary.latest[0].topicId })
            }
          >
            <b>{discoverySummary.latest[0].title}</b>
            <span>{discoverySummary.latest[0].statement}</span>
            <small>再听一次</small>
          </button>
        ) : (
          <button
            className="lesson-secondary"
            type="button"
            onClick={() => openExploration('jasmine')}
          >
            开始今日探索
          </button>
        )}
      </section>

      <div className="map-track quest-track">
        {questStats.map(({ quest, completed, pct, unlocked }, index) => (
          <button
            key={quest.id}
            className={`station quest-card card ${pct >= 100 ? 'done' : ''} ${unlocked ? '' : 'locked'} ${quest.id === activeQuest.id ? 'active' : ''}`}
            onClick={() => unlocked && setActiveQuestId(quest.id)}
            disabled={!unlocked}
            title={`${quest.title}：${quest.mood}。${quest.topicIds.length} 张发现卡 · ${routeLabel(quest.practiceRoute)}`}
          >
            <span className="station-index">{index + 1}</span>
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

      <section className="leader-panel card quest-topic-panel">
        <div>
          <span className="course-kicker">岛屿发现卡</span>
          <h3>{activeQuest.title}会遇到这些关卡</h3>
        </div>
        <div className="quest-topic-grid">
          {previewTopics.map((topic) => (
            <button
              key={topic!.id}
              onClick={() =>
                openTheory(
                  focusFromTheoryTopic({
                    id: topic!.id,
                    category: topic!.category,
                    stage: topic!.stage,
                  })
                )
              }
              title={topic!.subtitle}
            >
              <b>{topic!.title}</b>
              <small>
                {topic!.category} · {topic!.level}
              </small>
              <span>{topic!.subtitle}</span>
            </button>
          ))}
        </div>
        <div className="lesson-foot">
          <button className="big-start" onClick={openExploreTheory}>
            进入探索馆闯关
          </button>
          <button className="lesson-secondary" onClick={() => navigate(activeQuest.practiceRoute)}>
            去完成小岛挑战
          </button>
        </div>
      </section>
    </div>
  )
}
