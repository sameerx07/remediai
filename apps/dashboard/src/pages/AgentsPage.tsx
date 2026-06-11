import { Play } from 'lucide-react'

interface AgentRun {
  id: string
  service: string
  serviceAbbr: string
  serviceColor: string
  exception: string
  triage: 'done' | 'running' | 'pending' | 'failed'
  rootCause: 'done' | 'running' | 'pending' | 'failed'
  fixPlanner: 'done' | 'running' | 'pending' | 'failed'
  pr: string | null
  duration: string
  created: string
}

const RUNS: AgentRun[] = [
  { id: '#1082', service: 'api',        serviceAbbr: 'API', serviceColor: 'var(--color-accent)', exception: 'NullReferenceException',     triage: 'done',    rootCause: 'running', fixPlanner: 'pending', pr: null,               duration: '1.2 min', created: 'Jun 7, 9:42' },
  { id: '#1081', service: 'worker',     serviceAbbr: 'WRK', serviceColor: '#8B5CF6',             exception: 'OutOfMemoryException',       triage: 'done',    rootCause: 'done',    fixPlanner: 'done',    pr: 'PR #247',          duration: '4.8 min', created: 'Jun 7, 9:15' },
  { id: '#1080', service: 'log-bridge', serviceAbbr: 'LBR', serviceColor: '#26C281',             exception: 'SqlException',               triage: 'done',    rootCause: 'done',    fixPlanner: 'done',    pr: 'PR #246',          duration: '3.1 min', created: 'Jun 7, 8:55' },
  { id: '#1079', service: 'api',        serviceAbbr: 'API', serviceColor: 'var(--color-accent)', exception: 'ArgumentNullException',      triage: 'done',    rootCause: 'done',    fixPlanner: 'done',    pr: 'PR #245 (merged)', duration: '2.4 min', created: 'Jun 7, 8:20' },
  { id: '#1078', service: 'worker',     serviceAbbr: 'WRK', serviceColor: '#8B5CF6',             exception: 'TimeoutException',           triage: 'done',    rootCause: 'done',    fixPlanner: 'running', pr: null,               duration: '5.6 min', created: 'Jun 6, 5:30' },
  { id: '#1075', service: 'worker',     serviceAbbr: 'WRK', serviceColor: '#8B5CF6',             exception: 'Azure.RequestFailedException',triage: 'done',    rootCause: 'done',    fixPlanner: 'failed',  pr: null,               duration: '2.9 min', created: 'Jun 5, 4:00' },
]

type StageStatus = 'done' | 'running' | 'pending' | 'failed'

const STAGE_PILL: Record<StageStatus, { bg: string; color: string; label: string }> = {
  done:    { bg: 'rgba(38,194,129,.13)',  color: '#26C281', label: '✓ Done'    },
  running: { bg: 'rgba(245,166,35,.13)', color: '#F5A623', label: '↻ Running' },
  pending: { bg: 'var(--color-surface-3)', color: 'var(--color-text-3)', label: '— Pending' },
  failed:  { bg: 'rgba(239,68,68,.13)',   color: '#EF4444', label: '✕ Failed'  },
}

function StagePill({ status }: { status: StageStatus }) {
  const s = STAGE_PILL[status]
  return (
    <span
      className="inline-block whitespace-nowrap rounded-xl px-2 py-[3px] text-[10.5px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

export function AgentsPage() {
  return (
    <div className="space-y-4 page-enter">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-text-3">
          Triage → Root Cause → Code Context → Fix Planner
        </span>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white"
          style={{ background: 'var(--color-accent)' }}
        >
          <Play className="h-3 w-3" />
          Trigger Run
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                {['Run ID', 'Service', 'Exception', 'Triage', 'Root Cause', 'Fix Planner', 'PR', 'Duration', 'Created'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[.06em] text-text-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RUNS.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                  className="transition-colors hover:bg-surface-2"
                >
                  <td className="px-4 py-3 text-[13px] font-bold text-text-1">{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ background: r.serviceColor }}
                      >
                        {r.serviceAbbr}
                      </span>
                      <span className="text-[12.5px] text-text-1">{r.service}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] font-semibold text-text-1">{r.exception}</td>
                  <td className="px-4 py-3"><StagePill status={r.triage} /></td>
                  <td className="px-4 py-3"><StagePill status={r.rootCause} /></td>
                  <td className="px-4 py-3"><StagePill status={r.fixPlanner} /></td>
                  <td className="px-4 py-3">
                    {r.pr ? (
                      <span className="text-[12px] font-medium" style={{ color: 'var(--color-accent)' }}>{r.pr}</span>
                    ) : (
                      <span className="text-[12px] text-text-3">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-2">{r.duration}</td>
                  <td className="px-4 py-3 text-[12px] text-text-3">{r.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
