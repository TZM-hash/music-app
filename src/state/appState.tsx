// 全局应用状态：模式（教师/学生）、导航、当前学生、当前曲目
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react'
import { findStudentById, getCurrentStudentId, loadRoster, setCurrentStudentId } from './students'
import { createTheoryFocus, TheoryFocus } from './theoryFocus'
import type { TheoryStageId } from '../music/theoryCatalog'
import { normalizeClassName, parseGradeSelection } from './learningScope'
import type { PrimaryGrade } from '../music/zhejiangCurriculum'
import {
  applyRouteNavigation,
  backButtonLabel,
  popRouteHistory,
  RouteNavigationOptions,
  RouteHistoryState,
} from './navigationHistory'

export type AppMode = 'teacher' | 'lecture' | 'student'
export type Route =
  | 'home'
  | 'lesson'
  | 'course'
  | 'training'
  | 'adventure'
  | 'piano'
  | 'drums'
  | 'mixer'
  | 'recorder'
  | 'xylophone'
  | 'game-ear'
  | 'game-echo'
  | 'game-taiko'
  | 'game-sing'
  | 'game-read'
  | 'library'
  | 'theory'
  | 'class'
  | 'dashboard'

interface AppState {
  mode: AppMode
  route: Route
  returnStack: Route[]
  canGoBack: boolean
  backLabel: string
  /** 最近一次导航方向：前进（push）或后退（pop），供转场动画使用 */
  navDirection: 'forward' | 'back'
  showNoteNames: boolean
  currentStudentId: string | null
  /** 顶部全局教材年级筛选；为空时显示全部小学年级内容 */
  selectedGrade: PrimaryGrade | null
  /** 顶部全局班级筛选；为空时显示全部班级 */
  selectedClass: string | null
  /** 供游戏使用的当前选中曲目 id（从曲库跳转时带入） */
  activeSongId: string | null
  /** 从成长路线/学段总览进入音乐探索馆时携带的筛选焦点 */
  theoryFocus: TheoryFocus | null
  /** 从学段总览进入互动课堂时携带的学段（lesson 为学习主轴） */
  lessonStage: TheoryStageId | null
  /** 当前互动课堂承载的探索单元；缺省时由页面回退到茉莉花试点 */
  explorationUnitId: string | null
  /** 窄屏时侧边栏是否展开 */
  sidebarOpen: boolean
  setMode: (m: AppMode) => void
  navigate: (r: Route, options?: RouteNavigationOptions) => void
  openTheory: (focus?: TheoryFocus, options?: RouteNavigationOptions) => void
  /** 进入互动课堂，可携带学段（让顶部 tab 自动落到该学段） */
  openLesson: (stage?: TheoryStageId, options?: RouteNavigationOptions) => void
  /** 进入音乐探索剧场，默认打开茉莉花试点 */
  openExploration: (unitId?: string, options?: RouteNavigationOptions) => void
  goBack: () => void
  toggleNoteNames: () => void
  selectGrade: (grade: PrimaryGrade | null) => void
  selectClass: (className: string | null) => void
  selectStudent: (id: string | null) => void
  playSongInGame: (songId: string, route: Route) => void
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
}

const Ctx = createContext<AppState | null>(null)

