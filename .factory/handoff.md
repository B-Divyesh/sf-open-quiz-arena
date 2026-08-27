# Open Quiz Arena — release 1 handoff

## What shipped

- A Rust 2021 Axum/Tokio service with unique six-digit rooms, WebSocket fan-out, role-scoped state, host authorization, opaque reconnect tokens, deterministic speed scoring, single-answer idempotency, duplicate-name suffixes, nickname moderation, structured logs, graceful shutdown, security headers, payload/rate limits, and `/health` build metadata.
- Fully ephemeral in-memory operation. Idle rooms expire after two hours; finished rooms expire after ten minutes; the purge removes the entire room object and no database exists.
- A strict TypeScript/Vite client with quiz editing, quoted CSV import and focusable aggregate errors, quiz-as-URL-fragment sharing, phone entry, late joining, host-loss messaging, bounded WebSocket retry, four large answer lanes, locked-answer feedback, between-round boards, and a final podium.
- Responsive keyboard-accessible screens for home, host editor, host projector, player phone, errors/offline states, privacy, and terms. There are no accounts, analytics, third-party assets, payments, persistent library, AI features, or homework mode.
- The original kinetic arena scoreboard system is documented in `.factory/design.md`; all visual assets are hand-authored HTML/CSS/SVG.
- A locked non-root multi-stage Alpine `Dockerfile` and deployment documentation.

## Verification performed on 2026-08-27

| Check | Result |
| --- | --- |
| `npm test` | PASS — 3 Vitest + 9 Rust tests |
| `npm run build` | PASS — `dist/` produced |
| Production client budget | 23.62 KB JS / 18.27 KB CSS uncompressed (8.59 / 4.84 KB gzip) |
| `cargo clippy --all-targets -- -D warnings` | PASS |
| `npm run test:e2e` | PASS — 3 Playwright tests |
| Eight-question real loop | PASS — 1 host + 3 isolated player contexts, all rounds and podium, zero console errors |
| 40-player concurrency test | PASS |
| 360×780 mobile overflow check | PASS |
| Axe serious/critical checks | PASS — zero on entry and privacy screens |
| Lighthouse mobile | Performance 100, Accessibility 100, Best Practices 100, SEO 91 |
| Lighthouse timings | LCP 0.9 s, CLS 0, TBT 10 ms |
| Fixed-rate load smoke | 1,000 requests over 10 s at 100.4 req/s; 1.81 ms average, 10 ms p97.5, no non-2xx responses |
| `/health` and headers | PASS — build SHA JSON, CSP, no-sniff, frame deny, referrer and permissions policy |
| Graceful SIGINT | PASS — structured `server_stopped` event |
| Visual inspection | PASS — desktop home and 360px player entry captured and reviewed |
| Factory URL verifier | PASS — HTTPS 200, 582 ms load, one h1/main/lang/title, no console errors |
| Live-domain E2E | PASS — eight-round host/3-player loop plus desktop/mobile Axe checks |

Run all product gates with:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
cargo clippy --all-targets -- -D warnings
```

## Deployment

Deployed through the factory Azure Container Apps flow at `https://open-quiz-arena.sociobot.in`. The ACR build of the multi-stage Dockerfile succeeded as image `sociobotregistry.azurecr.io/sf-open-quiz-arena:581382ac36ff`. The app is configured with `BUILD_SHA=581382ac36ff`, port 8080, HTTPS-only ingress, a managed certificate, and one warm replica (`min=1`, `max=1`) so every WebSocket and HTTP action for an in-memory room reaches the same process. `/health` returns `{"build":"581382ac36ff","status":"ok"}`.

For another environment, build with `docker build --build-arg BUILD_SHA=<sha> -t open-quiz-arena .`. The runtime uses non-root UID/GID 10001. Horizontal replicas require WebSocket/session affinity or a shared ephemeral room coordinator.

## Known gaps and next steps

- The in-memory architecture is intentionally single-replica today. A future multi-replica design would need sticky affinity or a shared pub/sub room coordinator while still enforcing room TTL and avoiding persistence.
- The service intentionally has no cross-session host history, analytics, or saved library; quiz share links are the durable handoff format.
