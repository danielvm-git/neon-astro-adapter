# Release Plan: Neon Auth Astro Adapter

## Version Strategy

All epics produce a single `feat:` merge commit → minor version bump each.
MVP v1.0.0 ships when Epics 1-4 are complete. Epic 5 is docs-only (no release).

| Epic | Conventional Commit | Version Bump | MVP Gate |
|---|---|---|---|
| 1: Adapter Core | `feat:` | minor | `createAstroRequestContext()` compiles |
| 2: Handler & Middleware | `feat:` | minor | API handler mounts in `[...slug].ts` |
| 3: Unified Entry & Integration | `feat:` | minor | `createAstroAuth()` one-liner works |
| 4: Integration + v1.0.0 | `feat:` | minor → v1.0.0 | `neonAuth()` auto-wires in astro.config |
| 5: Example App | `docs:` | none | Manual smoke test passes |

---

## Epic 1: Adapter Core — `feat:` → minor

**MVP gate:** `import { createAstroRequestContext } from '@danielvm/neon-astro-auth/server'` compiles and works.

### Story 1.1 — Write adapter test (RED)
- **File:** `src/server/adapter.test.ts`
- **Test:** Instantiates adapter with mock `APIContext`, verifies `getCookies()`, `setCookie()`, `getHeader()`, `getOrigin()` return expected values
- **Verify:** `npx vitest run src/server/adapter.test.ts` fails (no impl)

### Story 1.2 — Implement adapter (GREEN)
- **File:** `src/server/adapter.ts`
- **Implements:** `RequestContext` interface mapping `APIContext.request.headers.get('cookie')`, `context.cookies.set()`, `context.url.origin`
- **Verify:** `npx vitest run src/server/adapter.test.ts` passes

### Story 1.3 — Refactor + wire exports (REFACTOR)
- **Files:** `package.json` exports, `tsdown.config.ts` entry points
- **Change:** Add `"./server"` export, tsdown entry for `src/server/index.ts`
- **Verify:** `npx tsdown && node -e "require('./dist/server/index.mjs')"` works

---

## Epic 2: Handler & Middleware — `feat:` → minor

**MVP gate:** User can mount the API handler in `src/pages/api/auth/[...slug].ts`.

### Story 2.1 — Write handler test (RED)
- **File:** `src/server/handler.test.ts`
- **Test:** Mock fetch to upstream; verify proxy request passes config; invalid config throws
- **Verify:** test fails

### Story 2.2 — Implement handler (GREEN)
- **File:** `src/server/handler.ts`
- **Implements:** `astroApiHandler()` returning `(context: APIContext) => Promise<Response>` wrapping `handleAuthProxyRequest()`
- **Verify:** test passes

### Story 2.3 — Write middleware test (RED)
- **File:** `src/server/middleware.test.ts`
- **Test:** `processAuthMiddleware` decision → `redirect()` or `next()` mapping; cookie setting on allow
- **Verify:** test fails

### Story 2.4 — Implement middleware (GREEN)
- **File:** `src/server/middleware.ts`
- **Implements:** `astroMiddleware()` — session-check middleware; allows/redirects based on upstream get-session call
- **Verify:** test passes

### Story 2.5 — Refactor + wire exports
- **Files:** `src/server/index.ts` barrel
- **Change:** Export `astroApiHandler`, `astroMiddleware` types alongside adapter
- **Verify:** `npx tsdown && npx tsc --noEmit && npx vitest run`

---

## Epic 3: Unified Entry & Client — `feat:` → minor

**MVP gate:** One-liner `createAstroAuth(config)` returns `{ handler(), middleware() }`.

**Architecture note:** `createAuthServerInternal()` is not exported from `@neondatabase/auth` (confirmed via opensrc). Our `createAstroAuth` returns handler + middleware only — no server methods (signIn, signUp, etc.). Those live in the client-side `createAuthClient()`.

### Story 3.1 — Write index test (RED)
- **File:** `src/server/index.test.ts`
- **Test:** Config validation (secret missing/short/valid); return structure has `.handler()` (returns `{ GET, POST, ... }`) and `.middleware()` (returns MiddlewareFn)
- **Verify:** test fails

### Story 3.2 — Implement createAstroAuth() (GREEN)
- **File:** `src/server/index.ts`
- **Implements:** `createAstroAuth(config)` — validates config, wires `astroApiHandler` + `astroMiddleware`, returns `{ handler: () => astroApiHandler(config), middleware: (overrides?) => astroMiddleware({...config, ...overrides}) }`
- **Verify:** test passes

### Story 3.3 — Write client test (RED)
- **File:** `src/index.test.ts`
- **Test:** `createAuthClient(url)` returns object with `signIn`, `signUp`, `getSession` methods
- **Verify:** test fails

### Story 3.4 — Implement createAuthClient() (GREEN)
- **File:** `src/index.ts`
- **Implements:** Thin wrapper around `createAuthClient` from `@neondatabase/auth` (defaults to `BetterAuthVanillaAdapter`)
- **Verify:** test passes

---

## Epic 4: Integration + v1.0.0 — `feat:` → minor (v1.0.0)

**MVP gate:** `neonAuth()` integration auto-wires in `astro.config.mjs`.

### Story 4.1 — Write integration test (RED)
- **File:** `src/integration.test.ts`
- **Test:** AstroIntegration hook `astro:config:setup` fires `injectRoute` and `addMiddleware`
- **Verify:** test fails

### Story 4.2 — Implement integration (GREEN)
- **File:** `src/integration.ts`
- **Implements:** `neonAuth()` returning `AstroIntegration` with `astro:config:setup` hook
- **Verify:** test passes

### Story 4.3 — Publish v1.0.0
- Semantic-release aggregates all `feat:` commits into one minor bump per epic
- All epics 1-4 complete → v1.0.0
- **Verify:** `npx semantic-release --dry-run --no-ci` shows v1.0.0

---

## Epic 5: Example App — `docs:` → no release

### Story 5.1 — Create example app
- **Files:** `examples/astro-neon-auth/`
- **Verify:** `cd examples/astro-neon-auth && pnpm run build`

### Story 5.2 — E2E smoke test
- **Verify:** Manual smoke test of auth flow in example app

---

## Execution Order

```
Epic 1: 1.1(RED) → 1.2(GREEN) → 1.3(REFACTOR)
                ↓
Epic 2: 2.1(RED) → 2.2(GREEN)
        2.3(RED) → 2.4(GREEN)     (parallel with 2.1-2.2)
                ↓
Epic 3: 3.1(RED) → 3.2(GREEN)
        3.3(RED) → 3.4(GREEN)     (parallel with 3.1-3.2)
                ↓
Epic 4: 4.1(RED) → 4.2(GREEN) → 4.3(v1.0.0)
                ↓
Epic 5: 5.1 → 5.2                 (after publish)
```
