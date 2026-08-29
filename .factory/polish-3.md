# Polish 3 — cumulative finding closure

Repair commits: `58a72e2f7fa4cee6fc89ab597ff110679eb68ff4` and `c2a4628b8c4d071b935793f8e84301f82a038db8`.

Evidence shorthand: **C** is the clean clone at `/tmp/open-quiz-arena-polish-3-final.wPazNI`, where all 23 registry commands were run separately; **B** is the clean 29-test Playwright run; **V** is `BASE_URL=http://127.0.0.1:8080 node .factory/verification-browser.mjs`; **L** is the post-deploy cold check at `https://open-quiz-arena.sociobot.in` and the named route. Screenshots are under `.factory/evidence/polish-3-local/` unless a live path is named in the deployment section.

| Finding | Change made or revalidated | Evidence |
| --- | --- | --- |
| F-1-1 | Repaired the podium replay handler, preserved both one-click demo entries, isolated storage, reset, and exit. | C `@claim:demo-sandbox`; `demo-lobby.png`; L `/demo`, `/?demo=1` |
| F-1-2 | Expanded the registry to 23 entries and verified exactly one `@claim:` tag per entry. | C all 23 commands; registry-tag audit |
| F-1-3 | Retained the designed, metadata-complete static 404 with an HTTP 404 status. | C `@claim:route-metadata-and-404`; `not-found.png`; L `/definitely-missing` |
| F-1-4 | Retained account-free/free copy and its clean-context request/UI check. | C `@claim:no-accounts-and-free-access`; L `/demo` |
| F-1-5 | Retained the measured 40-learner wording and browser fan-out check. | C `@claim:room-capacity-40`; L `/` |
| F-1-6 | Kept the unproved speed, 400-player, and no-cap bundle removed. | Copy audit; L `/` |
| F-1-7 | Retained six-digit room creation and join coverage. | C `@claim:six-digit-room-code`; L `/play` |
| F-1-8 | Retained the plain reusable-link wording and fragment round trip. | C `@claim:quiz-share-link`; L `/privacy` |
| F-1-9 | Retained exact active and finished retention periods. | C `@claim:temporary-room-expiry`; L `/` and `/privacy` |
| F-1-10 | Retained CSV import and focused complete error summary. | C `@claim:csv-import`; L `/create` |
| F-1-11 | Extended the 390px claim through question, answer lock, and reveal. | C `@claim:mobile-nickname-entry`; B; L `/play` |
| F-1-12 | Retained full answer, ranking, and final podium flow. | C `@claim:live-quiz-results`; B |
| F-1-13 | Added tab-scoped draft storage, exact lifetime copy, pre-room request inventory, cleanup, and fresh-tab check. | C `@claim:draft-in-browser`; L `/create` |
| F-1-14 | Kept the unprovable upload absolute removed. | Copy audit; L `/create` |
| F-1-15 | Retained exact temporary-room wording and expiry test. | C `@claim:temporary-room-expiry`; L `/create` |
| F-1-16 | Kept vague nickname deletion wording removed. | Copy audit; L `/play` |
| F-1-17 | Kept tracker/library privacy absolutes removed. | Copy audit; L `/privacy` |
| F-1-18 | Retained narrowed, observable session-data privacy wording. | C `@claim:privacy-session-data`; L `/privacy` |
| F-1-19 | Retained active two-hour expiry coverage. | C `@claim:temporary-room-expiry`; L `/privacy` |
| F-1-20 | Retained finished ten-minute expiry coverage. | C `@claim:temporary-room-expiry`; L `/privacy` |
| F-1-21 | Kept unprovable database and backup absolutes removed. | Copy audit; L `/privacy` |
| F-1-22 | Retained current-session reconnect-token check. | C `@claim:privacy-session-data`; L `/privacy` |
| F-1-23 | Retained fresh-context reconnect-token deletion check. | C `@claim:privacy-session-data` |
| F-1-24 | Retained fragment-only reusable-link behavior. | C `@claim:quiz-share-link`; L `/privacy` |
| F-1-25 | Kept irrecoverability absolute removed. | Copy audit; L `/privacy` |
| F-1-26 | Retained operator, free access, and privacy contact coverage. | C `@claim:legal-operator-contact`; L `/terms` |
| F-1-27 | Retained bounded README capability wording. | C `@claim:room-capacity-40`; README audit |
| F-1-28 | Added a typed-authoring room-opening claim alongside CSV coverage. | C `@claim:typed-questions`; L `/create` |
| F-1-29 | Retained phone code and nickname coverage. | C `@claim:mobile-nickname-entry`; L `/play` |
| F-1-30 | Retained observable result wording instead of scoring jargon. | C `@claim:live-quiz-results`; B |
| F-1-31 | Kept bundled absence claims out of README. | README audit |
| F-1-32 | Retained tested fragment-link explanation. | C `@claim:quiz-share-link`; L `/privacy` |
| F-1-33 | Kept server-memory absolute out of README. | README audit |
| F-1-34 | Retained eight-question, isolated-learner flow. | C `@claim:live-quiz-results`; B |
| F-1-35 | Kept broad test-coverage marketing removed. | README audit |
| F-1-36 | Retained complete focused CSV error behavior. | C `@claim:csv-import`; V |
| F-1-37 | Kept unprovable container secrecy wording removed. | README audit |
| F-1-38 | Retained scoped deployment wording. | C `@claim:runtime-port-health`; README audit |
| F-1-39 | Retained the one-warm-replica deployment instruction and set the live scale to one minimum and one maximum replica. | C `@claim:single-process-room-state`; L Container App scale `1/1` |
| F-1-40 | Kept unsupported multi-process failure prose removed. | README audit |
| F-1-41 | Retained both stated timeout checks. | C `@claim:temporary-room-expiry` |
| F-1-42 | Kept unsafe nickname absolutes removed. | Copy audit; L `/play` |
| F-1-43 | Retained reconnect-token session behavior. | C `@claim:privacy-session-data` |
| F-1-44 | Retained operator and contact behavior. | C `@claim:legal-operator-contact`; L `/privacy` |
| F-1-45 | Retained route-aware titles and added the job-naming home title. | C `@claim:route-metadata-and-404`; L `/` |
| F-1-46 | Retained focus, route announcement, scroll, and history behavior. | C `@claim:route-metadata-and-404`; V |
| F-1-47 | Retained canonical, social, sitemap, favicon, and touch-icon metadata. | C `@claim:route-metadata-and-404`; L `/` |
| F-1-48 | Retained normal site header/footer on routes and 404. | C `@claim:route-metadata-and-404`; `not-found.png`; L `/definitely-missing` |
| F-1-49 | Moved the four plain facts above the desktop fold while retaining phone visibility. | B `1440px first screen`; `home-desktop.png`, `home-mobile.png`; L `/` |
| F-1-50 | Retained literal free-classroom-quiz wording. | Copy audit; L `/` |
| F-1-51 | Retained the seven-word job headline. | Copy audit; L `/` |
| F-1-52 | Retained explicit teacher/trainer and learner-phone explanation. | C `@claim:mobile-nickname-entry`; L `/` |
| F-1-53 | Retained plain reusable-link wording. | C `@claim:quiz-share-link`; L `/privacy` |
| F-1-54 | Retained task-naming three-step heading. | Copy audit; L `/` |
| F-1-55 | Retained plain CSV import wording. | C `@claim:csv-import`; L `/` |
| F-1-56 | Retained factual footer copy. | C `@claim:no-accounts-and-free-access`; L `/` |
| F-1-57 | Kept “ephemeral” out of README. | README audit |
| F-1-58 | Kept scoring jargon out of README. | README audit |
| F-1-59 | Kept JSON implementation jargon out of README. | README audit |
| F-1-60 | Kept server-memory implementation jargon out of README. | README audit |
| F-1-61 | Kept coverage jargon out of README. | README audit |
| F-1-62 | Kept “fixture” out of README. | README audit |
| F-1-63 | Re-audited every README sentence at 22 words or fewer. | `.factory/copy-audit.md` |
| F-1-64 | Kept “load smoke” out of README. | README audit |
| F-1-65 | Added separate boundary claims for answer numbering and time. | C `@claim:csv-answer-numbering`, `@claim:csv-time-range` |
| F-1-66 | Retained focus on the full CSV error list. | C `@claim:csv-import`; V |
| F-1-67 | Kept process-local jargon out of the product summary. | README audit |
| F-1-68 | Retained concise replica guidance. | README audit |
| F-1-69 | Kept implementation-heavy nickname language out of public copy. | Copy audit |
| F-1-70 | Retained “Enter nickname” action wording. | C `@claim:mobile-nickname-entry`; L `/play` |
| F-1-71 | Replaced every visible host/result “player” label with “learner.” | C `@claim:live-quiz-results`; B; L live host room |
| F-1-72 | Retained task-naming Create and Join headings. | B route audit; L `/create`, `/play` |
| F-2-1 | Retained direct `?demo=1` demo coverage. | C `@claim:demo-sandbox`; L `/?demo=1` |
| F-2-2 | Retained tested demo exit and renamed it to name its result. | C `@claim:demo-sandbox`; L `/demo` |
| F-2-3 | Retained plain “separate demo storage” README wording. | `.factory/copy-audit.md` |
| F-2-4 | Retained direct registry instructions instead of coverage marketing. | README audit |
| F-3-1 | Bound all reset controls through `data-demo-reset`; podium replay now clears state and returns to lobby. | C `@claim:demo-sandbox`; L `/demo` |
| F-3-2 | Made browser verifier honor `BASE_URL` and use a newly joined unanswered learner for reduced-motion coverage. | C verifier command; V |
| F-3-3 | Reduced desktop hero height and placed facts before secondary actions; added a 1440×900 bound assertion. | B `1440px first screen`; `home-desktop.png`; L `/` |
| F-3-4 | Changed home title and social title to “Open Quiz Arena — run live classroom quizzes.” | C `@claim:route-metadata-and-404`; L `/` |
| F-3-5 | Registered the supported Node 22/current Rust toolchain and checked it in a clean build. | C `@claim:runtime-toolchain` |
| F-3-6 | Registered clean default-port behavior. | C `@claim:runtime-defaults` |
| F-3-7 | Registered the clean `dist` static-directory default. | C `@claim:runtime-defaults` |
| F-3-8 | Registered `/health` build identification. | C `@claim:runtime-defaults` |
| F-3-9 | Added optional-column import assertions. | C `@claim:csv-optional-columns` |
| F-3-10 | Added 1→A, 4→D, and invalid-number assertions. | C `@claim:csv-answer-numbering` |
| F-3-11 | Added 5/120 acceptance and out-of-range rejection assertions. | C `@claim:csv-time-range` |
| F-3-12 | Registered a supplied-port health smoke against a separately started binary. | C `@claim:runtime-port-health`; L `/health` |
| F-3-13 | Registered and tested process-scoped room state with two isolated app states. | C `@claim:single-process-room-state` |
| F-3-14 | Made the registry complete, then independently counted one source tag for each of 23 entries. | C registry-tag audit |
| F-3-15 | Renamed “Start for real” to “Leave demo and create a quiz.” | C `@claim:demo-sandbox`; L `/demo` |

