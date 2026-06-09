/** Central slug → hero image mapping for stories, shows, and fallbacks. */

export const STORY_HERO: Record<string, string> = {
  "oklahoma-budget-crisis": "/assets/images/stories/oklahoma-budget-crisis.svg",
  "lobbyist-network-silence": "/assets/images/stories/lobbyist-network.svg",
  "parents-curriculum-pushback": "/assets/images/stories/parents-curriculum.svg",
  "energy-sector-green-mandates": "/assets/images/stories/energy-pipeline.svg",
  "sheriffs-race-investigation": "/assets/images/stories/sheriffs-race.svg",
  "tulsa-dei-defund-vote": "/assets/images/stories/tulsa-dei-vote.svg",
};

export const STORY_HERO_ALT: Record<string, string> = {
  "oklahoma-budget-crisis": "Oklahoma state capitol at dusk — budget crisis investigation",
  "lobbyist-network-silence": "Capitol corridor and lobbying documents — Oklahoma politics",
  "parents-curriculum-pushback": "Parents at an Oklahoma school board meeting on curriculum",
  "energy-sector-green-mandates": "Oklahoma oil field and pipeline infrastructure at sunset",
  "sheriffs-race-investigation": "Oklahoma sheriff campaign rally — campaign finance investigation",
  "tulsa-dei-defund-vote": "Tulsa City Council chamber during DEI budget vote",
};

export const PODCAST_ART: Record<string, string> = {
  "colony-report": "/assets/images/podcast-colony-report.svg",
  "patriot-hour": "/assets/images/podcast-patriot-hour.svg",
  "oklahoma-underground": "/assets/images/podcast-ok-underground.svg",
  "faith-and-freedom": "/assets/images/podcast-faith-freedom.svg",
};

export const HOST_PHOTO: Record<string, string> = {
  "jake-merrick": "/assets/images/hosts/jake-merrick.jpg",
  "marcus-webb": "/assets/images/hosts/marcus-webb.jpg",
  "rachel-torres": "/assets/images/hosts/rachel-torres.jpg",
  "dan-hollis": "/assets/images/hosts/dan-hollis.jpg",
  "sarah-mitchell": "/assets/images/hosts/sarah-mitchell.svg",
  "david-reyes": "/assets/images/hosts/david-reyes.svg",
};

export function storyHero(slug: string, dbUrl?: string | null): string {
  return dbUrl || STORY_HERO[slug] || "/assets/images/story-lead.svg";
}

export function hostPhoto(slug: string, headshot?: string | null, name = ""): string {
  if (headshot) return headshot;
  if (HOST_PHOTO[slug]) return HOST_PHOTO[slug];
  const lower = `${slug} ${name}`.toLowerCase();
  if (lower.includes("marcus") || lower.includes("webb")) return HOST_PHOTO["marcus-webb"];
  if (lower.includes("rachel") || lower.includes("torres")) return HOST_PHOTO["rachel-torres"];
  if (lower.includes("dan") || lower.includes("hollis") || lower.includes("pastor")) return HOST_PHOTO["dan-hollis"];
  if (lower.includes("jake") || lower.includes("merrick")) return HOST_PHOTO["jake-merrick"];
  if (lower.includes("sarah") || lower.includes("mitchell")) return HOST_PHOTO["sarah-mitchell"];
  if (lower.includes("david") || lower.includes("reyes")) return HOST_PHOTO["david-reyes"];
  return "/assets/images/author-1.svg";
}