# Independent verification — `21029cf3e0369a8b7309f6da174d3da4d8ae4297`

## Verdict: **FAIL**

Verified independently on 2026-08-27 UTC from a clean `main` checkout whose `HEAD` and `origin/main` were both `21029cf3e0369a8b7309f6da174d3da4d8ae4297`. Product code was not changed.

The local artifact is buildable and its single-process quiz loop works. The deployed product is not release-ready: live room state is split across multiple replicas without affinity/shared coordination, so valid room operations and WebSocket handshakes intermittently return 404. Production also does not expose its deployed SHA. These failures contradict the core live-classroom job and the builder handoff.

## Release-blocking evidence

### P0 — live rooms are randomly unavailable across replicas

- The service stores rooms only in each process's `AppState.rooms` map (`src/server.rs:35-41`) and every room lookup uses that local map (`src/server.rs:76-78`). There is no shared store or cross-replica coordinator.
- For freshly created room `524390`, 50 independent `GET /api/rooms/524390` requests returned **17× 200 and 33× 404**. The approximate 1:2 split is consistent with one owning replica among three live replicas.
- Browser reproduction against fresh room `547184`: joining required 2 attempts, starting required 3 attempts, and Chromium logged 8 failed HTTP/WebSocket requests with `Unexpected response code: 404`. A separate reduced-motion player exhausted the client's bounded retry window without reaching its valid room.
- A projector capture taken after the room finally connected still showed the toast “That room is not active. Check the code with your host.” from a host action routed to a different replica.
- This is intermittent: the repository's live Playwright loop passed once before fan-out (`8.7 s`), and the independent 40-player run also succeeded when all relevant calls happened to reach the owner. That does not mitigate the later reproducible split.
- Required remediation: pin the deployment to exactly one replica as the previous handoff claimed, or route every HTTP and WebSocket request for a room consistently, or move live state/fan-out to a shared ephemeral coordinator. Then repeat the 50-request distribution and full multi-browser run under scale.

### P1 — deployed release identity is absent

`GET https://open-quiz-arena.sociobot.in/health` returned HTTP 200 and:

```json
{"build":"unknown","status":"ok"}
```

It does not expose `21029cf3e0369a8b7309f6da174d3da4d8ae4297` (or even a short SHA), so the deployed backend cannot be tied to the requested commit. The locally built JS/CSS filenames exactly match production (`index-B4mWE3O1.js`, `index-B4arHymv.css`), which supports—but does not prove—the frontend revision.

## Prioritized non-blocking defects

| Priority | Defect | Evidence / impact |
| --- | --- | --- |
| P2 | Nickname moderation is trivially bypassed | Live joins preserved `f u c k` and Cyrillic-homoglyph `ѕhit`. Markup is neutralized (`<img src=x onerror=alert(1)>` became plain text `img srcx onerroralert1`), so this is a classroom moderation gap rather than observed XSS. |
| P2 | Mobile touch targets miss the required 44 px minimum | At 360 px, the home/entry brand link measured 198×30 px and footer Privacy/Terms links measured 49×20 and 40×20 px. Gameplay answer targets passed at 155×268 px. |
| P2 | Privacy notice lacks an identifiable operator/contact | `/privacy` accurately describes room data, session storage, and 2 h/10 min retention, but “contact the operator listed by your school or deployment administrator” gives public users no controller identity, usable contact, legal basis, or rights route. `/terms` likewise names no operator. |
| P2 | HTTPS responses omit HSTS | TLS certificate verification passed and TLS 1.2/1.3 worked, while old protocols were rejected; however, no `Strict-Transport-Security` header was present. |
| P3 | Favicon is malformed | The deployed and source SVG begin with a literal `+` byte before `<svg>`; Chromium reports `naturalWidth: 0`, `naturalHeight: 0`. |
| P3 | Invalid `/robots.txt` hurts SEO | The SPA fallback serves HTML as `robots.txt`; Lighthouse reports 17 parse errors and SEO 91. |

## Functional verification

### Real quiz loop

`BASE_URL=https://open-quiz-arena.sociobot.in npm run test:e2e` initially passed all 3 tests. The main test used one isolated host context and three isolated player contexts, imported eight CSV questions, opened a six-digit room, joined all players, submitted answers, scored each round, advanced through every leaderboard, and reached “Tonight’s podium.” with no console errors during that particular run.

An independent API/WebSocket lifecycle then verified:

- six-digit room creation and invalid-code 404;
- case-insensitive duplicate names (`Ada`, `ada · 2`);
- markup/control-character sanitization (`<script>Ada</script>` → `scriptAdascript`);
- reconnect with the same player ID/name via reconnect token;
- invalid host token → 401;
- late join during a question, with ability to answer that question;
- first answer → 200, second answer → 409, with no duplicate score;
- correct speed scores on the leaderboard (998 points in the sampled first round);
- host disconnect exposed `host_connected:false`, followed by successful token reconnect with phase preserved;
- all eight question/reveal transitions and final `finished` state with four players.

Because of the P0 routing fault, later UI repetitions required retries or failed even though the room and token were valid.

### Limits, expiry, and load

