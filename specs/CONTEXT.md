# Context: Neon Auth Astro Adapter

## Stack

- **Monorepo:** pnpm workspaces, [neon-js](https://github.com/neondatabase/neon-js)
- **Build:** tsdown (Rolldown-powered), ESM-only output, shared base config at `build/tsdown-base.ts`
- **Framework:** Astro >=5.0.0 (peer dependency, optional)
- **Auth Core:** Better Auth 1.x via framework-agnostic server layer (`packages/auth/src/server/`)
- **Target Package:** `@neondatabase/auth` (`packages/auth/`)
- **Re-export Target:** `@neondatabase/neon-js` (`packages/neon-js/`)

## Domain Model

### Core Abstractions (framework-agnostic — no code changes needed)

| Abstraction | Location | Role |
|---|---|---|
| `RequestContext` | `server/request-context.ts:12-28` | Interface: `getCookies()`, `setCookie()`, `getHeader()`, `getOrigin()`, `getFramework()` |
| `RequestContextFactory` | `server/request-context.ts:41` | `() => RequestContext \| Promise<RequestContext>` |
| `createAuthServerInternal()` | `server/client-factory.ts:31` | Creates proxy-based auth server with all Better Auth methods |
| `handleAuthProxyRequest()` | `server/proxy/handler.ts:41` | Generic proxy: cookie cache → upstream fallback → response minting |
| `processAuthMiddleware()` | `server/middleware/processor.ts:60` | Framework-agnostic middleware: returns decision objects (`allow \| redirect_oauth \| redirect_login`) |
| `validateCookieConfig()` | `server/config.ts:103` | Cookie secret validation (>=32 chars) |
| `NeonAuthConfig` / `NeonAuthMiddlewareConfig` | `server/config.ts:81,86` | Config types (baseUrl, cookies.secret, sessionDataTtl, domain, sameSite) |

### Framework Adapters

| Framework | Adapter | Pattern |
|---|---|---|
| Next.js (reference) | `src/next/server/adapter.ts` | Uses `cookies()` + `headers()` from `next/headers` (implicit per-request context) |
| **Astro (new)** | `src/astro/server/adapter.ts` | Uses `APIContext` explicitly — `context.request.headers.get('cookie')`, `context.cookies.set()`, `context.url.origin` |

### Key difference from Next.js adapter

Next.js uses implicit `cookies()/headers()` with no parameters — they're per-request async context.
Astro requires the `APIContext` object to be threaded explicitly. The adapter factory takes `context: APIContext`.

### Integration Layer (optional)

| Framework | Entry Point | Combines |
|---|---|---|
| Next.js | `next/server/index.ts` → `createNeonAuth()` | `createAuthServerInternal()` + `authApiHandler()` + `neonAuthMiddleware()` → unified `NeonAuth` type |
| **Astro (new)** | `astro/server/index.ts` → `createAstroAuth()` | Analogous — returns server methods + handler + middleware |
| **Astro (new)** | `astro/integration.ts` → `neonAuth()` | `AstroIntegration` that auto-injects route + middleware via `astro:config:setup` hooks |

### Export Hierarchy

```
@neondatabase/auth
├── ./astro          → dist/astro/index.mjs        (client: createAuthClient)
├── ./astro/server   → dist/astro/server/index.mjs  (server: createAstroAuth)

@neondatabase/neon-js (re-exports)
├── ./auth/astro          → re-exports @neondatabase/auth/astro
├── ./auth/astro/server   → re-exports @neondatabase/auth/astro/server
```

## Conventions (from CLAUDE.md)

- TypeScript strict mode enabled
- Functional patterns preferred
- NO `I` prefix in interface names
- Absolute imports using workspace protocol
- Package naming: `@neondatabase/<name>`
- Subpath exports follow Next.js precedent exactly
- `workspace:*` protocol for internal dependencies
- Tests: Vitest with MSW for unit tests, Playwright for E2E
- Build: `tsdown` with shared `createPackageConfig()` base
- CSS: Not applicable (no UI components in this adapter)

## Key Files (reference — read before coding)

| File | Purpose |
|---|---|
| `packages/auth/src/next/server/adapter.ts` | Reference adapter implementation (38 LOC) |
| `packages/auth/src/next/server/handler.ts` | Reference API handler (66 LOC) |
| `packages/auth/src/next/server/middleware.ts` | Reference middleware (111 LOC) |
| `packages/auth/src/next/server/index.ts` | Reference unified entry (208 LOC) |
| `packages/auth/src/next/server/index.test.ts` | Reference test pattern (117 LOC) |
| `packages/auth/tsdown.config.ts` | Entry points + build config |
| `packages/auth/package.json` | Exports + peerDependencies |
| `packages/neon-js/src/auth/next/index.ts` | Re-export wrapper pattern |
| `packages/neon-js/package.json` | Re-export exports map |
| `packages/neon-js/tsdown.config.ts` | Re-export entry points |
