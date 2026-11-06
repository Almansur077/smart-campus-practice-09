<!-- session 8178fe5f-c4d4-4b00-b464-d1fdd8b8018e | model claude-opus-5-5 | tools ['Glob', 'Grep', 'Read'] -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/expB_with_agents/AGENTS.md"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/expB_with_agents/src/App.tsx"} -->
<!-- TOOL CALL: Glob {"pattern": "{src,tests}/**/*"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/expB_with_agents/tests/ui.regression.test.tsx"} -->
<!-- result: success | turns 5 | 31670 ms -->

I read `AGENTS.md`, `src/App.tsx` and `tests/ui.regression.test.tsx`. I didn't edit any files. I also didn't run any commands (I have no shell access in this session), so there is no test output here.

## What's wrong today

`src/App.tsx` mixes three separate jobs:

| Concern | Where | Lines |
|---|---|---|
| Booking rule (AC1–AC5) | `checkAvailability`, `overlaps`, `isWholeMinute`, `MAX_MINUTES`, `DAY_MINUTES` | `src/App.tsx:12-64` |
| Time formatting | `formatTime` (used by both the rule and the UI) | `src/App.tsx:66-72` |
| Demo data | `DEMO_ROOM` | `src/App.tsx:74-78` |
| UI | input checks, parsing, rendering | `src/App.tsx:80-243` |

The rule is already a pure function, but you can only test it by rendering the whole React page. The tests U01–U13 all go through the form.

## Proposed refactoring

This follows the module split `AGENTS.md` already plans:

```
src/domain/availability.ts   types (Booking, RoomState, Result), MAX_MINUTES, DAY_MINUTES,
                             isWholeMinute, overlaps, checkAvailability, formatTime   (no React import)
src/data/demoRoom.ts         DEMO_ROOM: RoomState  (imports the type from domain)
src/App.tsx                  validateRequired, parseInt→null parsing, useState, InfoRow, JSX
tests/domain/availability.test.ts   new focused unit tests
```

Imports only point one way: UI → domain and data → domain. The domain imports nothing.

**Steps, one change at a time.** Run `npm test` and `npm run typecheck` before and after each step:

1. **Move the rule.** Cut lines 12–72 into `src/domain/availability.ts` unchanged. Export `checkAvailability`, `formatTime`, `MAX_MINUTES` (the UI's reference text uses it) and the types. `App.tsx` then imports them. Message text, check order and the `Room B-204` text stay exactly the same.
2. **Move the fixture.** Put `DEMO_ROOM` into `src/data/demoRoom.ts`. Keep the defensive copy in `useState` (`bookings.map(b => ({...b}))`).
3. **Make data read-only in the types.** Use `readonly bookings: readonly Booking[]` and readonly fields on `Booking`. This only changes types, not runtime behaviour, so AC5 is enforced when the code compiles.
4. **Add focused unit tests** for the pure function (U01–U13 stay as they are):
   - AC2 limits: duration 120 is available, 121 is rejected.
   - AC4 edges: 550–600 and 660–720 are available, 599–601 is rejected.
   - Check order: a request that is both blocked and overlapping gets the *blocked* message, and one that is both in the past and too long gets the *past* message.
   - AC5: deep-equal the input before and after, and calling with an `Object.freeze`d room doesn't throw and returns the same result twice.
   - `formatTime`: 0 gives `00:00` and 1440 gives `24:00`.
   - `isWholeMinute` fails for `null` and gives the "whole-number minutes" message.
5. Run `npm test`, `npm run typecheck` and `npm run build`. Then report the changed files and the real pass/fail counts.

## Design patterns: I'd use one, possibly two

`AGENTS.md` allows at most 2, each with a problem → pattern → benefit reason:

1. **Functional Core, Imperative Shell** (a module boundary)
   - *Problem:* the booking rule lives inside a React component file, so you can only test it through the UI, and UI edits could accidentally change it.
   - *Pattern:* a pure `checkAvailability(room, start, end) → Result` in `domain/`. `App.tsx` is the "shell": it handles state, parsing and rendering.
   - *Benefit:* AC1–AC5 can be tested in milliseconds without the DOM, and AC6 (UI) and the rule can change separately.

2. **Immutable data / read-only value objects** (optional; only types)
   - *Problem:* AC5 says booking data must not be mutated, but right now nothing enforces that.
   - *Pattern:* `readonly` types on `Booking`/`RoomState`, plus a frozen-input unit test.
   - *Benefit:* any mutation becomes a compile error, so AC5 is checked automatically and isn't just a convention.

**Patterns I'd deliberately not use:**
- **Strategy:** there's only one booking policy, so there's no second policy to switch to.
- **Adapter:** the fixture has only one data shape.
- **Chain of Responsibility / validator classes:** the guard clauses already put the checks in a fixed, readable order, and a chain would make that order harder to keep exactly.
- **Factory / Singleton:** they don't solve any problem in this code.

## Things to leave alone

These look odd, but the tests pin them down, so changing them would break `AGENTS.md`'s rules:
- `parseInt` truncates input: `"12.5"` becomes `12`, so the "whole-number minutes" message is only shown for `null`. Changing this would change behaviour.
- The `Room B-204` text in the messages: don't make it depend on the room. That would be a new feature.
- All Tailwind classes and the `role="status"` banner (AC6).
