export interface DigestProps {
  subject: string;
  items: Array<{ title: string; url: string; dek?: string | null }>;
  unsubscribeUrl: string;
}

export function newsletterDigestHtml({ subject, items, unsubscribeUrl }: DigestProps): string {
  const list = items.map(i => `<li style="margin:8px 0"><a href="${i.url}" style="color:#b22222">${i.title}</a><br/><span style="font-size:13px;opacity:.8">${i.dek || ""}</span></li>`).join("");
  return `<!doctype html>
<html><body style="font-family:monospace;background:#f6f3eb;padding:24px;color:#111">
<table style="max-width:560px;margin:0 auto;background:#fff;border:3px solid #111;padding:20px">
<tr><td>
<p style="margin:0 0 8px;font-size:11px;color:#b22222">▼ THE BRIEFING — WEEKLY</p>
<h1 style="margin:0 0 12px">${subject}</h1>
<ul style="padding-left:18px">${list}</ul>
<p style="margin-top:16px;font-size:12px">Independent Oklahoma journalism. Supported by readers like you.</p>
<p style="font-size:11px;margin-top:12px"><a href="${unsubscribeUrl}">Unsubscribe</a></p>
</td></tr></table>
</body></html>`;
}
