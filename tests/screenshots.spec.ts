import { test, expect } from '@playwright/test';

test('capture release screenshots across sections', async ({ page }) => {
  // Desktop high-res viewport
  await page.setViewportSize({ width: 1280, height: 960 });

  await page.goto('https://kc-spineguard.web.app');

  // Sign up a clean demo user
  await page.getByTestId('switch-to-signup').click();
  const demoEmail = `release-demo-${Date.now()}@example.com`;
  await page.getByTestId('auth-email').fill(demoEmail);
  await page.getByTestId('auth-password').fill('P@ssword123!');
  await page.getByTestId('auth-submit').click();

  // Wait for Today dashboard
  await expect(page.getByTestId('quick-pain')).toBeVisible({ timeout: 25_000 });

  // 1. Log Pain
  await page.getByTestId('quick-pain').click();
  await page.getByTestId('pain-intensity').fill('6');
  await page.getByRole('button', { name: 'Lower back left' }).click();
  await page.getByRole('button', { name: 'Shooting' }).click();
  await page.getByTestId('log-save').click();
  await page.waitForTimeout(600);

  // 2. Log Weight
  await page.getByTestId('quick-weight').click();
  await page.getByTestId('weight-value').fill('72.4');
  await page.getByTestId('log-save').click();
  await page.waitForTimeout(600);

  // 3. Log Stretch (Malasana)
  await page.getByTestId('quick-stretch').click();
  const minInput = page.getByPlaceholder('e.g. 1.5');
  if (await minInput.isVisible()) {
    await minInput.fill('15');
  }
  await page.getByTestId('log-save').click();
  await page.waitForTimeout(600);

  // 4. Log Mood
  await page.getByTestId('quick-mood').click();
  await page.getByLabel('Mood 4').click();
  await page.getByTestId('log-save').click();
  await page.waitForTimeout(600);

  // Screenshot 1: Today Dashboard
  await page.screenshot({ path: 'docs/assets/screenshots/2026-11-14/01-today-dashboard.png', fullPage: true });

  // Screenshot 2: History View (showing logs & direct delete button)
  await page.getByRole('button', { name: 'History' }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'docs/assets/screenshots/2026-11-14/02-history-view.png', fullPage: true });

  // Screenshot 3: Trends View (showing Stretch minutes adaptive grouping, Daily Stretches graph, weight timeline)
  await page.getByRole('button', { name: 'Trends' }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'docs/assets/screenshots/2026-11-14/03-trends-view.png', fullPage: true });

  // Switch to Library
  await page.getByRole('button', { name: 'Library' }).first().click();
  await page.waitForTimeout(800);

  // Switch to Stretches tab
  await page.getByRole('button', { name: 'Stretches' }).click();
  await page.waitForTimeout(800);

  // Screenshot 4: Library Stretches tab
  await page.screenshot({ path: 'docs/assets/screenshots/2026-11-14/04-library-stretches.png', fullPage: true });

  // Screenshot 5: Malasana stretch timer modal with live kinematics
  const startTimerButtons = page.getByRole('button', { name: 'Start timer' });
  if (await startTimerButtons.count() > 0) {
    await startTimerButtons.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'docs/assets/screenshots/2026-11-14/05-stretch-timer-modal.png' });
    await page.getByRole('button', { name: 'Close' }).click();
    await page.waitForTimeout(400);
  }

  // Screenshot 6: Profile View
  await page.getByRole('button', { name: 'Profile' }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'docs/assets/screenshots/2026-11-14/06-profile-view.png', fullPage: true });
});
