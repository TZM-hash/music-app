import { useEffect, useState } from 'react'
import { useApp, type Route } from '../state/appState'
import {
  STUDENT_INSTRUMENT_NAV,
  STUDENT_PRIMARY_NAV,
  STUDENT_SECONDARY_NAV,
} from './studentNavigation'

const INSTRUMENT_ROUTES = STUDENT_INSTRUMENT_NAV.map((item) => item.route)

export default function Sidebar() {
  const { route, navigate } = useApp()
  const openMainRoute = (target: Route) => navigate(target, { history: 'reset' })
  const [instrumentsOpen, setInstrumentsOpen] = useState(() => INSTRUMENT_ROUTES.includes(route))

  useEffect(() => {
    if (INSTRUMENT_ROUTES.includes(route)) setInstrumentsOpen(true)
  }, [route])

  return (
    <aside className="sidebar">
      <button className="side-logo" onClick={() => openMainRoute('home')}>
        <span className="side-logo-icon" aria-hidden="true">
          🎵
        </span>
        <span>
          <span className="side-logo-text">乐动课堂</span>
          <span className="side-logo-sub">课堂探索空间</span>
        </span>
      </button>

      <nav className="side-nav" aria-label="主导航">
        <div className="side-group side-primary-group">
          <div className="side-group-title">音乐空间</div>
          {STUDENT_PRIMARY_NAV.map((item) => (
            <button
              key={item.route}
              className={`side-item ${route === item.route ? 'active' : ''}`}
              onClick={() => openMainRoute(item.route)}
            >
              <span className="side-icon">{item.icon}</span>
              <span className="side-label">
                <b>{item.label}</b>
                <small>{item.hint}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="side-more-group">
          <div className="side-group-title side-more-title">更多入口</div>
          <div className="side-more-list">
            {STUDENT_SECONDARY_NAV.map((item) => (
              <button
                key={item.route}
                className={`side-item ${route === item.route ? 'active' : ''}`}
                onClick={() => openMainRoute(item.route)}
              >
                <span className="side-icon">{item.icon}</span>
                <span className="side-label">
                  <b>{item.label}</b>
                  <small>{item.hint}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <details
          className="side-instrument-group"
          open={instrumentsOpen}
          onToggle={(event) => setInstrumentsOpen(event.currentTarget.open)}
        >
          <summary>乐器</summary>
          <div className="side-instrument-list">
            {STUDENT_INSTRUMENT_NAV.map((item) => (
              <button
                key={item.route}
                className={`side-item ${route === item.route ? 'active' : ''}`}
                onClick={() => openMainRoute(item.route)}
              >
                <span className="side-icon">{item.icon}</span>
                <span className="side-label">
                  <b>{item.label}</b>
                  <small>{item.hint}</small>
                </span>
              </button>
            ))}
          </div>
        </details>
      </nav>

      <div className="side-foot">
        <span>v0.6</span>
        <b>互动课堂为学习主轴</b>
      </div>
    </aside>
  )
}
