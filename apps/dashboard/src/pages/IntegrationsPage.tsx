import { Activity, GitPullRequest, Code, Radio, MessageSquare, Bell, Layers, BarChart2 } from 'lucide-react'

interface Integration {
  name: string
  desc: string
  meta: string
  icon: React.ReactNode
  iconBg: string
  connected: boolean
}

const CONNECTED: Integration[] = [
  {
    name: 'Azure Monitor',
    desc: 'Log analytics & KQL ingestion',
    meta: 'Last synced: 1 min ago · 142 incidents',
    icon: <Activity className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />,
    iconBg: 'rgba(0,145,226,.14)',
    connected: true,
  },
  {
    name: 'Azure DevOps',
    desc: 'PR creation & work item tracking',
    meta: 'RemediAI org · 184 PRs created',
    icon: <GitPullRequest className="h-5 w-5" style={{ color: '#8B5CF6' }} />,
    iconBg: 'rgba(139,92,246,.14)',
    connected: true,
  },
  {
    name: 'GitHub',
    desc: 'Code context & repo analysis',
    meta: '3 repos indexed · 47,291 files',
    icon: <Code className="h-5 w-5" style={{ color: '#26C281' }} />,
    iconBg: 'rgba(38,194,129,.14)',
    connected: true,
  },
  {
    name: 'Azure Service Bus',
    desc: 'Real-time event ingestion',
    meta: 'remediai-events topic · 99.9% uptime',
    icon: <Radio className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />,
    iconBg: 'rgba(0,145,226,.14)',
    connected: true,
  },
]

const AVAILABLE: Integration[] = [
  {
    name: 'Slack',
    desc: 'Incident alerts & team notifications',
    meta: 'Get notified when new incidents are triaged',
    icon: <MessageSquare className="h-5 w-5" style={{ color: '#F5A623' }} />,
    iconBg: 'rgba(245,166,35,.14)',
    connected: false,
  },
  {
    name: 'PagerDuty',
    desc: 'On-call escalation & alerts',
    meta: 'Escalate critical incidents to on-call',
    icon: <Bell className="h-5 w-5" style={{ color: '#EA580C' }} />,
    iconBg: 'rgba(234,88,12,.14)',
    connected: false,
  },
  {
    name: 'Jira',
    desc: 'Cross-platform issue tracking',
    meta: 'Sync incidents to Jira tickets',
    icon: <Layers className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />,
    iconBg: 'rgba(0,145,226,.14)',
    connected: false,
  },
  {
    name: 'Datadog',
    desc: 'APM metrics & tracing',
    meta: 'Correlate incidents with performance traces',
    icon: <BarChart2 className="h-5 w-5" style={{ color: '#8B5CF6' }} />,
    iconBg: 'rgba(139,92,246,.14)',
    connected: false,
  },
]

function IntegrationCard({ item }: { item: Integration }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
      style={{ opacity: item.connected ? 1 : 0.82 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: item.iconBg }}
          >
            {item.icon}
          </span>
          <div>
            <div className="text-[13px] font-bold text-text-1">{item.name}</div>
            <div className="text-[11.5px] text-text-3">{item.desc}</div>
          </div>
        </div>
        <span
          className="mt-0.5 shrink-0 rounded-full px-2.5 py-[3px] text-[10.5px] font-semibold"
          style={
            item.connected
              ? { background: 'rgba(38,194,129,.13)', color: '#26C281' }
              : { background: 'rgba(245,166,35,.13)', color: '#F5A623' }
          }
        >
          {item.connected ? 'Connected' : 'Not Connected'}
        </span>
      </div>
      <div className="text-[12px] text-text-3">{item.meta}</div>
      <button
        className="w-full rounded-[7px] py-1.5 text-[12px] font-semibold transition-colors"
        style={
          item.connected
            ? { border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text-2)' }
            : { border: 'none', background: 'var(--color-accent)', color: '#fff' }
        }
      >
        {item.connected ? 'Configure' : 'Connect'}
      </button>
    </div>
  )
}

export function IntegrationsPage() {
  return (
    <div className="space-y-4 page-enter">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-text-3">4 connected · 4 available</span>
      </div>

      {/* Connected */}
      <div>
        <div className="mb-2 text-[13px] font-bold text-text-1">Connected (4)</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTED.map((item) => (
            <IntegrationCard key={item.name} item={item} />
          ))}
        </div>
      </div>

      {/* Available */}
      <div>
        <div className="mb-2 text-[13px] font-bold text-text-1">Available (4)</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE.map((item) => (
            <IntegrationCard key={item.name} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
