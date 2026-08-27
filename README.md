# Open Quiz Arena

Open Quiz Arena is an account-free live classroom quiz for teachers and trainers who need every learner in the same game. A host types questions or imports CSV, opens an ephemeral six-digit room, and controls each reveal. Learners join from a phone with only a moderated nickname. Correct answers earn deterministic speed-weighted points; every round ends with a leaderboard and the game ends on a podium.

There are no accounts, persistent quiz library, analytics, trackers, payments, homework mode, or paid player cap. Quiz share links store the quiz JSON in the URL fragment. Live room state exists only in server memory and expires automatically.

## Stack

- Rust 2021, Axum, Tokio, WebSockets, and in-memory room state
- Vite with strict, framework-free TypeScript and CSS
- Vitest for CSV/share-link utilities, Rust unit and route tests, Playwright for the multi-browser live loop
- A non-root, multi-stage Alpine container

## Run locally

Requirements: Rust 1.85+ and Node 22+.

```sh
npm ci
npm run build
cargo run
```

Open `http://localhost:8080`. `PORT` defaults to `8080`; `STATIC_DIR` defaults to `dist`. Set `BUILD_SHA` to the full accepted commit SHA in the running environment; `/health` returns it as `{"status":"ok","build":"…"}`. The compiled value is only a fallback for local/container runs without a runtime value.

For split frontend/backend development, run `cargo run` and `npm run dev` in separate terminals. Vite proxies API and WebSocket traffic to port 8080.

## Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
cargo clippy --all-targets -- -D warnings
```

The end-to-end fixture imports and completes eight questions with three independently isolated players. The server test suite covers room lifecycle, unique codes, validation/limits, idempotent scoring, deterministic speed scores, reconnect tokens, host authorization, nickname sanitization, and expiry purge.

For a basic load smoke against a running instance:

```sh
npx autocannon -c 20 -R 100 -d 10 http://localhost:8080/health
```

## CSV format

Use a header row containing `question,answer1,answer2,correct`. Optional columns are `answer3`, `answer4`, and `time`. `correct` is a one-based answer number and `time` is 5–120 seconds.

```csv
question,answer1,answer2,answer3,answer4,correct,time
Which planet is red?,Mars,Venus,Jupiter,Mercury,1,20
```

The importer supports quoted commas and reports every row error in a keyboard-focusable error summary.

## Container

```sh
docker build --build-arg BUILD_SHA="$(git rev-parse HEAD)" -t open-quiz-arena .
docker run --rm -p 8080:8080 open-quiz-arena
curl http://localhost:8080/health
```

The runtime uses UID/GID 10001, contains no secrets, and writes no room data to disk. Deployment infrastructure, DNS, and billing are intentionally outside this repository.

### Required deployment topology

Live rooms and WebSocket fan-out are deliberately process-local and ephemeral. Until a shared ephemeral room coordinator (including cross-process pub/sub) exists, **run exactly one replica**: `minReplicas=1` and `maxReplicas=1`. Do not use a scale-to-zero or `0..3` deployment helper, load balancing, or an autoscaler for this service; any second process will not know rooms created by the first and valid joins/actions can return 404.

For every deployment, inject `BUILD_SHA` with the full commit SHA of the image being deployed and confirm it through `/health`. The factory controller owns deployment; this repository must not deploy itself.

## Privacy and operating model

Rooms expire after two idle hours; finished rooms expire after ten minutes. The only learner-supplied value is a sanitized nickname. Random host/player tokens live in browser session storage to enable reconnect. Sociobot operates the public service; privacy requests can be sent to `privacy@sociobot.in`. See `/privacy` and `/terms` in the running app.

## License

MIT. See [LICENSE](LICENSE).
