import { useState } from 'react'
import { useApp } from '../state/appState'
import { loadRoster } from '../state/students'
import { studentStat } from '../state/stats'

export default function StudentSelector() {
  const { currentStudentId, selectStudent, navigate } = useApp()
  const [open, setOpen] = useState(false)
  const roster = loadRoster()
  const current = roster.find((student) => student.id === currentStudentId)

  return (
    <div className="stu-selector">
      <button className="stu-current" onClick={() => setOpen((value) => !value)}>
        {current ? (
          <>
            <span className="stu-avatar">{current.avatar}</span>
            <span>{current.name}</span>
          </>
        ) : (
          <>
            <span className="stu-avatar">访</span>
            <span>选择学生</span>
          </>
        )}
        <span className="stu-caret">⌄</span>
      </button>

      {open && (
        <>
          <div className="stu-backdrop" onClick={() => setOpen(false)} />
          <div className="stu-dropdown">
            <div className="stu-dropdown-title">当前练习对象</div>
            <button
              className={`stu-option ${!currentStudentId ? 'on' : ''}`}
              onClick={() => {
                selectStudent(null)
                setOpen(false)
              }}
            >
              <span className="stu-avatar">访</span>
              <span className="stu-option-main">
                <span>匿名体验</span>
                <small>不计入班级统计</small>
              </span>
            </button>
            {roster.map((student) => (
              <StudentOption
                key={student.id}
                id={student.id}
                avatar={student.avatar}
                name={student.name}
                active={currentStudentId === student.id}
                onSelect={() => {
                  selectStudent(student.id)
                  setOpen(false)
                }}
              />
            ))}
            <button
              className="stu-manage"
              onClick={() => {
                setOpen(false)
                navigate('class', { history: 'reset' })
              }}
            >
              管理学生名单
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
