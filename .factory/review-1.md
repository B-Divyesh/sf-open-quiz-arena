# Adversarial first-read review 1

## Verdict: **FAIL**

Reviewed `https://open-quiz-arena.sociobot.in` cold on 28 August 2026 in fresh Chromium contexts at 390×844 and 1440×900. The deployed `/health` identified build `6ff62a0b361ca7af34242c9598d1dc1bc8ffe9c0`.

The working quiz loop passes. Acceptance does not. There is no usable demo, no `.factory/claims.json`, and no real 404. Route titles, route focus, route scroll, metadata, required navigation, and substantial copy also fail the supplied product contract.

## Cold first screen

Before scrolling, I understood the product as follows on both viewports:

- **What it does:** runs a live classroom quiz with phone answers and a shared scoreboard.
- **For whom:** a teacher or trainer hosts it; learners join it. The copy says “classroom” but does not name teachers or trainers on the live first screen.
- **What to click first:** “Build a quiz” when hosting, or “Join a room” when given a code.

This is not a blocking comprehension failure: all three answers are inferable. At 390 px the headline, explanation, both actions, and three short facts appear before the preview begins at 816 px. At desktop width the sample scoreboard is visible beside the copy.

The first screen nevertheless misses the required shape. “Try it with sample data” is absent; “THE FREE LANE IS OPEN” is metaphor; “One live quiz. Everybody plays.” is a slogan rather than a job; the audience is implicit; and the three facts do not plainly state price, privacy, and the internet requirement.

## Findings

Findings are ordered by severity. Every unlisted claim has its own finding below.

### Blocking

#### F-1-1 — No one-click sandbox demo

- **Quote/location:** the first screen offers only “Build a quiz” and “Join a room.” `GET /demo` returns HTTP 200 but renders the ordinary landing page.
- **Evidence:** `/demo` has no demo banner, no “Reset demo,” no “Start for real,” no seeded live room, and no demo storage namespace. Its only apparent sample is the same static Earth-question illustration shown on `/`.
- **Why this fails:** a visitor cannot experience hosting, answering, scoring, or the leaderboard without authoring data and coordinating another browser. Nothing proves that demo activity is isolated from real room storage.
- **Concrete fix:** add a first-screen “Try it with sample data” action that opens `/demo` into a seeded host/player simulation already in use. Show “Demo — sample data, nothing is saved,” “Reset demo,” and “Start for real.” Use a separate `demo:` browser namespace or an ephemeral backend tenant, and document it in `.factory/demo.md`.

#### F-1-2 — The claim registry and all required claim tests are absent

- **Quote/location:** `.factory/claims.json` does not exist.
- **Why this fails:** there were zero listed claim commands to run. Passing general tests does not satisfy the one-test-per-claim contract, and there is no clean-demo entry point in which to verify privacy or persistence.
- **Concrete fix:** create `.factory/claims.json`; give every retained claim below one stable ID and one `@claim:<id>` test against `/demo`; remove claims that cannot be proved. Add an outgoing-request assertion for privacy claims and observable assertions rather than element-presence checks.

#### F-1-3 — Unknown routes silently become the homepage

- **Quote/location:** `https://open-quiz-arena.sociobot.in/definitely-missing`, `/sitemap.xml`, and `/apple-touch-icon.png` all return HTTP 200 HTML. The unknown route shows the home headline “One live quiz. Everybody plays.”
- **Why this fails:** visitors and crawlers cannot distinguish a mistyped URL from a valid page. This is broken routing, and there is no designed recovery path.
- **Concrete fix:** add a styled `/404` page with a home/demo action and configure the backend to return it with HTTP 404 for unknown paths. Serve real sitemap and icon assets rather than the SPA fallback.

### Major: unlisted claims

Each row is a separate unlisted-claim finding. The common failure is that no `.factory/claims.json` entry or tagged sandbox test exists.

