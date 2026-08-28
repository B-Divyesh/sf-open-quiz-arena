# Open Quiz Arena — perfection loop round 2 handoff

## Outcome

All findings in `.factory/review-1.md` and `.factory/review-2.md` are closed. The kinetic arena scoreboard identity and Rust/Axum plus Vite deployment class remain intact.

The release now states and proves a useful classroom size, supports both one-click demo URLs with complete isolation and exit cleanup, serves a fully styled HTTP 404 under the CSP, updates route metadata, and keeps the required first-screen content visible at 390×844. `.factory/polish-2.md` maps F-1-1 through F-1-72 and F-2-1 through F-2-4 individually.

## Exact verification evidence

Source repair `bc4a928993ba6b94ed9b2be5f3d501343582f33c` was cloned without shared working files at `/tmp/open-quiz-arena-polish-2.KLE1dc`.

- `npm ci`: 61 packages, zero audit vulnerabilities.
- `npm test`: 3 Vitest tests and 12 Rust tests passed.
- `npm run build`: produced `dist/`; initial JS 31,420 bytes raw / 10,268 gzip and CSS 20,266 bytes raw / 5,227 gzip.
- Every one of the 14 commands in `.factory/claims.json` passed separately from the clean clone.
- `npm run test:e2e -- --retries=0`: 24/24 passed, including the eight-question live loop, 40-learner WebSocket claim, rate-limit response, mobile layout, offline failure, privacy request/storage, routing, and 404 checks.
- `cargo fmt --all -- --check` and `cargo clippy --all-targets --locked -- -D warnings`: passed.
- `BASE_URL=http://127.0.0.1:8080 node .factory/verification-live.mjs`: 11/11 checks passed; 40 joins, 40 answers, and 40 result frames completed in 236ms.
- Playwright Axe checks: zero serious or critical findings on `/`, `/demo`, `/?demo=1`, `/create`, `/play`, `/privacy`, `/terms`, and the HTTP 404 at 360px.
- Local worker URL verification passed `/` and `/?demo=1` with one h1, `lang=en`, a main landmark, complete image/button labels, and zero console errors.
- Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.2s, CLS 0, TBT 20ms.
- The catalog description is verb-first and 69 characters.

Committed local visual evidence:

- `.factory/evidence/polish-2-local/home/screenshot-mobile.png`
- `.factory/evidence/polish-2-local/home/screenshot-desktop.png`
- `.factory/evidence/polish-2-local/demo-query/screenshot-mobile.png`
- `.factory/evidence/polish-2-local/demo-query/screenshot-desktop.png`
- `.factory/evidence/polish-2-local/404-mobile.png`
- `.factory/evidence/polish-2-local/404-desktop.png`

## Deployment and cold live check

Deployment uses `/opt/fleet/lib/deploy-container.sh open-quiz-arena /work/repo Dockerfile 8080`, followed by a one-replica scale check because live rooms are process-local. The final cold check confirms:

- `https://open-quiz-arena.sociobot.in/health` returns the deployed Git commit.
- `/` shows the measured 40-learner fact and required first-screen content at 390×844.
- `/?demo=1` opens the seeded host immediately with the demo banner; Reset demo and Start for real clear sample progress.
- `/definitely-missing` returns HTTP 404 with scoreboard styling, metadata, normal navigation, Privacy/Terms links, and no CSP/runtime errors.
- The complete live Playwright suite passes 24/24, including all 14 claim tests.
- The live worker URL verifier passes `/` and `/?demo=1` with no console errors.

Post-deploy screenshots and verifier JSON are written outside the repository at `/work/.evidence/open-quiz-arena-polish-2/live/`.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e -- --retries=0
cargo fmt --all -- --check
cargo clippy --all-targets --locked -- -D warnings
```

Run each command in `.factory/claims.json` independently for the public-claim gate. Open `/demo` or `/?demo=1` for the isolated sample.

## Known gaps

No review finding remains. Keep the deployment at one warm replica until rooms and WebSocket fan-out use a shared coordinator.
