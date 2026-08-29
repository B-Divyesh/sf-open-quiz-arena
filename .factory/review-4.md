# Adversarial first-read review 4

## Verdict: **PASS**

No blocking, major, or minor findings remain. This review used the live service at `https://open-quiz-arena.sociobot.in` on 29 August 2026 and a fresh clone of commit `13fe244c04e48b0be06a42082564c0200599d8a4`.

## Cold first screen

At 390×844 and 1440×900, before scrolling, the page states:

> “Run one live quiz for your class.”
>
> “Teachers and trainers host. Learners join by code and answer on their phones.”
>
> “Try it with sample data” — “Opens a sample host screen with learners already joined.”

First-read interpretation: this is a free, account-free live quiz for teachers and trainers; a host creates or imports questions, learners join a code on phones, and the host reveals results. The first action to take is **Try it with sample data**. The four facts—free, no accounts, internet required, and tested with 40 learners—are visible without scrolling at both tested sizes. This satisfies the first-screen test.

The visual treatment is distinct: a dark scoreboard surface, sharp lane blocks, tabular game status, lime/coral/cyan signals, and an original three-bar mark. It does not read as a generic SaaS hero.

## Findings

None.

## Copy audit

All landing and README sentences/labels are listed below. Word counts include number tokens. No entry is over 22 words, uses a banned marketing adjective, relies on an unexplained metaphor, or uses an inconsistent product term. Buttons name their results. No rewrite is required.

### Landing page

| Words | Exact copy | Check |
| ---: | --- | --- |
| 4 | Skip to main content | Clear action |
| 3 | Open Quiz Arena | Product name |
| 1 each | Demo / Create / Join / Privacy | Clear navigation |
| 4 | Free live classroom quiz | Context |
| 7 | Run one live quiz for your class. | Plain job headline |
| 4 | Teachers and trainers host. | Audience |
| 9 | Learners join by code and answer on their phones. | Phone outcome |
| 5 | Try it with sample data | Result-naming primary action |
| 9 | Opens a sample host screen with learners already joined. | States click result |
| 1 / 2 / 2 / 7 | Free / No accounts / Internet required / Tested with 40 learners in one room | Tested facts |
| 3 / 3 | Create a quiz / Join a room | Result-naming secondary actions |
| 3 | Live · Q 4/8 | Labelled preview status |
| 2 | 27 playing | Labelled preview count |
| 8 | Which layer of Earth moves beneath the crust? | Realistic preview question |
| 2 / 1 / 2 / 1 | Inner core / Mantle / Outer core / Atmosphere | Preview answers |
| 3 | How it works | Section label |
| 6 | Run a quiz in three steps. | Section heading |
| 3 | Create or import | Step label |
| 8 | Type questions or import a CSV file. | Usable instruction |
| 3 | Share the code | Step label |
| 7 | Learners enter one nickname on their phones. | Usable instruction |
| 2 | Reveal results | Step label |
| 8 | Show each answer, rankings, and the final podium. | Usable instruction |
| 3 | Data and limits | Section heading |
| 7 | Internet is required for a live room. | Limit |
| 8 | There is no homework mode or analytics dashboard. | Limit |
| 3 | Rooms are temporary. | Retention introduction |
| 8 | Active rooms expire after two hours without activity. | Tested retention fact |
| 6 | Finished rooms expire after ten minutes. | Tested retention fact |
| 4 / 2 | Free live classroom quizzes. / No accounts. | Tested footer facts |
| 1 / 1 | Privacy / Terms | Legal links |
| 5 | Built by Param Factory · 13fe244c04e4 | Build identity |

### README

| Words | Exact sentence | Check |
| ---: | --- | --- |
| 7 | Run one live quiz for your class. | Product summary |
| 14 | Teachers and trainers create questions, share a six-digit room code, and reveal each result. | Tested workflow |
| 8 | The live room is tested with 40 learners. | Tested capacity |
| 8 | Try the isolated sample at `/demo` or `/?demo=1`. | Demo entry |
| 9 | The sample uses preset learners and separate demo storage. | Demo behaviour |
| 6 | Reset demo removes that sample progress. | Demo behaviour |
| 12 | Leave demo and create a quiz removes it and opens the quiz editor. | Demo behaviour |
| 10 | Build and test with Node 22 and current stable Rust. | Tested runtime |
| 4 | Open `http://localhost:8080`. | Local action |
| 16 | Without settings, the server uses port `8080`, serves `dist`, and returns a build identifier at `/health`. | Tested runtime |
| 12 | Every public product claim and its command are listed in `.factory/claims.json`. | Verification pointer |
| 7 | Run `npm run test:e2e` for browser checks. | Verification instruction |
| 9 | See `.factory/claims.json` for each public promise and its test. | Verification pointer |
| 9 | Use a header row with `question,answer1,answer2,correct`. | CSV instruction |
| 7 | CSV accepts `answer3`, `answer4`, and `time` columns. | Tested CSV format |
| 10 | CSV `correct` uses answer numbers from `1` to `4`. | Tested CSV format |
| 8 | CSV `time` accepts 5 to 120 seconds. | Tested CSV format |
| 10 | Build the supplied Dockerfile with `BUILD_SHA` set to the source commit. | Deployment instruction |
| 7 | The service accepts `PORT` and serves `/health`. | Tested runtime |
| 7 | Live rooms use the running server process. | Tested scope |
| 10 | Deploy one warm replica until a shared room coordinator exists. | Deployment instruction |
| 9 | See `/privacy` and `/terms` in the running app. | Legal-route instruction |
| 6 | Privacy requests go to `privacy@sociobot.in`. | Tested contact |
| 4 | MIT. See LICENSE. | License |