| ID | Exact quote and location | Why a visitor could be misled | Concrete fix |
| --- | --- | --- | --- |
| F-1-4 | “No accounts.” — landing header | Account-free use is a core reliance claim. | Add a clean-context host/join test proving no sign-in, account cookie, or account request occurs. |
| F-1-5 | “No player cap.” — landing header; “Open Quiz Arena — live classroom quizzes without player caps” — document title | “No cap” is absolute and unbounded. | Either test the supported operating target and say “Tested with 400 players,” or define and test a truthful limit. |
| F-1-6 | “Run a fast classroom game for 4 or 400—no student accounts, no artificial cap, no quiz library left behind.” — landing hero | Speed, 400-player operation, account-free use, cap behavior, and storage are bundled without tests. Existing automated fan-out covers 40, not 400. | Split the sentence. Add separate tagged tests for 400 players, account-free entry, and quiz retention; remove “fast” or give a measured bound. |
| F-1-7 | “6-digit entry” — landing facts | The entry format is a functional promise. | Add a claim test that creates a room, asserts a six-digit code, and joins with it. |
| F-1-8 | “Quiz-as-link” — landing facts | The phrase implies a reusable share-link behavior without proof or explanation. | Rewrite to “Copy a link that contains your quiz” and test opening that link in a fresh context. |
| F-1-9 | “Auto-deleted rooms” — landing facts | No deletion interval is stated here and no claim test is registered. | State the active and finished intervals, then test both with a controllable clock or isolated TTL fixture. |
| F-1-10 | “Type questions or drop in a clean CSV.” — landing “How it runs” | CSV import is relied-on product behavior. | Add a demo CSV import claim that asserts the parsed questions and every invalid-row error. |
| F-1-11 | “Learners enter one nickname on any phone.” — landing “How it runs” | Phone compatibility and nickname-only entry are untested claims. | Test join and answer at 390 px from a fresh mobile context with only code and nickname. |
| F-1-12 | “You reveal every answer and the final podium.” — landing “How it runs” | This promises the central host flow. | Tag the existing eight-question host/player test and assert each reveal plus the final podium. |
| F-1-13 | “Questions stay in this browser until you start a live room or copy a share link.” — `/create` | This is a privacy/storage assertion. | Record requests while editing and copying; assert no quiz content leaves the origin before room creation. |
| F-1-14 | “Nothing is uploaded until you open a room.” — `/create` | This is an explicit network privacy claim. | Add a Playwright request-body log covering the entire editor flow before room creation. |
| F-1-15 | “Live room data is automatically erased.” — `/create` | “Automatically” omits timing and proof. | Replace it with the two exact retention periods and add tagged TTL tests. |
| F-1-16 | “We discard it when the room expires.” — nickname screen | Learners are asked to trust nickname deletion. | Test that the room and nickname are unavailable after expiry. |
| F-1-17 | “It does not create accounts, use trackers, or keep a quiz library.” — `/privacy` | Three privacy promises are unregistered. | Split and test account-free flow, whole-flow outgoing requests, cookies/storage, and share-link behavior. |
| F-1-18 | “We process quiz content, a moderated nickname, answers, score, and random session tokens only to run the requested live room.” — `/privacy` | “Only” is an exhaustive data-use claim. | Add a full demo request/storage inventory test or narrow the wording to what the test can observe. |
| F-1-19 | “Active rooms expire after two hours without activity.” — `/privacy` | This is a quantitative retention promise. | Add `@claim:active-room-expiry` with a controllable clock and observable 404 after expiry. |
| F-1-20 | “Finished rooms expire after ten minutes.” — `/privacy` | This is a quantitative retention promise. | Add `@claim:finished-room-expiry`; the historical live probe can inform the assertion but is not a registered claim test. |
| F-1-21 | “Room data stays in server memory and is not written to an application database or backup.” — `/privacy` | The storage-location and no-backup claims affect privacy decisions. | Add an architecture/storage test where feasible; otherwise remove the unprovable “or backup” statement. |
| F-1-22 | “Your browser temporarily stores random reconnect tokens in session storage.” — `/privacy` | This is directly observable storage behavior. | Test exact session-storage keys and values during host and player reconnect flows. |
| F-1-23 | “Closing the tab or browser session clears them.” — `/privacy` | This promises deletion on close. | Test a new browser context after closing the old one and assert no reconnect token remains. |
| F-1-24 | “Quiz share links contain the quiz itself in the URL fragment; the fragment is not sent to our server until you choose to open a room.” — `/privacy` | This is a precise privacy and transport promise. | Capture requests while opening a share link, assert the fragment is absent from requests, then assert the quiz is sent only on room creation. |
| F-1-25 | “Once its short retention window ends, the room cannot be recovered.” — `/privacy` | Irrecoverability is stronger than expiry. | Test all read/reconnect paths after expiry and remove “cannot be recovered” unless backups/logs are also covered. |
| F-1-26 | “Open Quiz Arena is a free live facilitation tool operated by Sociobot.” — `/terms` | “Free” and operator identity are reliance claims. | Register an access/payment test and an operator/contact content test. |
| F-1-27 | “Open Quiz Arena is an account-free live classroom quiz for teachers and trainers who need every learner in the same game.” — README; “Run an account-free live classroom quiz with every learner in one room.” — meta description | “Account-free” and “every learner” repeat absolute capability claims. | Rewrite with a tested player count and link to the corresponding account-free and load claim tests. |
| F-1-28 | “A host types questions or imports CSV, opens an ephemeral six-digit room, and controls each reveal.” — README | This promises the whole authoring/room/reveal path. | Add a tagged end-to-end claim covering typed and imported quizzes, room creation, and reveal control. |
| F-1-29 | “Learners join from a phone with only a moderated nickname.” — README | Mobile, minimal-input, and moderation behavior are bundled. | Split and test mobile join plus the documented moderation cases. |
| F-1-30 | “Correct answers earn deterministic speed-weighted points; every round ends with a leaderboard and the game ends on a podium.” — README | Scoring and results are relied-on game rules. | Add a fixed-clock scoring test and a browser test for every leaderboard and final podium. |
| F-1-31 | “There are no accounts, persistent quiz library, analytics, trackers, payments, homework mode, or paid player cap.” — README | Seven absence claims are bundled and unregistered. | Split user-relevant facts; test network/storage/payment surfaces and remove any assertion that cannot be observed. |
| F-1-32 | “Quiz share links store the quiz JSON in the URL fragment.” — README | This is a testable share-link implementation promise. | Add a round-trip encode/open claim with Unicode and quoted text. |
| F-1-33 | “Live room state exists only in server memory and expires automatically.” — README | Storage scope and expiry are both privacy claims. | Split into two claims and test each; remove “only” if infrastructure logs/backups are out of scope. |
| F-1-34 | “The end-to-end fixture imports and completes eight questions with three independently isolated players.” — README | The README promises a specific verifier behavior, but it is not in the claim registry. | Tag the test and assert the eight questions, three contexts, scores, and finish state. |
| F-1-35 | “The server test suite covers room lifecycle, unique codes, validation/limits, idempotent scoring, deterministic speed scores, reconnect tokens, host authorization, nickname sanitization, and expiry purge.” — README | This is a broad test-coverage claim and exceeds 22 words. | Split it and link each retained behavior to a named test or claim ID. |
| F-1-36 | “The importer supports quoted commas and reports every row error in a keyboard-focusable error summary.” — README | Parser and accessibility behavior are product promises. | Add a tagged import test with several bad rows and assert focus plus the complete error list. |
| F-1-37 | “The runtime uses UID/GID 10001, contains no secrets, and writes no room data to disk.” — README | “Contains no secrets” and no-disk persistence are security/privacy claims. | Add container/static inspection to a claim test or remove the absolute “contains no secrets.” |
| F-1-38 | “Live rooms and WebSocket fan-out are deliberately process-local and ephemeral.” — README | This describes a critical operating constraint. | Add a topology/configuration test or replace the claim with a clearly scoped deployment requirement. |
| F-1-39 | “Until a shared ephemeral room coordinator (including cross-process pub/sub) exists, run exactly one replica: `minReplicas=1` and `maxReplicas=1`.” — README | Availability depends on an external configuration that this repository does not test. | Add a deployment verification claim or state that the deployer must verify these values. |
| F-1-40 | “Do not use a scale-to-zero or `0..3` deployment helper, load balancing, or an autoscaler for this service; any second process will not know rooms created by the first and valid joins/actions can return 404.” — README | This predicts a concrete failure mode and exceeds 22 words. | Split it into short requirements and add a multi-process regression test. |
| F-1-41 | “Rooms expire after two idle hours; finished rooms expire after ten minutes.” — README | Both quantitative retention claims are duplicated outside the registry. | Reuse two tagged TTL claims and reference their IDs from the README. |
| F-1-42 | “The only learner-supplied value is a sanitized nickname.” — README | “Only” and “sanitized” are privacy/safety claims. | Test the join payload/storage inventory and moderation cases; use “filtered nickname” in plain copy. |
| F-1-43 | “Random host/player tokens live in browser session storage to enable reconnect.” — README | Storage and reconnect behavior are both testable. | Add a fresh-context storage/reconnect claim with exact key assertions. |
| F-1-44 | “Sociobot operates the public service; privacy requests can be sent to `privacy@sociobot.in`.” — README | Visitors rely on the operator and contact route. | Add a legal-page/contact-link content test to the registry. |

