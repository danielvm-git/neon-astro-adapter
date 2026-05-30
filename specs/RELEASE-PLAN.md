# Release Plan: Neon Auth Astro Adapter

## Epic 0: Release Infrastructure

### Story 0.1 — Initialize npm package
- **Files:** `package.json`
- **Change:** Create package.json with `name`, `version`, `files`, `publishConfig`, `exports`, `scripts`, peer deps
- **Verify:** `node -e "const p = require('./package.json'); console.assert(p.name === '@neondatabase/auth-astro'); console.assert(p.publishConfig.provenance === true)"`

### Story 0.2 — Add .releaserc config
- **File:** `.releaserc`
- **Change:** Configure branches (`main`, `next`, `beta`, `alpha`), plugins (commit-analyzer + conventionalcommits, release-notes-generator + conventionalcommits, npm, github, git), tagFormat `v${version}`
- **Verify:** `npx semantic-release --dry-run --no-ci` loads all 5 plugins without errors

### Story 0.3 — Add GitHub Actions release workflow
- **File:** `.github/workflows/release.yml`
- **Change:** Workflow triggers on push to `main/next/beta/alpha`, runs `pnpm install --frozen-lockfile`, lint, build, typecheck, test, then `npx semantic-release`
- **Verify:** Workflow YAML syntax is valid (`npx yaml-validator .github/workflows/release.yml || true`)

### Story 0.4 — Add commitlint + husky pre-commit hook
- **Files:** `commitlint.config.js`, `.husky/commit-msg`
- **Change:** Enforce conventional commits via `@commitlint/config-conventional`
- **Verify:** `echo "feat: add astro adapter" | npx commitlint --verbose` passes; `echo "breaking: oops" | npx commitlint --verbose` fails

### Story 0.5 — Initialize git repository
- **File:** `.gitignore`
- **Change:** Ignore `node_modules/`, `dist/`, `*.tgz`, `.DS_Store`
- **Verify:** `git status` shows clean working tree

---

## Epic 1: Dependencies & Adapter Core (no build yet)

### Story 1.1 — Add Astro peer dependency
- **Files:** `packages/auth/package.json`
- **Change:** Add `"astro": ">=5.0.0"` to `peerDependencies` + `peerDependenciesMeta.astro`
- **Verify:** `node -e "const p = require('./packages/auth/package.json'); console.assert(p.peerDependencies.astro === '>=5.0.0', 'astro version'); console.assert(p.peerDependenciesMeta.astro.optional === true, 'optional')"`

### Story 1.2 — Create RequestContext adapter
- **File:** `packages/auth/src/astro/server/adapter.ts`
- **Implements:** `RequestContext` using `APIContext` (context.request.headers, context.cookies.set, context.url.origin)
- **Verify:** `pnpm run --filter '@neondatabase/auth' typecheck`

### Story 1.3 — Register tsdown entry points + package.json exports
- **Files:** `packages/auth/tsdown.config.ts`, `packages/auth/package.json`
- **Change:** Add `'src/astro/index.ts'` and `'src/astro/server/index.ts'` to tsdown `entry` array. Add `"./astro"` and `"./astro/server"` exports with types + default.
- **Verify:** `pnpm run --filter '@neondatabase/auth' build`

## Epic 2: Handler & Middleware

### Story 2.1 — Create astroApiHandler
- **File:** `packages/auth/src/astro/server/handler.ts`
- **Implements:** Returns an Astro endpoint handler `(context: APIContext) => Promise<Response>` that calls `handleAuthProxyRequest()` with slug from `context.params.slug`.
- **Verify:** `pnpm run --filter '@neondatabase/auth' typecheck`

### Story 2.2 — Create astroMiddleware
- **File:** `packages/auth/src/astro/server/middleware.ts`
- **Implements:** `defineMiddleware()` wrapper that calls `processAuthMiddleware()`, maps decision to `context.redirect()` or `next()`. Sets cookies via `context.cookies.set()` on allow.
- **Verify:** `pnpm run --filter '@neondatabase/auth' typecheck`

## Epic 3: Unified Entry Point & Integration

### Story 3.1 — Create createAstroAuth()
- **File:** `packages/auth/src/astro/server/index.ts`
- **Implements:** `createAstroAuth(config)` → returns `NeonAuthServer` + `.handler()` + `.middleware()`. Re-exports error classes, network-error types, logger types (matching Next.js pattern).
- **Verify:** `pnpm run --filter '@neondatabase/auth' build`

### Story 3.2 — Create neonAuth() AstroIntegration
- **File:** `packages/auth/src/astro/integration.ts`
- **Implements:** `AstroIntegration` with `astro:config:setup` hook that calls `injectRoute()` for the catch-all auth route and `addMiddleware()` for the auth middleware.
- **Verify:** `pnpm run --filter '@neondatabase/auth' typecheck`

### Story 3.3 — Create client-side createAuthClient()
- **File:** `packages/auth/src/astro/index.ts`
- **Implements:** Pre-configured `createAuthClient()` using `BetterAuthReactAdapter()` (same as Next.js client). Re-exports auth error classes.
- **Verify:** `pnpm run --filter '@neondatabase/auth' build`

### Story 3.4 — Add config validation tests
- **File:** `packages/auth/src/astro/server/index.test.ts`
- **Tests:** Secret missing/too-short/exact/over, sessionDataTtl zero/negative/undefined/positive, domain, sameSite values, return value structure (handler + middleware are functions).
- **Verify:** `pnpm run --filter '@neondatabase/auth' test:ci`

## Epic 4: Neon-JS Re-exports

### Story 4.1 — Create re-export wrappers
- **Files:** `packages/neon-js/src/auth/astro/index.ts`, `packages/neon-js/src/auth/astro/server/index.ts`
- **Content:** Simple re-export files matching existing pattern (`export {} from '@neondatabase/auth/astro'`, etc.)
- **Verify:** `pnpm run --filter '@neondatabase/neon-js' typecheck`

### Story 4.2 — Register neon-js exports + tsdown entries
- **Files:** `packages/neon-js/package.json`, `packages/neon-js/tsdown.config.ts`
- **Verify:** `pnpm run --filter '@neondatabase/neon-js' build`

### Story 4.3 — Full build verification
- **Verify:** `pnpm run build && pnpm typecheck`

## Epic 5: Example App

### Story 5.1 — Create examples/astro-neon-auth
- **Files:** `astro.config.mjs`, `package.json` (with `workspace:*`), `src/middleware.ts`, endpoint + pages
- **Verify:** `cd examples/astro-neon-auth && pnpm run build`

### Story 5.2 — Full test suite
- **Verify:** `pnpm test:ci` — all existing + new tests pass

---

## Execution Order

```
1.1 → 1.2 → 1.3  (dep chain: dep → adapter → exports)
         ↓
   2.1, 2.2       (parallel: handler, middleware are independent)
         ↓
   3.1 → 3.2      (index.ts depends on handler + middleware; integration depends on index)
         ↓
   3.3 → 3.4      (client + tests after server is stable)
         ↓
   4.1 → 4.2      (re-export wrappers after auth package builds)
         ↓
   5.1 → 5.2      (example app after all packages build)
```