- Request body above 256 KiB → 413.
- 51-question quiz → 400; the supported maximum is 50.
- Forty players joined one room, opened 40 authenticated player WebSockets plus a host WebSocket, submitted 40 answers, appeared as `40/40` to the host, and all 40 received correct-result leaderboard frames in **411 ms** total for join/answer/reveal in that run.
- `autocannon -c 20 -R 100 -d 10 /health`: 1,000 requests in 11.04 s, 106 req/s average, 7.47 ms average latency, 45 ms p99, 60 ms max; no non-2xx count was reported.
- Finished-room live expiry probe `428583`: the authorized `end` required 4 attempts because of cross-replica 404s. Status sampling was 9×200/21×404 immediately, 10×200/20×404 at 300 s, 9×200/21×404 at 570 s, and **0×200/30×404 at 630 s**. This confirms deletion shortly after the documented 10-minute finished TTL while independently reinforcing the replica split.
- Active-room two-hour expiry could not be elapsed inside the 90-minute work order. Code sets `ACTIVE_TTL=2h`, `FINISHED_TTL=10m`, purges every 30 s, and the local expiry/purge tests passed. This is code/test evidence, not a live two-hour observation.

## Local clean-checkout gates

Environment: Node `v22.23.2`, npm `10.9.8`, rustc `1.98.0`, cargo `1.98.0`.

| Gate | Result |
| --- | --- |
| `npm ci` | PASS; 60 packages, 0 audit vulnerabilities |
| `npm test` | PASS; 3 Vitest + 9 Rust tests |
| `npm run build` | PASS; `dist/` produced |
| Client size | 23.62 KB JS / 18.27 KB CSS uncompressed; 8.59 / 4.84 KB gzip |
| `cargo test --locked` | PASS; 9 unit/integration tests |
| `cargo build --locked` | PASS |
| `cargo build --release --locked` | PASS |
| `cargo clippy --all-targets --locked -- -D warnings` | PASS |
| `cargo fmt --all -- --check` | PASS |
| local `npm run test:e2e` | PASS; 3 Playwright tests in 19.6 s |
| container build | NOT RUN; this verifier image has no Docker, Podman, or Buildah |

Static container inspection found a three-stage Alpine build, locked Cargo release build, no copied secrets, runtime UID/GID 10001, port 8080, and only the binary plus `dist/` copied to runtime. Base images are tag-pinned rather than digest-pinned. The final image itself was not independently executed or scanned.

## Browser, accessibility, and performance

- Axe: **0 serious/critical findings** on `/`, `/create`, `/play`, `/privacy`, `/terms`, live host-question, and live mobile-player-question states.
- Semantics on every audited route/state: `lang=en`, nonempty title, exactly one `<main>`, exactly one `<h1>`, and no horizontal overflow.
- Keyboard: skip link was first focus target with a visible 3 px solid outline; CSV import/error was operable and the aggregate error summary received focus; join, host start, and answer controls were operable with Tab/Enter. No trap observed.
- Mobile 360×780: question view had no horizontal overflow; the four answer buttons formed a readable 2×2 grid at 155×268 px each.
- Desktop projector 1440×900: board stayed within viewport, prompt was visible, and answers formed two columns. The layout is legible at distance.
- 200% text resize: root computed to 32 px on `/privacy`; headings remained present and there was no horizontal overflow.
- Reduced motion: media query matched; computed animation and transition durations were `0.00001 s` (serialized as `1e-05s`).
- Live console: static/policy audits were clean, but valid-room runs produced 404/WebSocket errors because of P0. Therefore the required zero-console-error result is **FAIL**.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 91; FCP 0.9 s, LCP 1.1 s, CLS 0, TBT 10 ms, Speed Index 0.9 s. Four initial requests transferred 14,677 bytes; JS 8,668 bytes and CSS 4,869 bytes transferred. INP has no lab value in this run.

## Security, privacy, and originality

- HTTPS certificate is valid for the host (DigiCert/GeoTrust, 2026-08-27 through 2027-02-27); TLS 1.2 and 1.3 succeeded.
- Present on HTML, API errors, health, and assets: CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and restrictive camera/microphone/geolocation policy. Hashed assets use one-year immutable caching; dynamic responses use `no-store`.
- Hostile-origin JSON POST preflight returned 405 with no `Access-Control-Allow-Origin`; browser cross-origin API access is therefore not granted. No permissive CORS header was found.
- Browser inspection found no cookies, local storage, IndexedDB, or service workers; only the expected player reconnect token in session storage. Source/dependency scans found no account flow, analytics/tracking SDK, database, payment code, secrets, remote font, or hosted third-party asset. The audited browser run made zero third-party requests.
- Room status is readable without a viewer token when the six-digit code is known and exposes quiz/player leaderboard state. This is worth documenting explicitly in the privacy model even though host/player mutation remains token-protected.
- `/privacy` and `/terms` exist and are readable. The room model is in-memory; no application persistence layer is present. WebSocket host/player tokens are passed in query strings, so deployment access-log redaction should be confirmed separately.
- Visual/source inspection found a bespoke dark scoreboard/grid system, lettered answer lanes, signal-bar mark, no images/fonts/audio/external icon set, no product reference to Kahoot, and no copied Kahoot terminology or recognizable trade dress. Originality claim is credible.

## Reproduction artifacts

- `.factory/verification-live.mjs` — API/WebSocket lifecycle, limits, host loss, idempotency, and 40-player fan-out.
- `.factory/verification-browser.mjs` — route semantics, axe, keyboard, responsive/projector, text resize, reduced motion, storage/network, and console capture.
- `.factory/verification-expiry.mjs` — timed live finished-room expiry probe.

Run the first two with `node .factory/verification-live.mjs` and `node .factory/verification-browser.mjs`. Live results are currently nondeterministic by design of the faulty replica routing; failures/retries are evidence of P0 rather than harness flakiness.
