import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { Filter, X, AlertCircle, Search } from 'lucide-react'
import { listIncidents } from '../api/incidents'
import { Pagination } from '../components/Pagination'
import { Badge, priorityVariant, statusVariant } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { SkeletonBlock } from '../components/ui/SkeletonBlock'

const PRIORITIES = ['', 'critical', 'high', 'medium', 'low']
const STATUS_TABS = ['', 'new', 'triaged', 'analyzed', 'resolved', 'ignored'] as const

const STATUS_LABELS: Record<string, string> = {
  '': 'All', new: 'New', triaged: 'Triaged',
  analyzed: 'Analyzed', resolved: 'Resolved', ignored: 'Ignored',
}

const SELECT_CLS =
  'h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-1 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent hover:border-border-2'

const SVC_COLORS = [
  'var(--color-accent)', '#8B5CF6', '#26C281', '#F5A623', '#EC4899', '#14B8A6',
]
function svcColor(name: string | null | undefined): string {
  if (!name) return SVC_COLORS[0]
  const s = String(name)
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return SVC_COLORS[h % SVC_COLORS.length]
}
function svcAbbr(name: string | null | undefined): string {
  if (!name) return '?'
  const base = String(name).replace(/^remediai[-_]?/, '').replace(/[-_]/g, ' ').trim()
  const words = base.split(' ').filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.map(p => p[0]?.toUpperCase() ?? '').join('').slice(0, 3)
}
function fmtLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
function firstTraceLine(trace: string | null | undefined): string | null {
  if (!trace) return null
  const line = trace.split('\n').find(l => l.trim().length > 0)
  return line?.trim() ?? null
}

function FilterTabs({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div
      className="flex gap-1 rounded-lg p-0.5"
      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
      role="tablist"
      aria-label="Filter by status"
    >
      {STATUS_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={value === tab}
          onClick={() => onChange(tab)}
          className="rounded-md px-3 py-1 text-[11.5px] font-medium transition-all duration-150"
          style={
            value === tab
              ? {
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-1)',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--color-border-2)',
                }
              : {
                  background: 'transparent',
                  color: 'var(--color-text-3)',
                  border: '1px solid transparent',
                }
          }
        >
          {STATUS_LABELS[tab]}
        </button>
      ))}
    </div>
  )
}

export function IncidentList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function onSearchChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearch(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 350)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['incidents', page, priority, status, debouncedSearch],
    queryFn: () =>
      listIncidents({
        page,
        page_size: 20,
        priority: priority || undefined,
        status: status || undefined,
        search: debouncedSearch || undefined,
      }),
  })

  function handleFilterChange(setter: (value: string) => void) {
    return (event: ChangeEvent<HTMLSelectElement>) => {
      setter(event.target.value)
      setPage(1)
    }
  }

  const searchBox = (
    <div className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 shadow-xs transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent">
      <Search className="h-3.5 w-3.5 flex-shrink-0 text-text-3" />
      <input
        type="search"
        value={search}
        onChange={onSearchChange}
        placeholder="Search incidents…"
        className="w-36 bg-transparent text-sm text-text-1 placeholder:text-text-3 outline-none"
      />
    </div>
  )

  const priorityFilter = (
    <select value={priority} onChange={handleFilterChange(setPriority)} className={SELECT_CLS}>
      {PRIORITIES.map((item) => (
        <option key={item} value={item} className="bg-surface text-text-1">
          {item === '' ? 'All priorities' : fmtLabel(item)}
        </option>
      ))}
    </select>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Incidents"
        subtitle="Track, triage, and inspect every exception incident in one place."
        actions={
          <>
            <div className="hidden items-center gap-2 lg:flex">
              {searchBox}
              {priorityFilter}
            </div>
            <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
              <Dialog.Trigger asChild>
                <Button type="button" variant="outline" size="sm" className="lg:hidden">
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" />
                <Dialog.Content className="fixed inset-x-3 bottom-3 z-50 rounded-xl border border-border bg-surface p-5 shadow-lg lg:hidden">
                  <div className="mb-4 flex items-center justify-between">
                    <Dialog.Title className="text-base font-semibold text-text-1">Filters</Dialog.Title>
                    <Dialog.Close asChild>
                      <button type="button" className="rounded-md p-1 text-text-2 hover:bg-surface-2 hover:text-text-1" aria-label="Close filters">
                        <X className="h-4 w-4" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="grid grid-cols-1 gap-3">{searchBox}{priorityFilter}</div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </>
        }
      />

      {/* Status filter tabs */}
      <FilterTabs value={status} onChange={(v) => { setStatus(v); setPage(1) }} />

      {isLoading && <LoadingState />}
      {isError && (
        <EmptyState
          icon={AlertCircle}
          title="Failed to load incidents"
          description="Refresh the page and try again."
        />
      )}

      {data && (
        <>
          {data.items.length === 0 ? (
            <EmptyState
              title="No incidents yet"
              description="Incidents appear here once the log bridge starts forwarding exceptions."
            />
          ) : (
            <>
              {/* Mobile card list */}
              <div className="space-y-3 lg:hidden">
                {data.items.map((incident) => (
                  <button
                    key={incident.id}
                    type="button"
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    className="group w-full rounded-xl border border-border bg-surface p-4 text-left shadow-xs transition-all duration-150 hover:border-border-2 hover:shadow-sm hover:-translate-y-[1px]"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                        style={{ background: svcColor(incident.source) }}
                      >
                        {svcAbbr(incident.source)}
                      </span>
                      <span className="text-xs text-text-3">{incident.source}</span>
                    </div>
                    <p className="font-mono text-xs font-medium text-accent">
                      {incident.exception_type.split('.').pop()}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-1">
                      {incident.exception_message}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge dot text={fmtLabel(incident.priority)} variant={priorityVariant(incident.priority)} />
                      <Badge dot text={fmtLabel(incident.status)} variant={statusVariant(incident.status)} />
                      <span className="ml-auto text-xs text-text-3">
                        {new Date(incident.created_at).toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop table */}
              <DataTable
                className="hidden lg:block"
                columns={['Service', 'Exception', 'Stack Trace', 'Severity', 'Status', 'Created', 'PR']}
              >
                {data.items.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-2"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                          style={{ background: svcColor(incident.source) }}
                        >
                          {svcAbbr(incident.source)}
                        </span>
                        <span className="whitespace-nowrap text-xs font-semibold text-text-1">{incident.source}</span>
                      </div>
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 font-mono text-xs font-semibold text-text-1">
                      {incident.exception_type.split('.').pop()}
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-text-3">
                        {firstTraceLine(incident.stack_trace) ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge dot text={fmtLabel(incident.priority)} variant={priorityVariant(incident.priority)} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge dot text={fmtLabel(incident.status)} variant={statusVariant(incident.status)} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-text-2">
                      {new Date(incident.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {incident.pr_url ? (
                        <a
                          href={incident.pr_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-medium text-accent hover:text-accent-hover hover:underline underline-offset-2"
                        >
                          Open PR →
                        </a>
                      ) : (
                        <span className="text-text-3">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </DataTable>
            </>
          )}

          <div className="rounded-lg border border-border bg-surface shadow-xs">
            <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
          </div>
        </>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <SkeletonBlock key={i} className="h-[72px] rounded-xl" />
      ))}
    </div>
  )
}
