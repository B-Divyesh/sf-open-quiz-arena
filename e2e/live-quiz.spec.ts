import { expect, test } from '@playwright/test';

test('host and multiple isolated players complete an eight-question quiz', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const host = await hostContext.newPage();
  const errors: string[] = [];
  host.on('console', message => { if (message.type() === 'error') errors.push(`${message.text()} ${message.location().url}`); });
  await host.goto('/create');
  await host.getByRole('button', { name: 'Import CSV' }).click();
  const rows = Array.from({ length: 8 }, (_, index) => `Question ${index + 1}?,Correct ${index + 1},Wrong ${index + 1},1,20`);
  await host.locator('#csv-text').fill(`question,answer1,answer2,correct,time\n${rows.join('\n')}`);
  await host.getByRole('button', { name: 'Use these questions' }).click();
  await host.getByRole('button', { name: 'Open live room' }).click();
  await expect(host).toHaveURL(/\/host\?room=\d{6}/);
  const code = new URL(host.url()).searchParams.get('room');
  expect(code).toMatch(/^\d{6}$/);

  const players = await Promise.all(['Ada', 'Lin', 'Noor'].map(async nickname => {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('console', message => { if (message.type() === 'error') errors.push(`${message.text()} ${message.location().url}`); });
    await page.goto(`/play?room=${code}`);
    await page.getByLabel('Nickname').fill(nickname);
    await page.getByRole('button', { name: 'Join room' }).click();
    await expect(page.getByRole('heading', { name: new RegExp(`You’re in, ${nickname}`) })).toBeVisible();
    return { context, page };
  }));
  await expect(host.getByText('3 players ready')).toBeVisible();
  await host.getByRole('button', { name: 'Start quiz' }).click();

  for (let index = 1; index <= 8; index += 1) {
    await expect(host.getByRole('heading', { name: `Question ${index}?` })).toBeVisible();
    await Promise.all(players.map(({ page }) => page.locator('[data-choice="0"]').click()));
    await expect(host.getByText('3/3 LOCKED IN')).toBeVisible();
    await host.getByRole('button', { name: 'Reveal answer' }).click();
    await Promise.all(players.map(({ page }) => expect(page.getByText('NICE HIT')).toBeVisible()));
    await host.getByRole('button', { name: index === 8 ? 'Show final podium' : 'Next question' }).click();
  }
  await expect(host.getByRole('heading', { name: 'Tonight’s podium.' })).toBeVisible();
  expect(errors).toEqual([]);
  await Promise.all(players.map(({ context }) => context.close()));
  await hostContext.close();
});
