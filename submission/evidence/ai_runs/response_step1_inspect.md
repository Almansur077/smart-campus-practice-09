<!-- session 46b597f0-c444-423b-a4e5-cc2a7ac5cd73 | model claude-opus-5-5 | tools ['Glob', 'Grep', 'Read'] -->
<!-- TOOL CALL: Glob {"pattern": "**/*"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step1_inspect/src/App.tsx"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step1_inspect/tests/ui.regression.test.tsx"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step1_inspect/package.json"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step1_inspect/vite.config.ts"} -->
<!-- result: success | turns 6 | 31609 ms -->

I read every source and test file. Nothing was changed, and I didn't run the tests because I only had read-only tools.

## What's where

| Part | Location |
|---|---|
| **Booking rule** | `checkAvailability()` in `src/App.tsx:27-64`, with helpers `overlaps()` (`:23`), `isWholeMinute()` (`:19`), `formatTime()` (`:66`) and constants `MAX_MINUTES` / `DAY_MINUTES` (`:16-17`) |
| **UI** | `App` component at `src/App.tsx:98-243` and `InfoRow` at `:86`; required-field check `validateRequired()` at `:80`; input parsing in `handleSubmit` at `:109-121` |
| **Fixture data** | `DEMO_ROOM` at `src/App.tsx:74-78`: now = 540, one booking 600–660, not blocked. `App` copies it at `:99-103` (this supports AC5) |
| **Tests** | `tests/ui.regression.test.tsx`: tests U01–U13 drive the form and check the exact status text. They cover AC1 (U01–U04, U11), AC2 (U05–U06), AC3 (U07), AC4 (U08–U10), AC5 (U13) and AC6 (U12). `vite.config.ts:8` already includes `src/**/*.test.ts`, so unit tests can be added without changing the config |

## Three maintainability problems

1. **Everything is in one file, and the rule can only be tested through the UI.** Rule, fixture, formatting and React component all sit in `src/App.tsx`, and `checkAvailability` isn't exported (`:27`). So each AC can only be checked by rendering `<App />` and comparing the final message (`tests/ui.regression.test.tsx:15-23`). Moving the rule out of this file means editing the UI file.

2. **The rule is tied to one room and to UI state.** The rule's messages hardcode `'Room B-204'` (`src/App.tsx:53`, `:63`), as the UI does (`:136`, `:142`). Blocked status is stored twice: once as `DEMO_ROOM.blocked` (`:76`) and once as separate `blocked` state (`:106`). The UI's value overwrites the fixture's at `:120` (`{ ...room, blocked }`), so the fixture's `blocked` field never has any effect.

3. **Input checks are split across three places.** They are `validateRequired` (`:80-84`), `parseInt` in `handleSubmit` (`:116-119`) and `isWholeMinute` inside the rule (`:28-30`). `parseInt` drops anything after the leading digits, so `"660.5"` becomes `660` and `"12abc"` becomes `12`. As a result, the rule's "whole-number minutes" message can only appear for unparseable input, never for decimals, and no test covers those inputs. Someone changing validation has to find all three places.

## Patterns: I recommend none

`checkAvailability` is a short sequence of early-return checks in a fixed order, and the order matters for which message appears (for example, U07 relies on the blocked check coming after the time checks). Strategy or Chain of Responsibility would add interfaces and wiring to fix a problem this code doesn't have, and could accidentally change the check order or the messages that U01–U13 compare exactly.

Plain refactorings are enough:
- **Extract Module:** move the rule, its types and `formatTime` into e.g. `src/availability.ts`, and `DEMO_ROOM` into e.g. `src/demoRoom.ts`. Export them and add unit tests in `src/*.test.ts`.
- **Introduce Parameter:** pass the room name into the rule (or add it to the room data) instead of hardcoding `'B-204'`, and keep blocked status in one place.
- **Consolidate parsing:** put input parsing in one function, keeping today's `parseInt` behaviour unless you decide to change it. If you do, add tests for it first.

## Keeping AC1–AC6 and the UI intact

- Keep every message string exactly as it is (U01–U13 compare full text).
- Keep the check order: whole-minute → day range → start ≥ end → past → duration → blocked → overlap.
- Keep the strict `<` / `>` comparisons in `overlaps()` so bookings that only touch at endpoints are still allowed (AC4).
- Keep the copy at `:99-103` so the fixture is never mutated (AC5).
- Don't touch the markup or Tailwind classes, including the `role="status"` result box and the `sm:` breakpoints, so desktop/mobile feedback stays the same (AC6).
- Run the UI tests without changes before and after each step.
