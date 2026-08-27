# Independent verification 2 — `6ff62a0b361ca7af34242c9598d1dc1bc8ffe9c0`

**Verdict: PASS**

Verified independently on 2026-08-27 UTC. Product source was not changed. The only changes made by this work order are this report and the handoff.

The repaired release is the requested source and image, runs as one warm process, and did not reproduce any release-blocking finding from [verification.md](verification.md). The prior P0 multi-replica split, P1 missing build identity, and all recorded P2/P3 product defects are repaired in the deployed candidate.

## Release identity and topology

| Check | Independent evidence | Result |
| --- | --- | --- |
| Source | `HEAD` was `6ff62a0b361ca7af34242c9598d1dc1bc8ffe9c0`; its sole parent is `8dfff4b9669abe4c89f91371343d093427f78c4b`. `git diff --name-status 8dfff4b 6ff62a0` contains only `M Dockerfile` (the public-assets build-context copy). | PASS |
| Registry image | Azure Container Registry resolves tag `sociobotregistry.azurecr.io/sf-open-quiz-arena:6ff62a0b361c` to `sha256:11278ccf570b681f20576db53f804a101c92241de17aa92d85b4f2b4413ebc8b` (timestamp `2026-08-27T19:11:07.5937842Z`). | PASS |
| Live identity | `GET https://open-quiz-arena.sociobot.in/health` returned HTTP 200 and `{"build":"6ff62a0b361ca7af34242c9598d1dc1bc8ffe9c0","status":"ok"}`. Azure also sets that exact full value as `BUILD_SHA`. | PASS |
| Azure scale | Active revision `sf-open-quiz-arena--0000004` has 100% traffic, image tag above, `minReplicas: 1`, `maxReplicas: 1`, and exactly one actual replica: `sf-open-quiz-arena--0000004-558b5c86-hdvh4`, `Running`, `ready: true`, `restartCount: 0`. | PASS |
| Process-local coherence | A fresh room `307447` returned HTTP 200 on **100/100** parallel room-status reads (no 404s). This directly retests the old cross-replica symptom. | PASS |

The one-replica setting is required: rooms, tokens, and WebSocket fan-out are intentionally in-memory and process-local. Any future scale-out remains a release blocker until a shared coordinator/fan-out design exists.

## Clean source gates

Environment: Node `v22.23.2`, npm `10.9.8`, Rust/Cargo stable `1.98.0`.

| Command/check | Result |
| --- | --- |
| `cargo clean` then `npm ci` | PASS — 60 packages installed, 0 npm audit vulnerabilities |
| `npm test` | PASS — 3 Vitest and 12 Rust tests |
| `npm run build` | PASS — `dist/` produced |
| `cargo test --locked` | PASS — 12 tests |
| `cargo build --locked` / `cargo build --release --locked` | PASS |
| `cargo clippy --all-targets --locked -- -D warnings` | PASS |
| `cargo fmt --all -- --check` | PASS |
| local `npm run test:e2e` | PASS — all 7 desktop/mobile Playwright tests (33.2 s) |
| deployed `BASE_URL=https://open-quiz-arena.sociobot.in npm run test:e2e` | PASS — all 7 tests (20.9 s) |

The built candidate matches production byte-for-byte: `index.html` SHA-256 `51caaac0…6d4bf5e`, JS `80745cc1…a3bb75af`, and CSS `b8245e4d…e08f7e9`. The initial client is 24,308 bytes JS (8,819 gzip) plus 18,516 bytes CSS (4,891 gzip), below the stated static budget.

## Live classroom verification

`node .factory/verification-live.mjs` against the public URL passed in a single run:

- Created and completed an eight-question room. The final state was `finished`, question 8, with a correct leaderboard/podium order.
- Reconnect token retained the same player id and original nickname; invalid host token returned 401; host disconnect/reconnect preserved phase.
- First answer returned 200; repeated answer returned 409 and did not add score. Sample correct score was 998; all host start/reveal/advance controls and leaderboard transitions worked.
- A late player joined an active question and answered it.
- Joined 40 concurrent players, opened 40 player sockets plus host socket, observed `40/40` locked answers, and delivered 40 result frames in **861 ms**. No WebSocket failure or browser console error occurred in the targeted host/player run.
- Limits: over-256 KiB request returned 413; 51-question quiz returned 400. The Rust lifecycle test also covers active two-hour expiry and purge.
- Real finished-room TTL probe (`.factory/verification-expiry.mjs`, room `710180`): authorized end succeeded first attempt; 30 parallel status reads were 200 at 0, 300, and 570 seconds; all 30 were 404 at 630 seconds. This reproduces the documented 10-minute finished-room deletion behavior.

