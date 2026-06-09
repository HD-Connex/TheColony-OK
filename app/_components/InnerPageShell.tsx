import Breadcrumbs, { type Crumb } from "./Breadcrumbs";
import PageHeader from "./PageHeader";

interface Props {
  breadcrumbs: Crumb[];
  eyebrow: string;
  title: string;
  lede?: React.ReactNode;
  children: React.ReactNode;
  section?: boolean;
  tone?: "ink" | "paper";
}

export default function InnerPageShell({
  breadcrumbs,
  eyebrow,
  title,
  lede,
  children,
  section = true,
  tone = "ink",
}: Props) {
  const toneClass = tone === "paper" ? " section--paper" : "";
  return (
    <main id="main" className="page--inner">
      <section className={`section section--tight section--flush${toneClass}`}>
        <div className="container">
          <Breadcrumbs items={breadcrumbs} />
          <PageHeader eyebrow={eyebrow} title={title} lede={lede} />
          {section ? <section className="section section--tight">{children}</section> : children}
        </div>
      </section>
    </main>
  );
}