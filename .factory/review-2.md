# Adversarial first-read review 2

## Verdict: **FAIL**

Reviewed the deployed build `21b241637d28cf177046f00f6bbb1be4f72cf7ba` on 28 August 2026. This was a cold Chromium review at 390×844 and 1440×900, followed by a clean-clone claim run, a live demo/storage/request audit, route crawl, metadata check, and Axe check.

There are two blocking regressions or omissions. The missing-page response is visibly unstyled and logs a CSP error. More importantly, the product's defining no-player-cap outcome is neither stated nor tested, so a visitor cannot tell that it solves the stated classroom problem. There are also untested README promises and one plain-language issue.

## Cold first screen

Before scrolling, at both sizes, I understood:

- **What it does:** run a live classroom quiz with a host screen and phone answers.
- **For whom:** teachers and trainers host; learners join by room code.
- **What to click first:** **Try it with sample data** to open a host screen with joined learners.

This is not a comprehension blocker. The phone view keeps the headline, audience sentence, primary action, action outcome, and the three facts in the initial viewport. The normal landing identity is distinct: it uses an original dark scoreboard/answer-lane system rather than a generic SaaS hero.

## Findings

### Blocking

#### F-1-3 (reopened) — The real 404 is unstyled and logs a CSP error

- **Exact location:** `GET /definitely-missing` returns `404` with `Content-Security-Policy: ... style-src 'self' ...`; its body in `src-web/public/404.html` contains the inline `<style>body{margin:0;...}</style>` block.
- **Live evidence:** Chromium logs `Applying inline style violates the following Content Security Policy directive 'style-src 'self''`. The 390 px result is browser-default black serif text on a white page, with “Go homeTry the sample quiz” run together. It also has no header, footer, Privacy/Terms links, favicon, canonical link, description, or OG metadata.
- **Why this fails:** F-1-3 required a *styled* recovery page. A mistyped URL now reaches a 404 status, but it does not receive the product's visual system and emits a console error on load. This fails the CSP, console-cleanliness, designed-404, metadata, and consistent-header/footer checks.
- **Concrete fix:** move the 404 rules to a same-origin external stylesheet (or use a CSP hash), then make the static 404 include the same skip link, wordmark/header, Privacy/Terms footer, favicon, description, canonical, and OG/Twitter metadata as the rest of the site. Re-test `/definitely-missing` at 390 px and desktop with a console-error assertion.

#### F-1-5 (reopened) — The no-player-cap job is neither communicated nor proved

- **Exact location:** the landing's only capacity-related facts are “FREE”, “NO ACCOUNTS”, and “INTERNET REQUIRED”. There is no player-count capability or no-cap statement. `.factory/claims.json` has no capacity claim. The only capacity check is the untagged unit test `room_accepts_at_least_40_concurrent_learners` in `src/server.rs`.
- **Why this fails:** the researched job is a teacher who has outgrown a player cap. A cold visitor cannot tell that this product addresses that need, and there is no clean-demo claim test that proves the supported classroom size. Removing the original absolute wording avoided an unproven promise, but did not perform either repair requested for F-1-5: test a supported count or state and test a truthful limit.
- **Concrete fix:** state a measured, useful capability near the first action, for example “One room has been tested with 40 learners.” Add `room-capacity-40` to `claims.json` and a tagged clean demo/browser test that joins and receives live state for 40 isolated learners. Do not use an unbounded “no player cap” promise unless it has an honest, reproducible definition.

### Minor

#### F-2-1 — The documented `?demo=1` entry is not covered by its claim test

- **Exact quote/location:** README: “Try the isolated sample at `/demo` or `/?demo=1`.”
- **Why this fails:** the `demo-sandbox` test visits only `/demo`. The query-string entry is a documented verifier and visitor path, yet no registered test proves that it opens the isolated sample with the banner and reset behavior.
- **Concrete fix:** extend `@claim:demo-sandbox` to load `/?demo=1` in a fresh context and assert the sample host, banner, reset, `demo:` storage key, and same-origin-only requests.

#### F-2-2 — “Start for real” behavior is asserted in README but not in the demo claim test

- **Exact quote/location:** README: “Start for real clears it and opens the quiz editor.”
- **Why this fails:** the live behavior works in this review, but `@claim:demo-sandbox` only tests Reset demo. The documented deletion-and-navigation promise has no observable regression assertion.
- **Concrete fix:** in `@claim:demo-sandbox`, seed demo progress, activate **Start for real**, assert `/create`, assert no `demo:` key remains, and assert no real-room session key was added.

#### F-2-3 — README uses storage implementation jargon where a visitor needs a privacy outcome

