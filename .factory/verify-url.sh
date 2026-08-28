#!/usr/bin/env bash
set -euo pipefail
url="${1:-http://127.0.0.1:8080/}"
node --input-type=module - "$url" <<'NODE'
import { chromium } from 'playwright';
const url = process.argv[2];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(url, { waitUntil: 'networkidle' });
if (!await page.title()) throw new Error('Missing title');
if (await page.locator('html[lang="en"]').count() !== 1) throw new Error('Missing lang');
if (await page.locator('main').count() !== 1) throw new Error('Expected one main');
if (await page.locator('img:not([alt])').count() !== 0) throw new Error('Image without alt');
if (errors.length) throw new Error(`Console errors: ${errors.join('; ')}`);
await browser.close();
console.log(`PASS title/lang/main/alt/console: ${url}`);
NODE
