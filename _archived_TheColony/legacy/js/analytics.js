// Lightweight event tracking wrapper around Plausible.
// Add `data-track="event-name"` to any clickable element to auto-track.

export function trackEvent(name, props = {}) {
  if (typeof window.plausible === 'function') {
    window.plausible(name, { props });
  }
}

export function initTracking() {
  // Auto-track elements with data-track attribute
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-track]');
    if (!target) return;
    const eventName = target.dataset.track;
    const props = { ...target.dataset };
    delete props.track;
    trackEvent(eventName, props);
  });

  // Track membership CTA clicks specifically
  document.querySelectorAll('a[href*="/membership"], a[href*="/join"]').forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('Membership CTA', {
        location: window.location.pathname,
        label: link.textContent.trim().slice(0, 50),
      });
    });
  });
}
