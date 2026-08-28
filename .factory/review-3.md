# Adversarial first-read review 3

## Verdict: **FAIL**

Reviewed `https://open-quiz-arena.sociobot.in` cold on 28 August 2026 in fresh Chromium contexts at 390×844 and 1440×900. The live `/health` response and repository both identify build `510725e8934b1b40e918f992e52f329955602a53`.

The first screen is clear and the main live-quiz flow works. Acceptance still fails. The demo ends on a dead primary action, four earlier findings are only partly fixed, the desktop first screen hides all plain facts below the fold, and several README promises remain outside the claim registry.

## Cold first screen

Before scrolling, I understood the product this way on both viewports:

- **What it does:** runs one live classroom quiz with a shared host screen and phone answers.
- **For whom:** teachers and trainers host it; learners join it.
- **What to click first:** **Try it with sample data**, which says it opens a sample host screen with learners already joined.

This is not a blocking comprehension failure. The exact live copy that supplied those answers was “Run one live quiz for your class,” “Teachers and trainers host. Learners join by code and answer on their phones,” and “Try it with sample data.”

At 390×844, the headline, audience, action, action explanation, and four facts end at y=641. At 1440×900, the facts begin at y=909 and are entirely below the first screen; that separate structure failure is F-3-3.

## Findings

Findings are ordered by severity. Earlier IDs are retained when the earlier repair is incomplete, as required by this review round.

### Blocking

#### F-3-1 — The demo ends on a dead “Run the sample again” button

- **Exact quote/location:** `/demo`, final podium: **Run the sample again**.
- **Evidence:** after completing the live sample and activating this button, the page remained on “Sample podium.” and `localStorage["demo:open-quiz-arena:step"]` remained `"2"`. The banner’s separate **Reset demo** button does work.
- **Code cause:** the banner and podium button both use `id="reset-demo"`. `querySelector('#reset-demo')` attaches the handler only to the first element, which is the banner button.
- **Why this fails:** the prominent completion action gives no response at the end of the one-click demo. This is a broken end-to-end demo path even though the secondary banner reset remains available.
- **Concrete fix:** give the podium action a unique ID or bind all reset actions. Extend `@claim:demo-sandbox` through **Show sample podium**, activate **Run the sample again**, and assert the lobby returns and the `demo:` key is removed.

#### F-1-11 (reopened) — Phone answering is still not covered by its public claim test

- **Exact quote/location:** landing first screen: “Learners join by code and answer on their phones.”
- **Evidence:** `@claim:mobile-nickname-entry` uses a 390×844 context but stops after “You’re in, Maya.” It never starts a question, taps an answer, or observes “Answer locked.” The separate full-game test uses default desktop contexts.
- **Why this fails:** F-1-11 required join **and answer** at phone width. The live behavior can work, but the registered test does not prove the whole first-screen promise.
- **Concrete fix:** extend `@claim:mobile-nickname-entry` to start a room, answer at 390 px, and assert the locked and revealed states, or split “answer on their phones” into its own claim and tagged test.

#### F-1-13 (reopened) — The editor again makes an unlisted browser-storage claim

- **Exact quote/location:** `/create`: “Your browser keeps the quiz while you edit. Open a room when you are ready.”
- **Evidence:** no `.factory/claims.json` entry tests the editor before room creation. `demo-sandbox` records demo requests; `privacy-session-data` begins with a server-created room.
- **Why this fails:** “Your browser keeps the quiz” is a privacy/storage statement a teacher can rely on. F-1-13 previously required this kind of statement to be tested or removed.
- **Concrete fix:** add a claim that edits a draft in a fresh context, records requests and storage before opening a room, and states the exact lifetime of the draft. Otherwise rewrite without implying a tested storage boundary.

#### F-1-28 (reopened) — Typed authoring remains outside the registered test

