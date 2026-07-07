'use client';

import { Search, Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function Navbar({ onOpenSearch, onToggleMobile }: { onOpenSearch: () => void; onToggleMobile: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-3"
      style={{ background: 'var(--cv-brand-grad)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Decorative blob */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-30 blur-2xl pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.4)' }} />

      {/* Mobile menu toggle */}
      <button onClick={onToggleMobile} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
        <Menu size={18} />
      </button>

      {/* Logo */}
      <div className="relative flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}>
          <span className="text-white font-bold text-[14px]">S</span>
        </div>
        <span className="text-[14px] font-semibold text-white hidden sm:block">SHAPE Docs</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto hidden sm:block">
        <button onClick={onOpenSearch}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-white/60 hover:text-white/80 transition-colors"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <Search size={14} />
          <span>Search docs...</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/50">⌘K</kbd>
        </button>
      </div>

      {/* Search icon mobile */}
      <button onClick={onOpenSearch} className="sm:hidden ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
        <Search size={16} />
      </button>

      {/* Theme toggle */}
      <div className="relative">
        {mounted && (
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
      </div>
    </nav>
  );
}
