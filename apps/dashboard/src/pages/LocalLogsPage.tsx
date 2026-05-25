import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { fetchLocalLogs } from '../api/localLogs'
import type { LogLine } from '../types/localLogs'

const CONTAINERS = ['', 'api', 'worker', 'dashboard']

const LEVEL_COLORS: Record<string, string> = {
  ERROR: 'text-red-600',
  CRITICAL: 'text-red-700 font-bold',
  WARNING: 'text-amber-600',
  WARN: 'text-amber-600',
  INFO: 'text-gray-300',
  DEBUG: 'text-gray-500',
}

function levelColor(level: string): string {
  return LEVEL_COLORS[level.toUpperCase()] ?? 'text-gray-300'
}

function ContainerBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    api: 'bg-blue-900 text-blue-200',
    worker: 'bg-purple-900 text-purple-200',
    dashboard: 'bg-teal-900 text-teal-200',
  }
  return (
    <span
      className={clsx(
        'inline-block rounded px-1.5 py-0.5 text-xs font-mono',
        colors[name] ?? 'bg-gray-700 text-gray-200',
      )}
    >
      {name}
    </span>
  )
}

function LogRow({ log, onIncidentClick }: { log: LogLine; onIncidentClick: (id: string) => void }) {
  return (
    <div
      className={clsx(
        'flex gap-3 px-4 py-1.5 font-mono text-xs border-b border-gray-800',
        log.is_exception ? 'bg-red-950' : 'hover:bg-gray-800',
      )}
    >
      <span className="shrink-0 text-gray-500 whitespace-nowrap">
        {new Date(log.ts).toLocaleTimeString()}
      </span>
      <ContainerBadge name={log.container} />
      <span className={clsx('shrink-0 w-14', levelColor(log.level))}>
        {log.level.toUpperCase().slice(0, 7)}
      </span>
      <span className={clsx('flex-1 break-all', log.is_exception ? 'text-red-300' : 'text-gray-300')}>
        {log.line}
      </span>
      {log.is_exception && log.incident_id && (
        <button
          onClick={() => onIncidentClick(log.incident_id!)}
          className="shrink-0 rounded bg-red-700 px-2 py-0.5 text-xs text-white hover:bg-red-600"
        >
          Incident →
        </button>
      )}
    </div>
  )
}

export function LocalLogsPage() {
  const navigate = useNavigate()
  const [container, setContainer] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['local-logs', container],
    queryFn: () => fetchLocalLogs({ container: container || undefined, limit: 200 }),
    refetchInterval: autoRefresh ? 2000 : false,
    staleTime: 0,
  })

  const exceptionCount = data?.filter((l) => l.is_exception).length ?? 0

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Container Logs</h1>
          {exceptionCount > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              {exceptionCount} exception{exceptionCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={container}
            onChange={(e) => setContainer(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            {CONTAINERS.map((c) => (
              <option key={c} value={c}>
                {c === '' ? 'All containers' : c}
              </option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
        </div>
      </div>

      <div className="rounded-lg bg-gray-900 overflow-hidden shadow-inner">
        <div className="border-b border-gray-700 px-4 py-2 text-xs text-gray-400 flex justify-between">
          <span>Last 200 lines — newest first</span>
          <span className="text-green-400">● LOCAL_MODE</span>
        </div>

        {isLoading && (
          <p className="px-6 py-8 text-center text-sm text-gray-500">Loading logs…</p>
        )}
        {isError && (
          <p className="px-6 py-8 text-center text-sm text-red-400">
            Failed to load logs. Is LOCAL_MODE=true and the API running?
          </p>
        )}
        {data && data.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-gray-500">
            No log lines yet. The log-bridge container is tailing docker stdout.
          </p>
        )}
        {data && data.length > 0 && (
          <div className="max-h-[70vh] overflow-y-auto">
            {data.map((log, i) => (
              <LogRow
                key={i}
                log={log}
                onIncidentClick={(id) => navigate(`/incidents/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
