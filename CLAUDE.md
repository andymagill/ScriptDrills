# ScriptDrills

A TypeScript coding-drill sandbox: pick a random challenge, write the solution in an
in-browser editor, run it, and get instant pass/fail feedback plus an explanation.
Vite + React 19 + shadcn/ui (Tailwind v4). No backend — everything (execution,
persistence) runs client-side in the browser.

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
  and [src/pages/Practice.tsx](src/pages/Practice.tsx) (the challenge workspace —
  editor, run/skip controls, console output, hints, explanation).
- **Challenge data**: [src/data/drill-challenges.json](src/data/drill-challenges.json),
  typed as `Challenge[]` (see [src/types/index.ts](src/types/index.ts)). Loaded
  statically and imported directly into `Practice.tsx` as `challengesData`.
- **Code execution**: user code is transpiled from TS to JS with `sucrase`
  ([src/lib/transpile.ts](src/lib/transpile.ts)), then executed via
  `new Function(code)()` in `Practice.tsx`'s `evaluateCode`. The code the user writes
  is the **entire body of that function** — there's no test harness or hidden
  invocation layer. Whatever the code `return`s is the result, stringified by
  `stringifyResult` (strings pass through as-is; objects/arrays go through
  `JSON.stringify`; everything else via `String()`) and compared against the
  challenge's `expectedOutput` string.
- **Persistence**: all progress (stats, activity log, in-progress challenge) lives in
  `localStorage` under key `ts-sandbox-state`, managed by
  [src/lib/storage.ts](src/lib/storage.ts). There is no server/database. A separate
  `sessionStorage` flag (`ts-sandbox-force-new`) tells `Practice.tsx` to load a fresh
  random challenge instead of resuming the last in-progress one.
- **UI components**: [src/components/ui/](src/components/ui) is a shadcn/ui component
  set (generated, not hand-written business logic). [src/components/CodeEditor.tsx](src/components/CodeEditor.tsx)
  is a custom textarea-based editor with line numbers (not a full code-editor library
  like Monaco/CodeMirror) — no syntax highlighting, no autocomplete.

## Data model & authoring conventions

`Challenge` (in `src/types/index.ts`): `id`, `title`, `description`, optional
`objective`, `hints[]`, `starterCode`, `expectedOutput`, `explanation`.

**`starterCode` must be an unsolved stub, never the answer.** Because the execution
model runs `starterCode` exactly as the user's code (see above), any solution logic
left in `starterCode` is immediately gained by the user without them writing anything.
Concretely: keep fixture/setup `const`/`let` declarations so the user has something
concrete to work against, but replace the actual solving logic with a `// TODO: ...`
comment and no `return` of the right value. This was a real bug in an earlier version
of the challenge data — every `starterCode` was the fully-worked solution — so this
convention is load-bearing, not stylistic.

Two authoring shapes both work as long as the whole file is one script body that ends
by `return`ing the answer:

```ts
// Inline-fixture style (most challenges)
const nums = [1, 2, 3, 4, 5];
// TODO: sum all elements and return the total
```

```ts
// Function-under-test style (used for generic/typed challenges)
function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  // TODO: implement grouping logic
}

const items = [ /* ...fixture... */ ];

return groupBy(items, 'category');
```

The second shape only works if the fixture *and* the call to the function are both
present in `starterCode` — defining a function without invoking it returns
`undefined`. There is no separate "call this with these args" mechanism; if the
invocation isn't in the code, it never happens.

`expectedOutput` is always a string. For non-string return values, write the value as
`JSON.stringify` would render it (`stringifyResult` does this automatically at
runtime — don't call `JSON.stringify` yourself inside `starterCode`/the solution
unless you want the *string* itself to be the visible return value).

### Adding a new challenge

1. Pick the next `ts-0NN` id (sequential, zero-padded to 3 digits).
2. Write `starterCode` as a self-contained script: fixture data + a `// TODO` stub,
   ending in whatever `return` a correct solution would produce.
3. Write out a real solution for the stub and run it manually (transpile with
   `sucrase`'s `transform(code, { transforms: ["typescript"] })`, then
   `new Function(code)()`) to get the exact `expectedOutput` string — don't hand-type
   it, copy the actual runtime output so formatting (JSON key order, spacing) matches.
4. Confirm the *unmodified* `starterCode` does **not** already satisfy
   `expectedOutput` (i.e. it doesn't leak the answer).

## Known gaps

- No automated tests.
- No ESLint config.
- Single production JS chunk is ~530 kB (Vite warns about this at build time); not
  yet code-split.
- The code editor is a plain `<textarea>` — no syntax highlighting, bracket matching,
  or autocomplete.