- **Exact quote/location:** “It uses sample learners and a separate `demo:open-quiz-arena:*` browser-storage namespace. Reset demo clears that namespace.”
- **Why this fails:** “browser-storage namespace” is implementation jargon. It makes the important outcome—sample work stays separate—harder to scan.
- **Concrete fix:** replace with: “The sample uses preset learners and separate demo storage. Reset demo removes that sample progress.” Keep the exact key in `.factory/demo.md` for verifiers.

#### F-2-4 — README's test-coverage statement is an unregistered claim and uses test jargon

- **Exact quote/location:** “The browser suite covers CSV imports, quiz links, room entry, the full host/player loop, mobile layout, routing, metadata, privacy requests, and accessibility checks.”
- **Why this fails:** it promises broad coverage without a claim entry or test that checks the listed coverage. “Browser suite” and “host/player loop” are also jargon in user-facing documentation.
- **Concrete fix:** replace with two usable instructions: “Run `npm run test:e2e` for browser checks. See `.factory/claims.json` for each public promise and its test.” If the coverage list remains, add a narrowly scoped documentation-verification test or link each item to its claim ID.

## Demo, privacy, claims, and route evidence

- **Demo:** from a fresh live `/demo`, the first screen already showed room `046610`, Climate check, and Maya/Ibrahim/Lena joined. The persistent banner read “Demo — sample data, nothing is saved.” Completing the sample produced rankings and a podium. Reset removed `demo:open-quiz-arena:step`; Start for real opened `/create` with no demo or session keys.
- **Isolation/network:** the full demo flow made only same-origin GET requests for `/demo`, JS, and CSS; it made no room API or WebSocket request. Demo storage was limited to the `demo:` key while active. This confirms the live sandbox behavior, subject to the missing automated coverage in F-2-1 and F-2-2.
- **Claims:** in a clean clone at `21b2416`, `npm ci`, `npm test`, `npm run build`, and `cargo test --locked` passed. All 13 registered claim commands passed (the browser commands were also run against a separately started clean-clone server when avoiding repeated web-server startup): demo sandbox; free/account access; internet requirement; no homework/analytics; six-digit room code; CSV import; quiz link; mobile nickname entry; privacy session data; legal contact; live results; temporary expiry; and metadata/404 status.
- **Routes/links:** `/`, `/demo`, `/create`, `/play`, `/privacy`, `/terms`, and `/404` returned 200 with one h1, route title, description, canonical, OG data, favicon, header/footer, and no console errors. Their internal links and both mailto contacts resolved correctly. `/definitely-missing` returned HTTP 404, but fails as described in F-1-3.
- **Accessibility:** Axe found no serious or critical violations on the seven routes above, including the 404. This does not offset its CSP console error or missing site skeleton.
- **AI and leverage:** the brief explicitly excludes AI question generation. CSV import and reusable quiz links cover the useful import/share path; no decorative AI feature is present.

## Earlier-finding verification

The source and live site were checked again rather than accepting the prior closure labels. “Resolved” means the current live behavior and source match the earlier repair. F-1-3 and F-1-5 are reopened above.

