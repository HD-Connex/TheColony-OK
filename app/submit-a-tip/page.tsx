import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import TipForm from "../_components/TipForm";

export const metadata: Metadata = {
  title: "Submit a Tip",
  description: "Secure tip line for The Colony OK investigations desk. Email, Signal, or anonymous form.",
  alternates: { canonical: "/submit-a-tip" },
  referrer: "no-referrer",
};

export default function SubmitTipPage() {
  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Submit a Tip" }]}
      eyebrow="▼ INVESTIGATIONS DESK · ANONYMOUS LINE"
      title="Submit a Tip"
      lede="Have a lead worth investigating? Choose the channel below that fits your level of caution. Encrypted options first, then standard."
      section={false}
    >
      <div className="tip-grid">
        <article className="tip-channel">
          <p className="tip-channel__eyebrow">▼ MOST SECURE · ENCRYPTED</p>
          <h2 className="tip-channel__title">Signal</h2>
          <p className="tip-channel__body">
            End-to-end encrypted messaging. Your number is not visible to us if you use a Signal username. We do not store
            messages.
          </p>
          <div className="tip-channel__handle">@thecolonyok.99</div>
        </article>

        <article className="tip-channel tip-channel--muted">
          <p className="tip-channel__eyebrow">▼ STANDARD · EMAIL</p>
          <h2 className="tip-channel__title">Encrypted Email</h2>
          <p className="tip-channel__body">PGP key available on request. Use a personal email account (not work).</p>
          <a className="btn btn--primary" href="mailto:tips@thecolonyok.com">
            tips@thecolonyok.com
          </a>
        </article>

        <article className="tip-channel">
          <p className="tip-channel__eyebrow">▼ ANONYMOUS · WEB FORM</p>
          <h2 className="tip-channel__title">Anonymous Tip Form</h2>
          <p className="tip-channel__body">
            Use Tor Browser for full anonymity. We follow up only if you provide a contact method. Submissions open your
            mail client to tips@thecolonyok.com — we do not store form data on our servers.
          </p>
          <TipForm />
        </article>

        <article className="tip-channel tip-channel--alarm">
          <p className="tip-channel__eyebrow">▼ POSTAL · NO ELECTRONIC TRAIL</p>
          <h2 className="tip-channel__title">Snail Mail</h2>
          <p className="tip-channel__body">
            Send physical documents to our P.O. Box. We open mail in person. Do not include a return address if anonymity
            matters.
          </p>
          <div className="tip-channel__address">
            THE COLONY OK
            <br />
            ATTN: INVESTIGATIONS
            <br />
            P.O. BOX 12
            <br />
            OKLAHOMA CITY OK 73101
          </div>
        </article>
      </div>
    </InnerPageShell>
  );
}