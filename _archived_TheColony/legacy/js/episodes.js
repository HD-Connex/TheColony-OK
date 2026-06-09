// Hydrate the static podcast page's #episode-list block from the live API.
//
// The static HTML ships pre-rendered episode rows as a fallback (no flash of
// empty content). On successful fetch, the JS replaces them with fresh data.

const FALLBACK_API_BASE = 'https://thecolony-app.vercel.app';

export async function initEpisodes() {
  const target = document.getElementById('episode-list');
  if (!target) return;

  const slug = target.dataset.show;
  if (!slug) return;

  const apiBase = window.COLONY_API_BASE || FALLBACK_API_BASE;

  try {
    const res = await fetch(`${apiBase}/api/episodes?show=${encodeURIComponent(slug)}&limit=50`);
    if (!res.ok) return;
    const { episodes } = await res.json();
    if (!Array.isArray(episodes) || episodes.length === 0) return;

    target.innerHTML = episodes.map((ep, i) => row(ep, episodes.length - i)).join('');
  } catch (err) {
    console.warn('[episodes] hydration failed; using fallback', err);
  }
}

function row(ep, fallbackNumber) {
  const number = ep.episode_no ?? fallbackNumber;
  const numberStr = `N°${String(number).padStart(2, '0')}`;
  const date = formatDate(ep.pub_date);
  const duration = formatDuration(ep.duration_s);
  const titleHtml = ep.audio_url
    ? `<a href="${escapeAttr(ep.audio_url)}">${escapeHtml(ep.title)}</a>`
    : escapeHtml(ep.title);

  return `
    <div class="episode-row">
      <div class="episode-row__number">${numberStr}</div>
      <div class="episode-row__info">
        <div class="episode-row__title">${titleHtml}</div>
        <div class="episode-row__date">${date}</div>
      </div>
      <div class="episode-row__duration">${duration}</div>
    </div>
  `;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}H ${String(m).padStart(2, '0')}M` : `${m}M`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}
