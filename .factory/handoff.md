# Open Quiz Arena — adversarial review 3 handoff

## Outcome

Review 3 is complete with verdict **FAIL**. No product code was changed. The live deployment matches repository commit `510725e8934b1b40e918f992e52f329955602a53`.

The cold first screen clearly states the job, audience, and first action. The registered claim commands and standard build/test gates pass. Blocking findings remain for the dead demo replay control and four half-fixed earlier findings: phone answering coverage, pre-room browser-storage wording, typed-authoring coverage, and learner/player terminology.

See `.factory/review-3.md` for the complete copy audit, claim results, route/accessibility evidence, and one-row verification of every earlier finding.

## Verification performed

Clean clone: `/tmp/open-quiz-arena-review-3.yxQoTB` at `510725e8934b1b40e918f992e52f329955602a53`.

- `npm ci`: passed with zero vulnerabilities.
- `npm run build`: passed and produced `dist/`.
- `npm test`: 3 Vitest and 12 Rust tests passed.
- Every command in `.factory/claims.json` was run separately: all 14 passed.
- `npm run test:e2e -- --retries=0`: 24/24 passed.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --all-targets --locked -- -D warnings`: passed.
- Live route/Axe checks: 8/8 passed with no serious or critical findings.
- `.factory/verify-url.sh` passed for `/` and `/?demo=1`.
- Fresh mobile and desktop first-screen captures were inspected at `/tmp/review-3-home-mobile.png` and `/tmp/review-3-home-desktop.png`.
- `.factory/verification-browser.mjs` failed waiting for an answer button after reconnecting an already-answered learner; it also ignores `BASE_URL`.

## Product state and gaps

- The banner **Reset demo** and **Start for real** controls work and clear demo storage.
- The podium **Run the sample again** button is dead because duplicate `reset-demo` IDs bind only the banner action.
- Demo traffic is same-origin only; demo storage uses only `demo:open-quiz-arena:step`; real session storage remains untouched.
- The 1440×900 first screen places its plain facts below the fold.
- The live host screen still says “player” while landing and README use “learner.”
- Registered tests do not cover phone answering or typed quiz authoring, and `/create` has an unlisted browser-storage statement.
- The home title does not state the live-classroom-quiz job.
- Several README runtime and CSV promises are absent from the claim registry.

## Next step

Repair every finding in `.factory/review-3.md`, add the missing tagged assertions, then deploy and repeat the full cold review rather than testing only the changed paths.
