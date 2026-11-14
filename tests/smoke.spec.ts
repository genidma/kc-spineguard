import { test, expect } from '@playwright/test';

test('sign up, add med, log entries, trigger dose warning, view trends & profile', async ({ page }) => {
  await page.goto('/');

  // Sign up
  await page.getByTestId('switch-to-signup').click();
  const email = `test-${Date.now()}@example.com`;
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('password123');
  await page.getByTestId('auth-submit').click();

  // Wait for Today dashboard
  await expect(page.getByTestId('quick-pain')).toBeVisible({ timeout: 15_000 });

  // Log pain (above threshold 5 -> 7)
  await page.getByTestId('quick-pain').click();
  await page.getByTestId('pain-intensity').fill('7');
  await page.getByRole('button', { name: 'Lower back left' }).click();
  await page.getByTestId('log-save').click();
  await expect(page.getByText('7/10')).toBeVisible();

  // Log weight
  await page.getByTestId('quick-weight').click();
  await page.getByTestId('weight-value').fill('74.5');
  await page.getByTestId('log-save').click();
  await expect(page.getByText('74.5 kg')).toBeVisible();

  // Add a medication in Library with maxDailyDose = 800
  await page.getByRole('button', { name: 'Library' }).first().click();
  await page.getByTestId('add-med-btn').click();
  await page.getByTestId('med-form-name').fill('Ibuprofen');
  await page.getByTestId('med-form-typical').fill('400');
  await page.getByTestId('med-form-max').fill('800');
  await page.getByTestId('med-form-gap').fill('6');
  await page.getByTestId('med-form-save').click();
  await expect(page.getByText('Ibuprofen')).toBeVisible();

  // Log first dose (400mg) via Today
  await page.getByRole('button', { name: 'Today' }).first().click();
  await page.getByTestId('quick-med').click();
  await page.getByTestId('log-save').click();

  // Log second dose (600mg) immediately -> should trigger both max-daily & min-gap warnings
  await page.getByTestId('quick-med').click();
  await page.getByTestId('med-dose').fill('600');
  await expect(page.getByRole('alert')).toContainText('above your max of 800');
  await expect(page.getByTestId('log-save')).toBeDisabled();
  await page.getByTestId('med-ack').check();
  await expect(page.getByTestId('log-save')).toBeEnabled();
  await page.getByTestId('log-save').click();

  // Check Trends & Profile render cleanly
  await page.getByRole('button', { name: 'Trends' }).first().click();
  await expect(page.getByText('Pain vs. medications taken')).toBeVisible();

  await page.getByRole('button', { name: 'Profile' }).first().click();
  await expect(page.getByText('Personal pain threshold')).toBeVisible();
});
