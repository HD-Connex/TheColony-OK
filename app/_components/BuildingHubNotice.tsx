import Link from "next/link";
import type { BlogPost } from "@/lib/blog-posts";

interface Props {
  post: BlogPost;
}

/** Homepage strip directly under the hero — surfaces the featured build-in-public blog post. */
export default function BuildingHubNotice({ post }: Props) {
  return (
    <section className="hub-notice" aria-label="Building the news hub">
      <div className="container hub-notice__inner">
        <div className="hub-notice__label">
          <span className="badge badge--live">BUILDING IN PUBLIC</span>
          <span className="hub-notice__category">{post.category}</span>
        </div>
        <div className="hub-notice__body">
          <h2 className="hub-notice__title">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h2>
          <p className="hub-notice__dek">{post.dek}</p>
        </div>
        <div className="hub-notice__actions">
          <Link className="btn btn--primary btn--sm" href={`/blog/${post.slug}`}>
            Read the Update
          </Link>
          <Link className="btn btn--outline btn--sm" href="/blog">
            All Blog Posts
          </Link>
        </div>
      </div>
    </section>
  );
}