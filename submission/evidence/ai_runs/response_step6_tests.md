<!-- session 99fe02b2-2869-46c0-84fd-c017c20f8774 | model claude-opus-5-5 | tools ['Bash', 'Edit', 'Glob', 'Grep', 'Read', 'Write'] -->
<!-- TOOL CALL: Bash {"command": "ls -R src tests && cat package.json && cat src/domain/availability.ts src/data/demoRoom.ts && ls node_modules | head -3", "description": "Inspect project structure and source"} -->
<!-- TOOL CALL: Glob {"pattern": "{src,tests}/**/*"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step6_tests/package.json"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step6_tests/src/domain/availability.ts"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step6_tests/src/data/demoRoom.ts"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step6_tests/src/domain/availability.test.ts"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step6_tests/tests/ui.regression.test.tsx"} -->
<!-- TOOL CALL: Glob {"pattern": "{vite,vitest}.config.*"} -->
<!-- TOOL CALL: Bash {"command": "npm test 2>&1 | tail -40", "description": "Run baseline test suite before changes"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step6_tests/vite.config.ts"} -->
<!-- TOOL CALL: Read {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step6_tests/src/App.tsx"} -->
<!-- TOOL CALL: Write {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step6_tests/src/domain/availability.regression.test.ts", "content": "/**\n * Focu -->
<!-- TOOL CALL: Bash {"command": "npm test 2>&1 | tail -45; echo \"EXIT=${pipestatus[1]}\"", "description": "Run full test suite after adding tests"} -->
<!-- TOOL CALL: Bash {"command": "npm run typecheck 2>&1; echo \"EXIT=$?\"", "description": "Run TypeScript type check"} -->
<!-- TOOL CALL: Bash {"command": "npm test", "description": "Run full test suite after adding tests"} -->
<!-- TOOL CALL: Bash {"command": "npm run typecheck", "description": "Run TypeScript type check"} -->
<!-- result: success | turns 17 | 60755 ms -->

I added 8 regression tests (R01–R08) in one new file, `src/domain/availability.regression.test.ts`. All 32 tests pass and the type check is clean. No existing test file was edited, so all D01–D09, F01, X01 and U01–U13 assertions are unchanged. The app code is unchanged too.

## Results

| Command | Before | After |
|---|---|---|
| `npm test` | 2 files, **24 passed** | 3 files, **32 passed (32)**, 0 failed |
| `npm run typecheck` (`tsc --noEmit`) | — | no errors (empty output) |

```
 Test Files  3 passed (3)
      Tests  32 passed (32)
```

## What each test expects and why

All tests use the demo data: the current time is 540 (09:00) and there is one existing booking from 600 to 660 (10:00–11:00). Each test checks the full result: whether the room is available, and the exact message text.

- **R01, past time (AC1).** Any request that starts at or before the current time is rejected. So 539–560 (one minute before now) and 0–60 both get "Start must be later than the current time (540 min = 09:00)." A request starting at 541 is allowed, which shows the cut-off is at 540 exactly.
- **R02, reversed interval (AC1).** A request where start is after end is rejected: 841–720 gets "Start must be earlier than end…". For 500–400, which is both reversed and in the past, the reversed message wins because that check runs first. AGENTS.md says the order of checks must stay the same, so this test locks it.
- **R03, 121-minute duration (AC2).** Anything over 120 minutes is rejected with the real length: "…this request is 121 minutes." I tested this in the middle of the day (720–841) and at the end of the day (1319–1440). Exactly 120 minutes (720–840 and 1320–1440) is allowed.
- **R04, check order (AC2 before AC4).** 600–721 is both too long and overlapping. It reports the duration, because the length check runs before the overlap check.
- **R05, blocked room (AC3).** A blocked room is always rejected with "Room B-204 is blocked (demo)…". That holds for a free slot (660–720), a 120-minute slot, and an overlapping slot (630–690). In the last case the blocked check runs before the overlap check.
- **R06, overlap (AC4).** Bookings are treated as `[start, end)`: the start minute is included, the end minute is not. Five overlap shapes are all rejected with the same message, "Overlaps an existing booking (600–660 min = 10:00–11:00)":
  - one minute into the start (541–601)
  - one minute into the end (659–720)
  - inside the booking (610–650)
  - covering the whole booking (590–670)
  - exactly the same times (600–660)
- **R07, touching endpoints (AC4).** Because the end minute is not included, 660–720 and 550–600 only touch the booking and are allowed. With two bookings (600–660 and 720–780), the slot 660–720 fills the gap exactly and is still allowed.
- **R08, fixtures unchanged (AC5).** Every case runs twice on a fully frozen copy of the demo data, so any attempt to change it would throw an error. The two runs must give the same answer, and the result must match the one from the real demo data. Afterwards the demo data must equal a snapshot taken before the test, keep the same booking list, and still have exactly 1 booking.

AC6 (messages and the `role="status"` banner in the UI) stays covered by U01–U13, which I didn't touch. The new tests fix the exact message text the banner shows.

## Notes
- Several of the requested cases were already covered (D01/D03/D05–D07/D09 and U01–U10/U13). The new tests add the boundaries, check order and fixture-freezing that weren't tested before.
- The new file is under `src/domain/`, so the existing `vite.config.ts` test settings pick it up without any config change.
- These tests pass against the current code. I didn't check that each one fails when the rule it guards is broken.
- Nothing is committed. You're on branch `ai-tests`; tell me if you want a commit.
