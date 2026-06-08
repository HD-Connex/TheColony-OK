import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <nav className="site-footer__nav" aria-label="Footer">
          <Link href="/vs/blaze">The Colony vs BlazeTV</Link>
        </nav>
        <small>The Colony OK — video/live/realtime features deployed.</small>
      </div>
    </footer>
  );
}