# ScriptDrills

A TypeScript coding-drill sandbox: pick a random challenge, write the solution in an
in-browser editor, run it, and get instant pass/fail feedback plus an explanation.
Vite + React 19 + shadcn/ui (Tailwind v4). No backend — everything runs client-side.

## Commands

```bash
npm install
npm run dev         # start Vite dev server
npm run typecheck   # tsc --noEmit
npm run build        # tsc -b && vite build
npm run preview      # preview a production build
```

There is no test suite and no linter configured in this repo.

## Architecture

- **Routing**: hand-rolled in [src/App.tsx](src/App.tsx) — no router library. Reads
  `window.location.pathname` (`/practice`) or a `#practice` hash to pick between two
  pages, and pushes history state on navigation.
- **Pages**: [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) (stats + activity log)
  and [src/pages/Practice.tsx](src/pages/Practice.tsx) (the challenge workspace).
- **Challenge data**: [src/data/drill-questions.json](src/data/drill-questions.json),
  typed as `Challenge[]` (see [src/types/index.ts](src/types/index.ts)). Loaded
  statically and imported directly into `Practice.tsx`.
- **Code execution**: user code is transpiled from TS to JS with `sucrase`
  ([src/lib/transpile.ts](src/lib/transpile.ts)), then run via `new Function(...)` in
  `Practice.tsx`. The returned value is stringified and compared against each
  challenge's `expectedOutput` string.
- **Persistence**: all progress (stats, activity log, in-progress challenge) lives in
  `localStorage` under key `ts-sandbox-state`, managed by
  [src/lib/storage.ts](src/lib/storage.ts). There is no server/database.
- **UI components**: [src/components/ui/](src/components/ui) is a shadcn/ui component
  set (generated, not hand-written business logic). [src/components/CodeEditor.tsx](src/components/CodeEditor.tsx)
  is a custom textarea-based editor with line numbers (not a full code-editor library
  like Monaco/CodeMirror).

## Data model

`Challenge` (in `src/types/index.ts`): `id`, `title`, `description`, optional
`objective`, `hints[]`, `starterCode`, `expectedOutput`, `explanation`.

Note: there is a second, differently-shaped `drill-questions.json` at the repo root
(not `src/data/`) with placeholder content and no `objective` field — it is not wired
into the app and is not the same file the UI reads from.

## Known gaps

- No automated tests.
- No ESLint config.
- Single production JS chunk is ~514 kB (Vite warns about this at build time); not
  yet code-split.
