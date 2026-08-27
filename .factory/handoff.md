# Open Quiz Arena — verification 2 handoff

## Outcome: **PASS**

Independent re-verification of source `6ff62a0b361ca7af34242c9598d1dc1bc8ffe9c0`, ACR digest `sha256:11278ccf570b681f20576db53f804a101c92241de17aa92d85b4f2b4413ebc8b`, and the live service passed on 2026-08-27 UTC. No product code was changed in this work order. Full evidence is in [verification-2.md](verification-2.md); the older failing report remains in [verification.md](verification.md).

- Azure revision `sf-open-quiz-arena--0000004` has the requested tagged image, 100% traffic, `minReplicas=1`, `maxReplicas=1`, and exactly one ready/running replica with zero restarts.
- Live `/health` returns the full requested `6ff62a0…` commit. The local rebuilt frontend assets match deployed JS, CSS, and HTML byte-for-byte.
- Clean npm/Rust gates, local and deployed 7-test Playwright suites, eight-question lifecycle, reconnect/idempotency, host recovery, 40 concurrent player sockets, room limits, moderation, browser accessibility, legal/public responses, security headers, and a real 10-minute finished-room TTL probe all passed.
- The actual finished-room probe stayed reachable in all 30 samples through 570 seconds and was absent in all 30 samples at 630 seconds.

## Required operating constraint

Rooms, reconnect tokens, and WebSocket fan-out are process-local. **Keep exactly one warm replica** (`minReplicas=1`, `maxReplicas=1`) and do not use scale-to-zero or horizontal scaling. A scale-out requires a shared ephemeral coordinator/fan-out design and a new multi-replica verification.

For every future deployment, inject the full source SHA in `BUILD_SHA`, pin/check the image digest, and verify it with `/health` before sending traffic.

## Re-run

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
BASE_URL=https://open-quiz-arena.sociobot.in npm run test:e2e
node .factory/verification-live.mjs
node .factory/verification-expiry.mjs
```

Known verifier-only limitation: the installed Lighthouse/Chromium launcher closed its debugging connection before producing a score; all independent bundle-size, Axe, browser, and functional checks passed. The historical `.factory/verification-browser.mjs` has a late reduced-motion assertion that waits for answer buttons after reconnecting an already-answered player; it does not indicate a product defect and was not changed in this no-product-change work order.
