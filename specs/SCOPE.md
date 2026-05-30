# Scope: Neon Auth Astro Adapter

## In Scope

- [ ] `@neondatabase/auth/astro` — client-side `createAuthClient()` for Astro
- [ ] `@neondatabase/auth/astro/server` — server-side adapter, handler, middleware, `createAstroAuth()`
- [ ] `neonAuth()` AstroIntegration — optional zero-config integration (auto-injects route + middleware)
- [ ] `@neondatabase/neon-js/auth/astro` — re-export wrappers (4 files in `packages/neon-js/src/auth/astro/`)
- [ ] `@neondatabase/neon-js/auth/astro/server` — re-export wrappers
- [ ] Example app: `examples/astro-neon-auth/` (workspace protocol, local build)
- [ ] Tests: config validation, return value structure (matching `next/server/index.test.ts` pattern)
- [ ] TypeScript strict compliance, all `pnpm typecheck` passes
- [ ] `pnpm run build` succeeds for all affected packages
- [ ] `pnpm test:ci` passes for all affected packages

## Out of Scope

- Database integration (`@neondatabase/postgrest-js`) — already framework-agnostic, no changes needed
- Auth UI components (`@neondatabase/auth-ui`) — React-only; Astro users can import React components directly
- E2E tests — requires Neon backend credentials; PR CI will run them
- `@neondatabase/neon-js/cli` — no changes needed
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

## Files to Create

```
packages/auth/src/astro/
├── server/
│   ├── adapter.ts       (~40 LOC)  — RequestContext impl
│   ├── handler.ts       (~40 LOC)  — API proxy handler
│   ├── middleware.ts     (~70 LOC)  — Auth middleware
│   ├── index.ts         (~80 LOC)  — createAstroAuth()
│   └── index.test.ts    (~60 LOC)  — config validation tests
├── integration.ts       (~50 LOC)  — AstroIntegration
└── index.ts             (~15 LOC)  — client createAuthClient()

packages/neon-js/src/auth/astro/
├── index.ts             (~3 LOC)  — re-export @neondatabase/auth/astro
└── server/
    └── index.ts         (~3 LOC)  — re-export @neondatabase/auth/astro/server

examples/astro-neon-auth/
├── astro.config.mjs
├── package.json
└── src/
    ├── middleware.ts
    ├── pages/
    │   ├── index.astro
    │   ├── auth/
    │   │   └── sign-in.astro
    │   ├── dashboard.astro
    │   └── api/
    │       └── auth/
    │           └── [...slug].ts
    └── lib/
        └── auth.ts
```

## Files to Modify

```
packages/auth/package.json          — peerDependencies.astro, exports "./astro" + "./astro/server"
packages/auth/tsdown.config.ts      — add 2 entry points to entry array
packages/neon-js/package.json       — exports "./auth/astro" + "./auth/astro/server"
packages/neon-js/tsdown.config.ts   — add 2 entry points to entry array
```