### Major: structure and navigation

#### F-1-45 — Every route keeps the home title

- **Quote/location:** `/`, `/demo`, `/create`, `/play`, `/privacy`, `/terms`, and the unknown route all use “Open Quiz Arena — live classroom quizzes without player caps.”
- **Why this fails:** history entries and assistive-technology announcements do not identify the current page.
- **Concrete fix:** set route-specific titles such as “Create a quiz — Open Quiz Arena,” “Join a quiz — Open Quiz Arena,” “Privacy — Open Quiz Arena,” “Terms — Open Quiz Arena,” “Demo — Open Quiz Arena,” and “Page not found — Open Quiz Arena.”

#### F-1-46 — SPA navigation preserves stale scroll and does not focus or announce the new page

- **Evidence/location:** after scrolling `/` to `y=1584` and activating the footer Privacy link, `/privacy` opened at `y=872`; `document.activeElement` was `BODY`. Clicking “Build a quiz” and using Back also left focus on `BODY`. `navigate()` only calls `pushState()` and `route()`; there is no route live region.
- **Why this fails:** mobile visitors can arrive in the middle of a new page, and screen-reader users receive no reliable route-change cue.
- **Concrete fix:** on every client route change, move to the top, focus the new `<h1>` or `<main>`, update the title, and announce the route through a persistent `aria-live="polite"` region. Preserve meaningful scroll only for browser Back/Forward.

