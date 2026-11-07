# Project Companion — local prototype

A standalone React/Vite prototype made from the user's Appbuild ZIP foundation. **No Base44 subscription or backend is required.** Original uploaded project is preserved under `original-base44/Appbuild/` for reference; the new runnable prototype is in `src/`.

## Run on Windows (VS Code terminal)

1. Extract this ZIP and open the `project_companion_work` folder in VS Code.
2. Make sure Node.js is installed.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the localhost URL printed in the terminal (normally `http://localhost:5173`).

Run `npm test` for logic tests; `npm run build` for a production build.

## Included

- Bruno Bucciarati as the initial and only selectable companion, with both supplied images.
- Editable daily and one-time tasks, with category and XP difficulty.
- Completion XP, undo, relationship levels and milestone unlock display.
- Event-based dialogue, talk button and optional browser text-to-speech (generic system voice).
- Daily progress, statistics and browser localStorage persistence.
- Mobile responsive UI for testing in iPhone/Android browsers.

## Limitations

- Browser localStorage only: no account login, cloud sync, push notifications, or native mobile binaries.
- No genuine Bruno voice recordings or conversational AI. Dialogue is scripted and spoken with browser speech synthesis.
- Progress is stored separately for each browser and may be lost if site storage is cleared.
- Existing Base44 project is retained as reference, not integrated with its backend.
- Copyrighted character images are supplied by the user and intended for private testing only.
