"use client";

export default function NewsletterForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) return;
    window.location.href = `mailto:briefing@thecolonyok.com?subject=${encodeURIComponent("Newsletter signup")}&body=${encodeURIComponent(`Please add me to The Briefing:\n${email}`)}`;
  }

  return (
    <form className="newsletter__form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="newsletter-email">Email address for The Briefing</label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        className="newsletter__input"
        placeholder="YOUR@EMAIL.COM"
        required
        aria-label="Email address for The Briefing"
      />
      <button type="submit" className="btn btn--primary">
        Join Free
      </button>
      <p className="newsletter__disclaimer">No spam. Unsubscribe in one click.</p>
    </form>
  );
}