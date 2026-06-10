// Sent when a contributor application is approved (status -> approved).
// Hook this from an admin action or future /api/contributors/approve route.

export interface ContributorApprovedProps {
  name: string;
  email: string;
  tier?: string | null;
  siteUrl?: string;
}

export function contributorApprovedHtml({ name, email, tier, siteUrl = "https://thecolonyok.com" }: ContributorApprovedProps): string {
  const t = tier ? ` as a ${tier}` : "";
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Contributor approved — The Colony OK</title></head>
<body style="margin:0;padding:24px;background:#f6f3eb;font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color:#111;">
  <table width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:3px solid #111;">
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:1px;color:#b22222;">▼ MASTHEAD</p>
      <h1 style="margin:0 0 16px;font-family: 'Archivo Black', system-ui, sans-serif; font-size:24px;">Welcome to the masthead, ${name}.</h1>
      <p style="margin:0 0 16px;font-size:15px;">Your contributor application has been approved${t}.</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">You can now pitch stories, upload clips (if tier permits), and appear on /journalists and bylines. An editor will reach out shortly with next steps and credentials.</p>
      <p style="margin:16px 0 0;font-size:14px;">Reply to this email or use your contributor dashboard (coming) to get started.</p>
      <p style="margin:24px 0 0;font-size:12px;color:#555;">The Colony OK • Oklahoma investigations + rural beats</p>
    </td></tr>
  </table>
</body>
</html>`;
}
