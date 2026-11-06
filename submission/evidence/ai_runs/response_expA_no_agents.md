<!-- session f2c34a7c-9ad4-407d-b5c7-101189afe6d9 | model claude-opus-5-5 | tools ['Glob', 'Grep', 'Read'] -->
<!-- TOOL CALL: Glob {"pattern": "**/*.{ts,tsx,js,jsx,json,md,html}"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/expA_no_agents/src/App.tsx"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/expA_no_agents/tests/ui.regression.test.tsx"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/expA_no_agents/package.json"} -->
<!-- result: success | turns 5 | 36952 ms -->

I read `src/App.tsx`, the characterization tests in `tests/ui.regression.test.tsx` and `package.json`. I didn't edit anything.

## What's wrong now

All 244 lines live in `src/App.tsx`, and that one file does five different jobs:

| Concern | Where | Problem |
|---|---|---|
| Domain rules | `checkAvailability` (`src/App.tsx:27-64`) | One long run of `if` checks. Input checks, time checks, the duration limit, the blocked flag and overlap detection are all mixed together. The order matters (it decides which message wins), but nothing in the code says so. |
| Time formatting | `formatTime` (`src/App.tsx:66`) | Display code is called from inside the domain messages. |
| Demo data | `DEMO_ROOM` (`src/App.tsx:74`) | Defined in the same file as the UI. `now = 540` is a fixed clock with no way to swap it out. |
| Parsing and form state | `handleSubmit` (`src/App.tsx:109-121`) | `parseInt` and null conversion are tangled with React state. |
| Presentation | JSX (`src/App.tsx:127-242`) | The start and end inputs are copy-pasted. The result banner is inline. |

Smaller issues:
- **"B-204" is hard-coded in 4 places**: two messages, the header and an `InfoRow`. The room should be data.
- **The blocked flag is stored twice**: `room.blocked` and a separate `blocked` state, merged with `{ ...room, blocked }`. `useState<RoomState>` has no setter, so it's really a constant with a deep copy.
- **`validateRequired` returns a `field` value that nothing uses.**
- **One message is probably unreachable from the form:** `parseInt('12.5')` returns `12`, so the "whole-number minutes" message likely can't come from the UI, except maybe for NaN. The refactor should keep this behaviour (U01–U13 lock it in). If you want to change it, do that as a separate fix.

## Proposed structure

```
src/
  domain/
    time.ts            // Minutes type, DAY_MINUTES, formatTime
    timeRange.ts       // TimeRange value object: duration, overlaps(), toString()
    room.ts            // Room { id, blocked, bookings }
    result.ts          // available() / unavailable(msg)
    rules.ts           // the ordered rules
    checkAvailability.ts
  data/
    demoRoom.ts        // B-204, bookings, demo clock
  ui/
    useAvailabilityCheck.ts   // form state + parse + call domain
    components/ InfoRow, RoomInfoCard, MinuteInput, ResultBanner
  App.tsx              // composition only (keeps default export for tests)
```

## Patterns I'd apply

1. **Chain of Responsibility, done with simple functions.** This is the main one. Each rule is a function that returns either a rejection or `null`. `checkAvailability` walks an ordered array and returns the first rejection:
   ```ts
   type Rule = (req: TimeRange, ctx: { room: Room; now: Minutes }) => Result | null;

   export const RULES: readonly Rule[] = [
     wholeMinutes, withinDay, startBeforeEnd, startInFuture,
     maxDuration(120), roomNotBlocked, noOverlap,
   ];

   export function checkAvailability(req, ctx): Result {
     for (const rule of RULES) { const r = rule(req, ctx); if (r) return r; }
     return available(`Room ${ctx.room.id} is available for this time.`);
   }
   ```
   The array order makes the message precedence explicit. Adding a rule, like opening hours, means adding one entry. Each rule can also be unit-tested on its own.

2. **Strategy for the parts that change: the rules and the parameters.** `maxDuration(120)` is a configurable rule, so another room or policy can get a different rule list without touching the checker.

3. **Value Object (`TimeRange`, `Minutes`).** `overlaps` (half-open intervals, so touching bookings are allowed, as U09 and U10 test), duration and formatting move onto one small immutable type. This removes the scattered `start`/`end` pairs and the repeated `` `${b.start}–${b.end} (...)` `` formatting.

4. **Dependency Injection of a Clock and room source.** Pass `now` and `room` in rather than reading globals. The demo data becomes one implementation, and later a real backend or `Date.now()` can replace it without changing domain code. A full Repository interface would be optional here. I'd only add one if a backend is actually coming.

5. **Container/Presentational split with a custom hook.** `useAvailabilityCheck` holds the input text, parsing and the result. `App` and small components only render. A reused `MinuteInput` removes the duplicated input markup.

6. **Factory functions for results.** `available()` and `unavailable(msg)` replace the repeated `{ available: false, message: ... }` objects.

I would **not** add class hierarchies, an abstract `Rule` base class or a state-management library. The app is too small to need them, and plain functions keep it readable.

## How to do it safely

Make small commits and run `npm test` (U01–U13) after each one. The tests only check visible text through the form, so they should pass unchanged:

1. Move `formatTime`, constants and types into `domain/`, with no logic changes.
2. Add `TimeRange` and the result factories.
3. Split `checkAvailability` into the ordered `RULES` array, keeping the exact order and message strings.
4. Move the demo room into `data/`, use `room.id` in place of the hard-coded "B-204", and store the blocked flag in one place.
5. Pull out `useAvailabilityCheck` and the presentational components.
6. Add unit tests for each rule in `domain/`. Right now the only tests go through the UI, which is slow and can't test rules in isolation.

The one thing to watch is that the messages depend on rule order. For example, `720–700` must say "reversed", not hit the duration rule. Keeping `RULES` in the same order as today's checks is enough to protect that, and U03–U05 cover it.
