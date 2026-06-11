import { useState, useMemo, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  Clipboard,
  Download,
  Filter,
  Play,
  Square,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { fetchLocalLogs } from '../api/localLogs'
import { EmptyState } from '../components/ui/EmptyState'
import type { LogLine } from '../types/localLogs'

// ── constants ────────────────────────────────────────────────────────────────

const CONTAINERS = ['api', 'worker', 'dashboard']

const LEVEL_BORDER: Record<string, string> = {
  ERROR:    'var(--color-error)',
  CRITICAL: 'var(--color-critical)',
  WARNING:  'var(--color-warning)',
  WARN:     'var(--color-warning)',
  INFO:     'var(--color-success)',
  DEBUG:    'var(--color-accent)',
}

const LEVEL_PILL: Record<string, { color: string; bg: string }> = {
  ERROR:    { color: 'var(--color-error)',   bg: 'var(--color-error-muted)'   },
  CRITICAL: { color: 'var(--color-critical)', bg: 'var(--color-error-muted)'  },
  WARNING:  { color: 'var(--color-warning)', bg: 'var(--color-warning-muted)' },
  WARN:     { color: 'var(--color-warning)', bg: 'var(--color-warning-muted)' },
  INFO:     { color: 'var(--color-success)', bg: 'var(--color-success-muted)' },
  DEBUG:    { color: 'var(--color-accent)',  bg: 'var(--color-accent-muted)'  },
}

type QuickFilter = 'errors' | 'auth' | 'last1h' | 'slow'

const QUICK_CHIPS: Array<{ id: QuickFilter; label: string }> = [
  { id: 'errors', label: 'Errors'  },
  { id: 'auth',   label: 'Auth'    },
  { id: 'last1h', label: 'Last 1h' },
  { id: 'slow',   label: 'Slow'    },
]

// ── shared style helpers ──────────────────────────────────────────────────────

const LOG_BTN =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border font-semibold transition-all duration-150 whitespace-nowrap'
const LOG_BTN_GHOST =
  'border-border-2 bg-transparent text-text-3 hover:text-text-1'
const LOG_BTN_SM = 'px-2 py-1.5 text-[11px]'

const LOG_SELECT =
  'rounded-lg border border-border-2 bg-surface-3 text-[12px] text-text-1 ' +
  'px-2.5 py-1.5 outline-none hover:border-accent transition-colors cursor-pointer ' +
  'appearance-none'

// ── LogRow ────────────────────────────────────────────────────────────────────

interface LogRowProps {
  log: LogLine
  showTimestamp: boolean
  wrapLines: boolean
  search: string
  onIncidentClick: (id: string) => void
}

function LogRow({ log, showTimestamp, wrapLines, search, onIncidentClick }: LogRowProps) {
  const level = log.level.toUpperCase()
  const borderColor = LEVEL_BORDER[level] ?? 'rgba(145,158,171,0.35)'
  const pill = LEVEL_PILL[level] ?? { color: '#8a97ac', bg: 'rgba(138,151,172,.15)' }

  const parts = useMemo(() => {
    if (!search.trim()) return null
    const q = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return log.line.split(new RegExp(`(${q})`, 'gi'))
  }, [log.line, search])

  return (
    <div
      style={{
        display: 'block',
        padding: '2px 12px 2px 10px',
        borderLeft: `3px solid ${borderColor}`,
        borderBottom: '1px solid var(--color-border)',
        whiteSpace: wrapLines ? 'pre-wrap' : 'pre',
        wordBreak: wrapLines ? 'break-word' : 'normal',
        overflowX: wrapLines ? 'visible' : 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: '12px',
        lineHeight: '1.38',
      }}
    >
      {showTimestamp && (
        <span style={{ color: 'var(--color-text-3)', opacity: 0.9, marginRight: 6 }}>
          {new Date(log.ts).toLocaleString()}
        </span>
      )}
      <span
        style={{
          display: 'inline-block',
          minWidth: 48,
          textAlign: 'center',
          fontSize: 10,
          fontWeight: 700,
          borderRadius: 999,
          padding: '1px 7px',
          marginRight: 7,
          letterSpacing: '.02em',
          color: pill.color,
          background: pill.bg,
        }}
      >
        {level.slice(0, 5)}
      </span>
      <span
        style={{
          display: 'inline-block',
          fontSize: 10,
          fontWeight: 500,
          borderRadius: 4,
          padding: '1px 5px',
          marginRight: 8,
          background: 'var(--color-surface-3)',
          color: 'var(--color-text-3)',
          border: '1px solid var(--color-border-2)',
        }}
      >
        {log.container}
      </span>
      <span style={{ color: log.is_exception ? 'var(--color-error)' : 'var(--color-text-1)' }}>
        {parts
          ? parts.map((part, i) =>
              part.toLowerCase() === search.toLowerCase() ? (
                <mark
                  key={i}
                  style={{ background: 'rgba(245,166,35,.35)', color: '#fde68a', borderRadius: 2 }}
                >
                  {part}
                </mark>
              ) : (
                <span key={i}>{part}</span>
              ),
            )
          : log.line}
      </span>
      {log.is_exception && log.incident_id && (
        <button
          type="button"
          onClick={() => onIncidentClick(log.incident_id!)}
          style={{
            marginLeft: 8,
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 4,
            padding: '1px 7px',
            background: 'rgba(244,63,94,.14)',
            color: '#f43f5e',
            border: '1px solid rgba(244,63,94,.28)',
            cursor: 'pointer',
          }}
        >
          Incident →
        </button>
      )}
    </div>
  )
}

// ── AdvancedPopover ───────────────────────────────────────────────────────────

interface AdvancedPopoverProps {
  timeFilter: string
  sortOrder: string
  onTimeChange: (v: string) => void
  onSortChange: (v: string) => void
  onClose: () => void
}

function AdvancedPopover({
  timeFilter,
  sortOrder,
  onTimeChange,
  onSortChange,
  onClose,
}: AdvancedPopoverProps) {
  return (
    <div
      className="absolute right-0 z-50 w-[280px] rounded-xl p-3"
      style={{
        top: 'calc(100% + 6px)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-2)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <p
        className="mb-2 text-[10px] font-semibold uppercase tracking-[.06em]"
        style={{ color: 'var(--color-text-3)' }}
      >
        Advanced Controls
      </p>
      <div className="flex flex-col gap-2">
        <select
          value={timeFilter}
          onChange={(e) => onTimeChange(e.target.value)}
          className={LOG_SELECT}
          style={{ width: '100%' }}
        >
          <option value="all">Time: All</option>
          <option value="15m">Last 15m</option>
          <option value="1h">Last 1h</option>
          <option value="6h">Last 6h</option>
          <option value="24h">Last 24h</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value)}
          className={LOG_SELECT}
          style={{ width: '100%' }}
        >
          <option value="timestamp_desc">Newest first</option>
          <option value="timestamp_asc">Oldest first</option>
          <option value="level_desc">By severity</option>
        </select>
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className={clsx(LOG_BTN, LOG_BTN_GHOST, LOG_BTN_SM)}
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ── SettingRow ────────────────────────────────────────────────────────────────

function SettingRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 py-1.5"
      style={{
        borderBottom: '1px solid var(--color-border)',
        fontSize: 12,
        color: 'var(--color-text-2)',
      }}
    >
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          accentColor: 'var(--color-accent)',
          width: 14,
          height: 14,
          cursor: 'pointer',
        }}
      />
    </div>
  )
}

