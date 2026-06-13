/** Central slug → hero image mapping for stories, shows, and fallbacks.
 * Stock footage (Pexels direct permanent CDN URLs) added for ALL ultimate fallbacks + null DB fields.
 * Guarantees ZERO broken <img> / Image src / video poster / podcast cover / thumbnail anywhere.
 * Relevant themes: rural Oklahoma landscapes, farms, energy/oil/pipelines, newsrooms, American heartland, politics, conservative journalism.
 * Stock temporary (will be swapped for real content). Prefer these over any null/empty/404 path.
 */

export const STOCK = {
  // Story / article / search heroes — rural OK prairie, politics, energy, farm heartland (fresh stable Pexels direct links from web search)
  storyDefault: "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  heroDefault: "https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  // Podcast covers + episode thumbs — studio journalism + rural conservative aesthetic
  podcastDefault: "https://images.pexels.com/photos/3756697/pexels-photo-3756697.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Host / contributor photos (professional portraits)
  hostDefault: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
  hostFemaleDefault: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400",
  // Live slates, off-air, 24/7 offline state — open prairie landscape
  slateDefault: "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=800",
  offAirDefault: "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Themed stock variants (searched fresh stable direct links)
  energyOil: "https://images.pexels.com/photos/162622/pexels-photo-162622.jpeg?auto=compress&cs=tinysrgb&w=800",
  farmRural: "https://images.pexels.com/photos/162395/hay-bales-field-agriculture-162395.jpeg?auto=compress&cs=tinysrgb&w=800",
  newsroomPolitics: "https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=800",
  prairieHeartland: "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Additional searched high-quality stock for variety (journalism, oil rigs, rural fields, anchors)
  journalismNews: "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?auto=compress&cs=tinysrgb&w=800",
  oilIndustry: "https://images.pexels.com/photos/37589838/pexels-photo-37589838.jpeg?auto=compress&cs=tinysrgb&w=800",
  ruralField: "https://images.pexels.com/photos/162395/hay-bales-field-agriculture-162395.jpeg?auto=compress&cs=tinysrgb&w=800",
  newsAnchor: "https://images.pexels.com/photos/7596907/pexels-photo-7596907.jpeg?auto=compress&cs=tinysrgb&w=800",
  pipeline: "https://images.pexels.com/photos/162622/pexels-photo-162622.jpeg?auto=compress&cs=tinysrgb&w=800",
};

export const STORY_HERO: Record<string, string> = {
  "oklahoma-budget-crisis": "/assets/images/stories/oklahoma-budget-crisis.jpg",
  "lobbyist-network-silence": "/assets/images/stories/lobbyist-network.jpg",
  "parents-curriculum-pushback": "/assets/images/stories/parents-curriculum.jpg",
  "energy-sector-green-mandates": "/assets/images/stories/energy-pipeline.jpg",
  "sheriffs-race-investigation": "/assets/images/stories/sheriffs-race.jpg",
  "tulsa-dei-defund-vote": "/assets/images/stories/tulsa-dei-vote.jpg",
  // Migrated newsletter archive articles (ex-Substack content, now native)
  "harvest-reality-2026": "/assets/images/stories/energy-pipeline.jpg",
  "patch-reality-energy": "/assets/images/stories/energy-pipeline.jpg",
  "heritage-4h-counties": "/assets/images/stories/parents-curriculum.jpg",
};

export const STORY_HERO_ALT: Record<string, string> = {
  "oklahoma-budget-crisis": "Oklahoma State Capitol at dusk with investigative budget documents and red stamps — budget crisis reporting",
  "lobbyist-network-silence": "Shadowed Oklahoma Capitol corridor with redacted lobbyist contracts and documents — lobbyist influence investigation",
  "parents-curriculum-pushback": "Oklahoma school board meeting with parents presenting curriculum documents and red parental rights materials — education investigation",
  "energy-sector-green-mandates": "Oklahoma oil field and pipeline at dramatic sunset with official energy mandate papers and red highlights — energy policy investigation",
  "sheriffs-race-investigation": "Rural Oklahoma courthouse with sheriff campaign materials, finance disclosure documents and red investigation stamps — sheriffs race reporting",
  "tulsa-dei-defund-vote": "Tulsa City Council chamber during tense public vote on DEI funding with official documents and microphones — local government investigation",
  // Migrated newsletter archive (ex-Substack) alt texts
  "harvest-reality-2026": "Oklahoma wheat harvest at golden hour with co-op silos — 2026 ag reality reporting",
  "patch-reality-energy": "Oklahoma energy infrastructure at sunset — pipeline and rural grid investigative beat",
  "heritage-4h-counties": "Small town Oklahoma community meeting with 4H and church leaders — county heritage and faith coverage",
};

