import { useMemo, useState } from 'react'
import { Route, useApp } from '../state/appState'
import { loadProgress } from '../state/progress'
import { getCurrentStudent } from '../state/students'
import { getTheoryTopic } from '../music/theoryCatalog'
import { THEORY_QUESTS } from '../music/theoryQuests'
import './course.css'

function routeLabel(route: Route): string {
  const labels: Partial<Record<Route, string>> = {
    theory: '知识库',
    course: '课程路径',
    training: '练习中心',
    library: '曲库谱例',
    mixer: '混音创编',
    'game-ear': '听辨挑战',
    'game-taiko': '节奏挑战',
    'game-sing': '视唱挑战',
    'game-read': '读谱挑战',
  }
  return labels[route] ?? '开始'
}

export default function AdventureMap() {
  const { navigate } = useApp()
  const progress = loadProgress()
  const student = getCurrentStudent()
  const [activeQuestId, setActiveQuestId] = useState(THEORY_QUESTS[0].id)
  const activeQuest = THEORY_QUESTS.find((quest) => quest.id === activeQuestId) ?? THEORY_QUESTS[0]

  const questStats = useMemo(() => {
    return THEORY_QUESTS.map((quest, index) => {
      const completed = quest.topicIds.filter((id) => (progress.bestScores[`theory-${id}`] ?? 0) > 0).length
      const pct = Math.round((completed / quest.topicIds.length) * 100)
      const previous = index === 0 ? null : THEORY_QUESTS[index - 1]
      const previousStarted = previous
        ? previous.topicIds.some((id) => (progress.bestScores[`theory-${id}`] ?? 0) > 0)
        : true
      return { quest, completed, pct, unlocked: index === 0 || previousStarted }
    })
  }, [progress.bestScores])

  const activeStat = questStats.find((item) => item.quest.id === activeQuest.id) ?? questStats[0]
  const previewTopics = activeQuest.topicIds
    .map((id) => getTheoryTopic(id))
    .filter(Boolean)
    .slice(0, 6)

  return (
    <div className="adventure-page quest-page">
      <section className="course-head card adventure-head">
        <div>
          <span className="course-kicker">快乐教学 · 边玩边学</span>
          <h2>乐理闯关岛</h2>
          <p>
            把 100+ 个乐理知识点整理成九座音乐小岛：先探索知识，再听演示，最后进入练习或创编挑战。
          </p>
        </div>
        <div className="map-summary">
          <div><b>{THEORY_QUESTS.length}</b><small>音乐岛屿</small></div>
          <div><b>{questStats.reduce((sum, item) => sum + item.completed, 0)}</b><small>已闯知识点</small></div>
          <div><b>{student ? student.avatar : '🎒'}</b><small>{student ? student.name : '匿名冒险'}</small></div>
        </div>
      </section>

      <section className="call-panel card quest-spotlight">
        <div>
          <span className="course-kicker">当前任务</span>
          <h3>{activeQuest.icon} {activeQuest.title}</h3>
          <p>{activeQuest.mission}</p>
          <div className="quest-reward">完成奖励：{activeQuest.reward}</div>
        </div>
        <div className="call-actions">
          <button className="lesson-secondary" onClick={() => navigate('course')}>
            课程指引
          </button>
          <button className="lesson-secondary" onClick={() => navigate(activeQuest.practiceRoute)}>
            {routeLabel(activeQuest.practiceRoute)}
          </button>
          <button className="big-start" onClick={() => navigate('theory')}>
            探索知识
          </button>
        </div>
      </section>

      <div className="map-track quest-track">
        {questStats.map(({ quest, completed, pct, unlocked }, index) => (
          <button
            key={quest.id}
            className={`station quest-card card ${pct >= 100 ? 'done' : ''} ${unlocked ? '' : 'locked'} ${quest.id === activeQuest.id ? 'active' : ''}`}
            onClick={() => unlocked && setActiveQuestId(quest.id)}
            disabled={!unlocked}
            title={`${quest.title}：${quest.mood}。${quest.topicIds.length} 个知识点 · ${routeLabel(quest.practiceRoute)}`}
          >
            <span className="station-index">{index + 1}</span>
            <span className="station-icon" style={{ background: quest.color }}>
              {quest.icon}
            </span>
            <h3>{quest.title}</h3>
            <p>{quest.mood}</p>
            <div className="station-skill">{quest.topicIds.length} 个知识点 · {routeLabel(quest.practiceRoute)}</div>
            <div className="station-progress">
              <span style={{ width: `${pct}%`, background: quest.color }} />
            </div>
            <small>{completed}/{quest.topicIds.length} 个知识点已完成</small>
          </button>
        ))}
      </div>

      <section className="leader-panel card quest-topic-panel">
        <div>
          <span className="course-kicker">岛屿知识卡</span>
          <h3>{activeQuest.title}会遇到这些关卡</h3>
        </div>
        <div className="quest-topic-grid">
          {previewTopics.map((topic) => (
            <button key={topic!.id} onClick={() => navigate('theory')} title={topic!.subtitle}>
              <b>{topic!.title}</b>
              <small>{topic!.category} · {topic!.level}</small>
              <span>{topic!.subtitle}</span>
            </button>
          ))}
        </div>
        <div className="lesson-foot">
          <button className="big-start" onClick={() => navigate('theory')}>
            进入知识库闯关
          </button>
          <button className="lesson-secondary" onClick={() => navigate(activeQuest.practiceRoute)}>
            去完成小岛挑战
          </button>
        </div>
      </section>
    </div>
  )
}
