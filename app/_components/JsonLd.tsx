// Server component for safely embedding JSON-LD into a page.

interface Props {
  // Schema.org object — typed as `unknown` so any shape passes through.
  data: unknown;
}

export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // Escape `<` so untrusted strings (RSS titles/descriptions) can't break
      // out of the script tag with a literal </script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
