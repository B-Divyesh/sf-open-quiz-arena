# Polish 1 — finding closure

Candidate repaired from `04661e3c36d0f7c0aa56b8700426ff5b1923a4a5`; review baseline `2a9f08f52b7c4ca5115a62ad65ae6a383a961447`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Added isolated `/demo` and `?demo=1` sample host flow, persistent demo banner, reset, and start-real controls. | `@claim:demo-sandbox`; `/demo` screenshot/route audit in Playwright. |
| F-1-2 | Added `.factory/claims.json` with one tagged executable test per retained claim. | All listed commands; clean `npm ci`, test, build, and Playwright run. |
| F-1-3 | Server now serves known routes only and returns designed `404.html` with HTTP 404 for missing paths. | `@claim:route-metadata-and-404`; `curl /definitely-missing` → 404. |
| F-1-4 | Retained “No accounts” only with a clean-demo sign-in/payment/network test. | `@claim:no-accounts-and-free-access`. |
| F-1-5 | Removed the absolute player-cap claim. | Cold-copy audit and landing text. |
| F-1-6 | Removed the unproven 4-or-400/speed/cap/storage sentence; replaced it with audience and phone outcome. | `copy-audit.md`; `@claim:mobile-nickname-entry`. |
| F-1-7 | Retained the six-digit code behavior and registered its API create/join test. | `@claim:six-digit-room-code`. |
| F-1-8 | Rewrote share-link wording and registered fragment round-trip coverage. | `@claim:quiz-share-link`. |
| F-1-9 | Replaced vague deletion copy with exact active/finished timeouts. | `@claim:temporary-room-expiry`. |
| F-1-10 | Rewrote CSV wording and registered valid import plus every-error summary behavior. | `@claim:csv-import`. |
| F-1-11 | Kept phone/nickname behavior under a 390px isolated-player test. | `@claim:mobile-nickname-entry`. |
| F-1-12 | Rewrote results copy and tagged the complete host/player flow. | `@claim:live-quiz-results`. |
| F-1-13 | Removed the untested browser-storage assertion from Create. | Cold-copy audit. |
| F-1-14 | Removed the untested upload assertion from Create. | Cold-copy audit. |
| F-1-15 | Replaced vague deletion wording with tested exact expiry wording. | `@claim:temporary-room-expiry`. |
| F-1-16 | Replaced the vague learner deletion assurance with the stated timeout. | `@claim:temporary-room-expiry`. |
| F-1-17 | Removed tracker/library absolutes; account-free claim has a request/UI test. | `@claim:no-accounts-and-free-access`. |
| F-1-18 | Narrowed the privacy explanation to testable quiz, nickname, and reconnect-token handling. | `@claim:privacy-session-data`. |
| F-1-19 | Kept the two-hour active expiry with an isolated-clock purge test. | `@claim:temporary-room-expiry`. |
| F-1-20 | Kept the ten-minute finished expiry with an isolated-clock purge test. | `@claim:temporary-room-expiry`. |
| F-1-21 | Removed the unprovable database/backup assertion. | Privacy copy audit. |
| F-1-22 | Kept session token wording with storage inspection. | `@claim:privacy-session-data`. |
| F-1-23 | Proved a fresh browser context has no prior session token. | `@claim:privacy-session-data`. |
| F-1-24 | Rewrote share-link explanation and tested a fresh fragment load. | `@claim:quiz-share-link`. |
| F-1-25 | Removed the irrecoverability assertion. | Privacy copy audit. |
| F-1-26 | Kept free/operator/contact wording with a policy contact test. | `@claim:legal-operator-contact`; `@claim:no-accounts-and-free-access`. |
| F-1-27 | Rewrote README summary; removed unbounded “every learner” wording. | `copy-audit.md`; claim registry. |
| F-1-28 | Replaced README lifecycle assertion with concise product instructions and tagged browser coverage. | `@claim:csv-import`, `@claim:live-quiz-results`. |
| F-1-29 | Replaced jargon with consistent learner/nickname wording. | `@claim:mobile-nickname-entry`. |
| F-1-30 | Replaced scoring jargon with result wording covered by the full flow. | `@claim:live-quiz-results`. |
| F-1-31 | Removed the bundled absence claims from README. | README copy audit. |
| F-1-32 | Replaced JSON implementation prose with fragment behavior. | `@claim:quiz-share-link`. |
| F-1-33 | Removed server-memory absolute from README. | README copy audit. |
| F-1-34 | Tagged the eight-question, three-player browser flow. | `@claim:live-quiz-results`. |
| F-1-35 | Replaced coverage marketing with a short test command and registry link. | README; `npm test`. |
| F-1-36 | Rewrote importer prose and asserts focused complete error list. | `@claim:csv-import`. |
| F-1-37 | Removed unprovable container secrecy claim. | README copy audit. |
| F-1-38 | Replaced implementation marketing with deployment instruction. | README; architecture inspection. |
| F-1-39 | Replaced configuration claim with deployment instruction. | README; one-replica work-order configuration. |
| F-1-40 | Removed long multi-process failure prose. | README copy audit. |
| F-1-41 | Reused the two TTL claim tests. | `@claim:temporary-room-expiry`. |
| F-1-42 | Replaced “only/sanitized” assertion with clear nickname instruction. | `@claim:mobile-nickname-entry`. |
| F-1-43 | Registered session reconnect-token storage behavior. | `@claim:privacy-session-data`. |
| F-1-44 | Registered operator and contact content. | `@claim:legal-operator-contact`. |
| F-1-45 | Added route-aware titles for home, demo, create, join, privacy, terms, and 404. | `@claim:route-metadata-and-404`. |
| F-1-46 | Navigation stores scroll, restores it only on history traversal, focuses the new h1, and announces route changes. | `@claim:route-metadata-and-404`. |
| F-1-47 | Added canonical, OG/Twitter metadata, 1200×630 original art, touch icon, and sitemap. | `@claim:route-metadata-and-404`; `/open-graph.png`, `/apple-touch-icon.png`, `/sitemap.xml`. |
| F-1-48 | Added persistent header navigation and complete footer attribution/build label. | browser route audit. |
| F-1-49 | Added literal free/account/internet facts and a Data and limits section. | landing screenshot and `copy-audit.md`. |
| F-1-50 | Replaced metaphor with “Free live classroom quiz.” | `copy-audit.md`. |
| F-1-51 | Replaced slogan h1 with the classroom job headline. | `copy-audit.md`. |
| F-1-52 | Replaced hero marketing with teacher/trainer and learner outcome sentences. | `copy-audit.md`. |
| F-1-53 | Replaced “Quiz-as-link” jargon with reusable-link explanation. | `@claim:quiz-share-link`. |
| F-1-54 | Replaced mood heading with “Run a quiz in three steps.” | `copy-audit.md`. |
| F-1-55 | Replaced idiom with “import a CSV file.” | `copy-audit.md`. |
| F-1-56 | Replaced reusable footer slogan with a product fact. | landing/footer audit. |
| F-1-57 | Removed “ephemeral” from README. | README audit. |
| F-1-58 | Removed deterministic scoring jargon from README. | README audit. |
| F-1-59 | Removed JSON implementation jargon from README. | README audit. |
| F-1-60 | Removed unexplained server-memory copy from README. | README audit. |
| F-1-61 | Replaced test-stack jargon with plain test coverage language. | README audit. |
| F-1-62 | Removed “fixture” wording. | README audit. |
| F-1-63 | Removed the overlong coverage sentence. | README audit. |
| F-1-64 | Removed “load smoke” wording. | README audit. |
| F-1-65 | Rewrote CSV number/time explanation. | README audit. |
| F-1-66 | Rewrote keyboard-focusable jargon; behavior is tested. | `@claim:csv-import`. |
| F-1-67 | Removed process-local/ephemeral copy from product summary. | README audit. |
| F-1-68 | Replaced the 36-word scale warning with one deployment instruction. | README audit. |
| F-1-69 | Replaced learner-supplied/sanitized jargon with nickname wording. | `@claim:mobile-nickname-entry`. |
| F-1-70 | Renamed “Continue” to “Enter nickname.” | mobile browser test. |
| F-1-71 | Standardized public instructional copy on “learner.” | `copy-audit.md`. |
| F-1-72 | Renamed route headings to task names. | mobile/browser route tests. |

## Evidence paths

- Browser tests: Playwright output and traces under `test-results/` when retained.
- Route screenshot/check substitute: `.factory/verify-url.sh http://127.0.0.1:8080/{,demo}`.
- Live URL check after deployment: `https://open-quiz-arena.sociobot.in`, `/demo`, `/privacy`, `/definitely-missing` (recorded in handoff).
