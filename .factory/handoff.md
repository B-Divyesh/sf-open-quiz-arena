# Open Quiz Arena — polish 3 handoff

## Outcome

Polish 3 is complete. The deployed product is build `c2a4628b8c4d071b935793f8e84301f82a038db8` at [open-quiz-arena.sociobot.in](https://open-quiz-arena.sociobot.in). The final ready Container App revision is `sf-open-quiz-arena--0000014` with `minReplicas=1` and `maxReplicas=1`.

The repair closes every cumulative review finding. It fixes the dead demo replay action, adds real typed-authoring, phone-answering, draft-privacy, CSV-boundary, runtime, and process-scope claim coverage, makes the desktop first-screen facts visible, uses the job in home metadata, standardizes visible “learner” terminology, and makes the browser verifier reproducible. The live rate limit now uses a rolling one-second window instead of a wall-clock bucket.

See `.factory/polish-3.md` for the complete finding-by-finding map.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e -- --retries=0
cargo fmt --all -- --check
cargo clippy --all-targets --locked -- -D warnings
```

Start locally with `cargo run`, then open `http://localhost:8080`. The one-click isolated sample is `/demo` or `/?demo=1`.

## Exact evidence

- Final clean clone: `/tmp/open-quiz-arena-polish-3-final.wPazNI` at `c2a4628b8c4d071b935793f8e84301f82a038db8`.
- `npm ci`: passed, 61 packages, zero vulnerabilities.
- `npm test`: passed, 3 Vitest and 13 Rust tests.
- `npm run build`: passed and produced `dist/`; initial JS is 31.91 kB raw / 10.42 kB gzip and CSS is 20.29 kB raw / 5.22 kB gzip.
- Every one of the 23 commands in `.factory/claims.json` was run separately from that clean clone: passed.
- Full clean Playwright: 29/29 passed with `--retries=0`.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --all-targets --locked -- -D warnings`: passed.
- Clean local `BASE_URL=http://127.0.0.1:8080 node .factory/verification-browser.mjs`: passed; zero serious/critical Axe findings, console errors, failed requests, and third-party requests.
- `.factory/verify-url.sh` passed local `/` and `/?demo=1`.
- Local Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.2s, CLS 0, TBT 40ms. Report: `.factory/evidence/polish-3-local/lighthouse.json`.
- Live `BASE_URL=https://open-quiz-arena.sociobot.in npm run test:e2e -- --retries=0 --reporter=line`: 30/30 passed.
- Live `BASE_URL=https://open-quiz-arena.sociobot.in node .factory/verification-browser.mjs`: passed; evidence `.factory/evidence/polish-3-live/browser-verification.json`.
- Live cold route/Axe audit: `.factory/evidence/polish-3-live/cold-audit.json` confirms 200 for `/`, `/demo`, `/?demo=1`, `/create`, `/play`, `/privacy`, and `/terms`; a styled 404 for `/definitely-missing`; one h1/main, `lang=en`, no overflow, console errors, or serious/critical Axe findings.
- `.factory/verify-url.sh` passed live `/` and `/?demo=1`. Live `/health` returned the full deployed SHA above.
- Cold live captures: `.factory/evidence/polish-3-live/home-desktop.png`, `home-mobile.png`, `demo.png`, and `not-found.png`.

## Deployment

The factory container path deployed the Rust/Axum service with the supplied `Dockerfile` on port 8080. The generic deploy default initially set a three-replica ceiling; it was corrected after deployment to the documented `minReplicas=1`, `maxReplicas=1` because live room state is intentionally process-scoped.

## Known gaps

None for the shipped scope. The brief deliberately excludes accounts, homework, dashboards, analytics, and AI question generation. A shared room coordinator would be needed before raising the replica ceiling above one.
