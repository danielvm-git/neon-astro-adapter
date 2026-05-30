## Problem

`pnpm install --frozen-lockfile` fails with `ERR_PNPM_IGNORED_BUILDS`:

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: core-js@3.49.0
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
Error: Process completed with exit code 1.
```

This blocks CI (release workflow) and any fresh install.

## Root Cause Analysis

**Phase 1 — Reproduce:** `pnpm install --frozen-lockfile` fails locally with the same error. Consistent.

**Phase 2 — Isolate:** pnpm v11 enforces build script approval via `allowBuilds` in `pnpm-workspace.yaml`. The file had:

```yaml
allowBuilds:
  core-js: set this to true or false
  esbuild: true
  sharp: true
```

The value `set this to true or false` is a placeholder string, not a boolean `true`. pnpm treats it as an unapproved build script and errors out.

**Phase 3 — Hypothesize:** The root cause is the placeholder value for `core-js` in the allow list.

**Phase 4 — Verify:** Changed value to `core-js: true`. `pnpm install --frozen-lockfile` now succeeds with `Already up to date` (exit 0). Hypothesis confirmed.

Risk level: **Low** — one-line config fix, no code changes.

## TDD Fix Plan

1. **GREEN**: Change `core-js: set this to true or false` to `core-js: true` in `pnpm-workspace.yaml`
   **verify**: `pnpm install --frozen-lockfile` exits 0

## Acceptance Criteria

- [x] `pnpm install --frozen-lockfile` completes without error
- [x] `pnpm install` (without frozen) also succeeds
- [x] `npx vitest run` still passes
- [x] `npx tsdown` still builds
- [x] `npx tsc --noEmit` passes

## Resolution

**Fixed:** 2026-05-30
**Root cause confirmed:** Placeholder string `set this to true or false` in `pnpm-workspace.yaml` `allowBuilds.core-js` instead of boolean `true`
**Fix applied:** Changed value to `true` in `pnpm-workspace.yaml`
**Hardening added:** None needed — one-time config fix
**Evidence:** `pnpm install --frozen-lockfile` exits 0
**Commit:** `fix: approve core-js build script in pnpm-workspace.yaml`
