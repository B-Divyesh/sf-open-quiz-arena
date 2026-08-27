# Independent verifier handoff

## Outcome

**FAIL** for commit `21029cf3e0369a8b7309f6da174d3da4d8ae4297` and `https://open-quiz-arena.sociobot.in`.

The local build and single-process experience pass, but the deployed service is horizontally serving process-local room state without affinity/shared coordination. A new room returned 200 on only 17/50 independent status requests and 404 on 33/50. Live browsers consequently saw valid-room WebSocket/action 404s, retries, console errors, and one exhausted reconnect window. `/health` also reports `build: unknown`, not the deployed SHA.

Full evidence, pass results, limitations, and prioritized defects are in `.factory/verification.md`. Product code was not modified; only independent verification documentation/harnesses were added.

## Verification performed

- `npm ci`, `npm test`, `npm run build`
- `cargo test --locked`, debug/release builds, Clippy with warnings denied, rustfmt check
- Local and live Playwright E2E, including the eight-question host/three-isolated-player loop
- Independent live API/WebSocket lifecycle, reconnect/idempotency, duplicate/sanitized names, invalid codes, late join, host loss/auth, payload/question limits, and 40-player fan-out
- Timed finished-room expiry probe; source/unit review for the two-hour active TTL
- 360 px mobile, 1440×900 projector, keyboard, 200% text resize, reduced motion, axe, console/network/storage checks
- Lighthouse and 100 rps HTTP smoke
- TLS, CSP/security/cache/CORS headers, privacy/terms, source dependency/persistence/tracking/originality review
- Static Dockerfile inspection; no container engine was available, so the final image was not executed

## Re-run

```sh
npm ci
npm test
npm run build
cargo test --locked
cargo build --release --locked
cargo clippy --all-targets --locked -- -D warnings
cargo fmt --all -- --check
npm run test:e2e
BASE_URL=https://open-quiz-arena.sociobot.in npm run test:e2e
node .factory/verification-live.mjs
node .factory/verification-browser.mjs
node .factory/verification-expiry.mjs
```

## Required next steps

1. Make live room routing safe across replicas (single replica, consistent affinity, or shared ephemeral coordination) and repeat scaled multi-browser testing.
2. Inject and expose the actual deployed commit SHA.
3. Address the remaining P2/P3 accessibility, policy, HSTS, moderation, favicon, and robots defects listed in the verification report.
