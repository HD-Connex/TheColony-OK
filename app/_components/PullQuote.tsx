export default function PullQuote({ children, cite }: { children: React.ReactNode; cite?: string }) {
  return (
    <blockquote className="pullquote">
      {children}
      {cite && <cite>— {cite}</cite>}
    </blockquote>
  );
}