- **Exact quotes/locations:** landing: “Type questions or import a CSV file.” README: “Teachers and trainers create questions, share a six-digit room code, and reveal each result.”
- **Evidence:** the `csv-import` claim repeats “Type questions or import a CSV file,” but its tagged test only imports CSV. The full live-flow test also starts by importing CSV.
- **Why this fails:** the earlier finding required both typed and imported authoring to be covered. A passing import test does not prove the other half of the registered sentence.
- **Concrete fix:** add `@claim:typed-questions` or extend the current claim test to type a quiz, open its room, and assert that the typed prompt and answers reach host and learner screens.

#### F-1-71 (reopened) — The live product still calls learners “players”

- **Exact locations:** landing and README use “learner”; the real host lobby says “1 player ready” / “players ready,” “Open player entry,” and “Waiting for the first player…”; results say “in the arena.”
- **Code evidence:** these strings remain in `hostBoard()` in `src-web/main.ts`. The repository terminology table says “Person joining a quiz → learner.”
- **Why this fails:** the earlier repair standardized only marketing and entry copy. The core host screen still changes the name of the same person, so F-1-71 is only half-fixed.
- **Concrete fix:** use “learner” throughout visible host and result copy. Keep `player` only in code and API identifiers.

### Major

#### F-3-2 — The handoff’s browser verifier no longer completes

- **Exact location:** `.factory/verification-browser.mjs:4` and `:177–183`; the previous handoff says `BASE_URL=http://127.0.0.1:8080 node .factory/verification-browser.mjs` passed.
- **Evidence:** the current script failed after 60 seconds waiting for `.answer-button`. It reconnects a player token that has already answered, so the page correctly shows the locked state and no answer button. It also hard-codes the production URL and ignores `BASE_URL`.
- **Why this fails:** a documented verification command cannot reproduce the evidence attributed to it and cannot target the clean-clone server as stated.
- **Concrete fix:** read `process.env.BASE_URL`, create an unanswered player for the reduced-motion check or inspect an element present in the locked state, and run this command in CI.

#### F-3-3 — The required plain facts are below the desktop first screen

- **Exact location:** landing `.trust-row` at 1440×900.
- **Evidence:** the primary action ends at y=779, its explanation ends at y=813, and the facts occupy y=909–957. None of “Free,” “No accounts,” “Internet required,” or “Tested with 40 learners in one room” is visible before scrolling.
- **Why this fails:** the required first-screen shape includes short price, privacy, and connectivity facts. Desktop visitors get less decision information than phone visitors.
- **Concrete fix:** reduce the desktop headline/hero height or place the facts before the secondary actions so the fact row ends above 900 px. Add the same bounding-box assertion used for 390 px at 1440×900.

#### F-3-4 — The home title reports a test result instead of the job

- **Exact quote/location:** `<title>Open Quiz Arena — quizzes tested with 40 learners</title>`.
- **Why this fails:** the required pattern is “Product — what it does.” “Quizzes tested with 40 learners” is capacity evidence, not the action or classroom job, so a tab or search result does not say that this runs live quizzes.
- **Concrete fix:** use “Open Quiz Arena — run live classroom quizzes.” Keep the tested capacity in the description and first-screen facts.

### Minor: unlisted README claims

Each sentence below is a distinct claim a developer can rely on, but none has its own `.factory/claims.json` entry. The source or general tests may currently agree; that does not satisfy the one-claim/one-tagged-test contract.

#### F-3-5 — Runtime compatibility is unlisted

- **Quote:** “Requirements: Rust stable and Node 22+.”
- **Fix:** add a compatibility claim exercised in the supported toolchain matrix, or state the exact versions used by CI without promising an open-ended range.

#### F-3-6 — The `PORT` default is unlisted

- **Quote:** “`PORT` defaults to `8080`.”
- **Fix:** add a runtime-config claim that starts the built server without `PORT` and probes port 8080.

#### F-3-7 — The `STATIC_DIR` default is unlisted

- **Quote:** “`STATIC_DIR` defaults to `dist`.”
- **Fix:** add a tagged clean-build test that starts without `STATIC_DIR` and serves the built index from `dist`.

#### F-3-8 — The health build identifier is unlisted

