# Neon Auth Astro Adapter — Implementation Plan

## Goal

Add `@neondatabase/auth/astro` and `@neondatabase/auth/astro/server` subpath exports to the [neon-js](https://github.com/neondatabase/neon-js) monorepo so Astro users can do auth through Neon with the same DX as Next.js.

---

## 1. Clone the Repo

```bash
cd /Users/danielvm/Developer
git clone git@github.com:neondatabase/neon-js.git
cd neon-js
```

Verify it builds:

```bash
pnpm install
pnpm run build
pnpm test:ci
```

---

## 2. Create a Feature Branch

```bash
git checkout -b feat/astro-auth-adapter
```

Branch naming follows Conventional Commits — the PR title will be something like `feat(auth): add Astro adapter for @neondatabase/auth`.

---

## 3. Understand the Architecture (read these files)

### Core server (framework-agnostic — reuse as-is)
- `packages/auth/src/server/request-context.ts` — `RequestContext` interface (the contract you implement)
- `packages/auth/src/server/client-factory.ts` — `createAuthServerInternal()` (takes a `RequestContextFactory`)
- `packages/auth/src/server/proxy/` — `handleAuthProxyRequest()` (used by the API handler)
- `packages/auth/src/server/middleware/` — `processAuthMiddleware()` (used by middleware)

### Next.js reference (the pattern to mirror)
- `packages/auth/src/next/server/adapter.ts` — `createNextRequestContext()` (implements `RequestContext`)
- `packages/auth/src/next/server/index.ts` — `createNeonAuth()` (combines server + handler + middleware)
- `packages/auth/src/next/server/handler.ts` — `authApiHandler()` (catch-all API proxy)
- `packages/auth/src/next/server/middleware.ts` — `neonAuthMiddleware()` (route protection)
- `packages/auth/src/next/index.ts` — client-side `createAuthClient()`

### Package exports reference
- `packages/auth/package.json` — note the `exports` and `peerDependencies` fields

---

## 4. Implementation Steps

### Step 4a — Add Astro dependencies

In `packages/auth/package.json`:

```jsonc
"devDependencies": {
  "astro": "^5.0.0"
},
"peerDependencies": {
  "astro": "^5.0.0"
},
"peerDependenciesMeta": {
  "astro": {
    "optional": true
  }
}
```

> `astro` is a peer dep (optional) — same pattern as `next`.

### Step 4b — Create `packages/auth/src/astro/server/adapter.ts`

Implement `RequestContext` using Astro's `APIContext`:

```typescript
// Translates Astro's request context into neon's RequestContext interface
export function createAstroRequestContext(context: APIContext): RequestContext
```

Key Astro primitives:
- `context.cookies.get(name)` / `context.cookies.set(name, value, opts)` / `context.cookies.delete(name)`
- `context.request.headers.get(name)`
- `context.url.origin`

### Step 4c — Create `packages/auth/src/astro/server/handler.ts`

Wraps `handleAuthProxyRequest` for Astro endpoints:

```typescript
export function astroApiHandler(config: NeonAuthConfig) {
  return async (context: APIContext): Promise<Response> => {
    const path = context.params.slug as string;
    const response = await handleAuthProxyRequest({
      request: context.request,
      path,
      baseUrl: config.baseUrl,
      cookieSecret: config.cookies.secret,
      ...
    });
    // Copy Set-Cookie headers from response to context.cookies
    return response;
  };
}
```

This mounts in `src/pages/api/auth/[...slug].ts` via `ALL` export.

### Step 4d — Create `packages/auth/src/astro/server/middleware.ts`

Uses Astro's `defineMiddleware` + `processAuthMiddleware`:

```typescript
export function astroMiddleware(config: NeonAuthMiddlewareConfig) {
  return defineMiddleware(async (context, next) => {
    // Use processAuthMiddleware (same core as Next.js)
    // Redirect to login if needed
    // Attach session to context.locals
  });
}
```

### Step 4e — Create `packages/auth/src/astro/server/index.ts`

The `createNeonAuth()` analog for Astro:

```typescript
export function createAstroAuth(config: NeonAuthConfig) {
  return {
    handler: () => astroApiHandler(config),
    middleware: () => astroMiddleware(config),
    // All Better Auth server methods (from createAuthServerInternal)
    ...server,
  };
}
```

### Step 4f — Create `packages/auth/src/astro/integration.ts`

The **AstroIntegration** for zero-config setup:

```typescript
export function neonAuth(): AstroIntegration {
  return {
    name: '@neondatabase/auth-astro',
    hooks: {
      'astro:config:setup'({ injectRoute, addMiddleware, injectTypes }) {
        // Auto-inject the catch-all API route
        // Auto-inject middleware
        // Inject TypeScript types for context.locals
      },
    },
  };
}
```

This is what goes in `astro.config.mjs`:
```js
import { neonAuth } from '@neondatabase/auth/astro';
export default defineConfig({
  integrations: [neonAuth({ /* config */ })],
});
```

### Step 4g — Register exports in `packages/auth/package.json`

```jsonc
"exports": {
  "./astro": {
    "types": "./dist/astro/integration.d.mts",
    "default": "./dist/astro/integration.mjs"
  },
  "./astro/server": {
    "types": "./dist/astro/server/index.d.mts",
    "default": "./dist/astro/server/index.mjs"
  }
}
```

### Step 4h — Update tsdown config if needed

Check if `packages/auth/tsdown.config.ts` needs the new entry points added.

---

## 5. Add an Example App (inside the monorepo)

Following the existing pattern at `examples/nextjs-neon-auth/`:

```bash
mkdir -p examples/astro-neon-auth/src/pages/api/auth
```

Create a minimal Astro app (`examples/astro-neon-auth/`) with:

- `astro.config.mjs` — uses the local `@neondatabase/auth` via workspace protocol
- `src/pages/api/auth/[...slug].ts` — mounts the handler
- `src/middleware.ts` — uses the middleware
- `src/pages/index.astro` — shows session state
- `src/pages/auth/sign-in.astro` — sign-in form
- `src/pages/dashboard.astro` — protected page

**Why inside the monorepo:** All other examples live there. It's how they do E2E tests (Playwright). Keeps everything consistent.

---

## 6. Build & Test

```bash
pnpm run build
pnpm typecheck
pnpm test:ci
```

For the example app:

```bash
cd examples/astro-neon-auth
pnpm run dev    # Manual testing
pnpm run build  # Verify it builds
```

---

## 7. Open a PR

### Commit

```bash
git add packages/auth/ examples/astro-neon-auth/
git commit -m "feat(auth): add Astro adapter with integration

- Add @neondatabase/auth/astro and /astro/server subpath exports
- Implement RequestContext adapter for Astro's APIContext
- Add astroApiHandler for catch-all auth route proxy
- Add astroMiddleware using Astro's defineMiddleware
- Add neonAuth() AstroIntegration for zero-config setup
- Add examples/astro-neon-auth/ reference app"
```

### Push and PR

```bash
git push -u origin feat/astro-auth-adapter
```

Then open a PR at [github.com/neondatabase/neon-js](https://github.com/neondatabase/neon-js). The CODEOWNERS file says PRs need review from `@shridhad` or `@thekauer`.

---

## 8. Total New Files

```
packages/auth/src/astro/
├── server/
│   ├── adapter.ts       (~40 LOC)  — RequestContext impl
│   ├── handler.ts       (~40 LOC)  — API proxy handler
│   ├── middleware.ts     (~60 LOC)  — Auth middleware
│   └── index.ts         (~50 LOC)  — createAstroAuth()
├── integration.ts       (~50 LOC)  — AstroIntegration
└── index.ts             (~15 LOC)  — client createAuthClient()

examples/astro-neon-auth/
├── astro.config.mjs
├── package.json
├── src/
│   ├── middleware.ts
│   ├── pages/
│   │   ├── index.astro
│   │   ├── auth/
│   │   │   └── sign-in.astro
│   │   ├── dashboard.astro
│   │   └── api/
│   │       └── auth/
│   │           └── [...slug].ts
│   └── lib/
│       └── auth.ts
```

---

## Key Design Decision: Integration vs Manual Setup

The Astro integration (`neonAuth()`) is **optional** — the subpath exports (`@neondatabase/auth/astro/server`) work standalone. The integration just automates wiring for users who want a one-liner. Both should be available.

---

## Demo Location: Inside the Monorepo

The example app should live at **`examples/astro-neon-auth/`** inside the neon-js monorepo, **not** a separate repo. Here's why:

### Precedent
The repo already has `examples/nextjs-neon-auth/`, `examples/react-neon-js/`, `examples/neon-auth-orgs-example/`, etc. All framework examples are co-located. An Astro example would be the outlier if separate.

### CI/E2E Integration
The existing Playwright E2E suite (`e2e/tests/`) targets examples within the monorepo. Adding an Astro example keeps it in the same test pipeline. A separate repo would need its own CI and test setup — redundant and harder to maintain.

### Workspace Protocol
The monorepo uses `"@neondatabase/auth": "workspace:*"` in example `package.json` files, so examples always test the local build. A separate repo would need `npm link` or `pnpm add ../../packages/auth` — brittle and easy to get wrong.

### Single PR
All code — adapter source + example + integration — in one branch, one PR. Reviewers see the whole picture. A separate repo means two PRs to two projects, and the neon team has to coordinate cross-repo changes.

### Contribution Credibility
A single PR to neon-js with the adapter source, tests, and working example is a self-contained contribution. It demonstrates the feature end-to-end without asking maintainers to clone a second repo and figure out how to wire it together.
