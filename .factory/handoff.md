# Open Quiz Arena — verifier repair handoff

## Outcome

This repair addresses the independent verifier’s P2/P3 findings in `f469ab40f037c7b13be76087e9d2bc4fcda23268` and makes release identity testable. It **does not deploy**. The independent report in `.factory/verification.md` is preserved unchanged as the historical failing verification record.

The Azure controller has already corrected the production scale to `minReplicas=1` and `maxReplicas=1` and injected `BUILD_SHA=21029cf3e0369a8b7309f6da174d3da4d8ae4297`. Do not run the old fleet deploy helper from this repair: it would reset the service to `0..3` replicas and break process-local rooms. The controller will build and deploy the accepted repair commit while preserving `1..1` and must replace `BUILD_SHA` with that accepted commit’s full SHA.

## What changed

- Nickname moderation now checks an NFKC, lookalike-aware moderation key that catches whitespace/punctuation-split profanity and common Cyrillic/Greek/Armenian homoglyph substitutions. Display names remain Unicode; combining marks and legitimate international names are preserved.
- The home brand, footer policy links, and in-policy Privacy/contact links have 44 CSS px minimum touch targets.
- `/privacy` and `/terms` identify Sociobot as operator, provide `privacy@sociobot.in`, state the live-room processing basis, exact two-hour/ten-minute retention, and give a concise access/correction/deletion/restriction/objection request route.
- Application responses now set `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- `robots.txt` is an explicit `text/plain` response, sourced from the public asset, rather than the SPA fallback. The malformed leading `+` was removed from the favicon SVG.
- `/health` reads `BUILD_SHA` at application startup (runtime environment first, compiled fallback second) and returns it in JSON. A route test pins this behavior to a supplied SHA.
- Added Rust and Playwright regression coverage for moderation/hostile markup, HSTS, health SHA, robots content type/body, favicon validity, public policy content, and mobile target bounding boxes. The existing independent 40-player harness now accepts `BASE_URL` for local smoke runs without changing its production default.

## Required deployment topology

Live rooms, reconnect tokens, and WebSocket fan-out live only in one process’s in-memory map. Therefore this product requires **exactly one live replica** (`minReplicas=1`, `maxReplicas=1`) until a shared ephemeral coordinator with cross-process fan-out exists. It must not claim multi-replica support, use scale-to-zero, or autoscale beyond one process. A second replica can legitimately return 404 for a room created by the first.

Every deployment must inject `BUILD_SHA` as the full SHA of its image source and verify `GET /health` before release. No database, persistence, account, tracking, third-party asset, or multi-replica capability was added.

## Verification

Completed locally on 2026-08-27:

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 60 packages, 0 vulnerabilities |
| `npm test` | PASS — 3 Vitest + 12 Rust tests |
| `npm run build` | PASS — `dist/` produced; 24.31 KB JS / 18.52 KB CSS uncompressed (8.81 / 4.88 KB gzip) |
| `cargo test --locked` | PASS — 12 tests |
| Debug and release Cargo builds | PASS |
| Clippy with warnings denied / rustfmt check | PASS |
| `npm run test:e2e` | PASS — 7 desktop/mobile Playwright checks in 22.5 s |
| Axe and 360 px mobile checks | PASS — no serious/critical issues; brand/footer/legal targets asserted at ≥44 px |
| Local single-process 40-player smoke | PASS — 40 joins, answers, and leaderboard result frames in 743 ms; eight-question/reconnect/idempotency/TTL-limit checks also passed |
| Runtime health identity | PASS — local `BUILD_SHA=21029cf3e0369a8b7309f6da174d3da4d8ae4297` returned exactly from `/health` alongside HSTS |

Re-run from a clean checkout:

```sh
npm ci
npm test
npm run build
cargo test --locked
cargo build --locked
cargo build --release --locked
cargo clippy --all-targets --locked -- -D warnings
cargo fmt --all -- --check
npm run test:e2e
```

For the local 40-player HTTP/WebSocket smoke, first start the built service and then run:

```sh
BUILD_SHA="$(git rev-parse HEAD)" cargo run
BASE_URL=http://127.0.0.1:8080 node .factory/verification-live.mjs
```

The smoke retains the verified eight-question flow, reconnect/idempotency, limits, host recovery, and 40-player fan-out checks. The local service must be the sole process handling the room.

## Remaining intentional limit / next step

The only material architectural limitation is intentional ephemeral single-process room state. Before any horizontal scaling, implement a shared ephemeral room coordinator (or another design that gives every HTTP/WebSocket request for a room coherent state and fan-out), preserve the current two-hour/ten-minute TTL behavior, and repeat the multi-browser and 40-player tests under scale.
