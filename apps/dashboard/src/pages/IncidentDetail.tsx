import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getIncident } from '../api/incidents'
import { PriorityBadge } from '../components/PriorityBadge'
import { StatusBadge } from '../components/StatusBadge'
import type { AgentTraceEntry, Recommendation } from '../types/incident'

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => getIncident(id!),
    enabled: !!id,
  })

  if (isLoading) return <p className="py-12 text-center text-sm text-gray-500">Loading…</p>
  if (isError || !data)
    return <p className="py-12 text-center text-sm text-red-600">Failed to load incident.</p>

  const shortType = data.exception_type.split('.').pop() ?? data.exception_type

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-2 text-sm text-indigo-600 hover:underline"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-gray-900 font-mono">{shortType}</h1>
          <p className="mt-1 text-sm text-gray-500">{data.exception_message}</p>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <PriorityBadge priority={data.priority} />
          <StatusBadge status={data.status} />
        </div>
      </div>

      {/* Work items */}
      {data.work_items.length > 0 && (
        <Section title="Azure DevOps">
          <div className="flex flex-wrap gap-2">
            {data.work_items.map((wi) => (
              <a
                key={wi.ado_item_id}
                href={wi.ado_item_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-100"
              >
                {wi.item_type} #{wi.ado_item_id}
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* Root cause */}
      {data.root_cause && (
        <Section title="Root Cause">
          <p className="text-sm text-gray-700 leading-relaxed">{data.root_cause}</p>
          {data.root_cause_json && (
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Component" value={data.root_cause_json.component} />
              <Stat
                label="Confidence"
                value={`${Math.round(data.root_cause_json.confidence * 100)}%`}
              />
              <div className="col-span-2">
                <dt className="text-xs font-medium text-gray-500">Likely Cause</dt>
                <dd className="mt-1 text-sm text-gray-700">{data.root_cause_json.likely_cause}</dd>
              </div>
              {data.root_cause_json.contributing_factors.length > 0 && (
                <div className="col-span-4">
                  <dt className="text-xs font-medium text-gray-500">Contributing Factors</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {data.root_cause_json.contributing_factors.map((f) => (
                      <span
                        key={f}
                        className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {f}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </Section>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Section title="Recommendations">
          <ol className="space-y-4">
            {data.recommendations.map((rec: Recommendation) => (
              <li key={rec.rank} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="mr-2 font-semibold text-indigo-700">#{rec.rank}</span>
                    <span className="font-medium text-gray-900">{rec.title}</span>
                  </div>
                  <span className="shrink-0 rounded bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                    {Math.round(rec.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{rec.description}</p>
                {rec.suggested_change && (
                  <p className="mt-2 rounded bg-gray-50 p-3 font-mono text-xs text-gray-700">
                    {rec.suggested_change}
                  </p>
                )}
                {rec.affected_files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rec.affected_files.map((f) => (
                      <span
                        key={f}
                        className="rounded bg-orange-50 px-2 py-0.5 font-mono text-xs text-orange-700"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Stack trace */}
      {data.stack_trace && (
        <Section title="Stack Trace">
          <pre className="overflow-x-auto rounded bg-gray-900 p-4 text-xs text-gray-100 leading-relaxed">
            {data.stack_trace}
          </pre>
        </Section>
      )}

      {/* Agent trace */}
      {data.agent_trace.length > 0 && (
        <Section title="Agent Trace">
          <div className="overflow-hidden rounded border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Agent</th>
                  <th className="px-4 py-2 text-left">Prompt</th>
                  <th className="px-4 py-2 text-left">Output</th>
                  <th className="px-4 py-2 text-right">Latency</th>
                  <th className="px-4 py-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.agent_trace.map((entry: AgentTraceEntry, i) => (
                  <tr key={i} className={entry.error ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 font-medium capitalize">{entry.agent_name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">
                      {entry.prompt_version}
                    </td>
                    <td className="px-4 py-2 text-gray-600 max-w-xs truncate text-xs">
                      {entry.output_summary}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-500">{entry.latency_ms} ms</td>
                    <td className="px-4 py-2 text-xs text-red-600">{entry.error ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <div className="text-xs text-gray-400">
        Created {new Date(data.created_at).toLocaleString()} &mdash; Updated{' '}
        {new Date(data.updated_at).toLocaleString()}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  )
}
