import { useState } from 'react'
import { useApp } from '../state/appState'
import { loadRoster } from '../state/students'
import { studentStat } from '../state/stats'

export default function StudentSelector() {
  const { currentStudentId, selectStudent, navigate } = useApp()
  const [open, setOpen] = useState(false)
  const roster = loadRoster()
  const current = roster.find((s) => s.id === currentStudentId)

  return (
    <div className="stu-selector">
      <button className="stu-current" onClick={() => setOpen((v) => !v)}>
        {current ? (
          <>
            <span className="stu-avatar">{current.avatar}</span>
            <span>{current.name}</span>
          </>
        ) : (
          <>
            <span className="stu-avatar">👤</span>
            <span>选择学生</span>
          </>
        )}
        <span className="stu-caret">▾</span>
      </button>

      {open && (
        <>
          <div className="stu-backdrop" onClick={() => setOpen(false)} />
          <div className="stu-dropdown">
            <div className="stu-dropdown-title">谁在练习？</div>
            <button
              className={`stu-option ${!currentStudentId ? 'on' : ''}`}
              onClick={() => {
                selectStudent(null)
                setOpen(false)
              }}
            >
              <span className="stu-avatar">👤</span> 匿名（不计入统计）
            </button>
            {roster.map((s) => (
              <StudentOption
                key={s.id}
                id={s.id}
                avatar={s.avatar}
                name={s.name}
                active={currentStudentId === s.id}
                onSelect={() => {
                  selectStudent(s.id)
                  setOpen(false)
                }}
              />
            ))}
            <button
              className="stu-manage"
              onClick={() => {
                setOpen(false)
                navigate('class')
              }}
            >
              ⚙️ 管理学生名册
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function StudentOption({
  id,
  avatar,
  name,
  active,
  onSelect,
}: {
  id: string
  avatar: string
  name: string
  active: boolean
  onSelect: () => void
}) {
  const stat = studentStat(id)
  return (
    <button className={`stu-option ${active ? 'on' : ''}`} onClick={onSelect}>
      <span className="stu-avatar">{avatar}</span>
      <span className="stu-option-main">
        <span>{name}</span>
        <small>
          {stat?.totalSessions ?? 0} 次练习 · {stat?.totalStars ?? 0} 星
        </small>
      </span>
    </button>
  )
}
