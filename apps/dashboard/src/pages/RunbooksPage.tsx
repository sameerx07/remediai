import { useState } from 'react'
import { Search, Plus } from 'lucide-react'

const TABS = ['All', '.NET', 'Node.js', 'Python', 'Azure'] as const
type Tab = typeof TABS[number]

interface Runbook {
  title: string
  desc: string
  category: '.NET' | 'Node.js' | 'Python' | 'Azure'
  usage: string
  success: string
  updated: string
  status: 'Published' | 'Draft'
}

const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  '.NET':    { bg: 'rgba(37,99,235,.13)',   color: '#3B82F6' },
  'Node.js': { bg: 'rgba(38,194,129,.13)', color: '#26C281' },
  'Python':  { bg: 'rgba(139,92,246,.13)', color: '#8B5CF6' },
  'Azure':   { bg: 'rgba(245,166,35,.13)', color: '#F5A623' },
}

const RUNBOOKS: Runbook[] = [
  { title: 'NullReferenceException — Null check injection pattern',       desc: 'Adds null guards before dereference in C# controller/service layers',       category: '.NET',    usage: '312 times', success: '94%', updated: 'Jun 1',  status: 'Published' },
  { title: 'SQL Timeout — Connection retry with exponential backoff',     desc: 'Wraps SqlClient calls in Polly retry policy with jitter',                   category: '.NET',    usage: '187 times', success: '91%', updated: 'May 28', status: 'Published' },
  { title: 'Azure Service Bus — Dead letter queue drain',                  desc: 'Moves unprocessable messages to DLQ and alerts on-call',                    category: 'Azure',   usage: '124 times', success: '88%', updated: 'Jun 3',  status: 'Published' },
  { title: 'OutOfMemoryException — Heap dump + stream reader fix',        desc: 'Identifies large object allocations and applies streaming pattern',          category: '.NET',    usage: '98 times',  success: '82%', updated: 'May 20', status: 'Published' },
  { title: 'Node.js UnhandledRejection — Promise catch wrapper',          desc: 'Wraps async handlers with global error boundary middleware',                 category: 'Node.js', usage: '76 times',  success: '95%', updated: 'Jun 5',  status: 'Published' },
  { title: 'Python ImportError — Dependency pinning fix',                 desc: 'Pins transitive dependencies and rebuilds lockfile',                        category: 'Python',  usage: '41 times',  success: '89%', updated: 'Apr 30', status: 'Draft' },
]

export function RunbooksPage() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('All')

  const filtered = RUNBOOKS.filter((r) => {
    if (tab !== 'All' && r.category !== tab) return false
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-4 page-enter">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex gap-1 rounded-[9px] p-[3px]"
          style={{ background: 'var(--color-surface-3)' }}
          role="tablist"
        >
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className="rounded-[7px] px-3.5 py-[5px] text-[12px] font-medium transition-all"
              style={
                tab === t
                  ? { background: 'var(--color-surface)', color: 'var(--color-text-1)', boxShadow: '0 1px 3px rgba(0,0,0,.12)' }
                  : { background: 'transparent', color: 'var(--color-text-3)' }
              }
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
            style={{ background: 'var(--color-surface-3)', borderColor: 'var(--color-border-2)' }}
          >
            <Search className="h-3 w-3 shrink-0 text-text-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search runbooks..."
              className="w-36 bg-transparent text-[12px] text-text-1 outline-none placeholder:text-text-3"
            />
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            <Plus className="h-3 w-3" />
            New Runbook
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                {['Title', 'Category', 'AI Usage (30d)', 'Success Rate', 'Last Updated', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[.06em] text-text-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const cs = CAT_STYLE[r.category]
                return (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                    className="transition-colors hover:bg-surface-2"
                  >
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-semibold text-text-1">{r.title}</div>
                      <div className="mt-0.5 text-[11px] text-text-3">{r.desc}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-[3px] text-[10.5px] font-semibold"
                        style={{ background: cs.bg, color: cs.color }}
                      >
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-text-1">{r.usage}</td>
                    <td className="px-4 py-3 text-[12.5px] text-text-2">{r.success}</td>
                    <td className="px-4 py-3 text-[12px] text-text-3">{r.updated}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-[3px] text-[10.5px] font-semibold"
                        style={
                          r.status === 'Published'
                            ? { background: 'rgba(38,194,129,.13)', color: '#26C281' }
                            : { background: 'rgba(245,166,35,.13)', color: '#F5A623' }
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                        style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
