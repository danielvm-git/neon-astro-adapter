## Problem

The `pnpm approve-builds --global esbuild sharp 2>/dev/null; true` command in the CI release workflow fails with exit code 1, aborting the pipeline before dependencies are installed or the package is built.

**Actual:** CI step exits with code 1.
**Expected:** Should gracefully skip or succeed, allowing install → build → release to continue.

## Root Cause Analysis

Two issues compound to produce the failure:

### Issue 1: `--global` flag removed from `pnpm approve-builds` in v11

The `pnpm approve-builds` command accepts `--all` to approve all pending builds non-interactively, and package names as positional arguments. However, the `--global` (`-g`) flag was **removed in pnpm v11.0.0**. Running `pnpm approve-builds --global esbuild sharp` exits with code 1 because `--global` is no longer a recognized flag for this command.

Additionally, `pnpm approve-builds` writes approved packages to the `allowBuilds` map in `pnpm-workspace.yaml`. This project has no `pnpm-workspace.yaml`, so even without `--global`, the command would find nothing to approve (all builds are already ignored by `ignore-scripts=true`).

### Issue 2: `; true` doesn't suppress exit code 1 under `set -e`

GitHub Actions runners execute shell commands with `set -eo pipefail`. The `; true` pattern — `cmd; true` — does NOT suppress the exit code when `set -e` is active. The shell terminates on the first failed command before reaching `true`. The correct idiom is `|| true` — `cmd || true` — which catches the non-zero exit in a logical OR that always yields 0.

### Issue 3: pnpm v11 configuration migration

The `pnpm.onlyBuiltDependencies` field in `package.json` is deprecated and ignored in pnpm v11. pnpm v11 uses `allowBuilds` in `pnpm-workspace.yaml` instead. The deprecated config produces a warning on every pnpm command: `The "pnpm" field in package.json is no longer read by pnpm. The following keys were ignored: "pnpm.onlyBuiltDependencies".`

Additionally, `.npmrc` with `ignore-scripts=true` was added as a workaround for the deprecated config not working. With the proper `allowBuilds` config, this workaround is unnecessary.

**Risk level:** Low — the fix is mechanical (config migration + CI step cleanup). No code logic is affected.

## TDD Fix Plan

A single RED-GREEN-REFACTOR cycle since the fix is configuration-only with no application code changes.

### 1. Create `pnpm-workspace.yaml` (GREEN)

**Action:** Create `pnpm-workspace.yaml` with `allowBuilds` for esbuild and sharp.

```yaml
allowBuilds:
  esbuild: true
  sharp: true
```

### 2. Remove deprecated `package.json` field (REFACTOR)

**Action:** Remove the `pnpm.onlyBuiltDependencies` array from `package.json`.

### 3. Clean up `.npmrc` (REFACTOR)

**Action:** Remove `ignore-scripts=true` from `.npmrc`. Empty file is fine.

### 4. Fix CI workflow (REFACTOR)

**Action:** In `.github/workflows/release.yml`:
- Remove the "Approve builds" step entirely
- Change `pnpm install --frozen-lockfile --ignore-scripts && npx husky` to `pnpm install --frozen-lockfile`

**verify:** `pnpm install --frozen-lockfile` succeeds (no approval needed, esbuild/sharp allowed)
**verify:** `pnpm install` succeeds locally (pnpm v11.1.2 no longer blocked by dep-status-check)
**verify:** `npx tsdown` still works (esbuild postinstall ran)
**verify:** `npx vitest run` still works (vitest/esbuild available)

## Acceptance Criteria

- [ ] `pnpm install --frozen-lockfile` succeeds without `--ignore-scripts`
- [ ] No pnpm warnings about deprecated `pnpm.onlyBuiltDependencies`
- [ ] CI "Approve builds" step removed, pipeline runs clean
- [ ] `npx tsdown` builds successfully
- [ ] `npx vitest run` runs tests successfully

## Resolution

- Created `pnpm-workspace.yaml` with `allowBuilds: { esbuild: true, sharp: true }`
- Removed deprecated `pnpm.onlyBuiltDependencies` from `package.json`
- Removed `ignore-scripts=true` from `.npmrc`
- Removed "Approve builds" step from CI workflow
- Replaced `pnpm install --frozen-lockfile --ignore-scripts && npx husky` with `pnpm install --frozen-lockfile` (husky runs via `prepare` lifecycle)

**Verification:**
- `pnpm install --frozen-lockfile` → exit 0, no warnings
- `npx tsdown` → builds successfully
- `npx vitest run` → "No test files found" (expected pre-Epic1)
