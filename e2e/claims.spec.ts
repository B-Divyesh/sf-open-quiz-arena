import { expect, test } from '@playwright/test';

test('@claim:demo-sandbox opens both demo URLs, resets them, replays the podium, and leaves no sample progress', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: '046610' })).toBeVisible();
  await page.getByRole('button', { name: 'Start sample question' }).click();
  for (const name of ['Maya answers A', 'Ibrahim answers A', 'Lena answers A']) await page.getByRole('button', { name }).click();
  await page.getByRole('button', { name: 'Reveal sample result' }).click();
  await expect(page.getByText('998 pts')).toBeVisible();
  await page.getByRole('button', { name: 'Show sample podium' }).click();
  await expect(page.getByRole('heading', { name: 'Sample podium.' })).toBeVisible();
  await page.getByRole('button', { name: 'Run the sample again' }).click();
  await expect(page.getByRole('button', { name: 'Start sample question' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.getByRole('button', { name: 'Start sample question' }).click();
  for (const name of ['Maya answers A', 'Ibrahim answers A', 'Lena answers A']) await page.getByRole('button', { name }).click();
  await page.getByRole('button', { name: 'Reveal sample result' }).click();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual(['demo:open-quiz-arena:step']);
  expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('button', { name: 'Start sample question' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);

  await page.goto('/?demo=1');
  await expect(page).toHaveTitle('Demo — Open Quiz Arena');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: '046610' })).toBeVisible();
  await page.getByRole('button', { name: 'Start sample question' }).click();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['demo:open-quiz-arena:step']);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('button', { name: 'Start sample question' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);

  await page.getByRole('button', { name: 'Start sample question' }).click();
  await page.getByRole('button', { name: 'Leave demo and create a quiz' }).click();
  await expect(page).toHaveURL(/\/create$/);
  await expect(page).toHaveTitle('Create a quiz — Open Quiz Arena');
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('demo:')))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => key.startsWith('arena:')))).toEqual([]);
  expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  expect(requests.some(url => new URL(url).pathname.startsWith('/api/') || new URL(url).pathname.startsWith('/ws/'))).toBe(false);
});

test('@claim:room-capacity-40 joins 40 learners and delivers each live room state', async ({ page }) => {
  await page.goto('/demo');
  const result = await page.evaluate(async () => {
    const quiz = { title: 'Capacity check', questions: [{ prompt: 'Ready?', answers: ['Yes', 'No'], correct_index: 0, time_limit_seconds: 20 }] };
    const createdResponse = await fetch('/api/rooms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ quiz }) });
    const created = await createdResponse.json() as { code: string; host_token: string };
    const joins = await Promise.all(Array.from({ length: 40 }, async (_, index) => {
      const nickname = `Learner ${String(index + 1).padStart(2, '0')}`;
      const response = await fetch(`/api/rooms/${created.code}/join`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nickname }) });
      return { status: response.status, nickname, ...(await response.json() as { player_token: string }) };
    }));
    const wsOrigin = location.origin.replace(/^http/, 'ws');
    const sockets: WebSocket[] = [];
    const readState = (role: 'host' | 'player', token: string) => new Promise<{ player_count: number; nickname?: string }>((resolve, reject) => {
      const socket = new WebSocket(`${wsOrigin}/ws/${created.code}?role=${role}&token=${encodeURIComponent(token)}`);
      sockets.push(socket);
      const timeout = window.setTimeout(() => reject(new Error(`Timed out waiting for ${role} room state`)), 10_000);
      socket.addEventListener('error', () => { window.clearTimeout(timeout); reject(new Error(`${role} socket failed`)); }, { once: true });
      socket.addEventListener('message', event => {
        const state = JSON.parse(String(event.data)) as { player_count: number; me?: { nickname: string } };
        window.clearTimeout(timeout);
        resolve({ player_count: state.player_count, nickname: state.me?.nickname });
      }, { once: true });
    });
    const playerStates = await Promise.all(joins.map(join => readState('player', join.player_token)));
    const hostState = await readState('host', created.host_token);
    sockets.forEach(socket => socket.close());
    return {
      joined: joins.filter(join => join.status === 201).length,
      hostCount: hostState.player_count,
      playerCount: playerStates.length,
      everyPlayerSaw40: playerStates.every(state => state.player_count === 40),
      uniqueNames: new Set(playerStates.map(state => state.nickname)).size,
    };
  });
  expect(result).toEqual({ joined: 40, hostCount: 40, playerCount: 40, everyPlayerSaw40: true, uniqueNames: 40 });
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

