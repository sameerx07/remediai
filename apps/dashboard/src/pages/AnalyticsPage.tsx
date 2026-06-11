import { useState } from 'react'
import { Download } from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useTheme } from '../components/shell/ThemeContext'

const CHART_CFG: Record<string, { accent: string; accentBg: string; grid: string; tick: string; bar2: string; bar3: string }> = {
  light:         { accent: '#2563EB', accentBg: 'rgba(37,99,235,.10)',   grid: '#E2E8F0', tick: '#94A3B8', bar2: '#8B5CF6', bar3: '#16A34A' },
  ocean:         { accent: '#60A5FA', accentBg: 'rgba(96,165,250,.12)',  grid: '#3A3A3A', tick: '#6A6A6A', bar2: '#A78BFA', bar3: '#4ADE80' },
  'docker-dark': { accent: '#0091E2', accentBg: 'rgba(0,145,226,.12)',   grid: '#23262F', tick: '#4E5670', bar2: '#8B5CF6', bar3: '#26C281' },
}

const VOLUME_DATA = [
  {d:'May 8',v:28},{d:'May 9',v:35},{d:'May 10',v:24},{d:'May 11',v:14},{d:'May 12',v:18},
  {d:'May 13',v:42},{d:'May 14',v:51},{d:'May 15',v:38},{d:'May 16',v:29},{d:'May 17',v:45},
  {d:'May 18',v:22},{d:'May 19',v:19},{d:'May 20',v:34},{d:'May 21',v:47},{d:'May 22',v:56},
  {d:'May 23',v:61},{d:'May 24',v:43},{d:'May 25',v:38},{d:'May 26',v:52},{d:'May 27',v:67},
  {d:'May 28',v:71},{d:'May 29',v:49},{d:'May 30',v:44},{d:'May 31',v:58},{d:'Jun 1',v:63},
  {d:'Jun 2',v:55},{d:'Jun 3',v:72},{d:'Jun 4',v:84},{d:'Jun 5',v:91},{d:'Jun 6',v:78},
]

const CATEGORY_DATA = [
  { w: 'Wk 1', null: 28, sql: 12, oom: 8,  timeout: 5  },
  { w: 'Wk 2', null: 35, sql: 18, oom: 11, timeout: 9  },
  { w: 'Wk 3', null: 42, sql: 22, oom: 14, timeout: 12 },
  { w: 'Wk 4', null: 31, sql: 15, oom: 9,  timeout: 7  },
]

const BY_SERVICE = [
  { name: 'api',        pct: 42, color: 'var(--color-accent)' },
  { name: 'worker',     pct: 31, color: '#8B5CF6' },
  { name: 'log-bridge', pct: 15, color: '#26C281' },
  { name: 'dashboard',  pct: 8,  color: '#F5A623' },
  { name: 'docs',       pct: 4,  color: 'var(--color-text-3)' },
]

const STATS = [
  { label: 'Total Incidents',    value: '4,821', delta: '↑ 12.4%',  note: 'vs last period' },
  { label: 'AI Resolution Rate', value: '89.4%', delta: '↑ 5.2%',   note: 'vs last period' },
  { label: 'Avg Fix Time',       value: '4.2',   unit: 'min', delta: '↓ 1.1 min', note: 'improvement' },
  { label: 'PRs Created',        value: '184',   delta: '↑ 8',       note: 'vs last period' },
]

export function AnalyticsPage() {
  const { theme } = useTheme()
  const cfg = CHART_CFG[theme] ?? CHART_CFG['docker-dark']
  const [range, setRange] = useState('Last 30 days')

  return (
    <div className="space-y-4 page-enter">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-[12px] text-text-1 outline-none"
        >
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>This year</option>
        </select>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-text-2 transition-colors hover:text-text-1">
          <Download className="h-3 w-3" />
          Export
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface px-5 py-[18px]">
            <div className="mb-2 text-[11.5px] font-medium text-text-3">{s.label}</div>
            <div className="mb-1.5 text-[26px] font-extrabold leading-none text-text-1">
              {s.value}
              {'unit' in s && (
                <span className="ml-1 text-[14px] font-semibold text-text-3">{s.unit}</span>
              )}
            </div>
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold"
              style={{ background: 'rgba(38,194,129,.13)', color: '#26C281' }}
            >
              {s.delta}
            </span>
            <span className="ml-1.5 text-[10.5px] text-text-3">{s.note}</span>
          </div>
        ))}
      </div>

      {/* Chart row */}
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-border bg-surface px-[22px] py-5">
          <div className="mb-4 text-[14px] font-bold text-text-1">Incident Volume — Last 30 Days</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={VOLUME_DATA} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-vol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={cfg.accent} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={cfg.accent} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={cfg.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 10, fill: cfg.tick }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: cfg.tick }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="v" name="Incidents" stroke={cfg.accent} strokeWidth={2.5} fill="url(#grad-vol)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3.5 text-[14px] font-bold text-text-1">By Service</div>
          <div className="flex flex-col gap-3">
            {BY_SERVICE.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex justify-between">
                  <span className="text-[12.5px] text-text-1">{s.name}</span>
                  <span className="text-[12.5px] font-bold text-text-1">{s.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'var(--color-surface-3)' }}>
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exception categories */}
      <div className="rounded-xl border border-border bg-surface px-[22px] py-5">
        <div className="mb-3.5 text-[14px] font-bold text-text-1">Exception Categories by Week</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={CATEGORY_DATA} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid stroke={cfg.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="w" tick={{ fontSize: 11, fill: cfg.tick }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: cfg.tick }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="null"    name="NullRef" stackId="a" fill={cfg.accent} />
            <Bar dataKey="sql"     name="SQL"     stackId="a" fill={cfg.bar2} />
            <Bar dataKey="oom"     name="OOM"     stackId="a" fill={cfg.bar3} />
            <Bar dataKey="timeout" name="Timeout" stackId="a" fill="#F5A623" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
