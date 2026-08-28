# Demo sandbox

Open `/demo` or `/?demo=1` from a fresh browser context.

The demo begins on a seeded host screen for the one-question **Climate check** quiz. Maya, Ibrahim, and Lena are already joined. Start the question, record the three sample answers, reveal the ranking, and show the sample podium.

Demo state uses only `localStorage` key `demo:open-quiz-arena:step`. It never calls the room API and never reads or writes real-room session storage. **Reset demo** removes every `demo:open-quiz-arena:*` key and returns to the sample lobby. **Start for real** removes those keys and opens `/create`. Leaving either demo URL also removes demo progress.
