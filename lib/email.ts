// Resend email sender + template wiring.
// Templates live in ../emails/*.ts (plain HTML strings for max deliverability, no extra deps).
// All sends are fire-and-forget; errors are logged but never throw to callers.

import { Resend } from "resend";
import { welcomeHtml, type WelcomeProps } from "../emails/welcome";
import { receiptHtml, type ReceiptProps } from "../emails/receipt";
import { cancelHtml, type CancelProps } from "../emails/cancel";
import { contributorApprovedHtml, type ContributorApprovedProps } from "../emails/contributor-approved";
import { tipAckHtml, type TipAckProps } from "../emails/tip-ack";
import { newsletterConfirmHtml, type NewsletterConfirmProps } from "../emails/newsletter-confirm";
import { newsletterDigestHtml, type DigestProps } from "../emails/newsletter-digest";
import { log } from "./log";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    log.warn("[email] RESEND_API_KEY missing — email sends are no-ops (see .env.example)");
    return null;
  }
  _resend = new Resend(key);
  return _resend;
}

const FROM = process.env.RESEND_FROM || "The Colony OK <no-reply@thecolonyok.com>";

async function send(opts: { to: string; subject: string; html: string; tags?: { name: string; value: string }[] }) {
  const client = getResend();
  if (!client) return { ok: false, skipped: true };
  try {
    const { data, error } = await client.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      tags: opts.tags,
    });
    if (error) {
      log.error("[email] send failed", error);
      return { ok: false, error };
    }
    log.debug("[email] sent", opts.subject, data?.id);
    return { ok: true, id: data?.id };
  } catch (e) {
    log.error("[email] unexpected send error", e);
    return { ok: false, error: e };
  }
}

/** New member welcome (call after first successful membership sync). */
export async function sendWelcomeEmail(to: string, props: Omit<WelcomeProps, "siteUrl"> = {}) {
  return send({
    to,
    subject: "Welcome to The Colony OK — thank you",
    html: welcomeHtml({ ...props, siteUrl: process.env.NEXT_PUBLIC_SITE_URL }),
    tags: [{ name: "category", value: "welcome" }],
  });
}

/** Payment receipt after checkout or renewal. */
export async function sendReceiptEmail(to: string, props: Omit<ReceiptProps, "siteUrl" | "email">) {
  return send({
    to,
    subject: "Receipt — The Colony OK membership",
    html: receiptHtml({ ...props, email: to, siteUrl: process.env.NEXT_PUBLIC_SITE_URL }),
    tags: [{ name: "category", value: "receipt" }],
  });
}

/** Cancel / membership ended notice. */
export async function sendCancelEmail(to: string, props: Omit<CancelProps, "siteUrl" | "email">) {
  return send({
    to,
    subject: "Your Colony OK membership has ended",
    html: cancelHtml({ ...props, email: to, siteUrl: process.env.NEXT_PUBLIC_SITE_URL }),
    tags: [{ name: "category", value: "cancel" }],
  });
}

/** Contributor application approved (hook from admin tooling). */
export async function sendContributorApprovedEmail(to: string, props: Omit<ContributorApprovedProps, "siteUrl" | "email">) {
  return send({
    to,
    subject: "Contributor application approved — The Colony OK",
    html: contributorApprovedHtml({ ...props, email: to, siteUrl: process.env.NEXT_PUBLIC_SITE_URL }),
    tags: [{ name: "category", value: "contributor" }],
  });
}

/** Ack for tip or newsletter submission (only if contact email supplied). */
export async function sendTipAckEmail(to: string, props: TipAckProps) {
  const subject = props.kind === "tip" ? "Tip received — thank you" : "Added to The Briefing";
  return send({
    to,
    subject,
    html: tipAckHtml(props),
    tags: [{ name: "category", value: props.kind }],
  });
}

/** Double opt-in confirmation for newsletter. */
export async function sendNewsletterConfirmEmail(to: string, props: Omit<NewsletterConfirmProps, "email">) {
  return send({
    to,
    subject: "Confirm your subscription to The Briefing",
    html: newsletterConfirmHtml({ ...props, email: to }),
    tags: [{ name: "category", value: "newsletter" }],
  });
}

/** Weekly digest to confirmed subscribers. */
export async function sendNewsletterDigest(to: string, props: DigestProps) {
  return send({
    to,
    subject: props.subject,
    html: newsletterDigestHtml(props),
    tags: [{ name: "category", value: "digest" }],
  });
}
