"use client";

export default function TipForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tip = String(fd.get("tip") ?? "").trim();
    const contact = String(fd.get("contact") ?? "").trim();
    if (!tip) return;

    const subject = encodeURIComponent("Anonymous tip — The Colony OK");
    const body = encodeURIComponent(
      `${tip}${contact ? `\n\n---\nContact (optional): ${contact}` : "\n\n---\nNo contact provided."}`,
    );
    window.location.href = `mailto:tips@thecolonyok.com?subject=${subject}&body=${body}`;
  }

  return (
    <form className="tip-form" onSubmit={handleSubmit}>
      <label htmlFor="tip" className="sr-only">Your anonymous tip or story lead</label>
      <textarea id="tip" name="tip" rows={6} placeholder="Your tip..." required aria-label="Your anonymous tip or story lead" />
      <label htmlFor="contact" className="sr-only">Optional contact email (we will never publish it)</label>
      <input id="contact" type="email" name="contact" placeholder="OPTIONAL CONTACT EMAIL" aria-label="Optional contact email (we will never publish it)" />
      <button type="submit" className="btn btn--primary">
        Submit Tip
      </button>
      <p className="tip-form__note">Secure mailto submission. We protect sources.</p>
    </form>
  );
}