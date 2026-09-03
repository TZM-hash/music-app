import { useEffect, useMemo, useRef, useState } from 'react'
import {
  loadRoster,
  addStudent,
  removeStudent,
  AVATAR_CHOICES,
  updateStudentProfile,
} from '../state/students'
import {
  getGradeLabel,
  getSemesterLabel,
  PRIMARY_GRADES,
  type PrimaryGrade,
  type Semester,
} from '../music/zhejiangCurriculum'
import { studentStat } from '../state/stats'
import { exportClassroomBackup, importClassroomBackup } from '../state/backup'
import { removeStudentProgress } from '../state/progress'
import { useApp } from '../state/appState'
import Reveal from '../components/Reveal'
import PagePager, { type PagePagerItem } from '../components/PagePager'
import { getPageSlice } from '../components/presentation'
import './class.css'

const ROSTER_PAGE_SIZE = 3

export default function ClassRoster() {
  const { currentStudentId, selectStudent, navigate } = useApp()
  const [, setVersion] = useState(0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATAR_CHOICES[0])
  const [grade, setGrade] = useState<PrimaryGrade>(3)
  const [semester, setSemester] = useState<Semester>(1)
  const [notice, setNotice] = useState<string | null>(null)
  const [rosterPage, setRosterPage] = useState(0)
  const [isDesktopPresentation, setIsDesktopPresentation] = useState(
    () => typeof window === 'undefined' || window.innerWidth > 900,
  )
  const importRef = useRef<HTMLInputElement>(null)
  const roster = loadRoster()
  const rosterPageData = useMemo(() => getPageSlice(roster, rosterPage, ROSTER_PAGE_SIZE), [roster, rosterPage])
  const rosterPagerItems = useMemo<readonly PagePagerItem[]>(
    () => Array.from({ length: rosterPageData.pageCount }, (_, index) => ({
      id: `roster-page-${index}`,
      label: `${index + 1}`,
      hint: `第 ${index + 1} 页学生名册`,
    })),
    [rosterPageData.pageCount],
  )

  useEffect(() => {
    if (rosterPageData.pageIndex !== rosterPage) setRosterPage(rosterPageData.pageIndex)
  }, [rosterPage, rosterPageData.pageIndex])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)')
    const update = () => setIsDesktopPresentation(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const add = () => {
    if (!name.trim()) return
    addStudent(name, avatar, { grade, semester })
    setName('')
    setVersion((v) => v + 1)
  }

  const updateCurriculum = (id: string, next: Partial<{ grade: PrimaryGrade; semester: Semester }>) => {
    updateStudentProfile(id, next)
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
            aria-label="学生姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <label className="roster-select-label">
            年级
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value) as PrimaryGrade)}>
              {PRIMARY_GRADES.map((item) => (
                <option key={item} value={item}>{getGradeLabel(item)}</option>
              ))}
            </select>
          </label>
          <label className="roster-select-label">
            册次
            <select value={semester} onChange={(e) => setSemester(Number(e.target.value) as Semester)}>
              <option value={1}>{getSemesterLabel(1)}</option>
              <option value={2}>{getSemesterLabel(2)}</option>
            </select>
          </label>
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
        {(isDesktopPresentation ? rosterPageData.items : roster).map((s, index) => {
          const stat = studentStat(s.id)
          const active = currentStudentId === s.id
          return (
            <Reveal key={s.id} index={isDesktopPresentation ? rosterPageData.pageIndex * ROSTER_PAGE_SIZE + index : index}>
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
              <div className="stu-card-curriculum">
                <label>
                  年级
                  <select
                    aria-label={`${s.name}年级`}
                    value={s.grade ?? ''}
                    onChange={(e) => {
                      if (e.target.value) updateCurriculum(s.id, { grade: Number(e.target.value) as PrimaryGrade })
                    }}
                  >
                    {!s.grade && <option value="">未设置</option>}
                    {PRIMARY_GRADES.map((item) => (
                      <option key={item} value={item}>{getGradeLabel(item)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  册次
                  <select
                    aria-label={`${s.name}册次`}
                    value={s.semester ?? 1}
                    onChange={(e) => updateCurriculum(s.id, { semester: Number(e.target.value) as Semester })}
                  >
                    <option value={1}>{getSemesterLabel(1)}</option>
                    <option value={2}>{getSemesterLabel(2)}</option>
                  </select>
                </label>
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
      {isDesktopPresentation && rosterPageData.pageCount > 1 && (
        <PagePager
          items={rosterPagerItems}
          activeIndex={rosterPageData.pageIndex}
          onChange={setRosterPage}
          ariaLabel="学生名册分页"
          compact
          showTabs={false}
          className="roster-pager"
        />
      )}
    </div>
  )
}
