import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getMetrics } from '../api/metrics'

const PRIORITY_COLOURS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

export function MetricsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['metrics'],
    queryFn: getMetrics,
    refetchInterval: 30_000,
  })

  if (isLoading) return <p className="py-12 text-center text-sm text-gray-500">Loading…</p>
  if (isError || !data)
    return <p className="py-12 text-center text-sm text-red-600">Failed to load metrics.</p>

  const analyzedPct =
    data.total_incidents > 0
      ? Math.round((data.total_analyzed / data.total_incidents) * 100)
      : 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Metrics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Incidents" value={data.total_incidents} />
        <StatCard label="Analyzed" value={data.total_analyzed} />
        <StatCard label="Analysis Rate" value={`${analyzedPct}%`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="By Status">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.by_status} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By Priority">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.by_priority} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {data.by_priority.map((entry) => (
                  <Cell
                    key={entry.priority}
                    fill={PRIORITY_COLOURS[entry.priority] ?? '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top errors table */}
      {data.top_errors.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Top Exception Types
          </h2>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="pb-2 text-left">Exception Type</th>
                <th className="pb-2 text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.top_errors.map((row) => (
                <tr key={row.exception_type}>
                  <td className="py-2 font-mono text-xs text-gray-700">{row.exception_type}</td>
                  <td className="py-2 text-right font-medium text-gray-900">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </div>
  )
}
