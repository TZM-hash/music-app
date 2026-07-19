import { useEffect } from 'react'
import { AppProvider, useApp } from './state/appState'
import { stopAllAudio } from './music/audioEngine'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import Celebration from './components/Celebration'
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
  const { mode, route, sidebarOpen, setSidebarOpen, navigate } = useApp()

  useEffect(() => {
    if (mode !== 'teacher' && (route === 'class' || route === 'dashboard')) {
      navigate('home', { history: 'reset' })
    }
  }, [mode, route, navigate])

  // 切换页面时停掉一切后台音频（伴奏/节拍器/持续音），避免残留
  useEffect(() => {
    stopAllAudio()
  }, [route])

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="main-col">
        <TopBar />
        <div className={`content route-${route}`}>
          {route === 'home' && <Home />}
          {route === 'lesson' && <LessonMode />}
          {route === 'piano' && <Piano />}
          {route === 'drums' && <Drums />}
          {route === 'mixer' && <Mixer />}
          {route === 'recorder' && <Recorder />}
          {route === 'xylophone' && <Xylophone />}
          {route === 'game-ear' && <EarGame />}
          {route === 'game-echo' && <EchoGame />}
          {route === 'game-taiko' && <TaikoGame />}
          {route === 'game-sing' && <SingGame />}
          {route === 'game-read' && <ReadGame />}
          {route === 'library' && <Library />}
          {route === 'theory' && <Theory />}
          {route === 'course' && <CourseCenter />}
          {route === 'training' && <TrainingCenter />}
          {route === 'adventure' && <AdventureMap />}
          {mode === 'teacher' && route === 'class' && <ClassRoster />}
          {mode === 'teacher' && route === 'dashboard' && <Dashboard />}
        </div>
      </div>
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
