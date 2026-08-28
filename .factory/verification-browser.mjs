import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:8080';
const evidence = { routes: [], keyboard: {}, mobile: {}, projector: {}, zoom: {}, reduced_motion: {}, live: {}, network: {} };
const errors = [];
const failedRequests = [];
const requestUrls = new Set();

async function api(path, init = {}) {
  const response = await fetch(`${base}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  assert(response.ok, `${path}: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

function observe(page) {
  page.on('console', message => { if (message.type() === 'error') errors.push({ url: page.url(), text: message.text() }); });
  page.on('pageerror', error => errors.push({ url: page.url(), text: error.message }));
  page.on('requestfailed', request => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText }));
  page.on('request', request => requestUrls.add(request.url()));
}

async function audit(page, path, label = path) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  return auditCurrent(page, label);
}

async function auditCurrent(page, label) {
  const semantics = await page.evaluate(() => ({
    title: document.title,
    lang: document.documentElement.lang,
    mains: document.querySelectorAll('main').length,
    h1s: document.querySelectorAll('h1').length,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  const result = await new AxeBuilder({ page }).analyze();
  const serious = result.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''));
  evidence.routes.push({ label, ...semantics, axe_serious_critical: serious.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.length })) });
  assert.equal(semantics.lang, 'en');
  assert.equal(semantics.mains, 1);
  assert.equal(semantics.h1s, 1);
  assert.equal(semantics.horizontalOverflow, false);
  assert.equal(serious.length, 0, `${label} axe: ${JSON.stringify(serious)}`);
}

async function retryUntil(action, predicate, attempts = 12) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await action();
    try { await predicate(); return attempt; } catch {}
  }
  throw new Error(`Condition did not pass after ${attempts} attempts`);
}

const browser = await chromium.launch({ headless: true });
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
observe(page);

for (const path of ['/', '/create', '/play', '/privacy', '/terms']) await audit(page, path);

await page.goto(`${base}/`);
await page.keyboard.press('Tab');
const skip = await page.evaluate(() => {
  const element = document.activeElement;
  const style = element ? getComputedStyle(element) : undefined;
  return { text: element?.textContent?.trim(), outlineWidth: style?.outlineWidth, outlineStyle: style?.outlineStyle };
});
assert.equal(skip.text, 'Skip to main content');
assert.notEqual(skip.outlineStyle, 'none');
await page.keyboard.press('Enter');
assert.equal(new URL(page.url()).hash, '#main');
evidence.keyboard.skip_link = skip;

