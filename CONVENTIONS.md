# Conventions

> Shared rules for all AI agents contributing to the Neon Auth Astro Adapter.

## General

- All planning output goes in `specs/`. Read `specs/` before starting work.
- Every non-trivial change goes through **TDD** (RED → GREEN → REFACTOR).
- Write the minimum code that solves the stated problem. Nothing extra.
- Never refactor, rename, or reorganize code outside the task scope.
- Run `npx vitest run` after every change. Show evidence before declaring done.
- One clarifying question beats a wrong assumption baked into 200 lines.

## Code Style

- TypeScript strict mode. `strict: true` in `tsconfig.json`.
- Functional style preferred. No classes unless the framework requires it (e.g. AstroIntegration).
- NO `I` prefix on interface names. Use `RequestContext`, not `IRequestContext`.
- NO JSDoc or inline comments. Code should be self-explanatory.
- ESM-only output. No CommonJS, no dual-format.

## Commits

- Conventional Commits (Angular convention).
- `feat:` → minor version bump. `fix:` → patch. `docs:`, `chore:`, `refactor:` → no release.
- One `feat:` commit per completed epic on merge to `main`.
- commitlint + husky enforces the convention.

## Architecture

| Layer | File | Purpose |
|-------|------|---------|
| Adapter | `src/server/adapter.ts` | Maps `APIContext` → `RequestContext` |
| Handler | `src/server/handler.ts` | Wraps `handleAuthProxyRequest()` |
| Middleware | `src/server/middleware.ts` | Wraps `processAuthMiddleware()` |
| Unified | `src/server/index.ts` | `createAstroAuth()` returns server + handler + middleware |
| Client | `src/index.ts` | `createAuthClient()` for browser |
| Integration | `src/integration.ts` | `neonAuth()` auto-wires in astro.config.mjs |

## Build & Dependencies

- `npx tsdown` to build. Never `pnpm run build`.
- `npx vitest run` to test. Never `pnpm run test`.
- Dependencies from npm registry. No `workspace:*` protocol.
- `@neondatabase/auth` is the core auth library — import and wrap, never modify.

## Defensive Code

The following defensive categories apply to this project:

- **Timeout:** Proxy requests to upstream better-auth server may hang. Always wrap upstream calls with a timeout (e.g. AbortSignal).
- **Graceful degradation:** If upstream is unreachable, middleware should not crash the page — serve an allow decision (degraded auth).

## Never Do

- ✗ Modify `@neondatabase/auth` internals
- ✗ Use `workspace:*` protocol
- ✗ Use pnpm scripts for build, test, or lint
- ✗ Generate CJS or dual-format output
- ✗ Commit secrets, tokens, or `.env` files
- ✗ Add UI components (CSS, styling, HTML templates)
