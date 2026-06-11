import { useQuery } from '@tanstack/react-query'
import {
  Area, AreaChart, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  AlertTriangle, CheckCircle2, Clock, GitPullRequest,
  TrendingUp, Search, Cpu, Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMetrics } from '../api/metrics'
import { listIncidents } from '../api/incidents'
import { useTheme } from '../components/shell/ThemeContext'

// ── Chart theme ────────────────────────────────────────────────────────────────

const CHART_THEMES = {
  light:         { grid: '#F1F5F9', tick: '#94A3B8', line2: '#CBD5E1', accent: '#2563EB', accentBg: 'rgba(37,99,235,0.10)',  donut: ['#2563EB','#8B5CF6','#26C281','#F5A623','#E2E8F0'] },
  ocean:         { grid: '#3A3A3A', tick: '#6A6A6A', line2: '#555560', accent: '#60A5FA', accentBg: 'rgba(96,165,250,0.12)', donut: ['#60A5FA','#8B5CF6','#26C281','#F5A623','#3E3E42'] },
  'docker-dark': { grid: '#23262F', tick: '#4E5670', line2: '#2A2D38', accent: '#0091E2', accentBg: 'rgba(0,145,226,0.12)', donut: ['#0091E2','#8B5CF6','#26C281','#F5A623','#2A2D38'] },
}

function useChart() {
  const { theme } = useTheme()
  return CHART_THEMES[theme] ?? CHART_THEMES['docker-dark']
}

// ── Sparkline SVG ──────────────────────────────────────────────────────────────

