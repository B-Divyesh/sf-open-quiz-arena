# Open Quiz Arena — polish 1 handoff

## Outcome

Repair commit: `fcf7eba980d9e25e0df9c4c93e821bcd22383da4` (`fix: close adversarial review findings`).

The adversarial review is closed in source. The release adds a true client-only sample demo, 13 executable claims, real server-side 404 handling, metadata/assets, route titles/focus/scroll announcements, navigation/footer, plain first-screen copy, mobile verification, and refreshed policy/README language. The scoreboard identity is preserved.

`polish-1.md` maps F-1-1 through F-1-72 individually to the repair and evidence. Demo behavior is documented in `demo.md`; first-screen wording is audited in `copy-audit.md`.

## Verification evidence

Clean clone: `/tmp/open-quiz-arena-clean.hlHuxI` cloned at repair commit, then passed:

```sh
npm ci
npm test
npm run build
cargo test --locked
BASE_URL=http://127.0.0.1:8081 npx playwright test --project=desktop --retries=0
BASE_URL=http://127.0.0.1:8081 npx playwright test e2e/mobile.spec.ts --project=mobile --retries=0
```

Main working-tree gates passed:

```sh
npm run build
npm test
cargo fmt --all -- --check
cargo clippy --all-targets --locked -- -D warnings
BASE_URL=http://127.0.0.1:8080 npx playwright test --project=desktop --retries=0
BASE_URL=http://127.0.0.1:8080 npx playwright test e2e/mobile.spec.ts --project=mobile --retries=0
cargo test claim_temporary_room_expiry --locked
.factory/verify-url.sh http://127.0.0.1:8080/
.factory/verify-url.sh http://127.0.0.1:8080/demo
```

Results: unit 3/3, Rust 12/12, clean-clone desktop browser 16/16 (including every claim), clean-clone mobile browser 2/2, claim expiry 1/1, and verifier title/lang/main/alt/console checks passed. The browser suite includes Axe checks with zero serious/critical violations on join and privacy routes. Initial JavaScript is 30.90 KB raw / 10.11 KB gzip; CSS is 19.99 KB raw / 5.17 KB gzip.

Evidence images:

- `.factory/evidence/demo-desktop.png`
- `.factory/evidence/home-mobile.png`

## Deployment and live recheck

Deployed through the container work order to Azure Container Apps revision `sf-open-quiz-arena--0000005`, image `sociobotregistry.azurecr.io/sf-open-quiz-arena:fcf7eba980d9`, with one warm replica. `/health` returns `fcf7eba980d9e25e0df9c4c93e821bcd22383da4`.

Cold-checked:

```text
https://open-quiz-arena.sociobot.in/
https://open-quiz-arena.sociobot.in/demo
https://open-quiz-arena.sociobot.in/privacy
https://open-quiz-arena.sociobot.in/definitely-missing
```

Observed: sample banner/controls on `/demo`, route-specific titles, and HTTP 404 on the final URL. The live desktop browser suite passed 16/16 and the live mobile suite passed 2/2. `.factory/verify-url.sh` passed title/lang/main/alt/console checks on live `/` and `/demo`. The container uses one warm replica because rooms are process-local.

## Known gaps

No product findings remain. No DNS or billing settings were changed.
