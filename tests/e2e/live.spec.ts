import { test, expect } from '@playwright/test';

/**
 * P2-15: Basic E2E smoke test for hot path (/live + home nav).
 * Verifies nav links, title, live page loads (key realtime hub).
 * Lightweight: no auth flows (gated features smoke separately).
 * Run via: npm run e2e or in CI after `npx playwright install --with-deps`.
 * Expands to cover chat/poll UI once backend tables live in test env.
 */
test.describe('Live hot path + nav smoke', () => {
  test('home loads and nav to /live works', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/The Colony OK/);

    // Smoke main nav links (desktop or mobile rendered)
    const liveLink = page.getByRole('link', { name: /Live/i }).first();
    await expect(liveLink).toBeVisible();
    await liveLink.click();

    await expect(page).toHaveURL(/\/live/);
    await expect(page.getByText(/Watch Live|Live TV HUB|ON AIR|TONIGHT/i).first()).toBeVisible();
  });

  test('/live page has core sections and chat gate', async ({ page }) => {
    await page.goto('/live');
    // Player/stage area (use specific .live-stage root + .first() to avoid strict-mode multi-match from outer .live-player wrapper + nested player inside LiveStage)
    await expect(page.locator('.live-stage').first()).toBeVisible({ timeout: 10000 });
    // Sidebar status + chat present (even if fallback "coming soon" or gated)
    await expect(page.locator('.live-sidebar').first()).toBeVisible();
    // Schedule or replays section visible
    await expect(page.getByText(/Channel Guide|Replays|Schedule/i).first()).toBeVisible();
  });
});
