# Scope: Neon Auth Astro Adapter

## In Scope — MVP (v1.0.0)

### Epic 1: Adapter Core
- [ ] `src/server/adapter.ts` — `createAstroRequestContext()` implementing `RequestContext` via Astro's `APIContext`
- [ ] `src/server/adapter.test.ts` — unit tests for all RequestContext methods
- [ ] `src/server/index.ts` — re-export barrel
- [ ] `package.json` exports → `"./server"` entry point
- [ ] tsdown entry for `src/server/index.ts`

### Epic 2: Handler & Middleware
- [ ] `src/server/handler.ts` — `astroApiHandler()` wrapping `handleAuthProxyRequest()`
- [ ] `src/server/handler.test.ts` — proxy request / config validation tests
- [ ] `src/server/middleware.ts` — `astroMiddleware()` wrapping `processAuthMiddleware()` via `defineMiddleware`
- [ ] `src/server/middleware.test.ts` — decision mapping and cookie tests

### Epic 3: Unified Entry & Client
- [ ] `src/server/index.ts` — `createAstroAuth()` combining server + handler + middleware
- [ ] `src/server/index.test.ts` — config validation + return structure tests
- [ ] `src/index.ts` — `createAuthClient()` using `BetterAuthReactAdapter()`
- [ ] `src/index.test.ts` — client shape tests

### Epic 4: Integration & Release
- [ ] `src/integration.ts` — `neonAuth()` AstroIntegration with `astro:config:setup` hooks
- [ ] `src/integration.test.ts` — injectRoute + addMiddleware assertions
- [ ] v1.0.0 published to npm

### Epic 5: Example App (post-release)
- [ ] `examples/astro-neon-auth/` — reference app with handler, middleware, pages
- [ ] Manual E2E smoke test

## Out of Scope

- Database integration (`@neondatabase/postgrest-js`) — already framework-agnostic, no changes needed
- Auth UI components (`@neondatabase/auth-ui`) — React-only; Astro users can import React components directly
- E2E tests requiring Neon backend credentials
- Other framework adapters (SvelteKit, Remix, SolidStart)
- CSS / theming — not applicable

## Design Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | Integration is optional | Users can wire handler/middleware manually via subpath exports or use `neonAuth()` one-liner. Matches Next.js flexibility. |
| D2 | Example inside monorepo | Precedent: `examples/nextjs-neon-auth/`. Benefits: CI integration, `workspace:*` protocol, single PR. |
| D3 | `astro` is optional peer dep | Same pattern as `next`. Users who don't use Astro never install it. |
| D4 | `getCookies()` reads raw Cookie header from `context.request.headers` | `RequestContext` contract returns header string. `APIContext.cookies` is a key-value API — can't use it for this purpose. |
| D5 | API handler returns Response directly | `handleAuthProxyRequest()` already returns a Response with Set-Cookie headers. Astro forwards Response headers including cookies. No manual cookie copying needed. |
| D6 | Middleware uses `defineMiddleware` + `context.redirect()` for auth redirects | Matches Astro idioms. For "allow" case, cookies from `processAuthMiddleware` result are set via `context.cookies.set()`. |
| D7 | Every story starts with a failing test (RED) | TDD discipline — ensures testable contracts before implementation. |

## Files to Create

```
src/
├── index.ts                 (~15 LOC)  — createAuthClient()
├── index.test.ts            (~30 LOC)  — client shape tests
├── integration.ts           (~50 LOC)  — neonAuth() AstroIntegration
├── integration.test.ts      (~40 LOC)  — injectRoute + addMiddleware tests
└── server/
    ├── adapter.ts           (~40 LOC)  — createAstroRequestContext()
    ├── adapter.test.ts      (~50 LOC)  — RequestContext unit tests
    ├── handler.ts           (~40 LOC)  — astroApiHandler()
    ├── handler.test.ts      (~50 LOC)  — proxy request tests
    ├── middleware.ts         (~70 LOC)  — astroMiddleware()
    ├── middleware.test.ts    (~60 LOC)  — decision mapping tests
    ├── index.ts             (~80 LOC)  — createAstroAuth()
    └── index.test.ts        (~60 LOC)  — config validation tests

examples/astro-neon-auth/
├── astro.config.mjs
├── package.json
└── src/
    ├── middleware.ts
    └── pages/
        ├── index.astro
        ├── auth/
        │   └── sign-in.astro
        ├── dashboard.astro
        └── api/
            └── auth/
                └── [...slug].ts
```

## Files to Modify

```
package.json          — exports "./server" + "."
tsdown.config.ts      — entry points for src/index.ts + src/server/index.ts
```
