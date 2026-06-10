// Payment receipt for successful membership payments / checkouts.
// Called from Stripe webhook after sync when payment succeeds.

export interface ReceiptProps {
  email: string;
  amount?: string | null; // e.g. "$9.99"
  tier?: string | null;
  periodEnd?: string | null;
  invoiceUrl?: string | null;
  siteUrl?: string;
}

export function receiptHtml({ email, amount, tier, periodEnd, invoiceUrl, siteUrl = "https://thecolonyok.com" }: ReceiptProps): string {
  const amt = amount || "your plan";
  const t = tier ? ` (${tier})` : "";
  const end = periodEnd ? `Renews ${new Date(periodEnd).toLocaleDateString()}.` : "";
  const inv = invoiceUrl ? `<p style="margin:12px 0 0;"><a href="${invoiceUrl}" style="color:#b22222;">View invoice / manage billing →</a></p>` : "";
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Receipt — The Colony OK</title></head>
<body style="margin:0;padding:24px;background:#f6f3eb;font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color:#111;">
  <table width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:3px solid #111;">
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:1px;color:#b22222;">▼ RECEIPT</p>
      <h1 style="margin:0 0 16px;font-family: 'Archivo Black', system-ui, sans-serif; font-size:24px;">Thank you for your support.</h1>
      <p style="margin:0 0 8px;font-size:15px;">Charged ${amt}${t} to ${email}.</p>
      <p style="margin:0 0 16px;font-size:14px;color:#444;">${end}</p>
      ${inv}
      <p style="margin:24px 0 0;font-size:13px;">Member benefits (live chat priority, full archive, exclusive clips) are now active. Questions? Reply to this email.</p>
      <p style="margin:20px 0 0;font-size:12px;color:#555;">The Colony OK • thecolonyok.com</p>
    </td></tr>
  </table>
</body>
</html>`;
}