#### F-1-47 — Required discovery and sharing metadata is missing

- **Quote/location:** the live `<head>` has a description and SVG favicon, but no canonical link, Open Graph fields, Twitter card, 1200×630 product image, or apple-touch icon. `/sitemap.xml` and `/apple-touch-icon.png` return the homepage HTML.
- **Why this fails:** shared links have no product-specific preview, canonical URLs are undefined, and install/bookmark surfaces get an invalid icon response.
- **Concrete fix:** add route-aware canonical metadata, OG/Twitter metadata with original 1200×630 art, a real 180 px apple-touch icon, and a sitemap listing every real route.

#### F-1-48 — Header and footer do not implement the required site skeleton

- **Quote/location:** the header contains only the wordmark and “No accounts. No player cap.” There is no header `<nav>` or Demo link. The footer says “Built for the whole room.” and has Privacy/Terms, but omits the product one-line description, “Built by Param Factory,” and version/build ID.
- **Why this fails:** visitors cannot discover the demo or legal pages from the consistent top navigation, and the release identity is absent from the page.
- **Concrete fix:** use the same header on every route with wordmark, Demo, Create, Join, and Privacy links; use the same footer with a literal product description, Privacy, Terms, Param Factory attribution, and build ID.

#### F-1-49 — The landing skeleton omits required plain facts and a privacy/limits section

- **Quote/location:** facts are “6-DIGIT ENTRY,” “QUIZ-AS-LINK,” and “AUTO-DELETED ROOMS.” The only section after the preview is “HOW IT RUNS.”
- **Why this fails:** price is implied by metaphor, offline behavior is unstated, and privacy/limitations require leaving the landing page.
- **Concrete fix:** show three literal facts such as “Free,” “No accounts,” and “Internet required.” Add a section named “Data and limits” that states room retention, live-internet dependency, lack of homework/analytics, and the one-replica operating constraint where relevant.

### Minor: copy and terminology

#### F-1-50 — “THE FREE LANE IS OPEN” is metaphor

Replace it with “Free live classroom quiz.”

#### F-1-51 — “One live quiz. Everybody plays.” is a slogan, not the job