### Nickname moderation

Live joins yielded `Player` (with normal unique suffixes for repeated fallback names) for whitespace/punctuation split profanity and homoglyphs:

| Input | Observed output |
| --- | --- |
| `  f u c k  ` | `Player` |
| `f-u-c-k` / `f_u_c_k` | `Player · 2` / `Player · 3` |
| `ѕhit` / `ѕһіт` | `Player · 4` / `Player · 5` |
| `Zoë Dvořák`, `Мария`, `नमस्ते` | preserved unchanged |
| `<img src=x onerror=alert(1)>` | harmless plain text `img srcx onerroralert1` |

## Browser, accessibility, privacy, and security

- Playwright keyboard paths passed locally and live: CSV import/error focus, mobile room join with Tab/Enter, host start/reveal controls, and keyboard answer selection. The first focus target is the skip link.
- Independent Axe/Playwright audits found **0 serious/critical** issues on `/`, `/create`, `/play`, `/privacy`, and `/terms`, each with `lang=en`, one `<main>`, one `<h1>`, no horizontal overflow, and no console errors. A live host-question and 360×780 player-question audit also had 0 serious/critical issues and no console errors.
- Live 360 px answer buttons measured 155×277 px. The deployed 7-test browser suite additionally asserted 44 px targets for brand, footer, and legal/contact links on desktop and mobile.
- `/privacy` and `/terms` name Sociobot as operator; provide `privacy@sociobot.in`; state processing/retention; and provide access, correction, deletion, restriction, and objection request routes. The live content and mailto links were exercised by browser tests.
- Live `/health`, `/robots.txt`, and favicon responses include `Strict-Transport-Security: max-age=31536000; includeSubDomains`. `/robots.txt` is HTTP 200 `text/plain; charset=utf-8` with `User-agent: *` / `Allow: /`. `/favicon.svg` is HTTP 200 `image/svg+xml` and begins exactly with `<svg` (no stray byte).
- TLS 1.2 and TLS 1.3 certificate validation succeeded (TLS 1.3 cipher `TLS_AES_256_GCM_SHA384`, verification code 0). A hostile-origin OPTIONS request returned 405 with no CORS grant. CSP, `nosniff`, `DENY` framing, no-referrer policy, and restrictive permissions policy were present.

## Defects and verification limits

| Severity | Finding | Status |
| --- | --- | --- |
| P0 | Process-local room routing split across replicas | **Not reproduced; fixed** by one actual warm replica and 100/100 fresh-room reads. |
| P1 | Deployed build identity absent | **Not reproduced; fixed** by exact full SHA from `/health`. |
| P2 | Profanity split/homoglyph bypass, undersized public targets, missing operator/contact, absent HSTS | **Not reproduced; fixed** by live API/browser/header checks above. |
| P3 | Malformed favicon and HTML `robots.txt` fallback | **Not reproduced; fixed** by live response checks. |
| P3 (test artifact, not product) | The pre-existing `.factory/verification-browser.mjs` reduced-motion tail reconnects a player after that same player has already answered, then incorrectly waits for an answer button for 60 seconds. The audit had already completed its route, axe, keyboard, mobile, host/projector, zoom, and reduced-motion setup checks. Targeted live Axe/keyboard/target-size checks and both Playwright suites passed. | Does not affect the product verdict; leave the historical harness unchanged in this no-product-change verification. |

Lighthouse was attempted with the installed Chromium twice but its launcher terminated with an internal Chrome connection error before producing a report; this is a verifier-environment limitation, not a product browser error. Independent bundle-size, Axe, semantics, mobile, keyboard, console, TLS, and live functional checks above passed.

## Reproduce

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

