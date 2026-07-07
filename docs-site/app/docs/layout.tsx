'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import CommandPalette from '@/components/CommandPalette';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="overflow-x-hidden">
      <Navbar onOpenSearch={() => setSearchOpen(true)} onToggleMobile={() => setMobileOpen(o => !o)} />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-[240px] h-full" onClick={e => e.stopPropagation()}>
            <Sidebar className="!fixed !top-0 !h-full pt-14" onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex pt-14 min-h-screen">
        <Sidebar className="hidden lg:block" />
        <main className="flex-1 min-w-0 overflow-x-hidden lg:ml-[230px]">
          {children}
        </main>
      </div>
    </div>
  );
}