| Earlier ID | Current verification |
| --- | --- |
| F-1-1 | Resolved: one-click seeded `/demo`, persistent banner, Reset, Start for real, and `demo:` storage. |
| F-1-2 | Resolved: claims registry exists and all listed commands passed from the clean clone. |
| F-1-3 | **Reopened:** 404 status is correct, but its styling is blocked by CSP. |
| F-1-4 | Resolved: account-free/free copy maps to a clean-context claim test. |
| F-1-5 | **Reopened:** capacity/no-cap outcome was removed instead of truthfully stated and tested. |
| F-1-6 | Resolved: unbounded speed/count copy is absent. |
| F-1-7 | Resolved: six-digit code claim and test exist. |
| F-1-8 | Resolved: reusable quiz-link behavior is plain and tested. |
| F-1-9 | Resolved: exact temporary-room times and expiry test exist. |
| F-1-10 | Resolved: CSV import copy and invalid-row test exist. |
| F-1-11 | Resolved: mobile nickname path has a 390 px test. |
| F-1-12 | Resolved: results/podium flow has an end-to-end claim test. |
| F-1-13 | Resolved: untested pre-room browser-storage claim is absent. |
| F-1-14 | Resolved: untested pre-room upload claim is absent. |
| F-1-15 | Resolved: deletion copy uses tested exact timeouts. |
| F-1-16 | Resolved: vague nickname-deletion assurance is absent. |
| F-1-17 | Resolved: tracker/library absolutes are absent; account-free is tested. |
| F-1-18 | Resolved: privacy copy is narrowed to tested room/session data. |
| F-1-19 | Resolved: active two-hour expiry is tested. |
| F-1-20 | Resolved: finished ten-minute expiry is tested. |
| F-1-21 | Resolved: database/backup absolute is absent. |
| F-1-22 | Resolved: current-session reconnect token is tested. |
| F-1-23 | Resolved: fresh-context session-token absence is tested. |
| F-1-24 | Resolved: reusable fragment behavior is tested. |
| F-1-25 | Resolved: irrecoverability claim is absent. |
| F-1-26 | Resolved: operator/contact copy has a legal-page test. |
| F-1-27 | Resolved: README no longer promises every learner/unbounded access. |
| F-1-28 | Resolved: author/import/room/reveal behaviors map to claim tests. |
| F-1-29 | Resolved: phone + nickname flow is tested. |
| F-1-30 | Resolved: observable results flow is tested without scoring jargon. |
| F-1-31 | Resolved: bundled absence claims are absent. |
| F-1-32 | Resolved: link behavior is explained and tested. |
| F-1-33 | Resolved: server-memory absolute is absent. |
| F-1-34 | Resolved: multi-player eight-question flow is tagged. |
| F-1-35 | Reopened in narrowed form as F-2-4: README still makes an unregistered test-coverage assertion. |
| F-1-36 | Resolved: import error summary is covered. |
| F-1-37 | Resolved: container-secrecy/no-disk absolutes are absent. |
| F-1-38 | Resolved: README gives a scoped one-process deployment requirement. |
| F-1-39 | Resolved: README gives a deployer action, not unsupported platform settings. |
| F-1-40 | Resolved: unsupported multi-process failure prose is absent. |
| F-1-41 | Resolved: timeout copy maps to the expiry test. |
| F-1-42 | Resolved: unsafe “only/sanitized” language is absent. |
| F-1-43 | Resolved: reconnect-token session behavior is tested. |
| F-1-44 | Resolved: operator/contact test exists. |
| F-1-45 | Resolved except the static missing-page metadata covered by reopened F-1-3. |
| F-1-46 | Resolved: client route changes focus the h1, announce, and restore history scroll. |
| F-1-47 | Resolved except the static missing-page metadata covered by reopened F-1-3. |
| F-1-48 | Resolved except the static missing-page header/footer covered by reopened F-1-3. |
| F-1-49 | Resolved: literal facts and Data and limits exist. |
| F-1-50 | Resolved: metaphorical lane heading is absent. |
| F-1-51 | Resolved: h1 names the job. |
| F-1-52 | Resolved: audience/outcome copy is plain. |
| F-1-53 | Resolved: unexplained quiz-as-link label is absent. |
| F-1-54 | Resolved: How it works heading names the section. |
| F-1-55 | Resolved: CSV import wording is plain. |
| F-1-56 | Resolved: footer gives a product fact. |
| F-1-57 | Resolved: README no longer uses “ephemeral.” |
| F-1-58 | Resolved: scoring jargon is absent from README. |
| F-1-59 | Resolved: JSON implementation prose is absent. |
| F-1-60 | Resolved: unexplained server-memory prose is absent. |
| F-1-61 | Reopened in narrowed form as F-2-4. |
| F-1-62 | Resolved: “fixture” wording is absent. |
| F-1-63 | Resolved: previous overlong coverage sentence is absent. |
| F-1-64 | Resolved: “load smoke” wording is absent. |
| F-1-65 | Resolved: CSV number/time wording is plain. |
| F-1-66 | Resolved: keyboard-focusable jargon is absent. |
| F-1-67 | Resolved: process-local/ephemeral summary copy is absent. |
| F-1-68 | Resolved: long scale warning is absent. |
| F-1-69 | Resolved: learner-supplied/sanitized wording is absent. |
| F-1-70 | Resolved: join action says “Enter nickname.” |
| F-1-71 | Resolved: public instruction copy uses learner. |
| F-1-72 | Resolved: create/join headings name their tasks. |

## Copy audit

Word counts use word/number tokens; the arrow is excluded. No landing or README sentence exceeds 22 words. “Flag” points to a finding above; all other entries are clear in their context. Navigation and one-word controls are included so the audit does not conceal label copy.

### Landing page

