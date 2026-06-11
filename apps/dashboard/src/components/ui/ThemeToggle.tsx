import { Sun, Monitor, Moon } from 'lucide-react'
import { clsx } from 'clsx'
import { useTheme } from '../shell/ThemeContext'

interface ThemeToggleProps {
  compact?: boolean
  className?: string
}

const THEMES = [
  { key: 'light'       as const, icon: Sun,     label: 'Light'  },
  { key: 'ocean'       as const, icon: Monitor, label: 'Ocean'  },
  { key: 'docker-dark' as const, icon: Moon,    label: 'Docker' },
]

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme } = useTheme()

  if (compact) {
    const current = THEMES.find((t) => t.key === theme) ?? THEMES[0]
    const Icon = current.icon
    return (
      <button
        type="button"
        id="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Current theme: ${current.label}. Click to cycle theme.`}
        title={`Theme: ${current.label}`}
        className={clsx(
          'flex h-8 w-8 items-center justify-center rounded-lg border border-border',
          'transition-all duration-150 hover:bg-surface-2',
          className,
        )}
      >
        <Icon className="h-3.5 w-3.5 text-accent" />
      </button>
    )
  }

  return (
    <div
      className={clsx('flex items-center gap-0.5 rounded-lg p-0.5', className)}
      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
      role="group"
      aria-label="Theme selector"
    >
      {THEMES.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setTheme(key)}
          aria-pressed={theme === key}
          title={label}
          className={clsx(
            'flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150',
            theme === key
              ? 'text-accent'
              : 'text-text-3 hover:text-text-2',
          )}
          style={
            theme === key
              ? {
                  background: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--color-border-2)',
                }
              : { background: 'transparent', border: '1px solid transparent' }
          }
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
}
