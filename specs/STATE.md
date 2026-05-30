# Session State: Neon Auth Astro Adapter

## Current Status

Standalone `@neondatabase/auth-astro` project. Release infrastructure (Epic 0) complete.
Ready to begin Epic 1 (TDD cycle).

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

## Pending (ordered by epic)

### Epic 1 — Adapter Core (next)
- [ ] 1.1 RED — `src/server/adapter.test.ts` (write failing tests)
- [ ] 1.2 GREEN — `src/server/adapter.ts` (implement)
- [ ] 1.3 REFACTOR — wire exports, tsdown entry
- [ ] → `git commit -m "feat: adapter core"` → push → minor bump

### Epic 2 — Handler & Middleware
- [ ] 2.1 RED — `src/server/handler.test.ts`
- [ ] 2.2 GREEN — `src/server/handler.ts`
- [ ] 2.3 RED — `src/server/middleware.test.ts`
- [ ] 2.4 GREEN — `src/server/middleware.ts`
- [ ] → `git commit -m "feat: handler and middleware"` → push → minor bump

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

Start Epic 1 Story 1.1: Write `src/server/adapter.test.ts` with failing tests for `createAstroRequestContext()`.
