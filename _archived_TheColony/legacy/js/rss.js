// Client-side RSS feed parser
// Fetches a podcast RSS feed via our own Cloudflare Pages Function
// (functions/rss.js) — no third-party CORS proxy dependency.

const RSS_PROXY = '/rss?url=';

export async function fetchPodcastFeed(rssUrl) {
  try {
    const res = await fetch(`${RSS_PROXY}${encodeURIComponent(rssUrl)}`);
    if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    if (xml.querySelector('parsererror')) {
      throw new Error('Invalid RSS XML');
    }
    return parseRssXml(xml);
  } catch (err) {
    console.error('RSS fetch failed:', rssUrl, err);
    return null;
  }
}

function parseRssXml(xml) {
  const channel = xml.querySelector('channel');
  if (!channel) return null;

  const show = {
    title: getText(channel, 'title'),
    description: getText(channel, 'description'),
    image: channel.querySelector('image url')?.textContent?.trim() || '',
    link: getText(channel, 'link'),
    episodes: [],
  };

  channel.querySelectorAll('item').forEach(item => {
    show.episodes.push({
      title: getText(item, 'title'),
      description: getText(item, 'description'),
      pubDate: getText(item, 'pubDate'),
      duration: item.querySelector('itunes\\:duration')?.textContent?.trim() || '',
      audioUrl: item.querySelector('enclosure')?.getAttribute('url') || '',
      guid: getText(item, 'guid'),
      link: getText(item, 'link'),
    });
  });

  return show;
}

function getText(el, tag) {
  return el.querySelector(tag)?.textContent?.trim() || '';
}

// Renders episodes into a target element
export function renderEpisodes(episodes, container) {
  if (!container || !episodes?.length) return;

  container.innerHTML = episodes.slice(0, 20).map((ep, i) => `
    <div class="episode-row">
      <span class="episode-row__number">${i + 1}</span>
      <div class="episode-row__info">
        <div class="episode-row__title">${ep.title}</div>
        <div class="episode-row__date">${formatDate(ep.pubDate)}</div>
      </div>
      ${ep.duration ? `<span class="episode-row__duration">${ep.duration}</span>` : ''}
    </div>
  `).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
