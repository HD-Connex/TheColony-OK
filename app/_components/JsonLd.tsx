// Server component for safely embedding JSON-LD into a page.

interface Props {
  // Schema.org object — typed as `unknown` so any shape passes through.
  data: unknown;
}

export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