await page.goto(`${base}/create`);
for (let i = 0; i < 8 && await page.locator('#csv-panel').isHidden(); i += 1) {
  await page.keyboard.press('Tab');
  if ((await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Import CSV') await page.keyboard.press('Enter');
}
assert(await page.locator('#csv-panel').isVisible());
await page.locator('#csv-text').focus();
await page.keyboard.type('bad');
await page.locator('#import-csv').focus();
await page.keyboard.press('Enter');
assert(await page.locator('#csv-errors [role="alert"]').isVisible());
assert.equal(await page.evaluate(() => document.activeElement?.id), 'csv-errors');
evidence.keyboard.csv_error_focus = true;

const quiz = { title: 'Browser audit', questions: [{ prompt: 'Projector question?', answers: ['First', 'Second', 'Third', 'Fourth'], correct_index: 0, time_limit_seconds: 20 }] };
const room = await api('/api/rooms', { method: 'POST', body: JSON.stringify({ quiz }) });
await page.goto(`${base}/`);
await page.evaluate(({ code, token, quiz }) => {
  sessionStorage.setItem(`arena:host:${code}`, token);
  sessionStorage.setItem(`arena:quiz:${code}`, JSON.stringify(quiz));
}, { code: room.code, token: room.host_token, quiz });
await page.goto(`${base}/host?room=${room.code}`);

const mobile = await browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
const player = await mobile.newPage();
observe(player);
await player.goto(`${base}/play?room=${room.code}`);
const joinAttempts = await retryUntil(async () => {
  if (await player.getByLabel('Nickname').isVisible().catch(() => false)) {
    await player.getByLabel('Nickname').fill('Keyboard Player');
    await player.keyboard.press('Tab');
    assert.match(await player.evaluate(() => document.activeElement?.textContent?.trim() || ''), /Join room/);
    await player.keyboard.press('Enter');
  }
}, () => player.getByRole('heading', { name: /You’re in/ }).waitFor({ timeout: 5000 }));
await page.getByText('1 learner ready').waitFor();
const startAttempts = await retryUntil(
  () => page.getByRole('button', { name: /Start quiz/ }).press('Enter'),
  () => player.getByRole('heading', { name: 'Projector question?' }).waitFor({ timeout: 3000 }),
);

await page.getByRole('heading', { name: 'Projector question?' }).waitFor({ timeout: 30000 });
await page.screenshot({ path: '/tmp/oqa-projector.png', fullPage: true });
await player.screenshot({ path: '/tmp/oqa-mobile-player.png', fullPage: true });
await auditCurrent(page, 'live host question');
await auditCurrent(player, 'live mobile player question');
const mobileGeometry = await player.evaluate(() => ({
  viewport: [innerWidth, innerHeight],
  scrollWidth: document.documentElement.scrollWidth,
  buttons: [...document.querySelectorAll('button')].map(button => {
    const box = button.getBoundingClientRect();
    return { text: button.textContent?.trim(), width: Math.round(box.width), height: Math.round(box.height) };
  }),
}));
assert.equal(mobileGeometry.scrollWidth, 360);
assert(mobileGeometry.buttons.every(button => button.width >= 44 && button.height >= 44));
evidence.mobile = mobileGeometry;
evidence.live.join_attempts = joinAttempts;
evidence.live.start_attempts = startAttempts;
const answerAttempts = await retryUntil(async () => {
  const firstAnswer = player.locator('.answer-button').first();
  if (await firstAnswer.isVisible().catch(() => false)) {
    await firstAnswer.focus();
    await player.keyboard.press('Enter');
  }
}, () => player.getByRole('heading', { name: 'Answer locked.' }).waitFor({ timeout: 3000 }));
evidence.live.keyboard_answer_attempts = answerAttempts;

const reducedLearner = await api(`/api/rooms/${room.code}/join`, {
  method: 'POST', body: JSON.stringify({ nickname: 'Reduced learner' })
});

const projector = await page.evaluate(() => {
  const board = document.querySelector('.board')?.getBoundingClientRect();
  const answers = [...document.querySelectorAll('.host-answer')].map(item => item.getBoundingClientRect());
  return {
    viewport: [innerWidth, innerHeight],
    board_within_viewport: !!board && board.left >= 0 && board.right <= innerWidth,
    answer_columns: new Set(answers.map(item => Math.round(item.left))).size,
    horizontal_overflow: document.documentElement.scrollWidth > innerWidth,
    prompt_visible: !!document.querySelector('h1') && document.querySelector('h1').getBoundingClientRect().bottom <= innerHeight,
  };
});
assert.equal(projector.board_within_viewport, true);
assert.equal(projector.answer_columns, 2);
assert.equal(projector.horizontal_overflow, false);
assert.equal(projector.prompt_visible, true);
evidence.projector = projector;

const zoomPage = await desktop.newPage();
observe(zoomPage);
await zoomPage.goto(`${base}/privacy`);
await zoomPage.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
const zoom = await zoomPage.evaluate(() => ({
  root_font_px: getComputedStyle(document.documentElement).fontSize,
  horizontal_overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  heading_visible: document.querySelector('h1')?.getBoundingClientRect().width > 0,
  last_heading_visible: [...document.querySelectorAll('h2')].at(-1)?.getBoundingClientRect().width > 0,
}));
assert.equal(zoom.root_font_px, '32px');
assert.equal(zoom.horizontal_overflow, false);
assert.equal(zoom.heading_visible, true);
assert.equal(zoom.last_heading_visible, true);
evidence.zoom = zoom;

const reduced = await browser.newContext({ viewport: { width: 360, height: 780 }, reducedMotion: 'reduce' });
const reducedPage = await reduced.newPage();
observe(reducedPage);
await reducedPage.goto(`${base}/`);
await reducedPage.evaluate(({ code, token }) => sessionStorage.setItem(`arena:player:${code}`, JSON.stringify({ token, nickname: 'Reduced learner' })), { code: room.code, token: reducedLearner.player_token });
await reducedPage.goto(`${base}/play?room=${room.code}`);
await reducedPage.locator('.answer-button').first().waitFor({ timeout: 60000 });
const reducedStyles = await reducedPage.evaluate(() => {
  const button = document.querySelector('.answer-button');
  const style = getComputedStyle(button);
  return { media_matches: matchMedia('(prefers-reduced-motion: reduce)').matches, animation_duration: style.animationDuration, transition_duration: style.transitionDuration };
});
assert.equal(reducedStyles.media_matches, true);
assert(reducedStyles.transition_duration.split(',').every(value => parseFloat(value) <= 0.001));
evidence.reduced_motion = reducedStyles;

const storage = await player.evaluate(async () => ({
  cookies: document.cookie,
  local_storage_keys: Object.keys(localStorage),
  session_storage_keys: Object.keys(sessionStorage),
  indexed_db_names: (await indexedDB.databases()).map(item => item.name),
  service_workers: (await navigator.serviceWorker.getRegistrations()).length,
}));
assert.equal(storage.cookies, '');
assert.deepEqual(storage.local_storage_keys, []);
assert.deepEqual(storage.indexed_db_names, []);
assert.equal(storage.service_workers, 0);
evidence.live.storage = storage;
evidence.live.console_errors = errors;
evidence.live.failed_requests = failedRequests;
assert.deepEqual(failedRequests, []);

const external = [...requestUrls].filter(url => !url.startsWith(base));
assert.deepEqual(external, []);
evidence.network = { total_requests: requestUrls.size, third_party_requests: external };

await reduced.close();
await mobile.close();
await desktop.close();
await browser.close();
console.log(JSON.stringify(evidence, null, 2));
