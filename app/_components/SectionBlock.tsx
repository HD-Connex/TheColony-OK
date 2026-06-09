import Link from "next/link";

interface Props {
  number: string;
  title: string;
  dateline?: string;
  linkHref?: string;
  linkLabel?: string;
  tone?: "ink" | "paper" | "alarm";
  children: React.ReactNode;
}

export default function SectionBlock({
  number,
  title,
  dateline,
  linkHref,
  linkLabel,
  tone,
  children,
}: Props) {
  const content = (
    <>
      <header className="section-header">
        <span className="section-header__number">{number}</span>
        <div className="section-header__group">
          <h2 className="section-title">{title}</h2>
          {dateline && <span className="section-header__dateline">{dateline}</span>}
        </div>
        {linkHref && linkLabel && (
          <Link className="section-link" href={linkHref}>
            {linkLabel}
          </Link>
        )}
      </header>
      {children}
    </>
  );

  if (!tone) return content;

  return <section className={`section section--${tone}`}>{content}</section>;
}