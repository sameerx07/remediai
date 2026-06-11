import { Bell, Plus, Search } from 'lucide-react'
import { useTheme } from './ThemeContext'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DesktopHeader() {
  const { theme } = useTheme()
  const dark = theme === 'ocean' || theme === 'docker-dark'

  return (
    <header
      className="sticky top-0 z-20 hidden h-[56px] items-center justify-between px-6 lg:flex"
      style={{
        backgroundColor: dark
          ? 'color-mix(in srgb, var(--color-surface) 90%, transparent)'
          : 'color-mix(in srgb, var(--color-bg) 90%, transparent)',
        backdropFilter: 'blur(12px) saturate(180%)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Left — greeting */}
      <p className="text-[14px] font-semibold text-text-1">
        {getGreeting()}, <span style={{ color: 'var(--color-accent)' }}>Anji</span>
      </p>

      {/* Right — search · bell · avatar · new */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-150"
          style={{
            background: 'var(--color-surface-2)',
            border: '1.5px solid var(--color-border)',
          }}
          onFocus={(e) => {
            ;(e.currentTarget as HTMLDivElement).style.borderColor =
              'var(--color-accent)'
          }}
          onBlur={(e) => {
            ;(e.currentTarget as HTMLDivElement).style.borderColor =
              'var(--color-border)'
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-3)' }} />
          <input
            type="search"
            placeholder="Search platforms, contacts..."
            className="w-[180px] bg-transparent text-[12.5px] outline-none placeholder:text-text-3"
            style={{ color: 'var(--color-text-1)' }}
          />
        </div>

        {/* Bell */}
        <div className="relative">
          <button
            type="button"
            aria-label="View notifications"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-all duration-150 hover:bg-surface-2"
          >
            <Bell className="h-4 w-4" style={{ color: 'var(--color-text-2)' }} />
          </button>
          {/* pulse dot */}
          <span
            className="absolute right-1.5 top-1.5 block h-1.5 w-1.5 rounded-full"
            style={{
              background: '#EF4444',
              boxShadow: '0 0 0 1.5px var(--color-surface)',
              animation: 'pulse-dot 1.8s ease-in-out infinite',
            }}
          />
        </div>

        {/* Avatar */}
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: 'var(--gradient-accent)' }}
        >
          AK
        </span>

        {/* New incident */}
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white transition-all duration-150 hover:brightness-110"
          style={{ background: 'var(--color-accent)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>
    </header>
  )
}
