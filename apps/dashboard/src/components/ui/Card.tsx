import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  /** Hover lift + pointer */
  interactive?: boolean
  onClick?: () => void
  /** Removes default bg/border for custom gradient cards */
  bare?: boolean
}

export function Card({ children, className, interactive, onClick, bare }: CardProps) {
  return (
    <section
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      className={clsx(
        'rounded-xl',
        !bare && [
          'border border-border bg-surface',
          'shadow-sm',
          'transition-[border-color,box-shadow,transform] duration-200',
          'hover:border-border-2 hover:shadow-md hover:-translate-y-px',
        ],
        interactive && [
          'cursor-pointer',
          'active:translate-y-0 active:shadow-sm',
        ],
        className,
      )}
    >
      {children}
    </section>
  )
}
