'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

interface NavSection {
  title: string;
  slug: string;
  subsections: { title: string; id: string }[];
}

const navItems: NavSection[] = [
  {
    title: 'Getting Started',
    slug: 'getting-started',
    subsections: [
      { title: 'Prerequisites', id: 'prerequisites' },
      { title: 'Installation', id: 'installation' },
      { title: 'Configuration', id: 'configuration' },
      { title: 'Starting the Platform', id: 'starting-the-platform' },
      { title: 'Your First Crawl', id: 'your-first-crawl' },
      { title: 'Embedding the Widget', id: 'embedding-the-widget' },
    ],
  },
  {
    title: 'Architecture Guide',
    slug: 'architecture',
    subsections: [
      { title: 'System Overview', id: 'system-overview' },
      { title: 'Architecture Layers', id: 'architecture-layers' },
      { title: 'Agentic RAG Pipeline', id: 'agentic-rag-pipeline' },
      { title: 'Multi-Tenancy', id: 'multi-tenancy' },
      { title: 'AI Provider Fallback', id: 'ai-provider-fallback' },
      { title: 'Key Design Decisions', id: 'key-design-decisions' },
      { title: 'Security', id: 'security' },
    ],
  },
];

export default function Sidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={clsx('w-[230px] h-[calc(100vh-56px)] fixed top-14 left-0 overflow-y-auto thin-scrollbar p-4 border-r', className)}
      style={{ background: 'var(--cv-bg)', borderColor: 'var(--cv-border)' }}>
      <div className="mt-2">
        <p className="text-[10px] uppercase font-bold tracking-[0.08em] mb-3 px-2"
          style={{ color: 'var(--cv-muted-fg)' }}>
          Documentation
        </p>
        <nav className="space-y-2">
          {navItems.map((section) => {
            const href = `/docs/${section.slug}`;
            const isActive = pathname === href;

            return (
              <div key={section.slug}>
                {/* Main section link */}
                <Link href={href} onClick={onNavigate}
                  className={clsx(
                    'block px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-150',
                    isActive
                      ? 'font-semibold'
                      : 'font-medium hover:bg-[var(--cv-muted)]'
                  )}
                  style={isActive ? {
                    background: 'var(--cv-brand-soft)',
                    color: 'var(--cv-brand)',
                  } : {
                    color: 'var(--cv-fg)',
                  }}>
                  {section.title}
                </Link>

                {/* Subsections — always visible */}
                {section.subsections.length > 0 && (
                  <div className="ml-2 mt-1 space-y-0 border-l pl-2" style={{ borderColor: 'var(--cv-border)' }}>
                    {section.subsections.map((sub) => (
                      <a key={sub.id} href={`/docs/${section.slug}#${sub.id}`} onClick={onNavigate}
                        className="block py-1 px-2 rounded-md text-[12px] transition-all duration-150 hover:text-[var(--cv-brand)] hover:bg-[var(--cv-brand-soft)]"
                        style={{ color: 'var(--cv-muted-fg)' }}>
                        {sub.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
