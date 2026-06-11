const LAUNCH = new Date("2025-01-01T00:00:00-06:00");

function editionNumber(now: Date): number {
  return Math.max(1, Math.floor((now.getTime() - LAUNCH.getTime()) / 86_400_000));
}

export default function FolioBar() {
  const now = new Date();
  const dateline = now
    .toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Chicago",
    })
    .toUpperCase();
  const vol = now.getFullYear() - LAUNCH.getFullYear() + 1;

  return (
    <div className="folio" role="doc-pagebreak" aria-label="Edition information">
      <span className="folio__item">VOL. {["I", "II", "III", "IV", "V"][vol - 1] ?? vol}</span>
      <span className="folio__item">N° {editionNumber(now)}</span>
      <span className="folio__item folio__item--date">{dateline}</span>
      <span className="folio__item">TULSA, OKLAHOMA</span>
      <span className="folio__item folio__item--funded">READER-FUNDED · NO ADVERTISERS</span>
    </div>
  );
}
