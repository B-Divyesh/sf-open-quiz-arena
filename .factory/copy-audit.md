# Copy audit — polish 3

Word counts use word and number tokens. Labels are included so the audit does not hide interface wording. No sentence exceeds 22 words or uses a banned marketing word. Every testable product promise maps to `.factory/claims.json`.

## Landing page

| Words | Copy | Result |
| ---: | --- | --- |
| 4 | Skip to main content | Clear action |
| 3 | Open Quiz Arena | Product name |
| 1 each | Demo / Create / Join / Privacy | Clear navigation labels |
| 4 | Free live classroom quiz | Clear context |
| 7 | Run one live quiz for your class. | Clear job |
| 4 | Teachers and trainers host. | Audience |
| 9 | Learners join by code and answer on their phones. | `mobile-nickname-entry` |
| 5 | Try it with sample data | Primary action |
| 9 | Opens a sample host screen with learners already joined. | `demo-sandbox` |
| 1 / 2 / 2 / 7 | Free / No accounts / Internet required / Tested with 40 learners in one room | Registered facts |
| 3 / 3 | Create a quiz / Join a room | Clear secondary actions |
| 3 | Live · Q 4/8 | Sample status |
| 2 | 27 playing | Sample count in the labelled illustration |
| 8 | Which layer of Earth moves beneath the crust? | Sample question |
| 2 / 1 / 2 / 1 | Inner core / Mantle / Outer core / Atmosphere | Sample answers |
| 3 | How it works | Clear section label |
| 6 | Run a quiz in three steps. | Clear heading |
| 3 | Create or import | Clear step label |
| 8 | Type questions or import a CSV file. | `typed-questions`; `csv-import` |
| 3 | Share the code | Clear step label |
| 7 | Learners enter one nickname on their phones. | `mobile-nickname-entry` |
| 2 | Reveal results | Clear step label |
| 8 | Show each answer, rankings, and the final podium. | `live-quiz-results` |
| 3 | Data and limits | Clear heading |
| 7 | Internet is required for a live room. | `internet-required` |
| 8 | There is no homework mode or analytics dashboard. | `no-homework-or-analytics` |
| 3 | Rooms are temporary. | Retention introduction |
| 8 | Active rooms expire after two hours without activity. | `temporary-room-expiry` |
| 6 | Finished rooms expire after ten minutes. | `temporary-room-expiry` |
| 4 / 2 | Free live classroom quizzes. / No accounts. | `no-accounts-and-free-access` |
| 1 / 1 | Privacy / Terms | Legal links |
| 5 | Built by Param Factory · [build] | Release identity |

At 390×844, the job, audience, action, action explanation, and facts end above the fold. At 1440×900, the fact row also ends above the fold. `mobile.spec.ts` asserts both bounds.

## README

| Words | Copy | Result |
| ---: | --- | --- |
| 7 | Run one live quiz for your class. | Plain product summary |
| 14 | Teachers and trainers create questions, share a six-digit room code, and reveal each result. | `typed-questions`; `six-digit-room-code`; `live-quiz-results` |
| 8 | The live room is tested with 40 learners. | `room-capacity-40` |
| 8 | Try the isolated sample at `/demo` or `/?demo=1`. | `demo-sandbox` |
| 9 | The sample uses preset learners and separate demo storage. | `demo-sandbox` |
| 6 | Reset demo removes that sample progress. | `demo-sandbox` |
| 12 | Leave demo and create a quiz removes it and opens the quiz editor. | `demo-sandbox` |
| 10 | Build and test with Node 22 and current stable Rust. | `runtime-toolchain` |
| 4 | Open `http://localhost:8080`. | Local action |
| 16 | Without settings, the server uses port `8080`, serves `dist`, and returns a build identifier at `/health`. | `runtime-defaults` |
| 12 | Every public product claim and its command are listed in `.factory/claims.json`. | Registry cross-check |
| 7 | Run `npm run test:e2e` for browser checks. | Verification instruction |
| 9 | See `.factory/claims.json` for each public promise and its test. | Verification instruction |
| 9 | Use a header row with `question,answer1,answer2,correct`. | `csv-import` |
| 7 | CSV accepts `answer3`, `answer4`, and `time` columns. | `csv-optional-columns` |
| 10 | CSV `correct` uses answer numbers from `1` to `4`. | `csv-answer-numbering` |
| 8 | CSV `time` accepts 5 to 120 seconds. | `csv-time-range` |
| 10 | Build the supplied Dockerfile with `BUILD_SHA` set to the source commit. | Deployment instruction |
| 7 | The service accepts `PORT` and serves `/health`. | `runtime-port-health` |
| 7 | Live rooms use the running server process. | `single-process-room-state` |
| 10 | Deploy one warm replica until a shared room coordinator exists. | Deployment instruction |
| 9 | See `/privacy` and `/terms` in the running app. | Legal-route instruction |
| 6 | Privacy requests go to `privacy@sociobot.in`. | `legal-operator-contact` |
| 4 | MIT. See LICENSE. | License |

## Terminology

| Concept | One term |
| --- | --- |
| Person joining a quiz | learner |
| Person controlling a quiz | host |
| Temporary live session | room |
| Reusable authored content | quiz |
| Sample experience | demo |
