'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

export default function TOC({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );

    items.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="fixed right-0 top-14 w-[200px] h-[calc(100vh-56px)] overflow-y-auto no-scrollbar p-4 hidden xl:block"
      style={{ borderLeft: '1px solid var(--cv-border)' }}>
      <p className="text-[11px] uppercase font-bold tracking-[0.08em] mb-3"
        style={{ color: 'var(--cv-muted-fg)' }}>
        On this page
      </p>
      <nav className="space-y-0.5">
        {items.map(item => (
          <a key={item.id} href={`#${item.id}`}
            className={clsx(
              'block py-1.5 px-3 rounded-lg text-[12px] transition-all duration-150',
              item.level === 3 && 'ml-3',
              item.level === 4 && 'ml-6'
            )}
            style={{
              color: activeId === item.id ? 'var(--cv-brand)' : 'var(--cv-muted-fg)',
              background: activeId === item.id ? 'var(--cv-brand-soft)' : 'transparent',
            }}>
            {item.title}
          </a>
        ))}
      </nav>
    </aside>
  );
}
