import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer__masthead">
          <div className="footer__mark">
            THE<span>COLONY</span>OK
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
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span className="footer__copyright">© 2026 The Colony OK. All rights reserved.</span>
          <div className="footer__legal">
            <Link className="footer__legal-link" href="/pricing">
              Terms
            </Link>
            <Link className="footer__legal-link" href="/pricing">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}