- **Quote:** “`/health` returns the build identifier.”
- **Fix:** register the behavior and assert the configured `BUILD_SHA` through `/health`.

#### F-3-9 — Optional CSV columns are unlisted

- **Quote:** “Optional columns are `answer3`, `answer4`, and `time`.”
- **Fix:** extend the CSV claim to import all three optional columns and assert their values in the editor.

#### F-3-10 — CSV answer numbering is unlisted

- **Quote:** “`correct` uses answer numbers starting at 1.”
- **Fix:** add boundary fixtures that prove 1 maps to A and invalid zero/out-of-range values are reported.

#### F-3-11 — The CSV time range is unlisted

- **Quote:** “`time` accepts 5 to 120 seconds.”
- **Fix:** add fixtures for 5 and 120 plus rejected values on each side, and include the range in the registered claim.

#### F-3-12 — Container serving behavior is unlisted

- **Quote:** “The container listens on `PORT` and serves `/health`.”
- **Fix:** add a tagged built-container smoke test that sets a non-default port and probes `/health`.

#### F-3-13 — The one-process operating constraint is unlisted

- **Quote:** “Live rooms run in one process.”
- **Fix:** register this architecture constraint with a test or rewrite it as an explicit deployment limitation that says room state is not shared between processes.

#### F-3-14 — The claim-registry completeness statement is false

- **Quote:** “Every public product claim and its command are listed in `.factory/claims.json`.”
- **Why this fails:** F-1-11, F-1-13, F-1-28, and F-3-5 through F-3-13 show otherwise.
- **Concrete fix:** make the registry complete, then retain this sentence; until then remove it.

### Minor: plain words

#### F-3-15 — “Start for real” does not name its result

- **Exact location:** persistent demo banner.
- **Why this fails:** “real” contrasts modes but does not say that the action discards demo progress and opens the editor.
- **Concrete fix:** rename it **Leave demo and create a quiz** or **Create your quiz**. Keep the cleanup assertion in `@claim:demo-sandbox`.

## Copy audit

Counts use letter/number tokens. Hyphenated labels follow the existing repository audit. No landing or README sentence exceeds 22 words, and no banned marketing adjective appears. “Finding” identifies the issue above; other entries are usable as written.

### Landing page and metadata

| Words | Exact copy | Audit |
| ---: | --- | --- |
| 4 | Skip to main content | Clear action |
| 3 | Open Quiz Arena | Brand name |
| 1 each | Demo / Create / Join / Privacy | Clear navigation labels |
| 4 | Free live classroom quiz | Clear context; free claim registered |
| 7 | Run one live quiz for your class. | Clear job; live result claim registered |
| 4 | Teachers and trainers host. | Clear audience |
| 9 | Learners join by code and answer on their phones. | Finding F-1-11 |
| 5 | Try it with sample data | Clear primary action |
| 9 | Opens a sample host screen with learners already joined. | Demo claim registered |
| 3 each | Create a quiz / Join a room | Clear result-naming actions |
| 1 | Free | Registered claim |
| 2 | No accounts | Registered claim |
| 2 | Internet required | Registered claim |
| 7 | Tested with 40 learners in one room | Registered quantitative claim |
| 4 | Live · Q 4/8 | Clearly illustrative status |
| 2 | 27 playing | Clearly illustrative count |
| 8 | Which layer of Earth moves beneath the crust? | Sample question |
| 2 / 1 / 2 / 1 | Inner core / Mantle / Outer core / Atmosphere | Sample answers |
| 3 | How it works | Clear section label |
| 6 | Run a quiz in three steps. | Clear heading |
| 3 | Create or import | Clear step label |
| 7 | Type questions or import a CSV file. | Finding F-1-28 |
| 3 | Share the code | Clear step label |
| 7 | Learners enter one nickname on their phones. | Registered mobile-entry claim |
| 2 | Reveal results | Clear step label |
| 8 | Show each answer, rankings, and the final podium. | Registered results claim |
| 3 | Data and limits | Clear heading |
| 7 | Internet is required for a live room. | Registered limitation |
| 8 | There is no homework mode or analytics dashboard. | Registered limitation |
| 3 | Rooms are temporary. | Supported by registered expiry claim |
| 8 | Active rooms expire after two hours without activity. | Registered quantitative claim |
| 6 | Finished rooms expire after ten minutes. | Registered quantitative claim |
| 4 | Free live classroom quizzes. | Registered claim |
| 2 | No accounts. | Registered claim |
| 1 | Terms | Clear legal link |
| 5 | Built by Param Factory · [build] | Clear release identity |
| 8 | Open Quiz Arena — quizzes tested with 40 learners | Finding F-3-4 |
| 10 | Teachers and trainers run live quizzes tested with 40 learners. | Registered capacity claim |
| 8 | Each learner joins by code on a phone. | Registered mobile-entry claim |