Replace the `<h1>` with “Run a live classroom quiz for everyone.”

#### F-1-52 — The hero explanation mixes marketing and metaphor

- **Quote:** “Run a fast classroom game for 4 or 400—no student accounts, no artificial cap, no quiz library left behind.”
- **Why:** “fast,” “artificial,” and “left behind” do not give separately testable facts; the sentence also changes “learners” to “students.”
- **Rewrite:** “Teachers and trainers host. Learners join by code and answer on their phones.” Put tested count, price, and storage facts on separate lines.

#### F-1-53 — “Quiz-as-link” is unexplained jargon

Replace it with “Copy a link that contains your quiz.”

#### F-1-54 — “From blank page to full-room energy in three moves.” is a mood heading

Replace it with “Run a quiz in three steps.”

#### F-1-55 — “drop in a clean CSV” is idiomatic and “clean” is undefined

Replace “Type questions or drop in a clean CSV.” with “Type questions or import a CSV file.”

#### F-1-56 — “Built for the whole room.” is a reusable slogan

Replace it with the product fact “Free live classroom quizzes. No accounts.”

#### F-1-57 — README uses “ephemeral” for ordinary temporary rooms

Replace “opens an ephemeral six-digit room” with “opens a temporary six-digit room.”

#### F-1-58 — README uses “deterministic speed-weighted points”

Replace the sentence with: “Correct answers score more when submitted sooner. Each round shows rankings, and the quiz ends with the top three.”

#### F-1-59 — README exposes implementation jargon in the product summary

Replace “Quiz share links store the quiz JSON in the URL fragment.” with “A reusable link contains the quiz, so the server does not need a saved quiz library.”

#### F-1-60 — README says “server memory” without explaining the outcome

Replace “Live room state exists only in server memory and expires automatically.” with “The server deletes temporary room data after the stated timeout.”

#### F-1-61 — README test-stack bullet says “multi-browser live loop”

Replace it with “Tests cover CSV and share links, server routes, and the live quiz flow in several browsers.”

#### F-1-62 — README says “end-to-end fixture”

Replace it with “The browser test imports eight questions and completes a quiz with three separate players.”

#### F-1-63 — README test-coverage sentence is 25 words and jargon-heavy

Split it into: “Server tests cover room creation, limits, scoring, reconnects, host access, nickname filtering, and deletion. They confirm that repeated answers do not change scores.”

#### F-1-64 — README says “basic load smoke”

Replace it with “To check basic server capacity against a running instance:”

#### F-1-65 — README says “one-based answer number”

Replace it with “`correct` uses answer numbers starting at 1. `time` accepts 5 to 120 seconds.”

#### F-1-66 — README says “keyboard-focusable error summary”

Replace it with “The importer reads quoted commas and lists every row error. Keyboard focus moves to the error list.”

#### F-1-67 — README says “process-local and ephemeral”

Replace it with “Live rooms and WebSocket updates exist only inside one running server process.”

#### F-1-68 — The scale warning is 36 words

Split it into: “Do not scale this service to zero or run more than one process. A second process cannot read rooms created by the first, so valid actions may return 404.”

#### F-1-69 — README says “learner-supplied” and “sanitized”

Replace it with “Learners provide only a nickname. The service filters unsafe nickname text.”

#### F-1-70 — “Continue” does not name its result

- **Location:** `/play` room-code form.
- **Concrete fix:** rename it “Enter nickname.”

#### F-1-71 — The same person is called a student, learner, and player

- **Locations:** hero says “student,” steps and README say “learner,” the preview says “PLAYING,” and the code-entry eyebrow says “Player entry.”
- **Concrete fix:** use “learner” in public instructional copy and reserve `player` for code/API identifiers only.

#### F-1-72 — Route headings use arena/board lore instead of naming the task

- **Quotes:** “Enter the arena.” on `/play`; “Build tonight’s board.” on `/create`.
- **Concrete fix:** use “Enter your room code” and “Create a live quiz.”

## Copy audit

Counts use letter/number word tokens; hyphenated compounds count as one. Commands and code blocks are not sentences. Headings, labels, and fragments are included so the audit does not hide non-sentence copy. “Clean” means no length, jargon, metaphor, terminology, or action-label flag; unlisted claims are recorded separately above.