test('@claim:csv-import @claim:csv-optional-columns @claim:csv-answer-numbering @claim:csv-time-range reads CSV options, boundaries, and every invalid row issue', async ({ page }) => {
  await page.goto('/create');
  await page.getByRole('button', { name: 'Import CSV' }).click();
  await page.locator('#csv-text').fill('question,answer1,answer2,answer3,answer4,correct,time\nCapital,Paris,Lyon,Marseille,Nice,1,5\nCompass,North,South,East,West,4,120');
  await page.getByRole('button', { name: 'Use these questions' }).click();
  await expect(page.getByLabel('Prompt').first()).toHaveValue('Capital');
  await expect(page.locator('#q0-a2')).toHaveValue('Marseille');
  await expect(page.locator('#q0-a3')).toHaveValue('Nice');
  await expect(page.locator('#q0-correct')).toHaveValue('0');
  await expect(page.locator('#q0-time')).toHaveValue('5');
  await expect(page.locator('#q1-correct')).toHaveValue('3');
  await expect(page.locator('#q1-time')).toHaveValue('120');
  await page.getByRole('button', { name: 'Import CSV' }).click();
  await page.locator('#csv-text').fill('question,answer1,answer2,correct,time\n,A,,0,4\nB,Yes,No,3,121');
  await page.getByRole('button', { name: 'Use these questions' }).click();
  await expect(page.locator('#csv-errors')).toContainText('Fix 6 CSV issues');
  await expect(page.locator('#csv-errors')).toContainText('correct must be an answer number from 1 to 2');
  await expect(page.locator('#csv-errors')).toContainText('time must be 5–120 seconds');
  await expect(page.locator('#csv-errors')).toBeFocused();
});

test('@claim:typed-questions types a quiz, opens its room, and shows it to the host', async ({ page }) => {
  await page.goto('/create');
  await page.getByLabel('Quiz title').fill('Typed science check');
  await page.getByLabel('Prompt').first().fill('What does water become when it freezes?');
  await page.locator('#q0-a0').fill('Ice');
  await page.locator('#q0-a1').fill('Steam');
  await page.getByRole('button', { name: 'Remove question 2' }).click();
  await page.getByRole('button', { name: 'Open live room' }).click();
  await expect(page).toHaveURL(/\/host\?room=\d{6}/);
  await expect(page.getByText('Typed science check')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start quiz' })).toBeDisabled();
});

test('@claim:draft-in-browser keeps an edited draft in this tab without a request before opening a room', async ({ browser }) => {
  const origin = process.env.BASE_URL ?? 'http://127.0.0.1:8080';
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests: { url: string; method: string; body: string | null }[] = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method(), body: request.postData() }));
  await page.goto(`${origin}/create`);
  await page.getByLabel('Quiz title').fill('Tab-only draft');
  await page.getByLabel('Prompt').first().fill('Which tab stores this draft?');
  await page.locator('#q0-a0').fill('This browser tab');
  await page.locator('#q0-a1').fill('The server');
  const draft = await page.evaluate(key => sessionStorage.getItem(key), 'arena:draft');
  expect(draft).toContain('Tab-only draft');
  expect(draft).toContain('Which tab stores this draft?');
  expect(requests.filter(request => new URL(request.url).pathname.startsWith('/api/') || new URL(request.url).pathname.startsWith('/ws/'))).toEqual([]);
  await page.getByRole('button', { name: 'Remove question 2' }).click();
  await page.getByRole('button', { name: 'Open live room' }).click();
  await expect(page).toHaveURL(/\/host\?room=\d{6}/);
  expect(await page.evaluate(key => sessionStorage.getItem(key), 'arena:draft')).toBeNull();
  await context.close();
  const fresh = await browser.newContext();
  const freshPage = await fresh.newPage();
  await freshPage.goto(`${origin}/create`);
  expect(await freshPage.evaluate(key => sessionStorage.getItem(key), 'arena:draft')).toBeNull();
  await fresh.close();
});

