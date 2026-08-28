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

test('the 390px first screen keeps the job, audience, sample action, and facts in view', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/');
  for (const locator of [page.getByRole('heading', { level: 1 }), page.locator('.lede'), page.getByRole('button', { name: /Try it with sample data/ }), page.locator('.action-note'), page.locator('.trust-row')]) {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  }
  await expect(page.getByText('Tested with 40 learners in one room')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await context.close();
});

test('every public route has one main heading and no serious accessibility issue', async ({ page }) => {
  for (const path of ['/', '/demo', '/?demo=1', '/create', '/play', '/privacy', '/terms', '/definitely-missing']) {
    await page.goto(path);
    expect(await page.locator('main').count(), `${path} main count`).toBe(1);
    expect(await page.locator('h1').count(), `${path} h1 count`).toBe(1);
    expect(await page.locator('html').getAttribute('lang'), `${path} language`).toBe('en');
    expect(await page.title(), `${path} title`).not.toBe('');
    const audit = await new AxeBuilder({ page }).analyze();
    expect(audit.violations.filter(issue => ['serious', 'critical'].includes(issue.impact ?? '')), `${path} Axe violations`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${path} horizontal overflow`).toBe(true);
  }
});
