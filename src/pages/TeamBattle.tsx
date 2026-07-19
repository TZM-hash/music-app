import { useState, useCallback } from 'react'
import { getBattleState, startBattle, scoreTeam, nextRound, endBattle, resetBattle } from '../state/teamBattle'
import { celebrate } from '../components/Celebration'
import { playUI } from '../music/uiSounds'
import './teambattle.css'

const QUESTIONS = [
  { q: '🎵 听音辨高低', desc: '老师弹两个音，学生判断第二个音更高还是更低' },
  { q: '🥁 节奏模仿', desc: '老师拍一段节奏，学生跟着拍' },
  { q: '🎼 识谱抢答', desc: '老师指五线谱上的一个音，学生抢答音名' },
  { q: '🎤 跟唱挑战', desc: '老师唱一句旋律，学生跟着唱' },
  { q: '🎹 琴键找音', desc: '老师说一个音名，学生在钢琴上找到并弹出来' },
  { q: '🥁 咚咚咔咔', desc: '听到"咚"拍手，听到"咔"跺脚' },
  { q: '🎵 乐器猜猜', desc: '老师描述一种乐器的声音，学生猜是什么乐器' },
  { q: '🎼 音符接龙', desc: '轮流唱出 do-re-mi-fa-sol-la-ti，不能重复' },
  { q: '🎤 音量控制', desc: '老师唱一个音，学生用更大/更小的音量跟唱' },
  { q: '🎹 和弦辨听', desc: '老师弹一个和弦，学生判断是大调（明亮）还是小调（忧伤）' },
]

export default function TeamBattle() {
  const [battle, setBattle] = useState(getBattleState())
  const [questionIdx, setQuestionIdx] = useState(0)
  const [showWinner, setShowWinner] = useState(false)
  const [winner, setWinner] = useState<'left' | 'right' | 'tie' | null>(null)

  const start = useCallback(() => {
    startBattle(QUESTIONS.length)
    setBattle(getBattleState())
    setQuestionIdx(0)
    setShowWinner(false)
    setWinner(null)
    playUI('countdown')
  }, [])

  const score = useCallback((side: 'left' | 'right') => {
    scoreTeam(side, 10)
    playUI('correct')
    setBattle(getBattleState())
  }, [])

  const next = useCallback(() => {
    const hasMore = nextRound()
    setBattle(getBattleState())
    if (hasMore) {
      setQuestionIdx((i) => (i + 1) % QUESTIONS.length)
    } else {
      const w = endBattle()
      setWinner(w)
      setShowWinner(true)
      if (w !== 'tie') {
        celebrate('epic')
        playUI('fanfare')
      }
    }
  }, [])

  const reset = useCallback(() => {
    resetBattle()
    setBattle(getBattleState())
    setShowWinner(false)
    setWinner(null)
    setQuestionIdx(0)
  }, [])

  const currentQ = QUESTIONS[questionIdx]
  const totalScore = battle.left.score + battle.right.score
  const leftPct = totalScore === 0 ? 50 : (battle.left.score / totalScore) * 100

  if (!battle.active && !showWinner) {
    return (
      <div className="battle-wrap">
        <div className="battle-start">
          <h2>⚔️ 班级对战</h2>
          <p>把全班分成两组，轮流答题/演奏，大屏实时显示比分。适合课堂互动！</p>
          <button className="big-start" onClick={start}>开始对战国</button>
        </div>
      </div>
    )
  }

  if (showWinner) {
    const winnerName = winner === 'left' ? battle.left.name : winner === 'right' ? battle.right.name : '平局'
    const winnerColor = winner === 'left' ? battle.left.color : winner === 'right' ? battle.right.color : '#e0e4f0'
    return (
      <div className="battle-wrap">
        <div className="battle-winner">
          <div className="winner-crown">👑</div>
          <h2 style={{ color: winnerColor }}>{winnerName === '平局' ? '势均力敌！' : `${winnerName} 获胜！`}</h2>
          <div className="winner-score">
            <span style={{ color: battle.left.color }}>{battle.left.score}</span>
            <span> : </span>
            <span style={{ color: battle.right.color }}>{battle.right.score}</span>
          </div>
          <button className="big-start" onClick={reset}>再来一局</button>
        </div>
      </div>
    )
  }

  return (
    <div className="battle-wrap">
      <div className="battle-scorebar">
        <div className="team-score left" style={{ width: `${leftPct}%` }}>
          <span className="team-name">{battle.left.name}</span>
          <span className="team-points">{battle.left.score}</span>
        </div>
        <div className="battle-vs">VS</div>
        <div className="team-score right" style={{ width: `${100 - leftPct}%` }}>
          <span className="team-points">{battle.right.score}</span>
          <span className="team-name">{battle.right.name}</span>
        </div>
      </div>

      <div className="battle-question">
        <div className="battle-round">第 {battle.round + 1} 题 / 共 {battle.totalRounds} 题</div>
        <h3>{currentQ.q}</h3>
        <p>{currentQ.desc}</p>
      </div>

      <div className="battle-actions">
        <button className="battle-btn left" onClick={() => score('left')}>
          +10 {battle.left.name}
        </button>
        <button className="battle-btn skip" onClick={next}>
          跳过 →
        </button>
        <button className="battle-btn right" onClick={() => score('right')}>
          +10 {battle.right.name}
        </button>
      </div>

      <button className="battle-end" onClick={next}>
        {battle.round + 1 >= battle.totalRounds ? '结束对战' : '下一题'}
      </button>
    </div>
  )
}
