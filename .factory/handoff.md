# Open Quiz Arena — review 2 handoff

## Outcome

This reviewer changed documentation only: `.factory/review-2.md` and this handoff. No product source, deployment, DNS, billing, or runtime data was changed.

Review verdict: **FAIL**. The live build is `21b241637d28cf177046f00f6bbb1be4f72cf7ba`.

## Verification performed

- Cold live Chromium checks at 390×844 and 1440×900.
- Full live demo flow, including rankings, podium, Reset demo, Start for real, browser storage, request log, and console log.
- Clean clone at `/tmp/open-quiz-arena-review-2.QwtWIw`: `npm ci`, `npm test`, `npm run build`, and `cargo test --locked` passed.
- Every registered claim command passed against the clean-clone server, including all 12 Playwright claims and the Rust expiry claim.
- Live route/link crawl and Axe review found no serious or critical Axe violations on `/`, `/demo`, `/create`, `/play`, `/privacy`, `/terms`, or the missing-page response.

## Known gaps requiring repair

1. Reopened F-1-3: the unknown-route 404 includes inline CSS, while the server CSP permits only same-origin stylesheets. The result is unstyled and logs a CSP console error. It also lacks the normal header/footer and route metadata.
2. Reopened F-1-5: no tested classroom-scale/no-cap capability is stated on the landing page or registered as a claim.
3. F-2-1 through F-2-4: two demo README promises are untested, and README has the identified jargon/unregistered coverage statement.

Read `.factory/review-2.md` for exact evidence and concrete repairs.
