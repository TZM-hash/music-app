import { useRef, useState } from 'react'
import {
  loadRoster,
  addStudent,
  removeStudent,
  AVATAR_CHOICES,
} from '../state/students'
import { studentStat } from '../state/stats'
import { exportClassroomBackup, importClassroomBackup } from '../state/backup'
import { removeStudentProgress } from '../state/progress'
import { useApp } from '../state/appState'
import Reveal from '../components/Reveal'
import './class.css'

export default function ClassRoster() {
  const { currentStudentId, selectStudent, navigate } = useApp()
  const [, setVersion] = useState(0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATAR_CHOICES[0])
  const [notice, setNotice] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const roster = loadRoster()

  const add = () => {
    if (!name.trim()) return
    addStudent(name, avatar)
    setName('')
    setVersion((v) => v + 1)
  }

  const del = (id: string, nm: string) => {
    if (confirm(`确定删除「${nm}」及其所有练习记录吗？`)) {
      removeStudent(id)
      removeStudentProgress(id)
      setVersion((v) => v + 1)
      setNotice(`已删除 ${nm} 的名册和练习数据。`)
    }
  }

  const exportData = () => {
    const blob = new Blob([exportClassroomBackup()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `乐动课堂-课堂数据-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setNotice('课堂数据已导出，请妥善保存备份文件。')
  }

  const importData = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = importClassroomBackup(String(reader.result ?? ''))
      setNotice(result.message)
      if (result.ok) {
        selectStudent(null)
        setVersion((v) => v + 1)
      }
      if (importRef.current) importRef.current.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="roster">
      <div className="roster-add card">
        <h3>➕ 添加学生</h3>
        <div className="add-row">
          <div className="avatar-choices">
            {AVATAR_CHOICES.map((a) => (
              <button
                key={a}
                className={`avatar-choice ${avatar === a ? 'on' : ''}`}
                onClick={() => setAvatar(a)}
                aria-label={`选择头像 ${a}`}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            placeholder="学生姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button className="add-btn" onClick={add}>
            添加
          </button>
        </div>
        <div className="data-tools">
          <button className="link-btn" onClick={exportData}>
            导出课堂数据
          </button>
          <button className="link-btn" onClick={() => importRef.current?.click()}>
            导入课堂数据
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
        </div>
        {notice && <div className="class-notice">{notice}</div>}
      </div>

      <div className="roster-header">
        <h3>👥 班级名册（{roster.length} 人）</h3>
        <button className="link-btn" onClick={() => navigate('dashboard')}>
          查看数据看板 →
        </button>
      </div>

      <div className="roster-grid">
        {roster.map((s, index) => {
          const stat = studentStat(s.id)
          const active = currentStudentId === s.id
          return (
            <Reveal key={s.id} index={index}>
            <div className={`stu-card card ${active ? 'active' : ''}`}>
              <div className="stu-card-head">
                <span className="stu-card-avatar">{s.avatar}</span>
                <div className="stu-card-name">
                  {s.name}
                  {active && <span className="now-tag">练习中</span>}
                </div>
                <button
                  className="stu-del"
                  onClick={() => del(s.id, s.name)}
                  aria-label={`删除 ${s.name}`}
                  title={`删除 ${s.name}`}
                >
                  🗑️
                </button>
              </div>
              <div className="stu-card-stats">
                <div>
                  <b>{stat?.totalSessions ?? 0}</b>
                  <small>练习</small>
                </div>
                <div>
                  <b>{stat?.totalStars ?? 0}</b>
                  <small>星星</small>
                </div>
                <div>
                  <b>{Math.round((stat?.avgAccuracy ?? 0) * 100)}%</b>
                  <small>正确率</small>
                </div>
              </div>
              <button
                className={`stu-select-btn ${active ? 'on' : ''}`}
                onClick={() => selectStudent(active ? null : s.id)}
              >
                {active ? '✓ 当前学生' : '设为当前'}
              </button>
            </div>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
