import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('join and policy routes fit a 360px viewport', async ({ page }) => {
  await page.goto('/play');
  await expect(page.getByRole('heading', { name: 'Enter the arena.' })).toBeVisible();
  const joinAudit = await new AxeBuilder({ page }).analyze();
  expect(joinAudit.violations.filter(issue => ['serious', 'critical'].includes(issue.impact ?? ''))).toEqual([]);
  await page.getByLabel('Room code').fill('123456');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  const privacyAudit = await new AxeBuilder({ page }).analyze();
  expect(privacyAudit.violations.filter(issue => ['serious', 'critical'].includes(issue.impact ?? ''))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