### Landing page

| # | Words | Exact copy | Audit |
| ---: | ---: | --- | --- |
| 1 | 3 | Open Quiz Arena | Clean brand name |
| 2 | 2 | No accounts. | Unlisted claim F-1-4 |
| 3 | 3 | No player cap. | Unlisted claim F-1-5 |
| 4 | 5 | The free lane is open | Flag F-1-50 |
| 5 | 3 | One live quiz. | Flag F-1-51 |
| 6 | 2 | Everybody plays. | Flag F-1-51 |
| 7 | 20 | Run a fast classroom game for 4 or 400—no student accounts, no artificial cap, no quiz library left behind. | Flags F-1-6, F-1-52, F-1-71 |
| 8 | 3 | Build a quiz | Clean result-naming action |
| 9 | 3 | Join a room | Clean result-naming action |
| 10 | 2 | 6-digit entry | Unlisted claim F-1-7 |
| 11 | 1 | Quiz-as-link | Flags F-1-8, F-1-53 |
| 12 | 2 | Auto-deleted rooms | Unlisted claim F-1-9 |
| 13 | 4 | Live · Q 4/8 | Clean sample status |
| 14 | 2 | 27 playing | Clean sample status |
| 15 | 8 | Which layer of Earth moves beneath the crust? | Clean sample question |
| 16 | 2 | Inner core | Clean sample answer |
| 17 | 1 | Mantle | Clean sample answer |
| 18 | 2 | Outer core | Clean sample answer |
| 19 | 1 | Atmosphere | Clean sample answer |
| 20 | 3 | How it runs | Clean section label |
| 21 | 9 | From blank page to full-room energy in three moves. | Flag F-1-54 |
| 22 | 3 | Build or import | Clean heading |
| 23 | 8 | Type questions or drop in a clean CSV. | Flags F-1-10, F-1-55 |
| 24 | 4 | Put up the code | Clean heading |
| 25 | 7 | Learners enter one nickname on any phone. | Unlisted claim F-1-11 |
| 26 | 3 | Control the pace | Clean heading |
| 27 | 8 | You reveal every answer and the final podium. | Unlisted claim F-1-12 |
| 28 | 5 | Built for the whole room. | Flag F-1-56 |
| 29 | 1 | Privacy | Clean link |
| 30 | 1 | Terms | Clean link |

No landing copy unit exceeds 22 words.

### README