Terminology remains consistent: **host**, **learner**, **room**, **quiz**, and **demo**.

## Demo and sandbox

The primary action entered `/demo` in one click. Its first screen already showed the host product in use: room code `046610`, the `Climate check` sample, and Maya, Ibrahim, and Lena joined. It contained the persistent banner “Demo — sample data, nothing is saved,” **Reset demo**, and **Leave demo and create a quiz**.

I completed the sample question, answer selection, result, and podium; **Run the sample again** returned to the seeded lobby. **Reset demo** returned to the same state. Local storage was empty at reset/lobby, used only `demo:open-quiz-arena:step` while the sample progressed, and was cleared on reset and demo exit. The demo request log contained only same-origin document, JS, and CSS requests—no room API calls or WebSockets—so no real room or session storage was read or written. `/?demo=1` also entered the same sandbox directly.

## Claims

`.factory/claims.json` contains 23 claims. I ran each listed command separately from the fresh clone. Every command passed; source audit found exactly one `@claim:<id>` tag for every registry ID.

| Claim ID | Result |
| --- | --- |
| demo-sandbox | PASS |
| no-accounts-and-free-access | PASS |
| room-capacity-40 | PASS |
| internet-required | PASS |
| no-homework-or-analytics | PASS |
| six-digit-room-code | PASS |
| typed-questions | PASS |
| csv-import | PASS |
| csv-optional-columns | PASS |
| csv-answer-numbering | PASS |
| csv-time-range | PASS |
| quiz-share-link | PASS |
| mobile-nickname-entry | PASS |
| draft-in-browser | PASS |
| privacy-session-data | PASS |
| legal-operator-contact | PASS |
| live-quiz-results | PASS |
| temporary-room-expiry | PASS |
| single-process-room-state | PASS |
| runtime-toolchain | PASS |
| runtime-defaults | PASS |
| runtime-port-health | PASS |
| route-metadata-and-404 | PASS |

No live landing or README claim-like sentence lacked a registry entry. README deployment instructions are instructions, not product promises. There is no decorative AI feature, no provider key, and no omitted AI step: the brief explicitly excludes AI question generation. CSV import and reusable quiz links supply the implied import/export/share leverage.

## Structure, navigation, and accessibility

Live checks confirmed the routes `/`, `/demo`, `/?demo=1`, `/create`, `/play`, `/privacy`, and `/terms` return 200; `/definitely-missing` returns a designed HTTP 404. Each application route had one `<main>`, one `<h1>`, `lang="en"`, a route-specific plain title, description, canonical, OG/Twitter metadata, favicon, and touch icon. The 404 has its own title, description, canonical, normal header/footer, and return actions.

All landing links crawled successfully. `robots.txt`, `sitemap.xml`, favicon, apple touch icon, and Open Graph image returned 200. Header, skip link, footer, Privacy, and Terms were consistent. SPA route changes moved focus to the new h1 and preserved back navigation. Cold page loads logged no console errors. The live request inventory was same-origin only; no third-party scripts, fonts, trackers, or analytics were observed.

Fresh-clone quality gates passed: `npm test` (3 Vitest + 13 Rust tests), `npm run build`, `cargo fmt --all -- --check`, `cargo clippy --all-targets --locked -- -D warnings`, and `npm run test:e2e -- --retries=0` (30 tests). The production initial JS is 10.42 kB gzip and CSS is 5.22 kB gzip.

## Earlier finding verification

Every earlier review, polish record, and handoff was read. The following records confirm each prior finding against the current live site and current code/tests; none was merely accepted from the prior status.

