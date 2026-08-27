import { expect, test } from '@playwright/test';

const quiz = {
  title: 'Verifier regression room',
  questions: [{ prompt: 'Ready?', answers: ['Yes', 'No'], correct_index: 0, time_limit_seconds: 20 }]
};

test('moderation blocks split and homoglyph profanity while rendering hostile nicknames as text', async ({ page, request }) => {
  const created = await request.post('/api/rooms', { data: { quiz } });
  expect(created.status()).toBe(201);
  const room = await created.json() as { code: string };

  for (const nickname of ['f u c k', 'f-u-c-k', '\u0455hit', '\u0455\u04bb\u0456\u0442']) {
    const response = await request.post(`/api/rooms/${room.code}/join`, { data: { nickname } });
    expect(response.status()).toBe(201);
    expect((await response.json() as { nickname: string }).nickname).toMatch(/^Player/);
  }

  await page.goto(`/play?room=${room.code}`);
  await page.getByLabel('Nickname').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Join room' }).click();
  await expect(page.getByRole('heading', { name: /You’re in, img srcx onerroralert/ })).toBeVisible();
  expect(await page.locator('.waiting-screen img').count()).toBe(0);
  await expect(page.locator('.waiting-screen')).not.toContainText('<img');
});

test('health, HSTS, robots, and favicon responses are valid public infrastructure', async ({ request }) => {
  const health = await request.get('/health');
  expect(health.status()).toBe(200);
  expect(health.headers()['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
  await expect(health.json()).resolves.toEqual(expect.objectContaining({ status: 'ok', build: expect.any(String) }));

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toMatch(/^text\/plain/);
  await expect(robots.text()).resolves.toContain('User-agent: *');

  const favicon = await request.get('/favicon.svg');
  expect(favicon.status()).toBe(200);
  expect(favicon.headers()['content-type']).toContain('image/svg+xml');
  await expect(favicon.text()).resolves.toMatch(/^<svg\b/);
});
