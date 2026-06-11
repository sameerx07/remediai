import { Activity, ChevronsLeft, MoreVertical } from 'lucide-react'
import { NAV_ROUTES } from './nav'
import { NavItem } from './NavItem'
import { ThemeToggle } from '../ui/ThemeToggle'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  width: number
}

export function Sidebar({ collapsed, onToggle, width }: SidebarProps) {
  return (
    <aside
      className="fixed top-0 left-0 z-30 hidden h-screen flex-col lg:flex"
      style={{
        width,
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'width 250ms cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo row (with collapse toggle on right) ── */}
      <div
        style={{
          padding: '14px 12px',
          borderBottom: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <span
            style={{
              width: 28, height: 28,
              background: 'var(--color-accent)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Activity style={{ color: '#fff', width: 14, height: 14 }} />
          </span>
          {!collapsed && (
            <span
              style={{
                fontSize: 15, fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
            >
              RemediAI
            </span>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 24, height: 24,
            borderRadius: 6,
            background: 'transparent',
            border: '1px solid var(--sidebar-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all .15s',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--nav-hover-bg)'
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          <ChevronsLeft
            style={{
              width: 13, height: 13,
              color: 'var(--text-faint)',
              transition: 'transform 250ms cubic-bezier(.4,0,.2,1)',
              transform: collapsed ? 'rotate(180deg)' : 'none',
            }}
          />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}
      >
        {NAV_ROUTES.map((route) => (
          <div key={route.to}>
            {route.dividerBefore && (
              <div
                style={{ height: 1, background: 'var(--sidebar-border)', margin: '6px 4px' }}
              />
            )}
            <NavItem route={route} compact={collapsed} />
          </div>
        ))}
      </nav>

      {/* ── Upgrade card (hidden when collapsed) ── */}
      {!collapsed && (
        <div
          className="upgrade-card"
          style={{
            margin: '0 10px 10px',
            borderRadius: 12,
            padding: 14,
            background: 'var(--upgrade-gradient)',
          }}
        >
          <UpgradeCardContent />
        </div>
      )}

      {/* ── Theme switcher ── */}
      <div
        style={{
          padding: '6px 8px',
          borderTop: '1px solid var(--sidebar-border)',
          borderBottom: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          overflow: 'hidden',
        }}
      >
        <ThemeToggle compact={collapsed} className={collapsed ? undefined : 'w-full'} />
      </div>

      {/* ── User row ── */}
      <div
        style={{
          padding: '10px 12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            width: 32, height: 32,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff',
            flexShrink: 0,
          }}
        >
          AK
        </span>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                Anji Keesari
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
                admin@remediai.dev
              </div>
            </div>
            <MoreVertical
              style={{ color: 'var(--text-faint)', width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
            />
          </>
        )}
      </div>
    </aside>
  )
}

// ── Upgrade card content — theme-adaptive ─────────────────────────────────────

function UpgradeCardContent() {
  return (
    <>
      <div
        className="upgrade-card-title"
        style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}
      >
        Upgrade to Pro
      </div>
      <div
        className="upgrade-card-desc"
        style={{ fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}
      >
        Get unlimited access to AI analytics and priority support.
      </div>
      <UpgradeButton />
    </>
  )
}

function UpgradeButton() {
  return (
    <button
      type="button"
      className="upgrade-card-btn"
      style={{
        width: '100%',
        fontSize: 11.5,
        fontWeight: 700,
        padding: '6px 0',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        transition: 'opacity .15s',
      }}
      onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '.85' }}
      onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
    >
      Upgrade Now
    </button>
  )
}
