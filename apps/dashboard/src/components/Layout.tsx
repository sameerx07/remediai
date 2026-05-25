import { NavLink, Outlet } from 'react-router-dom'
import { clsx } from 'clsx'

const NAV = [
  { to: '/incidents', label: 'Incidents' },
  { to: '/metrics', label: 'Metrics' },
  { to: '/logs', label: 'Logs' },
]

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-3">
          <span className="text-lg font-bold text-indigo-700">RemediAI</span>
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'text-sm font-medium transition-colors',
                  isActive ? 'text-indigo-700' : 'text-gray-500 hover:text-gray-900',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