| Earlier ID | Current verification |
| --- | --- |
| F-1-1 | Demo path, banner, reset, podium replay, and exit passed `demo-sandbox`. |
| F-1-2 | 23-entry registry and one source tag per entry confirmed. |
| F-1-3 | Designed HTTP 404 and CSP passed route claim. |
| F-1-4 | Free/account-free entry passed clean-context claim. |
| F-1-5 | Measured 40-learner first-screen fact passed live-state claim. |
| F-1-6 | Unbounded speed/400/no-cap copy remains absent. |
| F-1-7 | Six-digit creation and join passed. |
| F-1-8 | Reusable fragment quiz link passed. |
| F-1-9 | Exact room-expiry copy and test passed. |
| F-1-10 | CSV import and complete error path passed. |
| F-1-11 | 390px join, answer, lock, and reveal passed. |
| F-1-12 | Answers, rankings, and podium passed. |
| F-1-13 | Tab-only draft lifetime passed. |
| F-1-14 | Unsupported upload absolute remains absent. |
| F-1-15 | Temporary-room wording uses tested timeouts. |
| F-1-16 | Vague nickname-deletion assurance remains absent. |
| F-1-17 | Unsupported tracker/library absolutes remain absent. |
| F-1-18 | Observable room/session privacy wording passed. |
| F-1-19 | Active two-hour expiry passed. |
| F-1-20 | Finished ten-minute expiry passed. |
| F-1-21 | Database/backup absolute remains absent. |
| F-1-22 | Current-session reconnect token passed. |
| F-1-23 | Fresh-context token absence passed. |
| F-1-24 | Fragment transport behaviour passed. |
| F-1-25 | Irrecoverability absolute remains absent. |
| F-1-26 | Operator and privacy contact passed. |
| F-1-27 | README uses measured 40-learner wording. |
| F-1-28 | Typed and CSV authoring both passed. |
| F-1-29 | Phone/nickname flow passed. |
| F-1-30 | Observable results flow passed without scoring jargon. |
| F-1-31 | Bundled absence claims remain absent. |
| F-1-32 | Plain fragment-link explanation remains tested. |
| F-1-33 | Server-memory absolute remains absent. |
| F-1-34 | Eight-question isolated-learner flow passed. |
| F-1-35 | Broad coverage marketing remains absent. |
| F-1-36 | Focused complete CSV error summary passed. |
| F-1-37 | Container-secrecy absolute remains absent. |
| F-1-38 | Deployment wording is scoped and runtime tested. |
| F-1-39 | Single-process scope is tested; one-replica instruction remains clear. |
| F-1-40 | Unsupported multi-process failure prose remains absent. |
| F-1-41 | Both expiry intervals passed. |
| F-1-42 | Unsafe nickname absolutes remain absent. |
| F-1-43 | Reconnect-token behaviour passed. |
| F-1-44 | Operator/contact behaviour passed. |
| F-1-45 | Route-aware titles passed. |
| F-1-46 | Route focus, announcement, scroll, and history passed. |
| F-1-47 | Canonical, social, sitemap, and icon metadata passed. |
| F-1-48 | Header/footer are present on app routes and 404. |
| F-1-49 | Required facts are above both first-screen bounds. |
| F-1-50 | Free classroom-quiz wording remains literal. |
| F-1-51 | Seven-word job headline remains present. |
| F-1-52 | Teacher/trainer and learner-phone outcome remains explicit. |
| F-1-53 | Reusable-link wording remains plain. |
| F-1-54 | Three-step heading names its section. |
| F-1-55 | CSV wording remains plain. |
| F-1-56 | Footer wording remains factual. |
| F-1-57 | `ephemeral` remains absent from README. |
| F-1-58 | Scoring jargon remains absent from README. |
| F-1-59 | JSON implementation prose remains absent. |
| F-1-60 | Unexplained server-memory prose remains absent. |
| F-1-61 | Test-coverage jargon remains absent. |
| F-1-62 | `fixture` remains absent from README. |
| F-1-63 | Every README sentence remains at most 22 words. |
| F-1-64 | `load smoke` remains absent. |
| F-1-65 | CSV answer/time boundaries passed. |
| F-1-66 | CSV error-summary focus passed. |
| F-1-67 | Process-local/ephemeral summary jargon remains absent. |
| F-1-68 | Replica guidance remains concise. |
| F-1-69 | Implementation-heavy nickname wording remains absent. |
| F-1-70 | `Enter nickname` names its result. |
| F-1-71 | Public instructional copy consistently uses learner. |
| F-1-72 | Create and Join headings name their tasks. |
| F-2-1 | `?demo=1` direct entry passed. |
| F-2-2 | Demo exit clears sample keys and opens Create. |
| F-2-3 | README says separate demo storage, not storage jargon. |
| F-2-4 | README has instructions, not unregistered coverage marketing. |
| F-3-1 | All reset/replay controls return to the sample lobby. |
| F-3-2 | Browser verifier is reproducible; clean suite passed. |
| F-3-3 | Desktop facts are above the 900px first-screen bound. |
| F-3-4 | Home title names the job. |
| F-3-5 | Node 22/current Rust claim passed. |
| F-3-6 | Default port claim passed. |
| F-3-7 | Default `dist` claim passed. |
| F-3-8 | Default health build identifier passed. |
| F-3-9 | Optional CSV columns passed. |
| F-3-10 | CSV answer numbering passed. |
| F-3-11 | CSV time boundaries passed. |
| F-3-12 | Supplied-port health claim passed. |
| F-3-13 | Process-scoped room state passed. |
| F-3-14 | Registry completeness was independently rechecked. |
| F-3-15 | Exit button says `Leave demo and create a quiz`. |

## What would make this perfect

No required work is identified. Maintain the tested 40-learner wording unless a larger real-room capacity test is added; do not replace it with an unbounded player-count promise.
