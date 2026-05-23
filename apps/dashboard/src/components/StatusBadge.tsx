import { clsx } from 'clsx'

const COLOURS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  triaged: 'bg-purple-100 text-purple-800',
  analyzed: 'bg-teal-100 text-teal-800',
  resolved: 'bg-green-100 text-green-800',
  ignored: 'bg-gray-100 text-gray-500',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize',
        COLOURS[status] ?? 'bg-gray-100 text-gray-800',
      )}
    >
      {status}
    </span>
  )
}