// ── LocalLogsPage ─────────────────────────────────────────────────────────────

export function LocalLogsPage() {
  const navigate = useNavigate()
  const consoleRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [container, setContainer] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [wrapLines, setWrapLines] = useState(false)
  const [showTimestamp, setShowTimestamp] = useState(true)
  const [timeFilter, setTimeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('timestamp_desc')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['local-logs', container],
    queryFn: () => fetchLocalLogs({ container: container || undefined, limit: 200 }),
    refetchInterval: autoRefresh ? 2000 : false,
    staleTime: 0,
  })

  const filteredLogs = useMemo(() => {
    if (!data) return []
    const now = Date.now()
    let logs = [...data]

    if (quickFilter === 'errors') {
      logs = logs.filter((l) => {
        const lvl = l.level.toUpperCase()
        return lvl === 'ERROR' || lvl === 'CRITICAL'
      })
    } else if (quickFilter === 'auth') {
      logs = logs.filter(
        (l) =>
          l.line.toLowerCase().includes('auth') ||
          l.container.toLowerCase().includes('auth'),
      )
    } else if (quickFilter === 'last1h') {
      logs = logs.filter((l) => now - new Date(l.ts).getTime() <= 60 * 60 * 1000)
    } else if (quickFilter === 'slow') {
      logs = logs.filter(
        (l) =>
          l.line.toLowerCase().includes('slow') ||
          l.line.toLowerCase().includes('timeout'),
      )
    }

    if (levelFilter) {
      logs = logs.filter(
        (l) =>
          l.level.toUpperCase() === levelFilter ||
          (levelFilter === 'WARN' && l.level.toUpperCase() === 'WARNING'),
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      logs = logs.filter(
        (l) =>
          l.line.toLowerCase().includes(q) ||
          l.container.toLowerCase().includes(q),
      )
    }

    const timeLimits: Record<string, number> = {
      '15m': 15 * 60 * 1000,
      '1h':  60 * 60 * 1000,
      '6h':  6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    }
    if (timeLimits[timeFilter]) {
      logs = logs.filter(
        (l) => now - new Date(l.ts).getTime() <= timeLimits[timeFilter],
      )
    }

    if (sortOrder === 'timestamp_asc') logs = [...logs].reverse()
    if (sortOrder === 'level_desc') {
      const order = ['CRITICAL', 'ERROR', 'WARNING', 'WARN', 'INFO', 'DEBUG']
      logs = [...logs].sort(
        (a, b) =>
          order.indexOf(a.level.toUpperCase()) - order.indexOf(b.level.toUpperCase()),
      )
    }

    return logs
  }, [data, quickFilter, levelFilter, search, timeFilter, sortOrder])

  const advancedCount = [
    timeFilter !== 'all',
    sortOrder !== 'timestamp_desc',
  ].filter(Boolean).length

  const handleCopy = useCallback(() => {
    const text = filteredLogs
      .map((l) => `${l.ts} [${l.level}] ${l.container}: ${l.line}`)
      .join('\n')
    navigator.clipboard.writeText(text).catch(() => {})
  }, [filteredLogs])

  const handleExport = useCallback(() => {
    const text = filteredLogs
      .map((l) => `${l.ts} [${l.level}] ${l.container}: ${l.line}`)
      .join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().slice(0, 19)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredLogs])

  const handleClear = useCallback(() => {
    setSearch('')
    setLevelFilter('')
    setContainer('')
    setQuickFilter(null)
    setTimeFilter('all')
    setSortOrder('timestamp_desc')
  }, [])

  return (
    <div className="page-enter -mx-5 -mt-7 sm:-mx-8 lg:-mt-8">
      <div
        className="flex flex-col h-[calc(100dvh-130px)] lg:h-[calc(100dvh-56px)]"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* ── Toolbar ── */}
        <div
          className="shrink-0 flex items-center gap-1.5 overflow-x-auto p-1.5"
          style={{
            background: 'var(--color-surface-2)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {/* Line count */}
          <span
            className="shrink-0 px-1 text-[11px]"
            style={{ color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}
          >
            {isLoading ? '…' : `${filteredLogs.length} lines`}
          </span>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search message, trace, service…"
            aria-label="Search logs"
            className="min-w-[150px] flex-1 rounded-lg px-2.5 py-1.5 text-[12.5px] outline-none transition-colors"
            style={{
              background: 'var(--color-surface-3)',
              border: '1px solid var(--color-border-2)',
              color: 'var(--color-text-1)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-2)'
            }}
          />

          {/* Quick chips */}
          {QUICK_CHIPS.map(({ id, label }) => {
            const active = quickFilter === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setQuickFilter(active ? null : id)}
                className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-150"
                style={{
                  background: active ? 'var(--color-accent-muted)' : 'transparent',
                  borderColor: active
                    ? 'var(--color-accent)'
                    : 'var(--color-border-2)',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-3)',
                }}
              >
                {label}
              </button>
            )
          })}

          {/* Level */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className={LOG_SELECT}
            aria-label="Filter by level"
          >
            <option value="">Level: All</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
            <option value="DEBUG">DEBUG</option>
          </select>

          {/* Service */}
          <select
            value={container}
            onChange={(e) => setContainer(e.target.value)}
            className={LOG_SELECT}
            aria-label="Filter by service"
          >
            <option value="">Service: All</option>
            {CONTAINERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Spacer */}
          <div className="flex-1" style={{ minWidth: 10 }} />

          {/* More / Advanced */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={clsx(LOG_BTN, LOG_BTN_GHOST, LOG_BTN_SM)}
              aria-label="Advanced filters"
            >
              <Filter className="h-3 w-3" />
              More
              {advancedCount > 0 && (
                <span
                  className="inline-flex h-4 min-w-[14px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: 'var(--color-accent)' }}
                >
                  {advancedCount}
                </span>
              )}
            </button>
            {showAdvanced && (
              <AdvancedPopover
                timeFilter={timeFilter}
                sortOrder={sortOrder}
                onTimeChange={setTimeFilter}
                onSortChange={setSortOrder}
                onClose={() => setShowAdvanced(false)}
              />
            )}
          </div>

          {/* Live toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={clsx(LOG_BTN, LOG_BTN_SM)}
            style={
              autoRefresh
                ? {
                    background: 'rgba(38,194,129,.14)',
                    border: '1px solid #26c281',
                    color: '#26c281',
                  }
                : {
                    background: 'transparent',
                    border: '1px solid var(--color-border-2)',
                    color: 'var(--color-text-3)',
                  }
            }
            aria-label="Toggle live tail"
          >
            {autoRefresh ? (
              <Square className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {autoRefresh ? 'Stop' : 'Start'}
          </button>

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className={clsx(LOG_BTN, LOG_BTN_GHOST, LOG_BTN_SM)}
            aria-label="Copy visible log lines"
          >
            <Clipboard className="h-3 w-3" />
            Copy
          </button>

          {/* Export */}
          <button
            type="button"
            onClick={handleExport}
            className={clsx(LOG_BTN, LOG_BTN_GHOST, LOG_BTN_SM)}
            aria-label="Export log lines as .txt"
          >
            <Download className="h-3 w-3" />
            Export
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={handleClear}
            className={clsx(LOG_BTN, LOG_BTN_GHOST, LOG_BTN_SM)}
            aria-label="Clear all filters"
          >
            <X className="h-3 w-3" />
            Clear
          </button>

          {/* Settings toggle */}
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className={clsx(LOG_BTN, LOG_BTN_SM, 'px-2.5')}
            style={
              showSettings
                ? {
                    background: 'var(--color-accent)',
                    border: '1px solid transparent',
                    color: '#fff',
                  }
                : {
                    background: 'transparent',
                    border: '1px solid var(--color-border-2)',
                    color: 'var(--color-text-3)',
                  }
            }
            aria-label="Toggle log settings panel"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Main layout: console + optional settings panel ── */}
        <div className="flex flex-1" style={{ minHeight: 0 }}>
          {/* Dark terminal console */}
          <div
            ref={consoleRef}
            className="flex-1 overflow-auto"
            style={{ background: 'var(--color-surface)' }}
          >
            {isLoading && (
              <p
                style={{
                  color: 'var(--color-text-3)',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: 12,
                  padding: '12px 14px',
                }}
              >
                Loading logs…
              </p>
            )}
            {isError && (
              <div style={{ padding: '48px 24px' }}>
                <EmptyState
                  title="Failed to load logs"
                  description="Ensure LOCAL_MODE=true and API is reachable."
                />
              </div>
            )}
            {!isLoading && !isError && filteredLogs.length === 0 && (
              <p
                style={{
                  color: 'var(--color-text-3)',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: 12,
                  padding: '12px 14px',
                }}
              >
                {data && data.length > 0
                  ? 'No logs match the current filters. Try Clear to reset.'
                  : 'No log lines yet. The log-bridge container is tailing Docker stdout.'}
              </p>
            )}
            {filteredLogs.map((log, index) => (
              <LogRow
                key={index}
                log={log}
                showTimestamp={showTimestamp}
                wrapLines={wrapLines}
                search={search}
                onIncidentClick={(id) => navigate(`/incidents/${id}`)}
              />
            ))}
          </div>

          {/* Settings sidebar */}
          {showSettings && (
            <aside
              className="shrink-0 overflow-auto p-3"
              style={{
                width: 210,
                borderLeft: '1px solid var(--color-border)',
                background: 'var(--color-surface-2)',
              }}
            >
              <h4
                className="mb-2 text-[10px] font-semibold uppercase tracking-[.06em]"
                style={{ color: 'var(--color-text-3)' }}
              >
                Log Settings
              </h4>
              <SettingRow
                label="Timestamp"
                checked={showTimestamp}
                onChange={setShowTimestamp}
              />
              <SettingRow
                label="Wrap lines"
                checked={wrapLines}
                onChange={setWrapLines}
              />
              <SettingRow
                label="Live tail"
                checked={autoRefresh}
                onChange={setAutoRefresh}
              />

              <h4
                className="mb-1 mt-4 text-[10px] font-semibold uppercase tracking-[.06em]"
                style={{ color: 'var(--color-text-3)' }}
              >
                Quick Filters
              </h4>
              {QUICK_CHIPS.map(({ id, label }) => (
                <div
                  key={id}
                  className="flex items-center justify-between py-1.5"
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 12,
                    color: 'var(--color-text-2)',
                  }}
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => setQuickFilter(quickFilter === id ? null : id)}
                    className="rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-all"
                    style={{
                      background:
                        quickFilter === id
                          ? 'var(--color-accent-muted)'
                          : 'transparent',
                      borderColor:
                        quickFilter === id
                          ? 'var(--color-accent)'
                          : 'var(--color-border-2)',
                      color:
                        quickFilter === id ? 'var(--color-accent)' : 'var(--color-text-3)',
                    }}
                  >
                    {quickFilter === id ? 'Active' : 'Run'}
                  </button>
                </div>
              ))}
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
