import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('join and policy routes fit a 360px viewport', async ({ page }) => {
  await page.goto('/play');
  await expect(page.getByRole('heading', { name: 'Enter your room code.' })).toBeVisible();
  const joinAudit = await new AxeBuilder({ page }).analyze();
  expect(joinAudit.violations.filter(issue => ['serious', 'critical'].includes(issue.impact ?? ''))).toEqual([]);
  await page.getByLabel('Room code').fill('123456');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByText('Sociobot operates Open Quiz Arena.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'privacy@sociobot.in' })).toHaveAttribute('href', /mailto:privacy@sociobot\.in/);
  const privacyAudit = await new AxeBuilder({ page }).analyze();
  expect(privacyAudit.violations.filter(issue => ['serious', 'critical'].includes(issue.impact ?? ''))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('brand, footer, and legal links are 44px touch targets at mobile width', async ({ page }) => {
  const expectTarget = async (selector: string) => {
    const box = await page.locator(selector).boundingBox();
    expect(box, `${selector} should have a bounding box`).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  };

  await page.goto('/');
  await expectTarget('.brand');
  await expectTarget('footer a[href="/privacy"]');
  await expectTarget('footer a[href="/terms"]');

  await page.goto('/privacy');
  await expectTarget('a[href^="mailto:privacy@sociobot.in"]');
  await page.goto('/terms');
  await expectTarget('main a[href="/privacy"]');
  await expectTarget('a[href^="mailto:privacy@sociobot.in"]');
});