### README

| Words | Exact copy | Audit |
| ---: | --- | --- |
| 3 | Open Quiz Arena | Clear product heading |
| 7 | Run one live quiz for your class. | Clear summary |
| 14 | Teachers and trainers create questions, share a six-digit room code, and reveal each result. | Finding F-1-28 for typed authoring; other parts registered |
| 8 | The live room is tested with 40 learners. | Registered capacity claim |
| 8 | Try the isolated sample at `/demo` or `/?demo=1`. | Registered demo claim |
| 9 | The sample uses preset learners and separate demo storage. | Registered demo claim |
| 6 | Reset demo removes that sample progress. | Registered demo claim |
| 10 | Start for real removes it and opens the quiz editor. | Registered demo claim; UI wording is F-3-15 |
| 2 | Run locally | Clear heading |
| 6 | Requirements: Rust stable and Node 22+. | Unlisted claim F-3-5 |
| 4 | Open `http://localhost:8080`. | Clear instruction |
| 4 | `PORT` defaults to `8080`. | Unlisted claim F-3-6 |
| 4 | `STATIC_DIR` defaults to `dist`. | Unlisted claim F-3-7 |
| 4 | `/health` returns the build identifier. | Unlisted claim F-3-8 |
| 1 | Test | Clear heading |
| 12 | Every public product claim and its command are listed in `.factory/claims.json`. | Finding F-3-14 |
| 7 | Run `npm run test:e2e` for browser checks. | Clear instruction |
| 9 | See `.factory/claims.json` for each public promise and its test. | Clear instruction, but registry is incomplete |
| 2 | CSV format | Clear heading |
| 9 | Use a header row with `question,answer1,answer2,correct`. | Covered by CSV import test |
| 7 | Optional columns are `answer3`, `answer4`, and `time`. | Unlisted claim F-3-9 |
| 8 | `correct` uses answer numbers starting at 1. | Unlisted claim F-3-10 |
| 5 | `time` accepts 5 to 120 seconds. | Unlisted claim F-3-11 |
| 1 | Deployment | Clear heading |
| 10 | Build the supplied Dockerfile with `BUILD_SHA` set to the source commit. | Clear deployment instruction |
| 10 | The container listens on `PORT` and serves `/health`. | Unlisted claim F-3-12 |
| 6 | Live rooms run in one process. | Unlisted claim F-3-13 |
| 10 | Deploy one warm replica until a shared room coordinator exists. | Clear deployment instruction |
| 3 | Privacy and terms | Clear heading |
| 9 | See `/privacy` and `/terms` in the running app. | Clear route instruction; links pass |
| 6 | Privacy requests go to `privacy@sociobot.in`. | Registered legal-contact claim |
| 1 | License | Clear heading |
| 1 | MIT. | Confirmed by repository license |
| 2 | See LICENSE. | Clear reference |

### Terminology

| Concept | Declared word | Actual result |
| --- | --- | --- |
| Person joining a quiz | learner | Landing/README comply; host/result UI regresses to “player” (F-1-71) |
| Person controlling a quiz | host | Consistent |
| Temporary live session | room | Consistent |
| Reusable authored content | quiz | Consistent |
| Sample experience | demo / sample data | Clear distinction |

