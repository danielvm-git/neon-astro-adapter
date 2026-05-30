# Session State: Neon Auth Astro Adapter

## Current Status

Epic 4 (Integration + v1.0.0) complete. Next: Example app (post-v1.0.0).

## Git Metadata

- **Repo:** `danielvm-git/neon-astro-adapter`
- **Current branch:** `main`
- **Release:** semantic-release via GitHub Actions on merge to `main`
- **Latest release:** v0.3.0

## Completed

### Epic 0 — Release Infrastructure
- [x] 0.1: package.json with name, version, publishConfig, scripts
- [x] 0.2: .releaserc with branches, plugins, tagFormat
- [x] 0.3: .github/workflows/release.yml
- [x] 0.4: commitlint.config.js + .husky/commit-msg hook
- [x] 0.5: Git init + .gitignore

### Epic 1 — Adapter Core
- [x] 1.1 RED — `src/server/adapter.test.ts`
- [x] 1.2 GREEN — `src/server/adapter.ts`
- [x] 1.3 REFACTOR — wire exports
- [x] → `feat: adapter core` → v0.1.x

### Epic 2 — Handler & Middleware
- [x] 2.1 RED — `src/server/handler.test.ts`
- [x] 2.2 GREEN — `src/server/handler.ts`
- [x] 2.3 RED — `src/server/middleware.test.ts`
- [x] 2.4 GREEN — `src/server/middleware.ts`
- [x] 2.5 REFACTOR — wire exports + extract shared config
- [x] 2.6 REVIEW — audit-code + request-review fixes applied
- [x] → `feat: handler and middleware` → v0.2.0

### Epic 3 — Unified Entry & Client
- [x] 3.1 RED — `src/server/index.test.ts`
- [x] 3.2 GREEN — `src/server/index.ts` (`createAstroAuth`)
- [x] 3.3 RED — `src/index.test.ts`
- [x] 3.4 GREEN — `src/index.ts` (`createAuthClient`)
- [x] 3.5 REVIEW — audit-code + request-review fixes applied
- [x] → `feat: unified entry and client` → v0.3.0

## Pending (ordered by epic)

### Epic 4 — Integration + v1.0.0
- [x] 4.1 RED — `src/integration.test.ts`
- [x] 4.2 GREEN — `src/integration.ts`
- [x] 4.3 ENTRYPOINTS — `src/route-handler.ts` + `src/middleware-handler.ts`
- [x] 4.4 WIRE — package.json exports + tsdown entries
- [x] → `feat: astro integration` → push → v1.0.0

## Infrastructure
- [x] Preflight at `package.json` `preflight` script
- [x] Exports: `.`, `./server`, `./route-handler`, `./middleware-handler`

### Epic 5 — Example App (post-v1.0.0)
- [ ] 5.1 Create `examples/astro-neon-auth/`
- [ ] 5.2 Manual E2E smoke test

## Infrastructure
- [x] Preflight script at `package.json` `preflight` — runs `tsdown && tsc --noEmit && vitest run`

## Next Action

Start Epic 4: Build `neonAuth()` Astro integration — auto-wires handler route + middleware via `injectRoute()` and `addMiddleware()` hooks.