| Words | Copy | Result |
| ---: | --- | --- |
| 4 | Skip to main content | Clear action |
| 3 | Open Quiz Arena | Brand name |
| 1 | Demo / Create / Join / Privacy | Clear navigation labels |
| 4 | Free live classroom quiz | Clear label |
| 7 | Run a live classroom quiz for everyone. | Clear job headline; capacity omission is F-1-5 |
| 4 | Teachers and trainers host. | Clear audience |
| 9 | Learners join by code and answer on their phones. | Tested mobile entry |
| 5 | Try it with sample data | Clear primary action |
| 9 | Opens a sample host screen with learners already joined. | Clear outcome |
| 3 | Create a quiz / Join a room | Result-naming actions |
| 1 / 2 / 2 | Free / No accounts / Internet required | Tested facts |
| 4 | Live · Q 4/8 | Clearly marked illustrative status |
| 2 | 27 playing | Clearly marked illustrative status |
| 8 | Which layer of Earth moves beneath the crust? | Sample question |
| 1 / 1 / 1 / 1 | A / B / C / D | Answer letters |
| 2 / 1 / 2 / 1 | Inner core / Mantle / Outer core / Atmosphere | Sample answers |
| 4 | 01 / How it works | Clear section marker |
| 6 | Run a quiz in three steps. | Clear section heading |
| 3 / 7 | Create or import / Type questions or import a CSV file. | Clear; CSV claim |
| 3 / 7 | Share the code / Learners enter one nickname on their phones. | Clear; mobile-entry claim |
| 2 / 8 | Reveal results / Show each answer, rankings, and the final podium. | Clear; results claim |
| 3 | Data and limits | Clear section heading |
| 7 | Internet is required for a live room. | Tested limitation |
| 8 | There is no homework mode or analytics dashboard. | Tested limitation |
| 3 | Rooms are temporary. | Clear retention label |
| 8 | Active rooms expire after two hours without activity. | Tested retention |
| 6 | Finished rooms expire after ten minutes. | Tested retention |
| 4 | Free live classroom quizzes. | Tested footer fact |
| 2 | No accounts. | Tested footer fact |
| 1 / 1 | Privacy / Terms | Clear links |
| 5 | Built by Param Factory · 21b241637d28 | Clear attribution/build label |

### README

| Words | Copy | Result |
| ---: | --- | --- |
| 7 | Run a live classroom quiz for everyone. | Clear summary; capacity omission is F-1-5 |
| 14 | Teachers and trainers create questions, share a six-digit room code, and reveal each result. | Clear; relevant behaviors are claimed/tested |
| 8 | Learners join with a nickname on a phone. | Clear; mobile-entry claim |
| 8 | Try the isolated sample at `/demo` or `/?demo=1`. | Flag F-2-1 |
| 10 | It uses sample learners and a separate `demo:open-quiz-arena:*` browser-storage namespace. | Flag F-2-3 |
| 5 | Reset demo clears that namespace. | Flag F-2-3 |
| 10 | Start for real clears it and opens the quiz editor. | Flag F-2-2 |
| 6 | Requirements: Rust stable and Node 22+. | Clear developer prerequisite |
| 4 | Open `http://localhost:8080`. | Clear local action |
| 4 / 4 / 4 | `PORT` defaults to `8080`. / `STATIC_DIR` defaults to `dist`. / `/health` returns the build identifier. | Necessary configuration terms |
| 12 | Every public product claim and its command are listed in `.factory/claims.json`. | Clear registry instruction |
| 21 | The browser suite covers CSV imports, quiz links, room entry, the full host/player loop, mobile layout, routing, metadata, privacy requests, and accessibility checks. | Flag F-2-4 |
| 9 | Use a header row with `question,answer1,answer2,correct`. | Clear CSV instruction |
| 7 | Optional columns are `answer3`, `answer4`, and `time`. | Clear CSV instruction |
| 8 | `correct` uses answer numbers starting at 1. | Clear CSV instruction |
| 5 | `time` accepts 5 to 120 seconds. | Clear CSV instruction |
| 10 | Build the supplied Dockerfile with `BUILD_SHA` set to the source commit. | Clear deployment instruction |
| 10 | The container listens on `PORT` and serves `/health`. | Clear deployment instruction |
| 6 | Live rooms run in one process. | Scoped deployment statement |
| 10 | Deploy one warm replica until a shared room coordinator exists. | Clear deployment instruction |
| 9 | See `/privacy` and `/terms` in the running app. | Clear route instruction |
| 6 | Privacy requests go to `privacy@sociobot.in`. | Legal-contact claim |
| 4 | MIT. See LICENSE. | Clear license instruction |

## What would make this perfect

Serve a fully styled, console-clean 404 under the existing CSP; make the classroom-scale capability explicit and reproducibly test it; then close the three README documentation gaps. At that point the cold first screen, isolated demo, privacy behavior, route structure, and normal-page visual system are already close to the required standard.
