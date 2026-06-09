import Breadcrumbs, { type Crumb } from "./Breadcrumbs";
import PageHeader from "./PageHeader";

interface Props {
  breadcrumbs: Crumb[];
  eyebrow: string;
  title: string;
  lede?: React.ReactNode;
  children: React.ReactNode;
  section?: boolean;
}

export default function InnerPageShell({
  breadcrumbs,
  eyebrow,
  title,
  lede,
  children,
  section = true,
}: Props) {
  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader eyebrow={eyebrow} title={title} lede={lede} />
        {section ? <section className="section section--tight">{children}</section> : children}
      </div>
    </main>
  );
}