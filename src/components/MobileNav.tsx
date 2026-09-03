import { useApp } from '../state/appState'
import { STUDENT_PRIMARY_NAV } from './studentNavigation'

export default function MobileNav() {
  const { route, navigate } = useApp()

  return (
    <nav className="mobile-nav" aria-label="移动端主导航">
      {STUDENT_PRIMARY_NAV.map((item) => (
        <button
          key={item.route}
          type="button"
          className={route === item.route ? 'active' : ''}
          onClick={() => navigate(item.route, { history: 'reset' })}
          aria-current={route === item.route ? 'page' : undefined}
        >
          <span aria-hidden="true">{item.icon}</span>
          <b>{item.label}</b>
        </button>
      ))}
    </nav>
  )
}

