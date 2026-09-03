import { useEffect, useRef, useState } from 'react'
import { AppProvider, useApp } from './state/appState'
import { stopAllAudio } from './music/audioEngine'
import { stopUISounds } from './music/uiSounds'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import Celebration from './components/Celebration'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import LessonMode from './pages/LessonMode'
import Piano from './pages/Piano'
import Drums from './pages/Drums'
import Mixer from './pages/Mixer'
import Recorder from './pages/Recorder'
import Xylophone from './pages/Xylophone'
import EarGame from './pages/games/EarGame'
import EchoGame from './pages/games/EchoGame'
import TaikoGame from './pages/games/TaikoGame'
import SingGame from './pages/games/SingGame'
import ReadGame from './pages/games/ReadGame'
import Library from './pages/Library'
import Theory from './pages/Theory'
import CourseCenter from './pages/CourseCenter'
import TrainingCenter from './pages/TrainingCenter'
import AdventureMap from './pages/AdventureMap'
import ClassRoster from './pages/ClassRoster'
import Dashboard from './pages/Dashboard'

function Shell() {
  const { mode, route, sidebarOpen, setSidebarOpen, navigate, navDirection } = useApp()

  // 路由切换时先播放旧页面退出动画，再挂载新页面
  const [displayedRoute, setDisplayedRoute] = useState(route)
  const [leaving, setLeaving] = useState(false)
  const leaveTimer = useRef<number | null>(null)

  useEffect(() => {
    if (route === displayedRoute) return
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current)
    setLeaving(true)
    leaveTimer.current = window.setTimeout(() => {
      setDisplayedRoute(route)
      setLeaving(false)
      leaveTimer.current = null
    }, 150)
    return () => {
      if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current)
    }
  }, [route, displayedRoute])

  useEffect(() => {
    if (mode !== 'teacher' && (route === 'class' || route === 'dashboard')) {
      navigate('home', { history: 'reset' })
    }
  }, [mode, route, navigate])

  // 切换页面时停掉一切后台音频（伴奏/节拍器/持续音/UI 延迟音效），避免残留
  useEffect(() => {
    stopAllAudio()
    stopUISounds()
  }, [route])

  const isInstrument = displayedRoute === 'piano' || displayedRoute === 'drums' || displayedRoute === 'recorder' || displayedRoute === 'xylophone'
  const isGame = displayedRoute.startsWith('game-')

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="main-col">
        <TopBar />
        <div
          className={`content route-${displayedRoute} ${isInstrument ? 'content-instrument' : ''} ${isGame ? 'content-game' : ''} ${leaving ? 'leaving' : ''} ${navDirection === 'back' ? 'nav-back' : 'nav-forward'}`}
        >
          <ErrorBoundary key={displayedRoute} onReset={() => navigate('home', { history: 'reset' })}>
            {displayedRoute === 'home' && <Home />}
            {displayedRoute === 'lesson' && <LessonMode />}
            {displayedRoute === 'piano' && <Piano />}
            {displayedRoute === 'drums' && <Drums />}
            {displayedRoute === 'mixer' && <Mixer />}
            {displayedRoute === 'recorder' && <Recorder />}
            {displayedRoute === 'xylophone' && <Xylophone />}
            {displayedRoute === 'game-ear' && <EarGame />}
            {displayedRoute === 'game-echo' && <EchoGame />}
            {displayedRoute === 'game-taiko' && <TaikoGame />}
            {displayedRoute === 'game-sing' && <SingGame />}
            {displayedRoute === 'game-read' && <ReadGame />}
            {displayedRoute === 'library' && <Library />}
            {displayedRoute === 'theory' && <Theory />}
            {displayedRoute === 'course' && <CourseCenter />}
            {displayedRoute === 'training' && <TrainingCenter />}
            {displayedRoute === 'adventure' && <AdventureMap />}
            {mode === 'teacher' && displayedRoute === 'class' && <ClassRoster />}
            {mode === 'teacher' && displayedRoute === 'dashboard' && <Dashboard />}
          </ErrorBoundary>
        </div>
      </div>
      <MobileNav />
      <Celebration />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