function Sparkline({ color, path, fill }: { color: string; path: string; fill: string }) {
  return (
    <svg
      viewBox="0 0 200 42"
      preserveAspectRatio="none"
      style={{ display: 'block', width: 'calc(100% + 32px)', height: 42, marginLeft: -16, marginRight: -16 }}
    >
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${color.replace('#','')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

interface OverviewStatCardProps {
  label: string
  value: string
  badge?: { text: string; positive: boolean }
  badgeNote?: string
  icon: React.ReactNode
  iconBg: string
  sparkColor: string
  sparkPath: string
  sparkFill: string
}

function OverviewStatCard({
  label, value, badge, badgeNote, icon, iconBg, sparkColor, sparkPath, sparkFill,
}: OverviewStatCardProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        padding: '14px 16px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</span>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 30, height: 30, background: iconBg }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 8 }}>
        {value}
      </div>
      {badge && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span
            style={{
              fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
              color: badge.positive ? '#16A34A' : '#dc2626',
              background: badge.positive ? '#DCFCE7' : 'rgba(220,38,38,.1)',
            }}
          >
            {badge.text}
          </span>
          {badgeNote && <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{badgeNote}</span>}
        </div>
      )}
      <Sparkline color={sparkColor} path={sparkPath} fill={sparkFill} />
    </div>
  )
}

// ── Service avatar helpers ─────────────────────────────────────────────────────

const SVC_COLORS = ['var(--color-accent)', '#8B5CF6', '#26C281', '#F5A623', '#EC4899', '#14B8A6']

function svcColor(name: string | null | undefined): string {
  if (!name) return SVC_COLORS[0]
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return SVC_COLORS[h % SVC_COLORS.length]
}

function svcAbbr(name: string | null | undefined): string {
  if (!name) return '?'
  const base = name.replace(/^remediai[-_]?/, '').replace(/[-_]/g, ' ').trim()
  const words = base.split(' ').filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.map(p => p[0]?.toUpperCase() ?? '').join('').slice(0, 3)
}

// ── Weekly trend data ──────────────────────────────────────────────────────────

const TREND_DATA = [
  { day: 'Mon', thisWeek: 80,  lastWeek: 60  },
  { day: 'Tue', thisWeek: 120, lastWeek: 95  },
  { day: 'Wed', thisWeek: 105, lastWeek: 85  },
  { day: 'Thu', thisWeek: 150, lastWeek: 125 },
  { day: 'Fri', thisWeek: 170, lastWeek: 145 },
  { day: 'Sat', thisWeek: 140, lastWeek: 115 },
  { day: 'Sun', thisWeek: 190, lastWeek: 160 },
]

const DONUT_DATA = [
  { name: 'api',         value: 39, color: '' },
  { name: 'worker',      value: 28, color: '#8B5CF6' },
  { name: 'log-bridge',  value: 15, color: '#26C281' },
  { name: 'dashboard',   value: 12, color: '#F5A623' },
  { name: 'Other',       value: 6,  color: '#6B7280' },
]

// Sparkline path data
const SPARK_INC_FILL   = 'M0,38 C20,36 35,32 55,26 C75,20 90,24 110,18 C130,12 150,8 170,6 C185,4 195,3 200,2 L200,42 L0,42 Z'
const SPARK_INC_PATH   = 'M0,38 C20,36 35,32 55,26 C75,20 90,24 110,18 C130,12 150,8 170,6 C185,4 195,3 200,2'
const SPARK_RATE_FILL  = 'M0,36 C15,34 30,30 50,28 C70,26 85,22 105,16 C125,10 145,7 165,5 C180,3 192,2 200,2 L200,42 L0,42 Z'
const SPARK_RATE_PATH  = 'M0,36 C15,34 30,30 50,28 C70,26 85,22 105,16 C125,10 145,7 165,5 C180,3 192,2 200,2'
const SPARK_FIX_FILL   = 'M0,37 C20,35 38,34 58,28 C78,22 95,20 115,14 C135,8 155,6 175,4 C188,3 196,2 200,2 L200,42 L0,42 Z'
const SPARK_FIX_PATH   = 'M0,37 C20,35 38,34 58,28 C78,22 95,20 115,14 C135,8 155,6 175,4 C188,3 196,2 200,2'
const SPARK_PR_FILL    = 'M0,38 C18,37 32,35 52,30 C72,25 90,22 110,16 C130,10 150,7 170,5 C183,3 193,2 200,2 L200,42 L0,42 Z'
const SPARK_PR_PATH    = 'M0,38 C18,37 32,35 52,30 C72,25 90,22 110,16 C130,10 150,7 170,5 C183,3 193,2 200,2'

// ── Agent Activity ─────────────────────────────────────────────────────────────

const AGENT_ACTIVITY = [
  { icon: <Cpu className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />, iconBg: 'rgba(139,92,246,0.15)', title: 'Triage Agent completed', desc: 'Classified NullReferenceException as High severity', time: '2m ago' },
  { icon: <GitPullRequest className="h-3.5 w-3.5" style={{ color: '#16A34A' }} />, iconBg: 'rgba(22,163,74,0.15)', title: 'PR auto-created', desc: 'Fix for SqlException in log-bridge merged', time: '18m ago' },
  { icon: <Search className="h-3.5 w-3.5" style={{ color: '#F5A623' }} />, iconBg: 'rgba(245,166,35,0.15)', title: 'Root Cause Agent', desc: 'Identified memory leak in worker service', time: '45m ago' },
  { icon: <Zap className="h-3.5 w-3.5" style={{ color: '#8B5CF6' }} />, iconBg: 'rgba(139,92,246,0.15)', title: 'Fix Planner Agent', desc: 'Generated 3 candidate fixes for api service', time: '1h ago' },
]

// ── Main component ─────────────────────────────────────────────────────────────

export function MetricsPage() {
  const navigate = useNavigate()
  const chart = useChart()

  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: getMetrics,
    refetchInterval: 30_000,
  })

  const { data: incidents } = useQuery({
    queryKey: ['incidents', 1, '', ''],
    queryFn: () => listIncidents({ page: 1, page_size: 4 }),
  })

  const totalInc    = metrics?.total_incidents ?? 0
  const analyzedPct = totalInc > 0 ? Math.round((metrics!.total_analyzed / totalInc) * 100) : 0
  const donutFirst  = [{ ...DONUT_DATA[0], color: chart.accent }, ...DONUT_DATA.slice(1)]

  const tooltipStyle = {
    backgroundColor: 'var(--bg-card)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
    borderRadius: 8,
    fontSize: 12,
    boxShadow: 'var(--shadow)',
  }

  return (
    <div className="space-y-[18px] page-enter" style={{ padding: '20px 0' }}>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[14px]">
        <OverviewStatCard
          label="Active Incidents"
          value={String(totalInc)}
          badge={{ text: `↑ ${Math.max(0, totalInc - (metrics?.total_analyzed ?? 0))} new`, positive: false }}
          badgeNote="since yesterday"
          icon={<AlertTriangle className="h-3.5 w-3.5" style={{ color: '#EA580C' }} />}
          iconBg="var(--color-warning-muted)"
          sparkColor="#F5A623"
          sparkPath={SPARK_INC_PATH}
          sparkFill={SPARK_INC_FILL}
        />
        <OverviewStatCard
          label="AI Resolution Rate"
          value={`${analyzedPct}%`}
          badge={{ text: '↑ 5.2%', positive: true }}
          badgeNote="last 7 days"
          icon={<CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#16A34A' }} />}
          iconBg="var(--color-success-muted)"
          sparkColor="#16A34A"
          sparkPath={SPARK_RATE_PATH}
          sparkFill={SPARK_RATE_FILL}
        />
        <OverviewStatCard
          label="Avg Fix Time"
          value="4.2 min"
          badge={{ text: '↓ 1.1 min', positive: true }}
          badgeNote="vs last week"
          icon={<Clock className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />}
          iconBg="var(--color-accent-muted)"
          sparkColor={chart.accent}
          sparkPath={SPARK_FIX_PATH}
          sparkFill={SPARK_FIX_FILL}
        />
        <OverviewStatCard
          label="PRs Auto-Created"
          value="37"
          badge={{ text: '↑ 8', positive: true }}
          badgeNote="this week"
          icon={<GitPullRequest className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />}
          iconBg="var(--color-accent-muted)"
          sparkColor={chart.accent}
          sparkPath={SPARK_PR_PATH}
          sparkFill={SPARK_PR_FILL}
        />
      </div>

      {/* ── Incident Trend + Agent Pipeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[14px]">

        {/* Line Chart */}
        <div
          className="rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', padding: '20px 22px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Incident Trend — Last 7 Days
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                <svg width="18" height="4" viewBox="0 0 18 4"><line x1="0" y1="2" x2="18" y2="2" stroke={chart.accent} strokeWidth="2.5" strokeLinecap="round" /></svg>
                This Week
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-faint)' }}>
                <svg width="18" height="4" viewBox="0 0 18 4">
                  <line x1="0" y1="2" x2="4" y2="2" stroke={chart.line2} strokeWidth="2" strokeDasharray="4 3" />
                  <line x1="7" y1="2" x2="11" y2="2" stroke={chart.line2} strokeWidth="2" strokeDasharray="4 3" />
                  <line x1="14" y1="2" x2="18" y2="2" stroke={chart.line2} strokeWidth="2" strokeDasharray="4 3" />
                </svg>
                Last Week
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={TREND_DATA} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="tg-thisweek" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chart.accent} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={chart.accent} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: chart.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 200]} tick={{ fill: chart.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: chart.grid, strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="thisWeek"
                name="This Week"
                stroke={chart.accent}
                strokeWidth={2.5}
                fill="url(#tg-thisweek)"
                dot={{ r: 3, fill: chart.accent, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="lastWeek"
                name="Last Week"
                stroke={chart.line2}
                strokeWidth={2}
                fill="transparent"
                strokeDasharray="5 4"
                dot={{ r: 2, fill: chart.line2, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Agent Pipeline Status */}
        <div
          className="rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', padding: '20px' }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
            Agent Pipeline Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { icon: <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#F5A623' }} />, bg: 'var(--color-warning-muted)', title: 'Top Error Source', desc: 'remediai-api has 6 unresolved NullReferenceExceptions' },
              { icon: <TrendingUp className="h-3.5 w-3.5" style={{ color: '#16A34A' }} />, bg: 'var(--color-success-muted)', title: 'Resolution Rate Up', desc: 'AI fix acceptance rate increased 5.2% vs last week' },
              { icon: <Clock className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />, bg: 'var(--color-accent-muted)', title: 'Avg Fix Time', desc: 'Fix generation dropped from 5.3 min to 4.2 min' },
            ].map((item, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height: 1, background: 'var(--divider)', margin: '10px 0' }} />}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 32, height: 32, background: item.bg }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom 3-column row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[14px]">

        {/* Incidents by Service — Donut */}
        <div
          className="rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', padding: '18px 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Incidents by Service</span>
            <button onClick={() => navigate('/incidents')} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <PieChart width={110} height={110}>
                <Pie
                  data={donutFirst}
                  cx={55} cy={55}
                  innerRadius={38} outerRadius={52}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {donutFirst.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${v}%`, n]} />
              </PieChart>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{totalInc}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-faint)', marginTop: 1 }}>Total</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {donutFirst.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Incidents */}
        <div
          className="rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', padding: '18px 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Incidents</span>
            <button onClick={() => navigate('/incidents')} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
          </div>
          <div>
            {(incidents?.items ?? []).slice(0, 4).map((inc, i) => (
              <div key={inc.id}>
                {i > 0 && <div style={{ height: 1, background: 'var(--divider)', margin: '6px 0' }} />}
                <button
                  type="button"
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', padding: '5px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--nav-hover-bg)' }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                >
                  <span className="flex items-center justify-center rounded-md text-white shrink-0" style={{ width: 32, height: 32, background: svcColor(inc.source), fontSize: 9, fontWeight: 700 }}>
                    {svcAbbr(inc.source)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inc.exception_type.split('.').pop()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inc.exception_message}
                    </div>
                  </div>
                  <StatusTag status={inc.status} />
                </button>
              </div>
            ))}
            {!incidents?.items?.length && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No recent incidents</p>
            )}
          </div>
        </div>

        {/* Agent Activity */}
        <div
          className="rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', padding: '18px 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Agent Activity</span>
            <button onClick={() => navigate('/agents')} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
          </div>
          <div>
            {AGENT_ACTIVITY.map((item, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height: 1, background: 'var(--divider)', margin: '8px 0' }} />}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '5px 4px', borderRadius: 8 }}>
                  <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 30, height: 30, background: item.iconBg }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{item.desc}</div>
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--text-faint)', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Small status tag helper ────────────────────────────────────────────────────

function StatusTag({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === 'resolved')      return <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', color: '#16A34A', background: '#DCFCE7' }}>Resolved</span>
  if (s === 'triaged')       return <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', color: '#1D4ED8', background: '#DBEAFE' }}>Triaging</span>
  if (s === 'analyzed')      return <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', color: '#2563EB', background: '#DBEAFE' }}>Fix Suggested</span>
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', color: 'var(--text-muted)', background: 'var(--bg-input)' }}>{label}</span>
}
