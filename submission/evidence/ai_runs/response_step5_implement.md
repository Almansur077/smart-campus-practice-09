<!-- session bc8bb705-1c8c-4a9d-91a2-45b55bdd4005 | model claude-opus-5-5 | tools ['Bash', 'Edit', 'Glob', 'Grep', 'Read', 'Write'] -->
<!-- TOOL CALL: Bash {"command": "ls -a && cat AGENTS.md | head -5 && cat src/App.tsx && ls tests src && cat package.json && cat tsconfig*.json", "description": "Inspect project files"} -->
<!-- TOOL CALL: Bash {"command": "npm test 2>&1 | tail -25 && npm run typecheck 2>&1 | tail -3; cat vite.config.ts; head -20 tests/ui.regression.test.tsx", "description": "Run baseline tests and typecheck"} -->
<!-- TOOL CALL: Write {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step5_implement/src/domain/availability.ts", "content": "// Pure booking rule for -->
<!-- TOOL CALL: Write {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step5_implement/src/data/demoRoom.ts", "content": "// Fictional demo fixture for  -->
<!-- TOOL CALL: Edit {"replace_all": false, "file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step5_implement/src/App.tsx", "old_string": "} from 'lucide -->
<!-- TOOL CALL: Write {"file_path": "/private/tmp/claude-501/-Users-almansurbajdildanov/fe3a16e8-0792-4204-9db6-8c3b29c3d301/scratchpad/runs/step5_implement/src/domain/availability.test.ts", "content": "/**\n * Domain test -->
<!-- TOOL CALL: Bash {"command": "npm test 2>&1 | tail -35; npm run typecheck; echo \"typecheck exit=$?\"; git status --short; git diff --stat", "description": "Run tests and typecheck after change"} -->
<!-- TOOL CALL: Bash {"command": "npm test 2>&1", "description": "Run test suite"} -->
<!-- TOOL CALL: Bash {"command": "npm run typecheck 2>&1", "description": "Run TypeScript type check"} -->
<!-- TOOL CALL: Bash {"command": "git status --short", "description": "Show changed files"} -->
<!-- result: success | turns 11 | 60048 ms -->

The booking rule and the demo fixture are now in their own modules, so the rule can be tested without the UI. All 24 tests pass and the type check is clean. Function signatures, messages, check order and UI markup are unchanged.

## Changed files
- **`src/domain/availability.ts`** (new): `checkAvailability` and `formatTime`, plus the helpers, types and constants they use, copied over unchanged. Only `checkAvailability`, `formatTime`, `MAX_MINUTES` and the types are exported; the other helpers stay private.
- **`src/data/demoRoom.ts`** (new): `DEMO_ROOM`, unchanged (`now: 540`, not blocked, one booking 600–660).
- **`src/App.tsx`**: about 70 lines of rule and fixture code removed and replaced with two imports. It still has its UI state, input parsing (`validateRequired`, `parseInt`), the copy of the fixture into state, and all the JSX and Tailwind classes, all unchanged.
- **`src/domain/availability.test.ts`** (new): 11 regression tests that call the rule directly:
  - D01–D07 cover AC1 to AC4, including bad or missing input and times outside the day.
  - D08 checks the order of the checks (duration before blocked, blocked before overlap).
  - D09 checks AC5 (input is not changed and repeated checks give the same answer).
  - F01 covers `formatTime` and X01 checks the fixture values.

  The file already matches the test pattern in `vite.config.ts`, so no config change was needed.

`tests/ui.regression.test.tsx` was not touched, and no dependencies were added.

## Pattern
I didn't use one. The problem was that the rule lived in the UI file, and moving it into its own module solves that. There is only one fixture shape and one policy, so Adapter or Strategy would add structure without fixing anything.

## Test evidence
| Command | Before | After |
|---|---|---|
| `npm test` | 1 file, **13 passed (13)** | 2 files, **24 passed (24)**, 0 failed |
| `npm run typecheck` | no errors | no errors |

U01–U13 pass unchanged after the refactor, so the behaviour you see in the UI is the same. Nothing is committed yet; the changes are in the working tree on branch `ai-refactor`.
