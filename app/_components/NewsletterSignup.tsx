"use client";

import NewsletterForm, { type NewsletterFormProps } from "./NewsletterForm";

/**
 * Newsletter signup "plate" / block for The Colony's "The Briefing" (internal, reader-funded).
 * Integrated newsletter experience: clean prominent headline, optional county picker, CTA.
 * "Subscribe for the local briefing" language. Fully self-contained (no external newsletter platforms).
 * Wraps the enhanced NewsletterForm.
 * Variants (passed through + local styling):
 *  - plate: dedicated full block (used in /counties, my-feed, after content)
 *  - inline: compact after filters/headers (news, stories)
 *  - sidebar: narrow vertical for live sidebar / story sidebar
 *  - default: falls back to footer-style
 *
 * DS alignment (brutalist Heirloom Press, ref Phase 1 + UI_UX_DESIGN_SYSTEM + premium.css):
 * - Zero radius (tokens enforce).
 * - Grain + foil accents on paper/cream contexts.
 * - rule-double / brass borders for premium plates.
 * - Mono uppercase eyebrows/labels, alarm for urgency on key CTAs, hairline rules.
 * - No breaking layout: uses container tokens, responsive, stacks cleanly.
 * - Reuses existing .newsletter* classes + extends with --plate etc for scoped overrides.
 */

interface NewsletterSignupProps extends Omit<NewsletterFormProps, "variant"> {
  variant?: NewsletterFormProps["variant"];
  title?: string; // override headline e.g. for context ("Get county briefings")
  eyebrow?: string;
  copy?: string;
  compact?: boolean; // for very tight spaces
}

export default function NewsletterSignup({
  variant = "plate",
  source = "web",
  title,
  eyebrow = "▼ THE BRIEFING",
  copy,
  compact = false,
  className,
  ...formProps
}: NewsletterSignupProps) {
  const isPlate = variant === "plate";
  const isInline = variant === "inline";
  const isSidebar = variant === "sidebar";

  const defaultTitle = "Subscribe for the local briefing";
  const defaultCopy =
    "Oklahoma investigations, live drops, and county editions — delivered before coffee. Free. Double opt-in. Unsubscribe anytime.";

  const rootClass = [
    "newsletter-signup",
    `newsletter-signup--${variant}`,
    isPlate ? "grain" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  const headingClass = isPlate || isSidebar ? "newsletter-signup__heading" : "";

  return (
    <div className={rootClass} data-variant={variant}>
      <div className={headingClass}>
        <span className="newsletter__eyebrow foil">{eyebrow}</span>
        <h3 className="newsletter-signup__title">{title || defaultTitle}</h3>
      </div>

      {!compact && (
        <p className="newsletter-signup__copy fine-print">
          {copy || defaultCopy}
        </p>
      )}

      <NewsletterForm
        variant={variant}
        source={source}
        {...formProps}
      />

      {isPlate && (
        <div className="newsletter-signup__footer">
          <span className="fine-print">Members: manage counties in <a href="/my-counties">My Counties</a>. Lists/prefs: <a href="/newsletter/preferences">Newsletter Preferences</a>.</span>
        </div>
      )}
    </div>
  );
}
