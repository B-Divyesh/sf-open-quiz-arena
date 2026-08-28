# Open Quiz Arena — adversarial review 1 handoff

## Outcome: **FAIL**

Completed a no-code-change first-read review of the live product on 28 August 2026. The full report is in [`review-1.md`](review-1.md).

The quiz implementation and existing test suites pass, but acceptance is blocked by three issues:

1. There is no one-click sample-data demo or isolated demo sandbox; `/demo` renders the homepage.
2. `.factory/claims.json` is absent, so no public or README claim has its required tagged sandbox test.
3. Unknown paths return the homepage with HTTP 200 instead of a designed 404.

The report also records route-title, route focus/scroll, metadata, header/footer, landing structure, wording, terminology, and result-naming button findings. It contains a complete word-count audit of landing-page and README copy, an inventory of unlisted claims, historical-finding rechecks, and concrete rewrites.

## Verification performed

```sh
npm ci
npm test
npm run build
npm run test:e2e
BASE_URL=https://open-quiz-arena.sociobot.in npm run test:e2e
node .factory/verification-live.mjs
```

Results:

- `npm test`: PASS — 3 Vitest and 12 Rust tests.
- `npm run build`: PASS — `dist/` produced; initial JS is 24,308 bytes raw and 8,819 bytes gzip.
- Local Playwright: PASS — 7 tests.
- Deployed Playwright: PASS — 7 tests.
- Live lifecycle/fan-out: PASS — eight questions and 40 players; sampled fan-out completed in 393 ms.
- Fresh 390×844 and 1440×900 browser audits: no console errors, no horizontal overflow, one `<main>`, one `<h1>`, and zero Axe violations on audited public routes.
- Claims: BLOCKED — no `.factory/claims.json` or `/demo` exists, so there were no listed claim commands and no valid demo sandbox in which to test them.

## History and known state

The live health endpoint reports build `6ff62a0b361ca7af34242c9598d1dc1bc8ffe9c0`. All defects previously recorded in `.factory/verification.md` were rechecked and remain fixed in the observed deployment: room coherence, build identity, moderation, mobile target sizes, legal contact, HSTS, favicon, and robots response.

No product source was modified. Only this handoff and `.factory/review-1.md` were changed for the work order.
