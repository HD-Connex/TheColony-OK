import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import { formatDate } from "@/lib/format";
import { getBlogPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Build updates, publisher notes, and behind-the-scenes dispatches from The Colony OK news media hub.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
      eyebrow="▼ FROM THE PUBLISHER"
      title="Blog"
      lede="Honest updates while we build Oklahoma's independent news media hub — product milestones, editorial direction, and what is coming next."
      section={false}
      tone="paper"
    >
      <div className="blog-grid" style={{ paddingBlock: "var(--space-12)" }}>
        {posts.map((post) => (
          <article className="blog-card" key={post.slug}>
            <div className="blog-card__meta">
              <span>{post.category}</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span>{post.readTime}</span>
            </div>
            <h2 className="blog-card__title">
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="blog-card__dek">{post.dek}</p>
            <Link className="btn btn--ink btn--sm" href={`/blog/${post.slug}`}>
              Read Post →
            </Link>
          </article>
        ))}
      </div>
    </InnerPageShell>
  );
}