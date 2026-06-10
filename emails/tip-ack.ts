// Acknowledgment for tip or newsletter submission via /api/tips.
// Sent only if a contact email was provided and valid.

export interface TipAckProps {
  kind: "tip" | "newsletter";
  contact?: string | null;
  siteUrl?: string;
}

export function tipAckHtml({ kind, contact, siteUrl = "https://thecolonyok.com" }: TipAckProps): string {
  const isTip = kind === "tip";
  const subject = isTip ? "Tip received" : "Newsletter signup confirmed";
  const body = isTip
    ? "Thank you. Our desk has the lead. We follow up only when a story is opened and only via the contact method you provided (if any). Your anonymity is protected."
    : "You're on the list for The Briefing. No spam, ever. Unsubscribe link will be in every issue.";
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${subject} — The Colony OK</title></head>
<body style="margin:0;padding:24px;background:#f6f3eb;font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color:#111;">
  <table width="100%" style="max-width:520px;margin:0 auto;background:#fff;border:3px solid #111;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:1px;color:#b22222;">▼ ${isTip ? "TIP LINE" : "NEWSLETTER"}</p>
      <h1 style="margin:0 0 12px;font-size:20px;">${subject}.</h1>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.5;">${body}</p>
      ${contact ? `<p style="margin:0;font-size:12px;color:#555;">Confirmation sent to ${contact}.</p>` : ""}
      <p style="margin:16px 0 0;font-size:11px;color:#777;">The Colony OK • secure submissions only</p>
    </td></tr>
  </table>
</body>
</html>`;
}