## Demo and sandbox evidence

- `/demo` and `/?demo=1` both open directly on sample room `046610`, “Climate check,” with Maya, Ibrahim, and Lena already joined.
- The persistent banner says “Demo — sample data, nothing is saved” and provides **Reset demo** and **Start for real**.
- Completing the flow shows the answer, ranking, and podium. Banner **Reset demo** returns to the lobby and clears storage. **Start for real** opens `/create` and clears demo storage.
- The complete demo made only three same-origin GET requests: the document, one JS asset, and one CSS asset. It made no API or WebSocket request.
- Demo storage was limited to `localStorage` key `demo:open-quiz-arena:step`; session storage remained empty. Exiting to `/create` removed the demo key and did not create an `arena:` key.
- The final **Run the sample again** control fails as F-3-1 describes.

## Claim results

The repository was cloned locally to `/tmp/open-quiz-arena-review-3.yxQoTB` from commit `510725e8934b1b40e918f992e52f329955602a53`. Dependencies and the build were created inside that clone. Each command from `.factory/claims.json` was run separately with `BASE_URL=http://127.0.0.1:8080` against the clone’s server.

| Claim ID | Registered command result | Adequacy |
| --- | --- | --- |
| `demo-sandbox` | PASS, 1 test | Does not reach or test the dead podium replay action (F-3-1) |
| `no-accounts-and-free-access` | PASS, 1 test | Adequate for listed wording |
| `room-capacity-40` | PASS, 1 test | 40 joins and 40 live states asserted |
| `internet-required` | PASS, 1 test | Offline room creation reports an error |
| `no-homework-or-analytics` | PASS, 1 test | Routes and navigation checked |
| `six-digit-room-code` | PASS, 1 test | Create and join checked |
| `csv-import` | PASS, 1 test | Import passes; typed-authoring half is untested (F-1-28) |
| `quiz-share-link` | PASS, 1 test | Fresh fragment load checked |
| `mobile-nickname-entry` | PASS, 1 test | Entry passes; phone answering is untested (F-1-11) |
| `privacy-session-data` | PASS, 1 test | Session token and same-origin requests checked |
| `legal-operator-contact` | PASS, 1 test | Operator and mail link checked |
| `live-quiz-results` | PASS, 1 test | Eight questions and three isolated players complete |
| `temporary-room-expiry` | PASS, 1 Rust test | Both stated timeouts checked |
| `route-metadata-and-404` | PASS, 1 test | Named routes and true 404 checked |

All commands passed, so there is no mechanically failing registered claim command. The coverage and unlisted-claim findings above still leave untested public promises.

## Structure, navigation, accessibility, and identity

- `/`, `/demo`, `/?demo=1`, `/create`, `/play`, `/privacy`, `/terms`, and `/404` return 200. `/definitely-missing` returns a styled HTTP 404.
- Every inspected route has `lang=en`, one `<main>`, one `<h1>`, a description, canonical URL, OG title/image, SVG favicon, and 180×180 touch icon. The OG image is 1200×630.
- All discovered same-origin links return 200 except the deliberately missing page. The two `mailto:` links are explicit.
- Client navigation focuses the new h1 and resets scroll. Back restores the prior page and its scroll; Forward restores Privacy and focuses its h1.
- The static 404 has the normal header/footer, recovery links, external CSS permitted by CSP, and no console error.
- Live Axe checks across all public routes found zero serious or critical issues. Mobile target tests and 390 px overflow checks pass. `.factory/verify-url.sh` passes `/` and `/?demo=1`.
- Reduced-motion emulation matches and reduces transition/animation durations to `0.00001s`.
- The built JS is 31.42 kB raw / 10.29 kB gzip. The live cold landing requested only same-origin HTML, JS, and CSS and logged no console errors.
- The dark scoreboard, answer lanes, signal mark, tabular room code, and podium form a distinct product-specific identity rather than a generic SaaS template.
- The home-title exception is F-3-4; the desktop first-screen exception is F-3-3.

