## Problem

semantic-release's npm publish step fails with a 404 during the `publish` phase:

```
npm error 404 Not Found - PUT https://registry.npmjs.org/@neondatabase%2fauth-astro
npm error 404  The requested resource '@neondatabase/auth-astro@0.1.0' could not be found or you do not have permission to access it.
```

The release workflow analyzes commits correctly, bumps version to `0.1.0`, builds the tarball, generates provenance attestation — but the actual `npm publish` command exits 1. This blocks automated releases entirely.

## Root Cause Analysis

### Phase 1 — Reproduce

The failure is **100% reproducible** on every push to `main` (or any release branch). The CI output from the GitHub Actions release workflow consistently shows the 404 at the npm publish step.

### Phase 2 — Isolate

The code path is: push to branch → `.github/workflows/release.yml` → `pnpm install --frozen-lockfile` → `npx tsdown` → `pnpm exec semantic-release` → `@semantic-release/npm` plugin → `npm publish`.

The npm publish step is the first layer that produces wrong output. All preceding steps (install, build, version analysis, tag creation) succeed.

Key observations from the CI log:
- `NPM_TOKEN` is written to a temp `.npmrc` by `@semantic-release/npm` and authenticates as **`danielvm`**
- The package name is **`@neondatabase/auth-astro`** (scoped under `@neondatabase` — which user does NOT control)
- The GitHub repo is `danielvm-git/neon-astro-adapter` (personal, not Neon official)

### Phase 3 — Hypothesize

**Hypothesis A (99%):** The npm scope `@neondatabase` is controlled by Neon. The authenticated npm user (`danielvm`) is not a member of the `@neondatabase` npm organization with publish rights. npm returns HTTP 404 (not 403) for scoped packages when the package doesn't exist AND the user lacks permission to create it under that scope.

**Hypothesis B (1%):** The package simply has never been published (per RELEASE.md first-time setup instructions). The `danielvm` user *does* have `@neondatabase` permissions, and a single manual `npm publish --access public` would create the package record, after which semantic-release would work.

### Phase 4 — Verify

**Confirmed:** User stated they are a solo developer with no affiliation with Neon, using their personal npm account. They do NOT have publish access to the `@neondatabase` scope. Hypothesis A is correct. Even a manual `npm publish --access public` would fail with the same 404.

Risk level: **Medium** — blocks all automated releases. Fix requires package rename across all config/docs files. Not a code logic bug.

## TDD Fix Plan

1. **RED**: CI release workflow fails because `@neondatabase` scope is not accessible
   **GREEN**: Change `package.json` `"name"` from `@neondatabase/auth-astro` to `@danielvm/neon-astro-auth`
   **verify**: `npm publish --access public --dry-run` exits 0 with new scope

2. **RED**: README and spec docs still reference the old package name
   **GREEN**: Replace all occurrences of `@neondatabase/auth-astro` with `@danielvm/neon-astro-auth` across the codebase
   **verify**: `git grep '@neondatabase/auth-astro'` returns no matches

3. **RED**: The `name` field in integration config (PLAN.md) still references old scope
   **GREEN**: Update the integration `name` field in source config
   **verify**: `npx tsdown` builds successfully with new name

**REFACTOR**: After verifying CI passes, update the badge URLs in README to point to the new npm package.

## Acceptance Criteria

- [x] Package renamed from `@neondatabase/auth-astro` to `@danielvm/neon-astro-auth` in all files
- [x] `npx tsdown` builds successfully
- [x] `npx vitest run` passes all 8 tests
- [x] `npx tsc --noEmit` passes
- [x] Package published to npm at v0.0.0 (`npm search` confirms visibility)
- [ ] CI release workflow completes successfully on next push to `main`

## Resolution

**Fixed:** 2026-05-30
**Root cause confirmed:** Package scope `@neondatabase` requires Neon org membership; user is a solo developer without access.
**Fix applied:** Renamed package from `@neondatabase/auth-astro` to `@danielvm/neon-astro-auth` in `package.json`, `README.md`, `specs/CONTEXT.md`, `specs/RELEASE-PLAN.md`, `PLAN.md`, and `specs/DIAGNOSIS.md`. Published initial v0.0.0 to npm manually.
**Evidence:** `npx tsdown` exits 0, `npx vitest run` exits 0, `npx tsc --noEmit` exits 0, `npm search @danielvm/neon-astro-auth` returns the package.
**Next:** Push to `main` to confirm semantic-release completes.
