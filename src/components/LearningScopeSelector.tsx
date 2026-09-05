import { useApp } from '../state/appState'
import { getGradeLabel, PRIMARY_GRADES } from '../music/zhejiangCurriculum'
import { classOptionsForRoster, parseGradeSelection } from '../state/learningScope'
import { loadRoster } from '../state/students'

/** 顶栏的全局教学范围选择：年级控制教材内容，班级控制学生上下文。 */
export default function LearningScopeSelector() {
  const { selectedGrade, selectedClass, selectGrade, selectClass } = useApp()
  const roster = loadRoster()
  const classOptions = (() => {
    const options = classOptionsForRoster(roster, selectedGrade)
    if (selectedClass && !options.includes(selectedClass)) options.push(selectedClass)
    return options
  })()

  return (
    <div className="learning-scope-selector" aria-label="教学范围">
      <label className="scope-select">
        <span className="scope-select-label">年级</span>
        <select
          aria-label="选择年级"
          value={selectedGrade === null ? '' : String(selectedGrade)}
          onChange={(event) => selectGrade(parseGradeSelection(event.target.value))}
        >
          <option value="">选择年级</option>
          {PRIMARY_GRADES.map((grade) => (
            <option key={grade} value={grade}>
              {getGradeLabel(grade)}
            </option>
          ))}
        </select>
      </label>

      <label className="scope-select">
        <span className="scope-select-label">班级</span>
        <select
          aria-label="选择班级"
          value={selectedClass ?? ''}
          onChange={(event) => selectClass(event.target.value || null)}
        >
          <option value="">选择班级</option>
          {classOptions.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
