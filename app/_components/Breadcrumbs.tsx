import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
            {i > 0 && <span className="breadcrumbs__separator">/</span>}
            {isLast || !c.href ? (
              <span className="breadcrumbs__current">{c.label}</span>
            ) : (
              <Link href={c.href}>{c.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
