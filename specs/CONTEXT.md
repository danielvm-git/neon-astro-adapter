# Context: Neon Auth Astro Adapter

## Stack

- **Project:** Standalone `@danielvm/neon-astro-auth` (not part of neon-js monorepo)
- **Build:** tsdown (Rolndown-powered), ESM-only output
- **Framework:** Astro >=5.0.0 (peer dependency, optional)
- **Auth Core:** `@neondatabase/auth` (npm dependency) — Better Auth 1.x via framework-agnostic server layer
- **Runtime:** Node v26, pnpm v11.1.2 (with `ignore-scripts=true` workaround)
- **Release:** semantic-release via GitHub Actions

## Domain Model

### Core Abstractions (provided by `@neondatabase/auth` — no changes needed)

| Abstraction | Role |
|---|---|
| `RequestContext` | Interface: `getCookies()`, `setCookie()`, `getHeader()`, `getOrigin()`, `getFramework()` |
| `RequestContextFactory` | `() => RequestContext \| Promise<RequestContext>` |
| `createAuthServerInternal()` | Creates proxy-based auth server with all Better Auth methods |
| `handleAuthProxyRequest()` | Generic proxy: cookie cache → upstream fallback → response minting |
| `processAuthMiddleware()` | Framework-agnostic middleware: returns `allow \| redirect_oauth \| redirect_login` |
| `validateCookieConfig()` | Cookie secret validation (>=32 chars) |
| `NeonAuthConfig` / `NeonAuthMiddlewareConfig` | Config types (baseUrl, cookies.secret, sessionDataTtl, domain, sameSite) |

### Astro Adapter Pattern

| Component | File | Pattern |
|---|---|---|
| Adapter | `src/server/adapter.ts` | `createAstroRequestContext(context: APIContext): RequestContext` — maps APIContext to RequestContext interface |
| Handler | `src/server/handler.ts` | `astroApiHandler(config): (ctx: APIContext) => Promise<Response>` — wraps `handleAuthProxyRequest()` |
| Middleware | `src/server/middleware.ts` | `astroMiddleware(config): Parameters<typeof defineMiddleware>` — wraps `processAuthMiddleware()` |
| Unified entry | `src/server/index.ts` | `createAstroAuth(config)` — returns server + handler + middleware |
| Client | `src/index.ts` | `createAuthClient()` — pre-configured with `BetterAuthReactAdapter()` |
| Integration | `src/integration.ts` | `neonAuth(): AstroIntegration` — auto-wires route + middleware in `astro:config:setup` |

### Key difference from Next.js adapter

Next.js uses implicit `cookies()/headers()` with no parameters (per-request async context).
Astro requires `APIContext` threaded explicitly. The adapter factory takes `context: APIContext`.

## Exports

```
@danielvm/neon-astro-auth
├── .                  → dist/index.mjs          (createAuthClient)
├── ./server           → dist/server/index.mjs   (createAstroAuth)
```

## Conventions

- TypeScript strict mode
- Functional patterns preferred
- NO `I` prefix in interface names
- NO comments in code
- Tests: Vitest, TDD (RED → GREEN → REFACTOR per story)
- Build: `npx tsdown` (direct, not via pnpm script — pnpm issue workaround)
- Commits: Conventional Commits (Angular), enforced by commitlint + husky
- ESM-only output

## Reference Architecture

Study Next.js adapter in `@neondatabase/auth` for the pattern to replicate:

| Component | Next.js (reference) | Astro (this project) |
|---|---|---|
| Adapter | `createNextRequestContext()` | `createAstroRequestContext()` |
| Handler | `nextApiHandler()` | `astroApiHandler()` |
| Middleware | `nextMiddleware()` | `astroMiddleware()` |
| Client | `createAuthClient()` | `createAuthClient()` (same — framework-agnostic) |

## Critical Notes

- pnpm v11.1.2 has dep-status-check bug with esbuild/sharp build scripts → `ignore-scripts=true` in `.npmrc`
- CI uses `--ignore-scripts` flag and runs `npx husky` explicitly
- Astro >=5.0.0 is an optional peer dependency
