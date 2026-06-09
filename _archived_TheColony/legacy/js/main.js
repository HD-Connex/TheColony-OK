import { loadComponents } from './components.js';
import { initNav } from './nav.js';
import { initHero } from './hero.js';
import { initTicker } from './ticker.js';
import { initTracking } from './analytics.js';
import { initNewsletter } from './newsletter.js';
import { initReveal } from './reveal.js';
import { initEpisodes } from './episodes.js';

async function init() {
  await loadComponents();
  initNav();
  initHero();
  initTicker();
  initTracking();
  initNewsletter();
  initReveal();
  initEpisodes();
}

document.addEventListener('DOMContentLoaded', init);
