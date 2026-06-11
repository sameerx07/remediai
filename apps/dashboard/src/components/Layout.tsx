import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, X } from 'lucide-react'
import { getIntegrationsHealth } from '../api/integrations'
import { AppShell } from './shell/AppShell'
import { Button } from './ui/Button'

const BANNER_DISMISS_KEY = 'remediai.integrationWarnings.dismissed'

export function Layout() {
  const location = useLocation()
  const isLogsPage = location.pathname === '/logs'
  const { data: integrations } = useQuery({
    queryKey: ['integrations-health'],
    queryFn: getIntegrationsHealth,
  })

  const warningText = useMemo(() => integrations?.warnings.join(' ') ?? '', [integrations])
  const [dismissedWarning, setDismissedWarning] = useState('')

  useEffect(() => {
    setDismissedWarning(localStorage.getItem(BANNER_DISMISS_KEY) ?? '')
  }, [])

  const showWarningBanner = Boolean(
    warningText && warningText.length > 0 && warningText !== dismissedWarning,
  )

  function dismissWarnings() {
    if (!warningText) return
    localStorage.setItem(BANNER_DISMISS_KEY, warningText)
    setDismissedWarning(warningText)
  }

  return (
    <AppShell>
      <div className="space-y-5 page-enter">

        {/* Warning banner — hidden on Logs page */}
        {!isLogsPage && showWarningBanner && (
          <div
            className="flex items-start gap-3 rounded-xl border px-4 py-3.5"
            style={{
              borderColor: 'var(--color-warning-muted)',
              backgroundColor: 'var(--color-warning-muted)',
            }}
          >
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: 'var(--color-warning)' }}
            />
            <p className="flex-1 text-sm leading-relaxed text-text-1">{warningText}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={dismissWarnings}
              className="shrink-0 -mr-1 text-text-2"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <Outlet />
      </div>
    </AppShell>
  )
}
