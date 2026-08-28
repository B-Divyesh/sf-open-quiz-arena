# Copy audit — polish 2

Word counts use word and number tokens. Labels are included so the audit does not hide interface wording. No sentence exceeds 22 words, and no banned marketing word or unexplained metaphor remains.

## First screen

| Words | Copy | Result |
| ---: | --- | --- |
| 4 | Skip to main content | Clear action |
| 3 | Open Quiz Arena | Product name |
| 1 | Demo / Create / Join / Privacy | Clear navigation labels |
| 4 | Free live classroom quiz | Clear context |
| 7 | Run one live quiz for your class. | Job headline |
| 4 | Teachers and trainers host. | Audience |
| 9 | Learners join by code and answer on their phones. | Outcome; `mobile-nickname-entry` |
| 5 | Try it with sample data | Primary action |
| 9 | Opens a sample host screen with learners already joined. | Explains the next screen |
| 1 / 2 / 2 / 7 | Free / No accounts / Internet required / Tested with 40 learners in one room | Facts; registered claims |

On a 390×844 viewport, the headline, audience, sample action, action explanation, and all four facts end above the fold. Create and Join remain in the header; their duplicate hero buttons are omitted on phones.

## Remaining landing page

| Words | Copy | Result |
| ---: | --- | --- |
| 4 | Live · Q 4/8 | Sample status |
| 2 | 27 playing | Sample count |
| 8 | Which layer of Earth moves beneath the crust? | Sample question |
| 2 / 1 / 2 / 1 | Inner core / Mantle / Outer core / Atmosphere | Sample answers |
| 3 | 01 / How it works | Section marker |
| 6 | Run a quiz in three steps. | Section heading |
| 3 | Create or import | Step label |
| 7 | Type questions or import a CSV file. | `csv-import` |
| 3 | Share the code | Step label |
| 7 | Learners enter one nickname on their phones. | `mobile-nickname-entry` |
| 2 | Reveal results | Step label |
| 8 | Show each answer, rankings, and the final podium. | `live-quiz-results` |
| 3 | Data and limits | Section heading |
| 7 | Internet is required for a live room. | `internet-required` |
| 8 | There is no homework mode or analytics dashboard. | `no-homework-or-analytics` |
| 3 | Rooms are temporary. | Retention introduction |
| 8 | Active rooms expire after two hours without activity. | `temporary-room-expiry` |
| 6 | Finished rooms expire after ten minutes. | `temporary-room-expiry` |
| 4 | Free live classroom quizzes. | `no-accounts-and-free-access` |
| 2 | No accounts. | `no-accounts-and-free-access` |
| 1 / 1 | Privacy / Terms | Legal links |
| 5 | Built by Param Factory · [build] | Attribution and release identity |

## README sentences

| Words | Copy | Result |
| ---: | --- | --- |
| 7 | Run one live quiz for your class. | Plain product summary |
| 14 | Teachers and trainers create questions, share a six-digit room code, and reveal each result. | Tested product flow |
| 8 | The live room is tested with 40 learners. | `room-capacity-40` |
| 8 | Try the isolated sample at `/demo` or `/?demo=1`. | `demo-sandbox` |
| 9 | The sample uses preset learners and separate demo storage. | Plain privacy outcome |
| 6 | Reset demo removes that sample progress. | `demo-sandbox` |
| 10 | Start for real removes it and opens the quiz editor. | `demo-sandbox` |
| 6 | Requirements: Rust stable and Node 22+. | Developer prerequisite |
| 4 | Open `http://localhost:8080`. | Local action |
| 4 | `PORT` defaults to `8080`. | Configuration fact |
| 4 | `STATIC_DIR` defaults to `dist`. | Configuration fact |
| 4 | `/health` returns the build identifier. | Operations fact |
| 12 | Every public product claim and its command are listed in `.factory/claims.json`. | Verification instruction |
| 7 | Run `npm run test:e2e` for browser checks. | Verification instruction |
| 9 | See `.factory/claims.json` for each public promise and its test. | Verification instruction |
| 9 | Use a header row with `question,answer1,answer2,correct`. | CSV instruction |
| 7 | Optional columns are `answer3`, `answer4`, and `time`. | CSV instruction |
| 8 | `correct` uses answer numbers starting at 1. | CSV instruction |
| 5 | `time` accepts 5 to 120 seconds. | CSV instruction |
| 10 | Build the supplied Dockerfile with `BUILD_SHA` set to the source commit. | Deployment instruction |
| 10 | The container listens on `PORT` and serves `/health`. | Deployment instruction |
| 6 | Live rooms run in one process. | Deployment constraint |
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