| # | Words | Exact copy | Audit |
| ---: | ---: | --- | --- |
| 1 | 3 | Open Quiz Arena | Clean heading |
| 2 | 21 | Open Quiz Arena is an account-free live classroom quiz for teachers and trainers who need every learner in the same game. | Unlisted claim F-1-27 |
| 3 | 16 | A host types questions or imports CSV, opens an ephemeral six-digit room, and controls each reveal. | Flags F-1-28, F-1-57 |
| 4 | 10 | Learners join from a phone with only a moderated nickname. | Unlisted claim F-1-29 |
| 5 | 19 | Correct answers earn deterministic speed-weighted points; every round ends with a leaderboard and the game ends on a podium. | Flags F-1-30, F-1-58 |
| 6 | 16 | There are no accounts, persistent quiz library, analytics, trackers, payments, homework mode, or paid player cap. | Unlisted claim F-1-31 |
| 7 | 11 | Quiz share links store the quiz JSON in the URL fragment. | Flags F-1-32, F-1-59 |
| 8 | 11 | Live room state exists only in server memory and expires automatically. | Flags F-1-33, F-1-60 |
| 9 | 1 | Stack | Clean heading |
| 10 | 9 | Rust 2021, Axum, Tokio, WebSockets, and in-memory room state | Appropriate stack terms |
| 11 | 7 | Vite with strict, framework-free TypeScript and CSS | Appropriate stack terms |
| 12 | 16 | Vitest for CSV/share-link utilities, Rust unit and route tests, Playwright for the multi-browser live loop | Flag F-1-61 |
| 13 | 5 | A non-root, multi-stage Alpine container | Appropriate container terms |
| 14 | 2 | Run locally | Clean heading |
| 15 | 7 | Requirements: Rust 1.85+ and Node 22+. | Clean requirement |
| 16 | 4 | Open `http://localhost:8080`. | Clean instruction |
| 17 | 9 | `PORT` defaults to `8080`; `STATIC_DIR` defaults to `dist`. | Clean configuration sentence |
| 18 | 20 | Set `BUILD_SHA` to the full accepted commit SHA in the running environment; `/health` returns it as `{"status":"ok","build":"…"}`. | Technical but usable |
| 19 | 15 | The compiled value is only a fallback for local/container runs without a runtime value. | Technical but usable |
| 20 | 15 | For split frontend/backend development, run `cargo run` and `npm run dev` in separate terminals. | Clean instruction |
| 21 | 9 | Vite proxies API and WebSocket traffic to port 8080. | Technical but usable |
| 22 | 1 | Verify | Clean heading |
| 23 | 13 | The end-to-end fixture imports and completes eight questions with three independently isolated players. | Flags F-1-34, F-1-62 |
| 24 | 25 | The server test suite covers room lifecycle, unique codes, validation/limits, idempotent scoring, deterministic speed scores, reconnect tokens, host authorization, nickname sanitization, and expiry purge. | **Over 22**; flags F-1-35, F-1-63 |
| 25 | 9 | For a basic load smoke against a running instance: | Flag F-1-64 |
| 26 | 2 | CSV format | Clean heading |
| 27 | 9 | Use a header row containing `question,answer1,answer2,correct`. | Clean instruction |
| 28 | 7 | Optional columns are `answer3`, `answer4`, and `time`. | Clean instruction |
| 29 | 12 | `correct` is a one-based answer number and `time` is 5–120 seconds. | Flag F-1-65 |
| 30 | 15 | The importer supports quoted commas and reports every row error in a keyboard-focusable error summary. | Flags F-1-36, F-1-66 |
| 31 | 1 | Container | Clean heading |
| 32 | 16 | The runtime uses UID/GID 10001, contains no secrets, and writes no room data to disk. | Unlisted claim F-1-37 |
| 33 | 10 | Deployment infrastructure, DNS, and billing are intentionally outside this repository. | Clean scope statement |
| 34 | 3 | Required deployment topology | Clean heading |
| 35 | 10 | Live rooms and WebSocket fan-out are deliberately process-local and ephemeral. | Flags F-1-38, F-1-67 |
| 36 | 20 | Until a shared ephemeral room coordinator (including cross-process pub/sub) exists, run exactly one replica: `minReplicas=1` and `maxReplicas=1`. | Unlisted claim F-1-39; jargon |
| 37 | 36 | Do not use a scale-to-zero or `0..3` deployment helper, load balancing, or an autoscaler for this service; any second process will not know rooms created by the first and valid joins/actions can return 404. | **Over 22**; flags F-1-40, F-1-68 |
| 38 | 21 | For every deployment, inject `BUILD_SHA` with the full commit SHA of the image being deployed and confirm it through `/health`. | Clean deployment instruction |
| 39 | 11 | The factory controller owns deployment; this repository must not deploy itself. | Clean scope statement |
| 40 | 4 | Privacy and operating model | Clean heading |
| 41 | 12 | Rooms expire after two idle hours; finished rooms expire after ten minutes. | Unlisted claim F-1-41 |
| 42 | 8 | The only learner-supplied value is a sanitized nickname. | Flags F-1-42, F-1-69 |
| 43 | 12 | Random host/player tokens live in browser session storage to enable reconnect. | Unlisted claim F-1-43 |
| 44 | 14 | Sociobot operates the public service; privacy requests can be sent to `privacy@sociobot.in`. | Unlisted claim F-1-44 |
| 45 | 8 | See `/privacy` and `/terms` in the running app. | Clean instruction; links were live |
| 46 | 1 | License | Clean heading |
| 47 | 1 | MIT. | Clean statement |
| 48 | 2 | See `LICENSE`. | Clean instruction |

The two README units over 22 words are findings F-1-63 and F-1-68.

## Demo and sandbox result

**BLOCKING FAIL.** No demo exists. `/demo` is an unrecognized SPA path that renders `/`. It creates no room, contains no seeded interactive data, and shows no demo controls or persistence notice. Local storage and session storage happened to be empty because no demo behavior ran; that is not proof of isolation. The demo privacy/request-log requirement is therefore untestable.

