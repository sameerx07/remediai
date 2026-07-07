import { getDocBySlug, getDocSlugs } from '@/lib/mdx';
import { extractToc } from '@/lib/toc';
import MDXContent from '@/components/MDXContent';
import TOC from '@/components/TOC';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return getDocSlugs().map(slug => ({ slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  if (!doc) notFound();

  const tocItems = extractToc(doc.content);

  return (
    <div className="relative">
      {/* Main content — fills available width, only padding from right for TOC on xl */}
      <article className="px-6 py-8 lg:px-10 xl:pr-[220px]">
        <MDXContent content={doc.content} />
      </article>

      {/* TOC fixed to right corner */}
      <TOC items={tocItems} />
    </div>
  );
}
