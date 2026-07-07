'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, FileText } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { useRouter } from 'next/navigation';

interface SearchItem {
  title: string;
  slug: string;
  description: string;
}

const searchData: SearchItem[] = [
  { title: 'Getting Started', slug: 'getting-started', description: 'Setup, installation, and first deployment' },
  { title: 'Prerequisites', slug: 'getting-started#prerequisites', description: 'Node.js, Python, Docker requirements' },
  { title: 'Installation', slug: 'getting-started#installation', description: 'Clone and install dependencies' },
  { title: 'Configuration', slug: 'getting-started#configuration', description: 'Environment files and API keys' },
  { title: 'Starting the Platform', slug: 'getting-started#starting-the-platform', description: 'Run all services with npm run dev' },
  { title: 'Your First Crawl', slug: 'getting-started#your-first-crawl', description: 'Index a website for the first time' },
  { title: 'Embedding the Widget', slug: 'getting-started#embedding-the-widget', description: 'Add chat widget to any website' },
  { title: 'Architecture Guide', slug: 'architecture', description: 'System design, data flows, and key decisions' },
  { title: 'System Overview', slug: 'architecture#system-overview', description: 'Four-layer platform architecture' },
  { title: 'Architecture Layers', slug: 'architecture#architecture-layers', description: 'Client, Node.js, Python, Qdrant layers' },
  { title: 'Agentic RAG Pipeline', slug: 'architecture#agentic-rag-pipeline', description: 'LLM decides which tools to call' },
  { title: 'Multi-Tenancy', slug: 'architecture#multi-tenancy', description: 'Data isolation by tenant_id at every layer' },
  { title: 'AI Provider Fallback', slug: 'architecture#ai-provider-fallback', description: 'Groq → Gemini → OpenRouter chain' },
  { title: 'Key Design Decisions', slug: 'architecture#key-design-decisions', description: 'Why Python + Node, SQLite, Agentic RAG' },
  { title: 'Security', slug: 'architecture#security', description: 'Passwords, JWT, API keys, CORS, tenant isolation' },
];

const fuse = new Fuse(searchData, { keys: ['title', 'description'], threshold: 0.4 });

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [selected, setSelected] = useState(0);

  const results = query ? fuse.search(query).map(r => r.item) : searchData;

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // parent toggles
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const navigate = (slug: string) => {
    if (slug.includes('#')) {
      const [page, hash] = slug.split('#');
      router.push(`/docs/${page}#${hash}`);
    } else {
      router.push(`/docs/${slug}`);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) { navigate(results[selected].slug); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: 'var(--cv-bg)', boxShadow: 'var(--cv-shadow-lg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--cv-border)' }}>
              <Search size={16} style={{ color: 'var(--cv-muted-fg)' }} />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Search documentation..."
                className="flex-1 bg-transparent outline-none text-[15px]"
                style={{ color: 'var(--cv-fg)' }} />
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
              {results.map((item, i) => (
                <button key={item.slug} onClick={() => navigate(item.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                  style={{
                    background: i === selected ? 'var(--cv-brand-soft)' : 'transparent',
                    color: i === selected ? 'var(--cv-brand)' : 'var(--cv-fg)',
                  }}>
                  <FileText size={14} style={{ color: 'var(--cv-muted-fg)' }} />
                  <div>
                    <p className="text-[13px] font-medium">{item.title}</p>
                    <p className="text-[11px]" style={{ color: 'var(--cv-muted-fg)' }}>{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 px-4 py-2.5 border-t text-[11px]"
              style={{ borderColor: 'var(--cv-border)', color: 'var(--cv-muted-fg)' }}>
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
