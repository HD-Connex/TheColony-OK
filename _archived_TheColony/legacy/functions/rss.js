// Cloudflare Pages Function — RSS proxy
// Endpoint: /rss?url=<encoded-rss-feed-url>
// Caches responses for 5 minutes to reduce upstream load.

const ALLOWED_HOSTS = [
  'anchor.fm',
  'feeds.simplecast.com',
  'feeds.buzzsprout.com',
  'feeds.transistor.fm',
  'feeds.megaphone.fm',
  'feeds.captivate.fm',
  'feeds.libsyn.com',
  'feeds.acast.com',
  'feeds.fireside.fm',
  'feeds.podbean.com',
  'media.rss.com',
  'rss.com',
  'omny.fm',
  'pinecast.com',
];

function isAllowed(rssUrl) {
  try {
    const u = new URL(rssUrl);
    return ALLOWED_HOSTS.some(host => u.hostname === host || u.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const feedUrl = url.searchParams.get('url');

  if (!feedUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  if (!isAllowed(feedUrl)) {
    return new Response('Feed host not allowed', { status: 403 });
  }

  // Try the cache first
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  let response = await cache.match(cacheKey);

  if (response) {
    return response;
  }

  // Fetch upstream
  try {
    const upstream = await fetch(feedUrl, {
      headers: { 'User-Agent': 'TheColonyOK/1.0 (+https://thecolonyok.com)' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    if (!upstream.ok) {
      return new Response(`Upstream returned ${upstream.status}`, { status: 502 });
    }

    const xml = await upstream.text();

    response = new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': 'https://thecolonyok.com',
        'X-Content-Type-Options': 'nosniff',
      },
    });

    // Store in cache
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (err) {
    return new Response(`Fetch error: ${err.message}`, { status: 502 });
  }
}
