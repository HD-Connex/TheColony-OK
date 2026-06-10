// Welcome email for new paying members (sent on first active membership).
// Keep HTML simple, inline styles, no external assets for deliverability.

export interface WelcomeProps {
  name?: string | null;
  tier?: string | null;
  siteUrl?: string;
}

export function welcomeHtml({ name, tier, siteUrl = "https://thecolonyok.com" }: WelcomeProps): string {
  const greeting = name ? ` ${name.split(" ")[0]}` : "";
  const tierLine = tier ? `You are now a <strong>${tier}</strong> member.` : "Thank you for supporting independent Oklahoma journalism.";
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Welcome to The Colony OK</title></head>
<body style="margin:0;padding:24px;background:#f6f3eb;font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color:#111;">
  <table width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:3px solid #111;">
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:1px;color:#b22222;">▼ THE COLONY OK — MEMBER</p>
      <h1 style="margin:0 0 16px;font-family: 'Archivo Black', system-ui, sans-serif; font-size:28px;line-height:1.1;">Welcome aboard${greeting}.</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">${tierLine}</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">Your support keeps rural beats, investigations, and live coverage alive. Expect member-only stories, early access, and the occasional unfiltered dispatch.</p>
      <p style="margin:24px 0 0;">
        <a href="${siteUrl}/stories" style="display:inline-block;background:#b22222;color:#fff;padding:10px 18px;border:2px solid #111;text-decoration:none;font-size:14px;">Read member stories →</a>
      </p>
      <p style="margin:28px 0 0;font-size:12px;color:#555;">The Colony OK • Oklahoma City<br/>No spam. Unsubscribe anytime via your account or reply.</p>
    </td></tr>
  </table>
</body>
</html>`;
}
