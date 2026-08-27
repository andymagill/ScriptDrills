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
npm run lint         # eslint .
npm run lint:fix     # eslint . --fix
npm test             # vitest run (single run)
npm run test:watch   # vitest (watch mode)
```

A husky pre-commit hook runs `lint-staged` (`eslint --fix` on staged `.ts`/`.tsx`
files) so commits stay fast. A pre-push hook runs `typecheck` + the full test suite,
so nothing broken reaches the remote. Both are wired via the `prepare` script, so
`npm install` sets them up automatically.

## Architecture

- **Routing**: hand-rolled in [src/App.tsx](src/App.tsx) — no router library. Reads
  `window.location.pathname` (`/practice`) or a `#practice` hash to pick between two
  pages, and pushes history state on navigation. Because `/practice` is a real
  pathname (not just a hash), the host must serve `index.html` for every unmatched
  path — see the `assets.not_found_handling` setting in
  [wrangler.jsonc](wrangler.jsonc) — or a direct link/refresh on `/practice` 404s.
- **Deployment**: Cloudflare **Workers** static assets (not classic Pages), via
  the native Git integration — no CI config in this repo. Every push to `main`
  builds (`npm run build`, output `dist`) and deploys automatically; PRs get
  preview deployments. Node version for the build comes from
  [.node-version](.node-version); asset/SPA behavior comes from
  [wrangler.jsonc](wrangler.jsonc).
  **Don't reintroduce a `public/_redirects` file for SPA fallback.** The
  Pages-era rule `/* /index.html 200` is rejected on this platform with
  "Infinite loop detected in this rule" (error 100324) — a known validator
  false-positive ([workers-sdk#11824](https://github.com/cloudflare/workers-sdk/issues/11824)) —
  and it broke production deploys once already. `not_found_handling` is the
  supported mechanism here.
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
  [src/lib/storage.ts](src/lib/storage.ts), with **no cap** on the activity log — every
  attempt ever made is kept, so per-challenge history and counts stay exact. There is no
  server/database. A separate `sessionStorage` flag (`ts-sandbox-force-new`) tells
  `Practice.tsx` to load a fresh random challenge instead of resuming the last
  in-progress one.
- **Dashboard's Activity Log is grouped by challenge, not by attempt**: `getChallengeSummaries()`
  in `storage.ts` collapses the raw per-attempt log into one row per distinct
  `challengeId` (title, `bestStatus`, `attemptCount`, `lastAttemptAt`), sorted by most
  recently attempted. `bestStatus` ranks `correct` > `skipped` > `incorrect`, so a
  challenge that was failed once and later solved still shows "Correct" — re-solving an
  already-finished challenge (random selection can repick one) only bumps `attemptCount`,
  it doesn't create a second row. Clicking a row opens a `Drawer` showing that
  challenge's full attempt history via `getChallengeHistory(challengeId)` (filters the
  same log, doesn't re-fetch anything). The "Total Challenges" stat is
  `getFinishedChallengeCount()` — distinct challenges with a `correct` or `skipped`
  entry; a challenge currently active/in-progress with only `incorrect` attempts logged
  doesn't count yet, so this can differ from `totalCorrect + totalSkipped` (which count
  attempts, not distinct challenges).
- **UI components**: [src/components/ui/](src/components/ui) is a shadcn/ui component
  set (generated, not hand-written business logic). [src/components/CodeEditor.tsx](src/components/CodeEditor.tsx)
  wraps CodeMirror 6 (`@uiw/react-codemirror`) with the `javascript({ typescript: true })`
  language extension (highlighting only — no type-checking) and the `oneDark` theme.
  Tab inserts indentation (`indentWithTab` + a 2-space `indentUnit`) rather than moving
  focus, matching the editor's old textarea behavior. `disabled` maps to `editable={false}`
  plus a dimmed wrapper, since CodeMirror doesn't style read-only state on its own.
- **Theming**: [src/index.css](src/index.css) is a custom tweakCN-exported theme (teal
  primary, `--radius: 0.1rem` for near-square corners), not shadcn's default neutral
  preset — see the comment block at the top of that file before regenerating it via the
  shadcn CLI, which would silently overwrite it. `--font-sans` (Open Sans) and
  `--font-serif` (Source Serif 4) are loaded from Google Fonts in `index.html`;
  `--font-mono` names "Google Sans Code" first but that font isn't publicly available, so
  it falls back to the system-monospace stack. `ThemeProvider` (`src/components/theme-provider.tsx`)
  and `ModeToggle` (`src/components/mode-toggle.tsx`) predate this theme and already
  supported light/dark/system — `ModeToggle` just wasn't rendered anywhere until now; it's
  in both page headers. `CodeEditor`'s `oneDark` CodeMirror theme and `Practice.tsx`'s
  console-output panel are intentionally hardcoded dark regardless of light/dark mode
  (common for code editors/consoles) — they don't follow the `:root`/`.dark` tokens.
- **Code splitting**: `CodeEditor` is loaded via `React.lazy` in `Practice.tsx` (wrapped
  in a `Suspense` with a `Skeleton` fallback matching its size) rather than imported
  statically, so CodeMirror's ~500 kB doesn't ship in the main bundle Dashboard also
  pays for. `Dashboard.tsx` has a `useEffect` that prefetches the `CodeEditor` chunk via
  `requestIdleCallback` (falling back to `setTimeout` where unsupported, e.g. Safari) so
  it's usually already cached by the time a user navigates to `/practice` — the
  `Suspense` fallback is a genuine fallback for the fast path, not the expected UX. If
  more routes/heavy components are added, follow the same pattern: lazy-load the heavy
  piece, eager-prefetch it from whatever screen precedes it.

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

## Linting & testing

- ESLint uses a flat config ([eslint.config.js](eslint.config.js)): `typescript-eslint`
  + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`, matching the standard
  Vite/React template setup. `src/components/ui/**` and `src/hooks/use-mobile.ts` are
  excluded — they're generated shadcn/ui vendor code, not hand-maintained app code,
  and the newer `react-hooks` v7 rules (purity/set-state-in-effect checks aimed at
  React Compiler) flag several idiomatic patterns in there that aren't worth hand-
  editing library output to satisfy.
- Tests run on **Vitest**, not Jest — it reuses `vite.config.ts` directly (see the
  `test` block there, `environment: "jsdom"`) with no extra ESM/TS transform config,
  unlike Jest in a Vite/ESM project. `globals: true` means `describe`/`it`/`expect`
  don't need explicit imports, though existing tests import them anyway for clarity.
- Current coverage: [src/lib/storage.test.ts](src/lib/storage.test.ts) covers the
  localStorage-backed stats/activity-log/active-challenge logic in
  [src/lib/storage.ts](src/lib/storage.ts), including the challenge-grouping helpers
  (`getChallengeSummaries`, `getChallengeHistory`, `getFinishedChallengeCount`).
  Nothing else has tests yet — see gaps below for good next targets.

## Known gaps

- Only `storage.ts` has test coverage. Good next candidates: a data-integrity test
  over `drill-challenges.json` (unique ids, and — given the answer-leak bug this
  repo already had once — asserting no `starterCode` already satisfies its
  `expectedOutput`), a `transpile.ts` unit test, and a React Testing Library
  integration test over the `Practice` run/evaluate flow.
- No bracket matching or autocomplete in the editor (CodeMirror's `javascript()`
  extension only enables highlighting here — `closeBrackets`/autocompletion would need
  their own extensions added to `CodeEditor.tsx`).
