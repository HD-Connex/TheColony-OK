import Link from "next/link";

export interface FilterOption {
  key: string;
  label: string;
  href: string;
}

export default function FilterBar({
  options,
  activeKey,
}: {
  options: FilterOption[];
  activeKey?: string;
}) {
  return (
    <nav className="filter-bar" aria-label="Filter">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          className={`filter-bar__chip${activeKey === o.key ? " filter-bar__chip--active" : ""}`}
          aria-pressed={activeKey === o.key}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}