## Earlier-finding verification

Every earlier ID was checked against the current live site and source. “Fixed” means the original failure is absent now; reopened rows point to blocking findings above.

| Earlier ID | Round-3 result |
| --- | --- |
| F-1-1 | Fixed: both one-click demo URLs, banner, reset, exit, and isolated storage exist. |
| F-1-2 | Fixed as infrastructure: a 14-entry registry exists and every listed command passes; completeness gaps are separately reported. |
| F-1-3 | Fixed: unknown routes return a styled, console-clean HTTP 404. |
| F-1-4 | Fixed: account-free/free wording has a clean-context claim test. |
| F-1-5 | Fixed: the page states and tests 40 learners rather than an unbounded cap. |
| F-1-6 | Fixed: the unproved “4 or 400,” speed, and cap bundle is absent. |
| F-1-7 | Fixed: six-digit room creation and join pass. |
| F-1-8 | Fixed: reusable quiz-fragment behavior is plain and tested. |
| F-1-9 | Fixed: exact active and finished expiry times are stated and tested. |
| F-1-10 | Fixed for CSV import and error summary. |
| F-1-11 | **Reopened:** the phone-width test stops before answering. |
| F-1-12 | Fixed: answer, rankings, and podium complete in the tagged flow. |
| F-1-13 | **Reopened:** `/create` again says the browser keeps the draft without a registered pre-room storage/request test. |
| F-1-14 | Fixed: the absolute “nothing is uploaded” sentence remains absent. |
| F-1-15 | Fixed: deletion wording uses the tested timeouts. |
| F-1-16 | Fixed: vague nickname-deletion wording remains absent. |
| F-1-17 | Fixed: untested tracker/library absolutes remain absent. |
| F-1-18 | Fixed: privacy wording is narrowed to the registered room/session data. |
| F-1-19 | Fixed: active two-hour expiry passes. |
| F-1-20 | Fixed: finished ten-minute expiry passes. |
| F-1-21 | Fixed: database/backup absolutes remain absent. |
| F-1-22 | Fixed: current-session reconnect storage passes. |
| F-1-23 | Fixed: a fresh context has no old reconnect token. |
| F-1-24 | Fixed: a fresh fragment link reconstructs the quiz. |
| F-1-25 | Fixed: irrecoverability wording remains absent. |
| F-1-26 | Fixed: free access, operator, and contact are registered and checked. |
| F-1-27 | Fixed: README no longer promises unbounded “every learner.” |
| F-1-28 | **Reopened:** registered coverage imports CSV but never types a quiz. |
| F-1-29 | Fixed: phone-width code and nickname entry pass. |
| F-1-30 | Fixed: observable results replace scoring jargon and pass. |
| F-1-31 | Fixed: the bundled absence claim remains absent. |
| F-1-32 | Fixed: fragment-link behavior is explained and tested. |
| F-1-33 | Fixed: server-memory absolute remains absent from README. |
| F-1-34 | Fixed: the tagged flow completes eight questions with three contexts. |
| F-1-35 | Fixed: the broad test-coverage marketing sentence remains absent. |
| F-1-36 | Fixed: CSV errors are complete and focus receives the summary. |
| F-1-37 | Fixed: container secrecy/no-disk absolutes remain absent. |
| F-1-38 | Fixed as wording: the README now states a scoped deployment constraint. |
| F-1-39 | Fixed as wording: README gives the deployer a one-replica instruction. |
| F-1-40 | Fixed: the overlong multi-process failure prose remains absent. |
| F-1-41 | Fixed: both room timeouts share the registered expiry test. |
| F-1-42 | Fixed: “only learner-supplied/sanitized” wording remains absent. |
| F-1-43 | Fixed: reconnect-token session behavior is registered and checked. |
| F-1-44 | Fixed: operator and privacy contact are registered and checked. |
| F-1-45 | Fixed: route titles update; the new home-title wording issue is F-3-4. |
| F-1-46 | Fixed: route focus, announcement, scroll reset, Back, and Forward work. |
| F-1-47 | Fixed: canonical, OG/Twitter, sitemap, favicon, and touch icon exist. |
| F-1-48 | Fixed: normal header/footer and build ID appear on routes and true 404. |
| F-1-49 | Fixed as content: price/account/internet/limits exist; desktop placement is F-3-3. |
| F-1-50 | Fixed: the lane metaphor is absent. |
| F-1-51 | Fixed: the h1 states the job in seven words. |
| F-1-52 | Fixed: audience and phone outcome are explicit. |
| F-1-53 | Fixed: “Quiz-as-link” jargon is absent. |
| F-1-54 | Fixed: “Run a quiz in three steps” names the section. |
| F-1-55 | Fixed: “import a CSV file” is plain wording. |
| F-1-56 | Fixed: the footer uses product facts rather than a slogan. |
| F-1-57 | Fixed: “ephemeral” remains absent from README. |
| F-1-58 | Fixed: deterministic scoring jargon remains absent from README. |
| F-1-59 | Fixed: unexplained JSON wording remains absent from README. |
| F-1-60 | Fixed: unexplained server-memory wording remains absent from product summary. |
| F-1-61 | Fixed: “browser suite” and “host/player loop” marketing wording is absent. |
| F-1-62 | Fixed: “fixture” wording remains absent. |
| F-1-63 | Fixed: no copy-audited sentence exceeds 22 words. |
| F-1-64 | Fixed: “load smoke” wording remains absent. |
| F-1-65 | Fixed: answer numbering and time range are written plainly; their claim coverage is F-3-10/F-3-11. |
| F-1-66 | Fixed: keyboard-focusable jargon is absent and focus behavior passes. |
| F-1-67 | Fixed: process-local/ephemeral product-summary jargon is absent. |
| F-1-68 | Fixed: the 36-word scale warning is gone. |
| F-1-69 | Fixed: “learner-supplied/sanitized” jargon is absent. |
| F-1-70 | Fixed: the room-code action is “Enter nickname.” |
| F-1-71 | **Reopened:** real host/result UI still uses “player.” |
| F-1-72 | Fixed: Create and Join h1s name their tasks. |
| F-2-1 | Fixed: both demo entry URLs are exercised by the tagged test. |
| F-2-2 | Fixed in live behavior: Start for real clears sample state and opens `/create`; the prior claim of testing every phase was overstated. |
| F-2-3 | Fixed: README uses “separate demo storage” and “sample progress.” |
| F-2-4 | Fixed: the unregistered coverage list and its jargon are absent. |