## Local quality evidence

- `npm test`: 3 Vitest and 13 Rust tests passed.
- `npm run build`: passed; `dist/` contains 31.91 kB raw / 10.42 kB gzip JavaScript and 20.29 kB raw / 5.22 kB gzip CSS.
- Full Playwright: 29/29 passed with `--retries=0`; it includes Axe on every public route, mobile target and overflow checks, offline room creation, request inventories, privacy storage, and 1440×900 first-screen bounds.
- `cargo fmt --all -- --check` and `cargo clippy --all-targets --locked -- -D warnings`: passed.
- `V`: passed with zero console errors, zero failed requests, zero serious/critical Axe issues, 360px mobile answer buttons at least 155×268px, and reduced-motion transitions at `0.00001s`.
- Lighthouse, local mobile preset: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.2s, CLS 0, TBT 40ms. Report: `.factory/evidence/polish-3-local/lighthouse.json`.

## Post-deploy evidence

- `/opt/fleet/lib/deploy-container.sh open-quiz-arena /work/repo Dockerfile 8080` deployed `c2a4628b8c4d071b935793f8e84301f82a038db8`.
- The final ready revision is `sf-open-quiz-arena--0000014`, configured with `minReplicas=1` and `maxReplicas=1`.
- Cold live Playwright: 30/30 passed with `BASE_URL=https://open-quiz-arena.sociobot.in npm run test:e2e -- --retries=0 --reporter=line`.
- Cold live route/Axe audit: `.factory/evidence/polish-3-live/cold-audit.json` covers `/`, `/demo`, `/?demo=1`, `/create`, `/play`, `/privacy`, `/terms`, and `/definitely-missing`; all normal routes are 200, the missing route is 404, every route has one h1/main and `lang=en`, and zero serious/critical Axe findings or console errors.
- Cold live screenshots: `.factory/evidence/polish-3-live/home-desktop.png`, `home-mobile.png`, `demo.png`, and `not-found.png`.
- Live verifier: `.factory/evidence/polish-3-live/browser-verification.json` has zero console errors, zero failed requests, no third-party requests, no serious/critical Axe issue, 360px answer targets above 44px, and reduced-motion transitions at `0.00001s`.
- `.factory/verify-url.sh` passed live `/` and `/?demo=1`; live `/health` returned the deployed full build SHA.
