# AGENTS.md: Smart Campus room availability checker

## Project
Smart Campus room availability checker for one room (B-204) with fictional data.
User story: as a student, I want to check a room's availability so that I can choose a valid booking time.
It only decides availability. It never creates or saves a booking.

## Structure
- `src/App.tsx`: React UI (form, room info, result banner). It currently also contains the booking rule
  `checkAvailability`, `formatTime` and the `DEMO_ROOM` fixture.
- `src/main.tsx`: entry point. `index.html`: Vite page.
- `tests/ui.regression.test.tsx`: UI characterization tests U01-U13. Do not change or weaken them.
- Planned module boundary (Practice #09): the pure rule goes to `src/domain/availability.ts` and the fixture
  to `src/data/demoRoom.ts`. `App.tsx` keeps only UI state, input parsing and rendering.

## Constraints (do not break)
- AC1: reject start >= end and past requests (start <= now).
- AC2: reject durations longer than 120 minutes; exactly 120 is allowed.
- AC3: reject a blocked room.
- AC4: reject overlaps; allow bookings that only touch at endpoints (half-open intervals `[start, end)`).
- AC5: do not mutate booking data; repeated checks give the same answer.
- AC6: keep clear desktop/mobile feedback: same messages, `role="status"` banner, same layout and Tailwind classes.
- No backend, login, database, external API or booking creation.

## Engineering rules
- Prefer pure functions and minimal changes. Change one concern at a time.
- Use at most 2 patterns, and only with a written problem -> pattern -> benefit reason.
  Avoid Singleton, Factory, Chain of Responsibility, class hierarchies or new libraries without a concrete need.
- Adapter only if fixtures really have two data shapes. Strategy only if there are two real policies.
- Keep the order of checks and every user-visible message text exactly the same.
- Do not mutate booking fixtures; keep responsive UI feedback.
- Do not add dependencies or features.

## Commands
- Install: `npm install`
- Tests: `npm test` (Vitest, verbose)
- Type check: `npm run typecheck`
- Build: `npm run build`
- Dev preview: `npm run dev`

## Verification
- Run existing tests before and after every change, and add focused regression tests.
- Never delete or weaken an existing assertion.
- Report changed files, rationale and real test evidence (command, output, pass/fail count).
