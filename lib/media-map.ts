/** Central slug → hero image mapping for stories, shows, and fallbacks. */

export const STORY_HERO: Record<string, string> = {
  "oklahoma-budget-crisis": "/assets/images/stories/oklahoma-budget-crisis.jpg",
  "lobbyist-network-silence": "/assets/images/stories/lobbyist-network.jpg",
  "parents-curriculum-pushback": "/assets/images/stories/parents-curriculum.jpg",
  "energy-sector-green-mandates": "/assets/images/stories/energy-pipeline.jpg",
  "sheriffs-race-investigation": "/assets/images/stories/sheriffs-race.jpg",
  "tulsa-dei-defund-vote": "/assets/images/stories/tulsa-dei-vote.jpg",
};

export const STORY_HERO_ALT: Record<string, string> = {
  "oklahoma-budget-crisis": "Oklahoma State Capitol at dusk with investigative budget documents and red stamps — budget crisis reporting",
  "lobbyist-network-silence": "Shadowed Oklahoma Capitol corridor with redacted lobbyist contracts and documents — lobbyist influence investigation",
  "parents-curriculum-pushback": "Oklahoma school board meeting with parents presenting curriculum documents and red parental rights materials — education investigation",
  "energy-sector-green-mandates": "Oklahoma oil field and pipeline at dramatic sunset with official energy mandate papers and red highlights — energy policy investigation",
  "sheriffs-race-investigation": "Rural Oklahoma courthouse with sheriff campaign materials, finance disclosure documents and red investigation stamps — sheriffs race reporting",
  "tulsa-dei-defund-vote": "Tulsa City Council chamber during tense public vote on DEI funding with official documents and microphones — local government investigation",
};

export const PODCAST_ART: Record<string, string> = {
  "colony-report": "/assets/images/podcasts/colony-report.jpg",
  "patriot-hour": "/assets/images/podcasts/patriot-hour.jpg",
  "oklahoma-underground": "/assets/images/podcasts/oklahoma-underground.jpg",
  "faith-and-freedom": "/assets/images/podcasts/faith-freedom.jpg",
};

export const HOST_PHOTO: Record<string, string> = {
  "jake-merrick": "/assets/images/hosts/jake-merrick.jpg",
  "marcus-webb": "/assets/images/hosts/marcus-webb.jpg",
  "rachel-torres": "/assets/images/hosts/rachel-torres.jpg",
  "dan-hollis": "/assets/images/hosts/dan-hollis.jpg",
  "sarah-mitchell": "/assets/images/hosts/sarah-mitchell.jpg",
  "david-reyes": "/assets/images/hosts/david-reyes.jpg",
};

export function storyHero(slug: string, dbUrl?: string | null): string {
  return dbUrl || STORY_HERO[slug] || "/assets/images/heroes/story-lead.jpg";
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