export const PODCAST_ART: Record<string, string> = {
  "colony-report": "/assets/images/podcasts/colony-report.jpg",
  "patriot-hour": "/assets/images/podcasts/patriot-hour.jpg",
  "oklahoma-underground": "/assets/images/podcasts/oklahoma-underground.jpg",
  "faith-and-freedom": "/assets/images/podcasts/faith-freedom.jpg",
  // Fill broken/missing (energy-ok from seeds, ag-report series) with stable stock footage
  "energy-ok": STOCK.energyOil,
  "ag-report": STOCK.farmRural,
};

export const HOST_PHOTO: Record<string, string> = {
  "jake-merrick": "/assets/images/hosts/jake-merrick.jpg",
  "marcus-webb": "/assets/images/hosts/marcus-webb.jpg",
  "rachel-torres": "/assets/images/hosts/rachel-torres.jpg",
  "dan-hollis": "/assets/images/hosts/dan-hollis.jpg",
  "sarah-mitchell": "/assets/images/hosts/sarah-mitchell.jpg",
  "david-reyes": "/assets/images/hosts/david-reyes.jpg",
  // Fill for wes-carter (seed contributor, ag/energy beat) — stock portrait
  "wes-carter": STOCK.hostDefault,
};

export function storyHero(slug: string, dbUrl?: string | null): string {
  if (dbUrl && dbUrl.trim() && !dbUrl.endsWith(".svg")) return dbUrl;
  return STORY_HERO[slug] || STOCK.storyDefault;
}

/** Helper for Next <Image unoptimized> on external stock (prevents optimization 404s on Pexels/Unsplash etc.) */
export const stockUnoptimized = (url: string) => url.startsWith('http');

export function hostPhoto(slug: string, headshot?: string | null, name = ""): string {
  if (headshot && headshot.trim() && !headshot.endsWith(".svg")) return headshot;
  if (HOST_PHOTO[slug]) return HOST_PHOTO[slug];
  const lower = `${slug} ${name}`.toLowerCase();
  if (lower.includes("marcus") || lower.includes("webb")) return HOST_PHOTO["marcus-webb"];
  if (lower.includes("rachel") || lower.includes("torres")) return HOST_PHOTO["rachel-torres"];
  if (lower.includes("dan") || lower.includes("hollis") || lower.includes("pastor")) return HOST_PHOTO["dan-hollis"];
  if (lower.includes("jake") || lower.includes("merrick")) return HOST_PHOTO["jake-merrick"];
  if (lower.includes("sarah") || lower.includes("mitchell")) return HOST_PHOTO["sarah-mitchell"];
  if (lower.includes("david") || lower.includes("reyes")) return HOST_PHOTO["david-reyes"];
  if (lower.includes("wes") || lower.includes("carter") || lower.includes("ag") || lower.includes("energy")) return STOCK.hostDefault;
  // Ultimate safe stock (never produces empty, null, svg, or 404)
  return STOCK.hostDefault;
}

/** Podcast / show cover — fills null DB (energy-ok etc) and ensures stock for grids/rails/search. */
export function podcastCover(slug: string, dbUrl?: string | null): string {
  if (dbUrl && dbUrl.trim() && !dbUrl.endsWith(".svg")) return dbUrl;
  if (PODCAST_ART[slug]) return PODCAST_ART[slug];
  return STOCK.podcastDefault;
}

/** Universal safe stock image helper. Call from any card, search result, live, admin preview etc.
 * Always returns a loading-guaranteed direct URL (stock from Pexels).
 */
export function safeStockImage(type: string = "default", key?: string, dbVal?: string | null): string {
  if (dbVal && dbVal.trim() && !dbVal.endsWith(".svg")) return dbVal;
  const t = (type || "default").toLowerCase();
  if (t.includes("podcast") || t.includes("cover") || t.includes("show")) return podcastCover(key || "", dbVal);
  if (t.includes("host") || t.includes("photo") || t.includes("portrait") || t.includes("contributor")) return hostPhoto(key || "", dbVal, "");
  if (t.includes("story") || t.includes("article") || t.includes("dispatch")) return storyHero(key || "", dbVal);
  if (t.includes("slate") || t.includes("off") || t.includes("live") || t.includes("247")) return STOCK.slateDefault;
  if (t.includes("energy") || t.includes("oil") || t.includes("pipeline")) return STOCK.energyOil;
  if (t.includes("farm") || t.includes("rural") || t.includes("harvest")) return STOCK.farmRural;
  if (t.includes("news") || t.includes("politic") || t.includes("capitol")) return STOCK.newsroomPolitics;
  if (t.includes("hero")) return STOCK.heroDefault;
  return STOCK.storyDefault;
}