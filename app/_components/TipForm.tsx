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
      <textarea name="tip" rows={6} placeholder="Your tip..." required />
      <input type="email" name="contact" placeholder="OPTIONAL CONTACT EMAIL" />
      <button type="submit" className="btn btn--primary">
        Submit Tip
      </button>
    </form>
  );
}