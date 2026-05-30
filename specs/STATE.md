# Session State: Neon Auth Astro Adapter

## Current Status

Epic 3 (Unified Entry & Client) complete. Epic 4 (Integration + v1.0.0) is next.

## Git Metadata

- **Repo:** `danielvm-git/neon-astro-adapter`
- **Current branch:** `main` (will branch per epic)
- **Release:** semantic-release via GitHub Actions on merge to `main`
- **Last release:** none (pre-v1.0.0)

## Completed

### Epic 0 — Release Infrastructure (2026-05-30)
- [x] 0.1: package.json with name, version, publishConfig, scripts
- [x] 0.2: .releaserc with branches, plugins, tagFormat
- [x] 0.3: .github/workflows/release.yml (pnpm + tsdown + semantic-release)
- [x] 0.4: commitlint.config.js + .husky/commit-msg hook
- [x] 0.5: Git init + .gitignore, pushed to `danielvm-git/neon-astro-adapter`

### Epic 1 — Adapter Core
- [x] 1.1 RED — `src/server/adapter.test.ts`
- [x] 1.2 GREEN — `src/server/adapter.ts`
- [x] 1.3 REFACTOR — wire exports
- [x] → `a9ae72b feat: adapter core` → pushed → minor bump

### Epic 2 — Handler & Middleware
- [x] 2.1 RED — `src/server/handler.test.ts`
- [x] 2.2 GREEN — `src/server/handler.ts`
- [x] 2.3 RED — `src/server/middleware.test.ts`
- [x] 2.4 GREEN — `src/server/middleware.ts`
- [x] 2.5 REFACTOR — wire exports in `src/server/index.ts`
- [x] 2.6 REVIEW — audit-code passed, request-review fixes applied
- [x] → `e7b2fb2 feat: handler and middleware` → pushed → v0.2.0

### Epic 3 — Unified Entry & Client
- [x] 3.1 RED — `src/server/index.test.ts`
- [x] 3.2 GREEN — `src/server/index.ts` (`createAstroAuth`)
- [x] 3.3 RED — `src/index.test.ts`
- [x] 3.4 GREEN — `src/index.ts` (`createAuthClient`)
- [x] → `be80c7e feat: unified entry and client` → pushed → minor bump

## Infrastructure
- [x] Preflight script at `package.json` `preflight` — runs `tsdown && tsc --noEmit && vitest run`

### Epic 3 — Unified Entry & Client
- [ ] 3.1 RED — `src/server/index.test.ts`
- [ ] 3.2 GREEN — `src/server/index.ts`
- [ ] 3.3 RED — `src/index.test.ts`
- [ ] 3.4 GREEN — `src/index.ts`
- [ ] → `git commit -m "feat: unified entry and client"` → push → minor bump

### Epic 4 — Integration + v1.0.0
- [ ] 4.1 RED — `src/integration.test.ts`
- [ ] 4.2 GREEN — `src/integration.ts`
- [ ] 4.3 Publish v1.0.0
- [ ] → `git commit -m "feat: astro integration"` → push → v1.0.0

### Epic 5 — Example App (post-v1.0.0)
- [ ] 5.1 Create `examples/astro-neon-auth/`
- [ ] 5.2 Manual E2E smoke test

## Next Action

Start Epic 4: Build `neonAuth()` Astro integration that auto-wires handler route + middleware via `injectRoute()` and `addMiddleware()` hooks.
