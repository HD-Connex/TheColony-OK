// Subscription cancellation / end notice.
// Sent on customer.subscription.deleted or when status moves to canceled.

export interface CancelProps {
  email: string;
  tier?: string | null;
  endedAt?: string | null;
  siteUrl?: string;
}

export function cancelHtml({ email, tier, endedAt, siteUrl = "https://thecolonyok.com" }: CancelProps): string {
  const t = tier ? ` (${tier})` : "";
  const when = endedAt ? ` on ${new Date(endedAt).toLocaleDateString()}` : "";
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Membership ended — The Colony OK</title></head>
<body style="margin:0;padding:24px;background:#f6f3eb;font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color:#111;">
  <table width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:3px solid #111;">
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:1px;color:#b22222;">▼ MEMBERSHIP</p>
      <h1 style="margin:0 0 16px;font-family: 'Archivo Black', system-ui, sans-serif; font-size:24px;">Your membership has ended.</h1>
      <p style="margin:0 0 16px;font-size:15px;">The ${t} membership for ${email} ended${when}.</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">We're sorry to see you go. You still have access to public stories, the live feed, and free episodes. Rejoin anytime at <a href="${siteUrl}/pricing" style="color:#b22222;">/pricing</a>.</p>
      <p style="margin:20px 0 0;font-size:13px;">If this was a mistake or you have feedback, reply to this email. We read every one.</p>
      <p style="margin:20px 0 0;font-size:12px;color:#555;">The Colony OK</p>
    </td></tr>
  </table>
</body>
</html>`;
}