test('@claim:quiz-share-link keeps the quiz in the URL fragment', async ({ page }) => {
  await page.goto('/create#quiz=eyJ0aXRsZSI6IkNhZlx1MDBlOSIsInF1ZXN0aW9ucyI6W3sicHJvbXB0IjoiXHUwMGJmUXVcdTAwZTk_IiwiYW5zd2VycyI6WyJTXHUwMGVkIiwiTm8iXSwiY29ycmVjdF9pbmRleCI6MCwidGltZV9saW1pdF9zZWNvbmRzIjoyMH1dfQ');
  await expect(page.getByLabel('Quiz title')).toHaveValue('Café');
  expect(new URL(page.url()).hash).toContain('quiz=');
});

test('@claim:mobile-nickname-entry lets a learner enter, answer, and see the result on a phone', async ({ browser }) => {
  const origin = process.env.BASE_URL ?? 'http://127.0.0.1:8080';
  const quiz = { title: 'Mobile check', questions: [{ prompt: 'Ready?', answers: ['Yes', 'No'], correct_index: 0, time_limit_seconds: 20 }] };
  const api = await browser.newContext();
  const created = await api.request.post(`${origin}/api/rooms`, { data: { quiz } });
  const room = await created.json() as { code: string; host_token: string };
  const hostContext = await browser.newContext();
  const host = await hostContext.newPage();
  await host.goto(`${origin}/`);
  await host.evaluate(({ code, token, createdQuiz }) => {
    sessionStorage.setItem(`arena:host:${code}`, token);
    sessionStorage.setItem(`arena:quiz:${code}`, JSON.stringify(createdQuiz));
  }, { code: room.code, token: room.host_token, createdQuiz: quiz });
  await host.goto(`${origin}/host?room=${room.code}`);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  await page.goto(`${origin}/play`);
  await page.getByLabel('Room code').fill(room.code);
  await page.getByRole('button', { name: 'Enter nickname' }).click();
  await page.getByLabel('Nickname').fill('Maya');
  await page.getByRole('button', { name: 'Join room' }).click();
  await expect(page.getByRole('heading', { name: /You’re in, Maya/ })).toBeVisible();
  await expect(host.getByText('1 learner ready')).toBeVisible();
  await host.getByRole('button', { name: 'Start quiz' }).click();
  await expect(page.getByRole('heading', { name: 'Ready?' })).toBeVisible();
  await page.locator('[data-choice="0"]').click();
  await expect(page.getByRole('heading', { name: 'Answer locked.' })).toBeVisible();
  await host.getByRole('button', { name: 'Reveal answer' }).click();
  await expect(page.getByText('NICE HIT')).toBeVisible();
  await context.close(); await hostContext.close(); await api.close();
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
  await expect(page).toHaveTitle('Open Quiz Arena — run live classroom quizzes');
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.locator('footer a[href="/privacy"]').click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe('H1');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.goto('/privacy');
  await expect(page).toHaveTitle('Privacy — Open Quiz Arena');
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Open Quiz Arena');
  await page.goto('/?demo=1');
  await expect(page).toHaveTitle('Demo — Open Quiz Arena');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/demo$/);
  const missing = await request.get('/definitely-missing');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('Page not found.');
  const consoleErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error' && !/Failed to load resource: the server responded with a status of 404/.test(message.text())) consoleErrors.push(message.text());
  });
  const missingPage = await page.goto('/definitely-missing');
  expect(missingPage?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Open Quiz Arena');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /does not exist/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Page not found — Open Quiz Arena');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/404$/);
  await expect(page.getByRole('banner').getByRole('link', { name: 'Open Quiz Arena home' })).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Terms' })).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(7, 21, 43)');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(consoleErrors).toEqual([]);
  expect((await request.get('/sitemap.xml')).status()).toBe(200);
  expect((await request.get('/apple-touch-icon.png')).headers()['content-type']).toContain('image/png');
});
