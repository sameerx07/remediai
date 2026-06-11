import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  Cpu,
  LayoutGrid,
  Link2,
  ScrollText,
  Server,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavRoute {
  to: string
  label: string
  icon: LucideIcon
  dividerBefore?: boolean
}

export const NAV_ROUTES: NavRoute[] = [
  { to: '/metrics',      label: 'Overview',      icon: LayoutGrid    },
  { to: '/logs',         label: 'Logs',          icon: ScrollText    },
  { to: '/incidents',    label: 'Incidents',     icon: AlertTriangle },
  { to: '/targets',      label: 'Services',      icon: Server        },
  { to: '/analytics',    label: 'Analytics',     icon: BarChart2     },
  { to: '/runbooks',     label: 'Runbooks',      icon: BookOpen      },
  { to: '/agents',       label: 'Agents',        icon: Cpu           },
  { to: '/integrations', label: 'Integrations',  icon: Link2         },
  { to: '/settings',     label: 'Settings',      icon: Settings, dividerBefore: true },
]
