export default function ImpactSeal({ text }: { text: string }) {
  return (
    <aside className="impact-seal" aria-label="Story impact">
      <span className="impact-seal__foil foil">IMPACT</span>
      <span className="impact-seal__text">{text}</span>
    </aside>
  );
}