const PREF_KEY = 'music-edu-prefs-v1'
interface Prefs {
  mode: AppMode
  showNoteNames: boolean
  selectedGrade?: PrimaryGrade | null
  selectedClass?: string | null
}
function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw) {
      const parsed = { mode: 'teacher', showNoteNames: true, ...JSON.parse(raw) } as Prefs
      // mode 非法时只纠正 mode，保留用户其它有效偏好（如 showNoteNames）
      if (!['teacher', 'lecture', 'student'].includes(parsed.mode)) {
        return { ...parsed, mode: 'teacher' }
      }
      if (parsed.selectedGrade !== undefined)
        parsed.selectedGrade = parseGradeSelection(parsed.selectedGrade)
      if (parsed.selectedClass !== undefined) {
        parsed.selectedClass =
          typeof parsed.selectedClass === 'string' && parsed.selectedClass.trim()
            ? parsed.selectedClass.trim()
            : null
      }
      return parsed
    }
  } catch {
    /* ignore */
  }
  return { mode: 'teacher', showNoteNames: true }
}
function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = loadPrefs()
  const [mode, setModeState] = useState<AppMode>(initial.mode)
  const [navigation, setNavigation] = useState<RouteHistoryState>({ route: 'home', stack: [] })
  const { route, stack: returnStack } = navigation
  const [navDirection, setNavDirection] = useState<'forward' | 'back'>('forward')
  const [showNoteNames, setShowNoteNames] = useState(initial.showNoteNames)
  const [currentStudentId, setCurrentId] = useState<string | null>(() => getCurrentStudentId())
  const [selectedGrade, setSelectedGradeState] = useState<PrimaryGrade | null>(() => {
    if (initial.selectedGrade !== undefined) return initial.selectedGrade ?? null
    return findStudentById(loadRoster(), getCurrentStudentId())?.grade ?? null
  })
  const [selectedClass, setSelectedClassState] = useState<string | null>(() => {
    if (initial.selectedClass !== undefined) return initial.selectedClass ?? null
    const student = findStudentById(loadRoster(), getCurrentStudentId())
    return student ? normalizeClassName(student.className) : null
  })
  const [activeSongId, setActiveSongId] = useState<string | null>(null)
  const [theoryFocus, setTheoryFocus] = useState<TheoryFocus | null>(null)
  const [lessonStage, setLessonStage] = useState<TheoryStageId | null>(null)
  const [explorationUnitId, setExplorationUnitId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 偏好持久化
  useEffect(() => {
    savePrefs({ mode, showNoteNames, selectedGrade, selectedClass })
  }, [mode, showNoteNames, selectedGrade, selectedClass])

  const setMode = useCallback((m: AppMode) => setModeState(m), [])
  const navigate = useCallback((r: Route, options?: RouteNavigationOptions) => {
    setNavigation((current) => applyRouteNavigation(current, r, options))
    setNavDirection('forward')
    setSidebarOpen(false) // 导航后自动收起（窄屏）
  }, [])
  const openTheory = useCallback((focus?: TheoryFocus, options?: RouteNavigationOptions) => {
    setTheoryFocus(focus ? createTheoryFocus(focus) : null)
    setNavigation((current) => applyRouteNavigation(current, 'theory', options))
    setNavDirection('forward')
    setSidebarOpen(false)
  }, [])
  const openLesson = useCallback((stage?: TheoryStageId, options?: RouteNavigationOptions) => {
    if (stage) setLessonStage(stage)
    setNavigation((current) => applyRouteNavigation(current, 'lesson', options))
    setNavDirection('forward')
    setSidebarOpen(false)
  }, [])
  const openExploration = useCallback((unitId = 'jasmine', options?: RouteNavigationOptions) => {
    setExplorationUnitId(unitId)
    setNavigation((current) => applyRouteNavigation(current, 'lesson', options))
    setNavDirection('forward')
    setSidebarOpen(false)
  }, [])
  const goBack = useCallback(() => {
    setNavigation((current) => popRouteHistory(current))
    setNavDirection('back')
    setSidebarOpen(false)
  }, [])
  const toggleNoteNames = useCallback(() => setShowNoteNames((v) => !v), [])
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), [])

  const selectGrade = useCallback(
    (grade: PrimaryGrade | null) => {
      setSelectedGradeState(grade)
      if (!currentStudentId || grade === null) return
      const current = findStudentById(loadRoster(), currentStudentId)
      if (current && current.grade !== grade) {
        setCurrentId(null)
        setCurrentStudentId(null)
      }
    },
    [currentStudentId]
  )

  const selectClass = useCallback(
    (className: string | null) => {
      const nextClass = className?.trim() || null
      setSelectedClassState(nextClass)
      if (!currentStudentId || nextClass === null) return
      const current = findStudentById(loadRoster(), currentStudentId)
      if (current && normalizeClassName(current.className) !== nextClass) {
        setCurrentId(null)
        setCurrentStudentId(null)
      }
    },
    [currentStudentId]
  )

  const selectStudent = useCallback((id: string | null) => {
    setCurrentId(id)
    setCurrentStudentId(id)
    const student = id ? findStudentById(loadRoster(), id) : null
    if (student?.grade) setSelectedGradeState(student.grade)
    if (student) setSelectedClassState(normalizeClassName(student.className))
  }, [])

  const playSongInGame = useCallback((songId: string, r: Route) => {
    setActiveSongId(songId)
    setNavigation((current) => applyRouteNavigation(current, r))
    setNavDirection('forward')
    setSidebarOpen(false)
  }, [])

  // 切到非游戏页时清空 activeSong，避免串曲
  useEffect(() => {
    if (!route.startsWith('game-')) setActiveSongId(null)
  }, [route])

  // 离开音乐探索馆后清掉筛选焦点，避免下次进入仍停在旧主题。
  useEffect(() => {
    if (route !== 'theory' && theoryFocus) setTheoryFocus(null)
  }, [route, theoryFocus])

  // 离开互动课堂后清掉携带的学段，避免下次进入仍强制回到旧学段。
  useEffect(() => {
    if (route !== 'lesson' && lessonStage) setLessonStage(null)
  }, [route, lessonStage])

  useEffect(() => {
    if (route !== 'lesson' && explorationUnitId) setExplorationUnitId(null)
  }, [route, explorationUnitId])

  // memo 化 context value：否则每次 Provider 重渲染都会生成新对象，
  // 导致所有 useApp() 消费者（几乎全站）无差别重渲染。
  const value = useMemo<AppState>(
    () => ({
      mode,
      route,
      returnStack,
      canGoBack: returnStack.length > 0,
      backLabel: backButtonLabel(returnStack),
      navDirection,
      showNoteNames,
      currentStudentId,
      selectedGrade,
      selectedClass,
      activeSongId,
      theoryFocus,
      lessonStage,
      explorationUnitId,
      sidebarOpen,
      setMode,
      navigate,
      openTheory,
      openLesson,
      openExploration,
      goBack,
      toggleNoteNames,
      selectGrade,
      selectClass,
      selectStudent,
      playSongInGame,
      toggleSidebar,
      setSidebarOpen,
    }),
    [
      mode,
      route,
      returnStack,
      navDirection,
      showNoteNames,
      currentStudentId,
      selectedGrade,
      selectedClass,
      activeSongId,
      theoryFocus,
      lessonStage,
      explorationUnitId,
      sidebarOpen,
      setMode,
      navigate,
      openTheory,
      openLesson,
      openExploration,
      goBack,
      toggleNoteNames,
      selectGrade,
      selectClass,
      selectStudent,
      playSongInGame,
      toggleSidebar,
    ]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook 与 Provider 同文件导出
export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
