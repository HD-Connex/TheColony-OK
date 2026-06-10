export interface NewsletterConfirmProps {
  email: string;
  confirmUrl: string;
  unsubscribeUrl: string;
}

export function newsletterConfirmHtml({ email, confirmUrl, unsubscribeUrl }: NewsletterConfirmProps): string {
  return `<!doctype html>
<html><body style="font-family:monospace;background:#f6f3eb;padding:24px;color:#111">
<table style="max-width:520px;margin:0 auto;background:#fff;border:3px solid #111;padding:20px">
<tr><td>
<p style="margin:0 0 12px;font-size:11px;color:#b22222">▼ THE BRIEFING</p>
<h1 style="margin:0 0 12px;font-family:'Archivo Black',system-ui">Confirm your subscription</h1>
<p>Thanks for signing up, ${email.split("@")[0]}. One click to start receiving The Briefing.</p>
<p style="margin:16px 0"><a href="${confirmUrl}" style="background:#b22222;color:#fff;padding:10px 16px;border:2px solid #111;text-decoration:none">Confirm subscription</a></p>
<p style="font-size:12px">Or paste: ${confirmUrl}</p>
<p style="margin-top:20px;font-size:11px"><a href="${unsubscribeUrl}">Unsubscribe</a> (one click, anytime)</p>
</td></tr></table>
</body></html>`;
}
