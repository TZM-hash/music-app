// 全局应用状态：模式（教师/学生）、导航、当前学生、当前曲目
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { getCurrentStudentId, setCurrentStudentId } from './students'
import { createTheoryFocus, TheoryFocus } from './theoryFocus'
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
  | 'battle'
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
  showNoteNames: boolean
  currentStudentId: string | null
  /** 供游戏使用的当前选中曲目 id（从曲库跳转时带入） */
  activeSongId: string | null
  /** 从成长路线/闯关岛进入音乐探索馆时携带的筛选焦点 */
  theoryFocus: TheoryFocus | null
  /** 窄屏时侧边栏是否展开 */
  sidebarOpen: boolean
  setMode: (m: AppMode) => void
  navigate: (r: Route, options?: RouteNavigationOptions) => void
  openTheory: (focus?: TheoryFocus, options?: RouteNavigationOptions) => void
  goBack: () => void
  toggleNoteNames: () => void
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
}
function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw) {
      const parsed = { mode: 'teacher', showNoteNames: true, ...JSON.parse(raw) } as Prefs
      if (!['teacher', 'lecture', 'student'].includes(parsed.mode)) return { mode: 'teacher', showNoteNames: true }
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
  const [showNoteNames, setShowNoteNames] = useState(initial.showNoteNames)
  const [currentStudentId, setCurrentId] = useState<string | null>(() => getCurrentStudentId())
  const [activeSongId, setActiveSongId] = useState<string | null>(null)
  const [theoryFocus, setTheoryFocus] = useState<TheoryFocus | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 偏好持久化
  useEffect(() => {
    savePrefs({ mode, showNoteNames })
  }, [mode, showNoteNames])

  const setMode = useCallback((m: AppMode) => setModeState(m), [])
  const navigate = useCallback((r: Route, options?: RouteNavigationOptions) => {
    setNavigation((current) => applyRouteNavigation(current, r, options))
    setSidebarOpen(false) // 导航后自动收起（窄屏）
  }, [])
  const openTheory = useCallback((focus?: TheoryFocus, options?: RouteNavigationOptions) => {
    setTheoryFocus(focus ? createTheoryFocus(focus) : null)
    setNavigation((current) => applyRouteNavigation(current, 'theory', options))
    setSidebarOpen(false)
  }, [])
  const goBack = useCallback(() => {
    setNavigation((current) => popRouteHistory(current))
    setSidebarOpen(false)
  }, [])
  const toggleNoteNames = useCallback(() => setShowNoteNames((v) => !v), [])
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), [])

  const selectStudent = useCallback((id: string | null) => {
    setCurrentId(id)
    setCurrentStudentId(id)
  }, [])

  const playSongInGame = useCallback((songId: string, r: Route) => {
    setActiveSongId(songId)
    setNavigation((current) => applyRouteNavigation(current, r))
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

  return (
    <Ctx.Provider
      value={{
        mode,
        route,
        returnStack,
        canGoBack: returnStack.length > 0,
        backLabel: backButtonLabel(returnStack),
        showNoteNames,
        currentStudentId,
        activeSongId,
        theoryFocus,
        sidebarOpen,
        setMode,
        navigate,
        openTheory,
        goBack,
        toggleNoteNames,
        selectStudent,
        playSongInGame,
        toggleSidebar,
        setSidebarOpen,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
