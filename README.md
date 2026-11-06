# Smart Campus room availability: Practice #09

**Student:** Almansur Baidildanov, 24B031671 · Thursday 13:00–16:00
**Course:** AI-Driven Software Engineering (KBTU). Practice #09: *Apply a small number of useful patterns*
**AI tool:** Claude Code 2.1.319, model `claude-opus-5-5`

* **Report (PDF):** [`submission/Practice09_Baidildanov_Almansur_Report.pdf`](submission/Practice09_Baidildanov_Almansur_Report.pdf)
* **Agent instructions:** [`AGENTS.md`](AGENTS.md)
* **Evidence:** [`submission/evidence/`](submission/evidence/), containing prompts, AI responses, raw agent logs, test outputs and screenshots
* **Live demo:** see the repository's GitHub Pages link (published from `gh-pages`)

## What changed
One problem: the booking rule and the demo fixture were inside the React UI file. One pattern: a **small module boundary**.
`src/domain/availability.ts` holds the pure rule, `src/data/demoRoom.ts` holds the fixture, and `src/App.tsx` is UI only.
Adapter and Strategy were not used because there is one data shape and one policy.

## Run
```bash
npm install
npm test            # 32 tests: U01-U13 UI, D01-D09/F01/X01 domain, R01-R08 regression
npm run typecheck
npm run build
npm run dev
```
