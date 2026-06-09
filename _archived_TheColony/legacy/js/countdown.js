// Countdown timer for upcoming live shows
// Usage: initCountdown(targetDateISO) where targetDateISO is "2026-06-01T19:00:00"

export function initCountdown(targetDateISO) {
  const container = document.querySelector('.countdown');
  if (!container) return;

  const target = new Date(targetDateISO).getTime();

  function update() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      container.innerHTML = '<span class="badge badge--live">LIVE NOW</span>';
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    container.querySelector('[data-unit="d"]').textContent = String(d).padStart(2, '0');
    container.querySelector('[data-unit="h"]').textContent = String(h).padStart(2, '0');
    container.querySelector('[data-unit="m"]').textContent = String(m).padStart(2, '0');
    container.querySelector('[data-unit="s"]').textContent = String(s).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}
