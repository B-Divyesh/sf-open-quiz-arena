import { expect, test } from '@playwright/test';

test('@claim:demo-sandbox opens a seeded, isolated sample and resets it', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: '046610' })).toBeVisible();
  await page.getByRole('button', { name: 'Start sample question' }).click();
  for (const name of ['Maya answers A', 'Ibrahim answers A', 'Lena answers A']) await page.getByRole('button', { name }).click();
  await page.getByRole('button', { name: 'Reveal sample result' }).click();
  await expect(page.getByText('998 pts')).toBeVisible();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual(['demo:open-quiz-arena:step']);
  expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('button', { name: 'Start sample question' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test('@claim:no-accounts-and-free-access demo starts without a sign-in or payment request', async ({ page }) => {
  const outgoing: string[] = [];
  page.on('request', request => outgoing.push(request.url()));
  await page.goto('/demo');
  await expect(page.getByText(/No accounts/)).toHaveCount(1);
  expect(await page.locator('input[type="password"], input[name*="email" i], input[name*="card" i]').count()).toBe(0);
  expect(outgoing.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
});

test('@claim:internet-required cannot open a live room while the browser is offline', async ({ page, context }) => {
  await page.goto('/create');
  await page.getByLabel('Quiz title').fill('Offline check');
  await page.getByLabel('Prompt').first().fill('Ready?');
  await page.locator('#q0-a0').fill('Yes');
  await page.locator('#q0-a1').fill('No');
  await page.getByRole('button', { name: 'Remove question 2' }).click();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Open live room' }).click();
  await expect(page.getByRole('alert')).toContainText('Couldn’t continue.');
  await context.setOffline(false);
});

test('@claim:no-homework-or-analytics has no homework or analytics route', async ({ page, request }) => {
  await page.goto('/');
  expect(await page.getByRole('link', { name: /homework|analytics/i }).count()).toBe(0);
  expect((await request.get('/homework')).status()).toBe(404);
  expect((await request.get('/analytics')).status()).toBe(404);
});

test('@claim:six-digit-room-code creates and joins a six-digit room', async ({ request }) => {
  const quiz = { title: 'Code check', questions: [{ prompt: 'Ready?', answers: ['Yes', 'No'], correct_index: 0, time_limit_seconds: 20 }] };
  const created = await request.post('/api/rooms', { data: { quiz } });
  expect(created.status()).toBe(201);
  const room = await created.json() as { code: string };
  expect(room.code).toMatch(/^\d{6}$/);
  expect((await request.post(`/api/rooms/${room.code}/join`, { data: { nickname: 'Maya' } })).status()).toBe(201);
});

test('@claim:csv-import reads a CSV and lists every invalid row issue', async ({ page }) => {
  await page.goto('/create');
  await page.getByRole('button', { name: 'Import CSV' }).click();
  await page.locator('#csv-text').fill('question,answer1,answer2,correct,time\nCapital,Paris,Lyon,1,20');
  await page.getByRole('button', { name: 'Use these questions' }).click();
  await expect(page.getByLabel('Prompt').first()).toHaveValue('Capital');
  await page.getByRole('button', { name: 'Import CSV' }).click();
  await page.locator('#csv-text').fill('question,answer1,answer2,correct,time\n,A,,4,2');
  await page.getByRole('button', { name: 'Use these questions' }).click();
  await expect(page.locator('#csv-errors')).toContainText('Fix 4 CSV issues');
  await expect(page.locator('#csv-errors')).toBeFocused();
});

test('@claim:quiz-share-link keeps the quiz in the URL fragment', async ({ page }) => {
  await page.goto('/create#quiz=eyJ0aXRsZSI6IkNhZlx1MDBlOSIsInF1ZXN0aW9ucyI6W3sicHJvbXB0IjoiXHUwMGJmUXVcdTAwZTk_IiwiYW5zd2VycyI6WyJTXHUwMGVkIiwiTm8iXSwiY29ycmVjdF9pbmRleCI6MCwidGltZV9saW1pdF9zZWNvbmRzIjoyMH1dfQ');
  await expect(page.getByLabel('Quiz title')).toHaveValue('Café');
  expect(new URL(page.url()).hash).toContain('quiz=');
});

test('@claim:mobile-nickname-entry lets a learner enter with a code and nickname', async ({ browser }) => {
  const origin = process.env.BASE_URL ?? 'http://127.0.0.1:8080';
  const quiz = { title: 'Mobile check', questions: [{ prompt: 'Ready?', answers: ['Yes', 'No'], correct_index: 0, time_limit_seconds: 20 }] };
  const api = await browser.newContext();
  const created = await api.request.post(`${origin}/api/rooms`, { data: { quiz } });
  const room = await created.json() as { code: string };
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  await page.goto(`${origin}/play`);
  await page.getByLabel('Room code').fill(room.code);
  await page.getByRole('button', { name: 'Enter nickname' }).click();
  await page.getByLabel('Nickname').fill('Maya');
  await page.getByRole('button', { name: 'Join room' }).click();
  await expect(page.getByRole('heading', { name: /You’re in, Maya/ })).toBeVisible();
  await context.close(); await api.close();
});

test('@claim:privacy-session-data stores a reconnect token for the current session', async ({ browser }) => {
  const origin = process.env.BASE_URL ?? 'http://127.0.0.1:8080';
  const quiz = { title: 'Privacy check', questions: [{ prompt: 'Ready?', answers: ['Yes', 'No'], correct_index: 0, time_limit_seconds: 20 }] };
  const setup = await browser.newContext();
  const created = await setup.request.post(`${origin}/api/rooms`, { data: { quiz } });
  const room = await created.json() as { code: string };
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto(`${origin}/play?room=${room.code}`);
  await page.getByLabel('Nickname').fill('Maya');
  await page.getByRole('button', { name: 'Join room' }).click();
  await expect(page.getByRole('heading', { name: /You’re in, Maya/ })).toBeVisible();
  expect(await page.evaluate(code => sessionStorage.getItem(`arena:player:${code}`), room.code)).toContain('token');
  expect(requests.every(url => new URL(url).origin === origin)).toBe(true);
  await context.close();
  const fresh = await browser.newContext();
  const freshPage = await fresh.newPage();
  await freshPage.goto(`${origin}/play`);
  expect(await freshPage.evaluate(code => sessionStorage.getItem(`arena:player:${code}`), room.code)).toBeNull();
  await fresh.close(); await setup.close();
});

test('@claim:legal-operator-contact names the operator and gives a working privacy contact', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByText('Sociobot operates Open Quiz Arena.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'privacy@sociobot.in' })).toHaveAttribute('href', /^mailto:privacy@sociobot\.in/);
});

test('@claim:route-metadata-and-404 gives each route a title and missing paths a 404', async ({ page, request }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.locator('footer a[href="/privacy"]').click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe('H1');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.goto('/privacy');
  await expect(page).toHaveTitle('Privacy — Open Quiz Arena');
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Open Quiz Arena');
  const missing = await request.get('/definitely-missing');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('Page not found.');
  expect((await request.get('/sitemap.xml')).status()).toBe(200);
  expect((await request.get('/apple-touch-icon.png')).headers()['content-type']).toContain('image/png');
});
