import { test, expect } from '@playwright/test';

/**
 * Mobile E2E — layout integrity + player smoke.
 *
 * Runs on the iphone-13 / pixel-7 projects (see playwright.config.ts) and also
 * on desktop chromium (the assertions are viewport-aware). Covers:
 *  - no horizontal overflow on key routes (mobile layout breakage guard)
 *  - the persistent bottom tab bar is reachable on mobile
 *  - the /live primary player renders inside the stage box (iframe or <video>)
 *  - a native <video> reaches a playing state within 5s (when a native source
 *    is configured; the 24/7 default is a cross-origin YouTube iframe, so this
 *    is skipped rather than failed when no <video> is present).
 *
 * Run: npm run build && npm run e2e   (or: npx playwright test tests/e2e/mobile.spec.ts)
 */

const ROUTES = ['/', '/live', '/watch', '/podcasts', '/news', '/membership'];

test.describe('Mobile layout integrity', () => {
  for (const route of ROUTES) {
    test(`no horizontal overflow on ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      // Let late images/embeds settle so a wide child would already overflow.
      await page.waitForTimeout(500);
      const overflowPx = await page.evaluate(() => {
        const d = document.documentElement;
        return d.scrollWidth - d.clientWidth;
      });
      // 2px tolerance for sub-pixel rounding.
      expect(overflowPx, `horizontal overflow on ${route}`).toBeLessThanOrEqual(2);
    });
  }

  test('bottom tab bar is reachable on mobile', async ({ page }) => {
    const vp = page.viewportSize();
    test.skip(!vp || vp.width > 1024, 'bottom tab bar is mobile-only (≤1024px)');
    await page.goto('/');
    const tabs = page.locator('.bottom-tabs');
    await expect(tabs).toBeVisible();
    await expect(tabs.locator('.bottom-tabs__tab')).toHaveCount(5);
  });
});

test.describe('Live player', () => {
  test('/live renders the primary player within the stage', async ({ page }) => {
    await page.goto('/live');
    await expect(page.locator('.live-stage').first()).toBeVisible({ timeout: 15000 });
    // 24/7 default = YouTube iframe; native HLS/MP4 = <video>. Accept either.
    const media = page.locator('.live-player iframe, .live-player video').first();
    await expect(media).toBeVisible({ timeout: 15000 });
  });

  test('native <video> on /live reaches a playing state within 5s (when present)', async ({ page }) => {
    await page.goto('/live');
    const video = page.locator('.live-player video').first();
    test.skip((await video.count()) === 0, 'no native <video> on /live (24/7 is a YouTube embed in this env)');

    await expect(video).toBeVisible({ timeout: 10000 });
    const didPlay = await video.evaluate(
      (el: HTMLVideoElement) =>
        new Promise<boolean>((resolve) => {
          if (!el.paused && el.readyState >= 2 && el.currentTime > 0) return resolve(true);
          const timer = setTimeout(() => resolve(false), 5000);
          el.addEventListener('playing', () => { clearTimeout(timer); resolve(true); }, { once: true });
          // Nudge muted autoplay in case the test harness blocks it.
          el.muted = true;
          void el.play().catch(() => {});
        }),
    );
    expect(didPlay, 'native <video> emitted a playing event within 5s').toBeTruthy();
  });
});
