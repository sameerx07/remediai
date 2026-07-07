'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MDXContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-[24px] font-bold tracking-tight mb-3" style={{ color: 'var(--cv-fg)' }}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => {
          const id = String(children).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
          return (
            <h2 id={id} className="text-[19px] font-semibold mt-10 mb-3 pt-6 border-t scroll-mt-20"
              style={{ color: 'var(--cv-fg)', borderColor: 'var(--cv-border)' }}>
              {children}
            </h2>
          );
        },
        h3: ({ children }) => {
          const id = String(children).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
          return (
            <h3 id={id} className="text-[16px] font-semibold mt-6 mb-2 scroll-mt-20" style={{ color: 'var(--cv-fg)' }}>
              {children}
            </h3>
          );
        },
        h4: ({ children }) => (
          <h4 className="text-[15px] font-medium mt-4 mb-1.5" style={{ color: 'var(--cv-fg)' }}>
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="text-[14px] leading-[1.7] mb-3" style={{ color: 'var(--cv-fg)' }}>
            {children}
          </p>
        ),
        a: ({ href, children }) => (
          <a href={href} className="no-underline hover:underline" style={{ color: 'var(--cv-brand)' }}>
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-0.5 text-[14px]" style={{ color: 'var(--cv-fg)' }}>{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-0.5 text-[14px]" style={{ color: 'var(--cv-fg)' }}>{children}</ol>,
        li: ({ children }) => <li className="leading-[1.7]">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-3 pl-3 my-3 py-1.5 rounded-r-lg text-[13px]"
            style={{ borderColor: 'var(--cv-brand)', background: 'var(--cv-brand-soft)', color: 'var(--cv-fg)' }}>
            {children}
          </blockquote>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <pre className="rounded-xl p-3 my-3 overflow-x-auto text-[12px] font-mono leading-relaxed"
                style={{ background: 'var(--cv-code-bg)' }}>
                <code>{children}</code>
              </pre>
            );
          }
          return (
            <code className="px-1 py-0.5 rounded-md text-[12px] font-mono"
              style={{ background: 'var(--cv-muted)', color: 'var(--cv-brand)' }}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        table: ({ children }) => (
          <div className="my-3 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--cv-border)' }}>
            <table className="w-full text-[12px]">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead style={{ background: 'var(--cv-muted)' }}>{children}</thead>,
        th: ({ children }) => <th className="px-2.5 py-1.5 text-left font-semibold text-[11px]" style={{ color: 'var(--cv-fg)' }}>{children}</th>,
        td: ({ children }) => <td className="px-2.5 py-1.5 border-t text-[12px]" style={{ borderColor: 'var(--cv-border)', color: 'var(--cv-fg)' }}>{children}</td>,
        hr: () => <hr className="my-8" style={{ borderColor: 'var(--cv-border)' }} />,
      }}>
      {content}
    </ReactMarkdown>
  );
}
