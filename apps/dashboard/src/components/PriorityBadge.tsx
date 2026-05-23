import { clsx } from 'clsx'

const COLOURS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize',
        COLOURS[priority] ?? 'bg-gray-100 text-gray-800',
      )}
    >
      {priority}
    </span>
  )
}