## Quality-gate evidence

From the clean clone:

- `npm ci`: PASS, 61 packages, zero vulnerabilities.
- `npm run build`: PASS; `dist/` produced; JS 31.42 kB raw / 10.29 kB gzip.
- `npm test`: PASS; 3 Vitest and 12 Rust tests.
- All 14 registered claim commands run separately: PASS.
- `npm run test:e2e -- --retries=0`: PASS, 24/24.
- `cargo fmt --all -- --check`: PASS.
- `cargo clippy --all-targets --locked -- -D warnings`: PASS.
- Live route/Axe subset: PASS, 8/8.
- `.factory/verify-url.sh` for `/` and `/?demo=1`: PASS.
- `.factory/verification-browser.mjs`: **FAIL**, as F-3-2 describes.

## Missed leverage

No additional AI feature is justified. The brief explicitly excludes AI question generation, and the product already provides the implied useful import/share paths through CSV and reusable quiz links. No decorative AI or embedded provider key is present. A sync feature would conflict with the account-free, temporary-room scope.

## What would make this perfect

Repair and test the podium replay; complete the phone-answer, pre-room privacy, and typed-authoring claims; use “learner” throughout the live UI; restore the desktop first-screen facts; give the home route a job-naming title; register or remove every remaining README promise; rename **Start for real**; and make the bundled browser verifier reproducible. Re-run every claim command, the full suite, the verifier, and the live route audit after deployment. Only a zero-finding result should pass.
