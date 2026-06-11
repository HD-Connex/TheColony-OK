import Link from "next/link";
import Image from "next/image";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="newsletter grain">
          <div className="newsletter__heading">
            <span className="newsletter__eyebrow">▼ The Briefing</span>
            <h3 className="newsletter__title">A Letter From Oklahoma. Every Morning.</h3>
          </div>
          <div>
            <p className="newsletter__copy">
              The day&apos;s investigations, podcasts, and live drops — delivered to your inbox before the first cup of
              coffee. Free.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="footer__masthead grain">
          <div className="footer__mark">
            <Image
              src="/assets/images/logo-dark.jpg"
              alt="The Colony"
              width={280}
              height={72}
              style={{ width: "auto", height: "3rem", display: "block" }}
            />
          </div>
          <div className="footer__imprint">
            <div>EST 2026 · VOL I</div>
            <div>OKLAHOMA CITY, OK</div>
            <div>READER-FUNDED PRESS</div>
          </div>
        </div>

        <div className="footer__grid">
          <div>
            <p className="footer__brand-tagline">
              Oklahoma&apos;s independent conservative press — investigative journalism, podcasting, and live
              programming funded by readers, not advertisers.
            </p>
          </div>
          <div>
            <div className="footer__col-title">Coverage</div>
            <div className="footer__links">
              <Link className="footer__link" href="/stories">
                Stories
              </Link>
              <Link className="footer__link" href="/news">
                Daily News
              </Link>
              <Link className="footer__link" href="/counties">
                Counties
              </Link>
              <Link className="footer__link" href="/my-feed">
                My Feed
              </Link>
              <Link className="footer__link" href="/live">
                Watch Live
              </Link>
              <Link className="footer__link" href="/podcasts">
                Podcasts
              </Link>
            </div>
          </div>
          <div>
            <div className="footer__col-title">Membership</div>
            <div className="footer__links">
              <Link className="footer__link" href="/pricing">
                Join — $4.99/mo
              </Link>
              <Link className="footer__link" href="/membership">
                Sign In
              </Link>
              <Link className="footer__link" href="/vs/blaze">
                The Colony vs BlazeTV
              </Link>
            </div>
          </div>
          <div>
            <div className="footer__col-title">Network</div>
            <div className="footer__links">
              <Link className="footer__link" href="/shows">
                Shows
              </Link>
              <Link className="footer__link" href="/search">
                Search
              </Link>
              <Link className="footer__link" href="/journalists">
                Journalists
              </Link>
              <Link className="footer__link" href="/contributors/join">
                Join the Masthead
              </Link>
            </div>
          </div>
          <div>
            <div className="footer__col-title">Imprint</div>
            <div className="footer__links">
              <Link className="footer__link" href="/about">
                About
              </Link>
              <Link className="footer__link" href="/advertise">
                Advertise
              </Link>
              <Link className="footer__link" href="/submit-a-tip">
                Submit a Tip
              </Link>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span className="footer__copyright">© 2026 The Colony OK. All rights reserved.</span>
          <div className="footer__legal">
            <Link className="footer__legal-link" href="/legal/privacy">
              Privacy
            </Link>
            <Link className="footer__legal-link" href="/legal/terms">
              Terms
            </Link>
            <Link className="footer__legal-link" href="/legal/cookies">
              Cookies
            </Link>
          </div>
        </div>

        <div className="colophon grain" style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', paddingBlock: 'var(--space-6)', borderTop: 'var(--rule-hairline) solid var(--color-border)' }}>
          Printed in the spirit of the broadsheet • handset in the digital foundry • no algorithms, no ads, no apologies.
        </div>
      </div>
    </footer>
  );
}