For the ordinary landing and policy routes, Playwright recorded only same-origin HTML, JS, and CSS requests. No cookies, third-party requests, console errors, or Axe violations were observed. This limited result does not substitute for a whole demo-flow privacy test.

## Claims and test execution

There were **zero listed claim tests** because `.factory/claims.json` is missing. Therefore no claim is accepted as verified, even where general tests happen to exercise similar behavior.

Other evidence collected from the clean dependency install:

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 60 packages, 0 audit vulnerabilities |
| `npm test` | PASS; 3 Vitest and 12 Rust tests |
| `npm run build` | PASS; `dist/` created; JS 24,308 bytes raw / 8,819 bytes gzip |
| `npm run test:e2e` | PASS; 7 local Playwright tests |
| `BASE_URL=https://open-quiz-arena.sociobot.in npm run test:e2e` | PASS; 7 deployed Playwright tests |
| `node .factory/verification-live.mjs` | PASS; eight-question lifecycle and 40-player fan-out in 393 ms |
| Fresh 390 px and desktop route audit | PASS for one `<main>`, one `<h1>`, `lang=en`, no overflow, no console errors, and zero Axe violations |

These suites are not tagged one-per-claim, do not enter a demo, and do not verify the advertised 400-player case.

## Route, link, accessibility, and identity checks

- Root title is exactly 60 characters and follows the requested “Product — what it does” pattern. Route-specific titles fail under F-1-45.
- Every audited route has one `<h1>`, one `<main>`, and `lang="en"`.
- The meta description and SVG favicon exist. Canonical, OG, Twitter, social image, apple-touch icon, and real sitemap are absent.
- Every actual rendered HTTP link returned 200; mail links are explicit. There were no dead rendered links.
- `/create`, `/play`, `/privacy`, and `/terms` deep links render the intended state. Browser Back changes the route, but focus and scroll handling fail under F-1-46.
- The visual identity is distinct: dark scoreboard grid, lime/cyan/coral answer lanes, signal mark, large tabular room codes, and podium geometry match `.factory/design.md`. It does not look like a generic gradient SaaS template.
- Touch targets, visible focus styles, reduced motion, contrast/Axe checks, and the tested keyboard paths pass. The route-change focus failure remains.

## History verification

There were no earlier `.factory/review-*.md` or `.factory/polish-*.md` files. The earlier handoff reported the fixes from `.factory/verification.md`; I rechecked those rather than trusting the status labels.

| Earlier issue | Live/code confirmation | Result |
| --- | --- | --- |
| Multi-replica room split | Live eight-question and 40-player runs completed without 404/WebSocket loss; README still mandates one replica. | Fixed in the observed deployment; operating constraint remains. |
| Missing build identity | `/health` returned full build `6ff62a0b…`. | Fixed |
| Nickname moderation bypass | Current regression test covers split/homoglyph profanity and hostile markup; deployed Playwright suite passed. | Fixed |
| Undersized mobile brand/footer/legal targets | Deployed mobile target-size tests passed. | Fixed |
| Missing operator/contact | `/privacy` names Sociobot and links `privacy@sociobot.in`. | Fixed |
| Missing HSTS | Live responses include `strict-transport-security: max-age=31536000; includeSubDomains`. | Fixed |
| Malformed favicon | `/favicon.svg` returns valid SVG content. | Fixed |
| Invalid robots response | `/robots.txt` returns `text/plain` with `User-agent: *` and `Allow: /`. | Fixed |

None of those earlier defects is reopened. The current findings concern requirements that the prior verification did not audit.

## Missed leverage

No additional AI feature is justified. The brief explicitly excludes AI question generation, and adding it would make a simple classroom tool less honest. CSV import and reusable quiz links—the obvious non-AI leverage—already exist. Export is described in the brief as an optional later host-pack feature, not part of the smallest useful product. The missing leverage is the required sample-data demo already captured in F-1-1.

## What would make this perfect

Nothing less than zero open findings: ship the isolated seeded demo, register and test or remove every claim, return a designed 404, fix route title/focus/scroll/announcements, add complete metadata and site navigation, then replace every flagged metaphor, jargon term, long sentence, inconsistent term, and vague action. Re-run this entire review cold at 390 px and desktop; do not accept a partial finding count.
