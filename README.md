# Open Quiz Arena

Run a live classroom quiz for everyone.

Teachers and trainers create questions, share a six-digit room code, and reveal each result. Learners join with a nickname on a phone.

Try the isolated sample at `/demo` or `/?demo=1`. It uses sample learners and a separate `demo:open-quiz-arena:*` browser-storage namespace. Reset demo clears that namespace. Start for real clears it and opens the quiz editor.

## Run locally

Requirements: Rust stable and Node 22+.

```sh
npm ci
npm run build
cargo run
```

Open `http://localhost:8080`.

`PORT` defaults to `8080`. `STATIC_DIR` defaults to `dist`. `/health` returns the build identifier.

## Test

```sh
npm test
npm run build
npm run test:e2e
cargo fmt --all -- --check
cargo clippy --all-targets --locked -- -D warnings
```

Every public product claim and its command are listed in [`.factory/claims.json`](.factory/claims.json). The browser suite covers CSV imports, quiz links, room entry, the full host/player loop, mobile layout, routing, metadata, privacy requests, and accessibility checks.

## CSV format

Use a header row with `question,answer1,answer2,correct`. Optional columns are `answer3`, `answer4`, and `time`.

`correct` uses answer numbers starting at 1. `time` accepts 5 to 120 seconds.

## Deployment

Build the supplied Dockerfile with `BUILD_SHA` set to the source commit. The container listens on `PORT` and serves `/health`.

Live rooms run in one process. Deploy one warm replica until a shared room coordinator exists.

## Privacy and terms

See `/privacy` and `/terms` in the running app. Privacy requests go to `privacy@sociobot.in`.

## License

MIT. See [LICENSE](LICENSE).
