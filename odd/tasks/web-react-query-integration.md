# Feature: web React Query integration

Status: implemented, verification passed, committed as one work unit
Owner: el Gentleman (parent session)
Branch: `fix/web-query-client-provider` (branched from `main` before committing)

## Problem

`bun run dev` in `apps/web` crashes during SSR (`renderToReadableStream`) with:

```
Error: No QueryClient set, use QueryClientProvider to set one
    at useQueryClient (node_modules/@tanstack/react-query/src/QueryClientProvider.tsx:29:11)
```

Root cause (evidence):

- `apps/web/src/routes/__root.tsx:1` imports `ReactQueryDevtools` and `:55` renders it inside
  `RootDocument`, so it runs on every SSR render.
- `ReactQueryDevtools` calls `useQueryClient()` internally, which throws without a provider.
- No `QueryClient`, `QueryClientProvider` or `routerWithQueryClient` exists anywhere in the
  repository.
- `apps/web/package.json:20,22,45` still installs `@tanstack/react-query`,
  `@tanstack/react-query-devtools` and `@tanstack/react-router-with-query@1.130.17`, but the
  generator never wired them: `apps/web/src/router.tsx` creates the router with an empty
  `context: {}` and a pass-through `Wrap`.

## Decision

Wire React Query properly with `routerWithQueryClient` (user choice, option B) instead of
removing the devtools component.

`router.options.Wrap` wraps the whole `RouterProvider`
(`@tanstack/react-router/dist/esm/RouterProvider.js:25`), so a `QueryClientProvider` installed
there also covers `RootDocument` and its devtools.

## Non-goals

- No data fetching, queries, loaders or API client work in this change.
- No version bumps, no new dependencies, no removal of existing ones.
- No commit, push, or PR without explicit user authorization.

## Acceptance criteria

- `bun run dev` in `apps/web` renders the app without the `No QueryClient set` error.
- `getRouter()` exposes a `QueryClient` both in the router context (for loaders) and through
  `router.options.Wrap` (for components).
- A regression test fails before the fix and passes after it.
- `bun run build` and `bun run test` still succeed.

## Tasks

- [x] 1. Add a regression test that renders the router `Wrap` with a consumer of
      `useQueryClient` and fails while no provider is installed (RED).
- [x] 2. Create the `QueryClient` and wrap the router with `routerWithQueryClient` in
      `apps/web/src/router.tsx`.
- [x] 3. Type the router context with `queryClient` in `apps/web/src/routes/__root.tsx`.
- [x] 4. Verify: focused test GREEN, SSR request without render error, build and test suite.

## Verification plan

Test-first applies to tasks 1-3: the regression test must fail for the reported reason before the
fix and pass after it. Task 4 is functional verification of the original failing path (SSR render
through the dev server) plus the existing build and test commands.

## Evidence

- Baseline: `bun run test` in `apps/web` -> `No test files found, exiting with code 0`.
- RED (observed inline before the fix): `bunx vitest run src/router.test.tsx` ->
  `AssertionError: expected [Function] to not throw an error but 'Error: No QueryClient set,
  use QueryClientProvider to set one' was thrown`.
- GREEN (observed inline after the fix): same command -> `Test Files 1 passed (1)`,
  `Tests 1 passed (1)`.
- Independent verification (gentle-ai-verify, read-only):
  - `bunx tsc --noEmit -p tsconfig.json` -> exit 0, zero diagnostics.
  - `bun run test` -> 1 file / 1 test passed, not a vacuous `passWithNoTests` run.
  - `bun run build` -> exit 0, client 2509 modules, SSR `dist/server/server.js` 253.15 kB.
  - SSR smoke test on port 3001 -> HTTP 200, served HTML contains no `No QueryClient set`
    and no `renderToReadableStream` error; genuine rendered markup with streamed-router script.
  - Pre-existing unrelated warnings: duplicated `vite-tsconfig-paths` notice and a >500 kB
    client chunk.
- Files touched: `apps/web/src/router.tsx`, `apps/web/src/routes/__root.tsx`,
  `apps/web/src/router.test.tsx` (new).
- Commit: `e28666e` on `fix/web-query-client-provider`
  ("fix(web): provide QueryClient through the router"), 3 files, +36/-4. Not pushed.

## Follow-ups

- Not in this change: no loader/query exists yet, so `context.queryClient` is wired but unused.
- Still untracked and outside this commit: `odd/` (this document), `apps/web/src/routeTree.gen.ts`
  (generated), `local.db`.
