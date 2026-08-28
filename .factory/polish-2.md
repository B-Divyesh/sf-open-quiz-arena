# Polish 2 — cumulative finding closure

Round-two source repair: `bc4a928993ba6b94ed9b2be5f3d501343582f33c`, based on review commit `d1bef65a868e391f7839b06644cd50f138eabea5` and released candidate `21b241637d28cf177046f00f6bbb1be4f72cf7ba`.

Every finding from reviews 1 and 2 is mapped below. “Reverified” means the earlier repair was inspected in current source and exercised again from clean clone `/tmp/open-quiz-arena-polish-2.KLE1dc`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Extended the isolated sample to cover both `/demo` and `/?demo=1`; every exit clears the demo namespace. | `@claim:demo-sandbox`; `demo-query/screenshot-mobile.png`. |
| F-1-2 | Reverified the claim registry and added the capacity claim, leaving one tagged test per claim. | All 14 registry commands passed separately from the clean clone. |
| F-1-3 | Rebuilt the HTTP 404 with same-origin CSS, complete metadata, header, footer, legal links, focus styling, and build id. | `@claim:route-metadata-and-404`; `404-mobile.png`; `404-desktop.png`; HTTP 404 and no CSP error. |
| F-1-4 | Reverified free, account-free entry without sign-in or payment UI. | `@claim:no-accounts-and-free-access`. |
| F-1-5 | Added the truthful first-screen statement “Tested with 40 learners in one room” and a 40-client live-state test. | `@claim:room-capacity-40`; 40 joins, 40 player WebSockets, host count 40. |
| F-1-6 | Kept unbounded speed/count wording removed; the first screen now states a measured count. | `copy-audit.md`; `@claim:room-capacity-40`. |
| F-1-7 | Reverified six-digit room creation and joining. | `@claim:six-digit-room-code`. |
| F-1-8 | Reverified reusable fragment-link behavior. | `@claim:quiz-share-link`. |
| F-1-9 | Reverified exact active and finished room timeouts. | `@claim:temporary-room-expiry`. |
| F-1-10 | Reverified valid CSV import and complete invalid-row errors. | `@claim:csv-import`. |
| F-1-11 | Reverified nickname entry in a 390px isolated mobile context. | `@claim:mobile-nickname-entry`. |
| F-1-12 | Reverified every reveal, ranking, and final podium. | `@claim:live-quiz-results`. |
| F-1-13 | Kept the untested pre-room storage absolute out of Create copy. | Current Create copy audit. |
| F-1-14 | Kept the untested pre-room upload absolute out of Create copy. | Current Create copy audit. |
| F-1-15 | Kept deletion wording tied to the two tested timeouts. | `@claim:temporary-room-expiry`. |
| F-1-16 | Kept vague nickname-deletion wording removed. | Privacy and nickname-screen copy audit. |
| F-1-17 | Kept tracker/library absolutes removed and reverified account-free entry. | `@claim:no-accounts-and-free-access`. |
| F-1-18 | Kept privacy wording narrowed to observable room and session data. | `@claim:privacy-session-data`. |
| F-1-19 | Reverified active-room expiry after two hours without activity. | `@claim:temporary-room-expiry`. |
| F-1-20 | Reverified finished-room expiry after ten minutes. | `@claim:temporary-room-expiry`. |
| F-1-21 | Kept the unprovable database/backup absolute removed. | Privacy copy audit. |
| F-1-22 | Reverified current-session reconnect-token storage. | `@claim:privacy-session-data`. |
| F-1-23 | Reverified that a fresh browser context has no prior session token. | `@claim:privacy-session-data`. |
| F-1-24 | Reverified quiz fragment round-trip behavior. | `@claim:quiz-share-link`. |
| F-1-25 | Kept the unprovable irrecoverability statement removed. | Privacy copy audit. |
| F-1-26 | Reverified free access, operator name, and privacy contact. | `@claim:no-accounts-and-free-access`; `@claim:legal-operator-contact`. |
| F-1-27 | Replaced the remaining unbounded README summary with “Run one live quiz for your class” and the measured 40-learner result. | `copy-audit.md`; `@claim:room-capacity-40`. |
| F-1-28 | Reverified create/import/room/reveal behaviors. | `@claim:csv-import`; `@claim:six-digit-room-code`; `@claim:live-quiz-results`. |
| F-1-29 | Reverified consistent learner and nickname wording at phone width. | `@claim:mobile-nickname-entry`. |
| F-1-30 | Kept scoring jargon out of public copy and reverified observable results. | `@claim:live-quiz-results`. |
| F-1-31 | Kept the bundled absence claims out of README. | README and claims cross-check. |
| F-1-32 | Reverified the plain fragment-link explanation. | `@claim:quiz-share-link`. |
| F-1-33 | Kept the server-memory absolute out of README. | README copy audit. |
| F-1-34 | Reverified the eight-question, three-player browser flow. | `@claim:live-quiz-results`. |
| F-1-35 | Removed the remaining broad coverage assertion; README now gives the browser command and claim-registry path. | README; clean `npm run test:e2e` 24/24. |
| F-1-36 | Reverified the focused CSV error summary. | `@claim:csv-import`. |
| F-1-37 | Kept the unprovable container-secrecy wording removed. | README audit. |
| F-1-38 | Kept deployment wording scoped to one process. | README; Dockerfile inspection. |
| F-1-39 | Kept the explicit one-warm-replica deployment instruction. | README; post-deploy topology check. |
| F-1-40 | Kept unsupported multi-process failure prose removed. | README audit. |
| F-1-41 | Reverified both stated room timeouts. | `@claim:temporary-room-expiry`. |
| F-1-42 | Kept unsafe “only/sanitized” language removed. | Nickname-screen and Privacy copy audit. |
| F-1-43 | Reverified reconnect-token session behavior. | `@claim:privacy-session-data`. |
| F-1-44 | Reverified operator and contact content. | `@claim:legal-operator-contact`. |
| F-1-45 | Added query-demo and host metadata; reverified unique titles across every public route and 404. | `@claim:route-metadata-and-404`; all-route browser audit. |
| F-1-46 | Reverified route focus, announcement, scroll reset, and history behavior. | `@claim:route-metadata-and-404`. |
| F-1-47 | Updated home metadata with the measured capability; query-demo now uses Demo metadata and canonical `/demo`; 404 has full metadata. | `@claim:route-metadata-and-404`; metadata assertions. |
| F-1-48 | Added the normal header, legal footer, and build id to the static HTTP 404. | `@claim:route-metadata-and-404`; 404 screenshots. |
| F-1-49 | Kept price, account, and internet facts and added measured classroom capacity. | `home/screenshot-mobile.png`; `copy-audit.md`. |
| F-1-50 | Reverified literal “Free live classroom quiz” wording. | `copy-audit.md`. |
| F-1-51 | Tightened the h1 to the seven-word job statement “Run one live quiz for your class.” | `copy-audit.md`; mobile screenshot. |
| F-1-52 | Reverified explicit teacher/trainer audience and learner phone outcome. | `copy-audit.md`; mobile first-screen test. |
| F-1-53 | Reverified the reusable-link explanation without jargon. | `@claim:quiz-share-link`. |
| F-1-54 | Reverified “Run a quiz in three steps.” | `copy-audit.md`. |
| F-1-55 | Reverified plain CSV wording. | `copy-audit.md`; `@claim:csv-import`. |
| F-1-56 | Reverified the factual footer sentence. | all-route browser audit. |
| F-1-57 | Reverified that “ephemeral” is absent from README. | README and banned-word scan. |
| F-1-58 | Reverified that scoring jargon is absent from README. | README audit. |
| F-1-59 | Reverified that JSON implementation prose is absent from README. | README audit. |
| F-1-60 | Reverified that unexplained server-memory prose is absent from README. | README audit. |
| F-1-61 | Removed the remaining “browser suite” and “host/player loop” coverage jargon. | README; F-2-4 regression review. |
| F-1-62 | Reverified that “fixture” is absent from README. | README audit. |
| F-1-63 | Replaced the remaining 21-word coverage list with two direct test instructions. | `copy-audit.md`; README. |
| F-1-64 | Reverified that “load smoke” is absent from README. | README audit. |
| F-1-65 | Reverified plain CSV number/time instructions. | `copy-audit.md`. |
| F-1-66 | Reverified keyboard focus on the complete import-error summary. | `@claim:csv-import`. |
| F-1-67 | Reverified that process-local/ephemeral language is absent from the product summary. | README audit. |
| F-1-68 | Reverified the single concise replica instruction. | `copy-audit.md`; README. |
| F-1-69 | Reverified plain nickname wording. | `@claim:mobile-nickname-entry`. |
| F-1-70 | Reverified the “Enter nickname” action. | `@claim:mobile-nickname-entry`. |
| F-1-71 | Reverified consistent “learner” terminology. | `copy-audit.md`. |
| F-1-72 | Reverified task-naming Create and Join route headings. | all-route browser audit. |
| F-2-1 | Extended the demo claim test to enter through `/?demo=1` and assert banner, seeded host, reset, storage, title, requests, and no API/WebSocket use. | `@claim:demo-sandbox`; `demo-query/screenshot-mobile.png`. |
| F-2-2 | Added a tested shared Start-for-real exit from lobby, question, results, and podium; it clears demo keys and opens `/create` without real-room keys. | `@claim:demo-sandbox`. |
| F-2-3 | Replaced “browser-storage namespace” with “separate demo storage” and “sample progress”; exact keys remain in `demo.md`. | README; `copy-audit.md`. |
| F-2-4 | Removed the unregistered coverage list and test jargon; replaced it with two executable instructions. | README; clean full browser suite 24/24. |

## Evidence paths and commands

- Local screenshots and verifier output: `.factory/evidence/polish-2-local/home/`, `.factory/evidence/polish-2-local/demo-query/`, `.factory/evidence/polish-2-local/404-mobile.png`, and `.factory/evidence/polish-2-local/404-desktop.png`.
- Clean-clone commit/path: `bc4a928993ba6b94ed9b2be5f3d501343582f33c` at `/tmp/open-quiz-arena-polish-2.KLE1dc`.
- Clean-clone gates: `npm ci`; `npm test` (3 TypeScript + 12 Rust); `npm run build`; all 14 claim commands individually; `cargo fmt`; `cargo clippy -D warnings`; full Playwright 24/24.
- Local browser evidence: all public routes passed Axe with zero serious/critical findings and no horizontal overflow. The 390×844 first screen kept the job, audience, demo action, explanation, and facts above the fold.
- Local performance: Lighthouse mobile scores 100 performance, 100 accessibility, 100 best practices, and 100 SEO; LCP 1.2s, CLS 0, TBT 20ms.
- Live checks and screenshot paths are recorded in `handoff.md` after the final deployment.
