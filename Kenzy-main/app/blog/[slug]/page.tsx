import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || !post.published) return { title: "Not found" };
  return {
    title: `${post.title} — RITHTOPUP`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverUrl ? [post.coverUrl] : undefined,
      type: "article",
    },
  };
}

/**
 * Minimal text-to-safe-HTML: escapes tags, preserves paragraphs and line breaks.
 * Keeps admin-authored content free of XSS without needing a rich-text sanitizer.
 */
function renderContent(raw: string) {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.split(/\n{2,}/).map((block, i) => (
    <p key={i} className="mb-4 leading-relaxed text-fox-text/90" dangerouslySetInnerHTML={{ __html: block.replace(/\n/g, "<br/>") }} />
  ));
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || !post.published) notFound();

  return (
    <>
      <Header />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-fox-muted hover:text-fox-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>

        {post.tag && (
          <span className="inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-fox-primary/10 text-fox-primary mb-3">
            {post.tag}
          </span>
        )}

        <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight mb-3">{post.title}</h1>
        {post.publishedAt && (
          <div className="text-sm text-fox-muted mb-8">{new Date(post.publishedAt).toLocaleDateString()}</div>
        )}

        {post.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverUrl} alt="" className="w-full rounded-2xl mb-8 border border-fox-border" />
        )}

        <div className="prose prose-invert max-w-none text-base">
          {renderContent(post.content)}
        </div>
      </article>
      <Footer />
    </>
  );
}
