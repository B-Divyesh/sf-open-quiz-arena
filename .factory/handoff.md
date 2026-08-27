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

Build with `docker build --build-arg BUILD_SHA=<sha> -t open-quiz-arena .`; run on port 8080 with one sticky container instance. Room state is intentionally local to a process, so horizontal replicas require WebSocket/session affinity. The runtime uses non-root UID/GID 10001.

No container engine or Azure credentials/CLI were available inside the worker, so the image could not be built here and the requested live deployment/URL verification could not honestly be performed. The repository does not modify infrastructure, DNS, or billing. The factory deployment stage should build this committed Dockerfile, route `open-quiz-arena.sociobot.in` to port 8080, set `BUILD_SHA`, keep at least one warm replica, and configure sticky sessions if using more than one replica.

## Known gaps and next steps

- Live-domain health, mobile, accessibility, and real-round verification remain deployment-stage checks because this worker had no deployment authority/tooling.
- The in-memory architecture is intentionally single-session-affinity. A future multi-replica design would need a shared pub/sub room coordinator while still enforcing room TTL and avoiding persistence.
- Dockerfile syntax and both build stages are represented by equivalent local Cargo/npm builds, but the final container itself was not executed because Docker/Podman was absent.
