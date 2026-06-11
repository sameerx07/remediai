interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  eyebrow?: string
}

export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <header
      className="mb-5 flex flex-wrap items-start justify-between gap-3 pb-4"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <div>
        {eyebrow && (
          <p
            className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--color-accent)' }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="text-[17px] font-bold tracking-tight text-text-1"
          style={{ lineHeight: 1.25, letterSpacing: '-0.01em' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[12px] leading-snug text-text-3">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  )
}
