<!-- session b21f1d62-5e3b-4fc6-9b79-3df38e19df5b | model claude-opus-5-5 | tools ['Glob', 'Grep', 'Read'] -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step4_activate/AGENTS.md"} -->
<!-- TOOL CALL: Glob {"pattern": "package.json"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step4_activate/package.json"} -->
<!-- result: success | turns 4 | 13552 ms -->

I read `AGENTS.md` at the repository root with the Read tool, so there's no need to paste it. I also checked `package.json` to see what each npm command actually runs. I haven't edited anything.

## Project
- This is a Smart Campus availability checker for one room, **B-204**, using made-up data. It only decides whether the room is available. It never creates or saves a booking.
- User story: as a student, I want to check a room's availability so that I can choose a valid booking time.
- Current structure:
  - `src/App.tsx` holds the UI, the `checkAvailability` rule, `formatTime` and the `DEMO_ROOM` test data.
  - `src/main.tsx` is the entry point, and `index.html` is the Vite page.
  - `tests/ui.regression.test.tsx` has the UI tests U01–U13, which must not be changed or weakened.
- Planned split (Practice #09): move the pure rule to `src/domain/availability.ts` and the test data to `src/data/demoRoom.ts`. `App.tsx` would then keep only UI state, input parsing and rendering.

## Requirements that must keep working (acceptance criteria)
- **AC1:** Reject a start time at or after the end time, and reject requests in the past (start ≤ now).
- **AC2:** Reject bookings longer than 120 minutes; exactly 120 minutes is allowed.
- **AC3:** Reject a blocked room.
- **AC4:** Reject overlapping bookings, but allow ones that only touch at the edges. Each booking counts as starting at its start time and ending just before its end time.
- **AC5:** Never change the booking data; repeated checks must give the same answer.
- **AC6:** Keep the desktop and mobile feedback the same: same messages, the `role="status"` banner, same layout and Tailwind classes.
- No backend, login, database, external API or booking creation.

## Engineering rules
- Prefer pure functions and minimal changes, one concern at a time.
- Use at most 2 design patterns, each with a written "problem → pattern → benefit" reason.
  - Avoid Singleton, Factory, Chain of Responsibility, class hierarchies and new libraries unless there's a concrete need.
  - Use Adapter only if the data really comes in two shapes, and Strategy only if there are two real policies.
- Keep the checks in the same order and every message the user sees word-for-word the same.
- Don't change the booking data; keep the responsive UI feedback.
- Don't add dependencies or features.

## Exact commands

| Purpose | Command in AGENTS.md | What it runs (`package.json`) |
|---|---|---|
| Install | `npm install` | n/a |
| Tests | `npm test` | `vitest run --reporter=verbose` |
| Type check | `npm run typecheck` | `tsc --noEmit` |
| Build | `npm run build` | `tsc --noEmit && vite build` |
| Dev preview | `npm run dev` | `vite` |

`package.json` also has a `preview` script (`vite preview`), which `AGENTS.md` doesn't mention.

## Verification rules
- Run the existing tests before and after every change, and add focused regression tests.
- Never delete or weaken an existing assertion.
- Report the changed files, the reasoning, and the real test results: the command, its output and the pass/fail counts.

I'm ready for the next step when you are.
