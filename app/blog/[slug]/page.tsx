import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InnerPageShell from "../../_components/InnerPageShell";
import JsonLd from "../../_components/JsonLd";
import { formatDate } from "@/lib/format";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/blog-posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecolonyok.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.dek,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.dek,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

function bodyParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const paragraphs = bodyParagraphs(post.body);
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.dek,
          datePublished: post.publishedAt,
          author: {
            "@type": "Person",
            name: post.author,
            jobTitle: post.authorRole,
          },
          publisher: {
            "@type": "Organization",
            name: "The Colony OK",
            url: SITE_URL,
          },
          mainEntityOfPage: canonicalUrl,
        }}
      />

      <InnerPageShell
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
        eyebrow={`▼ ${post.category.toUpperCase()}`}
        title={post.title}
        lede={post.dek}
        section={false}
        tone="paper"
      >
        <article className="prose-block" style={{ margin: "0 auto", paddingBlock: "var(--space-8) var(--space-16)" }}>
          <p className="mono-eyebrow" style={{ marginBottom: "var(--space-8)" }}>
            {post.author.toUpperCase()} · {post.authorRole.toUpperCase()} · {formatDate(post.publishedAt)} · {post.readTime}
          </p>

          {paragraphs.map((block, i) => {
            if (block.startsWith("**") && block.endsWith("**")) {
              return <h2 key={i}>{block.replace(/\*\*/g, "")}</h2>;
            }
            if (block.startsWith("- ")) {
              const items = block.split("\n").filter((line) => line.trim().startsWith("- "));
              return (
                <ul key={i}>
                  {items.map((item, j) => (
                    <li key={j}>{item.replace(/^-\s+/, "")}</li>
                  ))}
                </ul>
              );
            }
            if (/^\d+\.\s/.test(block)) {
              const items = block.split("\n").filter((line) => /^\d+\.\s/.test(line.trim()));
              return (
                <ol key={i}>
                  {items.map((item, j) => (
                    <li key={j}>{item.replace(/^\d+\.\s+/, "")}</li>
                  ))}
                </ol>
              );
            }
            return <p key={i}>{block}</p>;
          })}

          <p style={{ marginTop: "var(--space-12)", fontStyle: "italic" }}>
            — {post.author}, {post.authorRole}
          </p>

          <div style={{ marginTop: "var(--space-10)", display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <Link className="btn btn--ink" href="/stories">
              Browse Stories
            </Link>
            <Link className="btn btn--outline" href="/pricing">
              Join the Hub
            </Link>
            <Link className="btn btn--outline" href="/blog">
              ← All Blog Posts
            </Link>
          </div>
        </article>
      </InnerPageShell>
    </>
  );
}