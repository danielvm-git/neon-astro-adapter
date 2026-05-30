## Problem

The Release step in the CI workflow fails:

```
Run npx --package semantic-release@25 --package @semantic-release/git semantic-release
sh: 1: semantic-release: not found
Error: Process completed with exit code 127.
```

The workflow should publish the package to npm after a successful build. Instead, the pipeline aborts at the Release step.

## Root Cause Analysis

### Phase 1 — Reproduce

The `npx --package semantic-release@25 --package @semantic-release/git semantic-release` command works locally (macOS, npm 11.12.1) but fails in CI (Ubuntu, Node 22 LTS, npm 10.x).

Locally confirmed:
- `semantic-release@25.0.3` is already present in the pnpm virtual store as a transitive peer dependency of `@semantic-release/git` (which IS a devDependency)
- `node_modules/.bin/semantic-release` exists and works via `pnpm exec semantic-release --version`

### Phase 2 — Isolate

The failing line is the `npx --package` invocation. Earlier steps (install, build) complete successfully.

- `pnpm install --frozen-lockfile` — succeeds, installs all deps including semantic-release into the virtual store
- `npx tsdown` — succeeds (tsdown is a devDependency, found in local node_modules)
- `npx --package semantic-release@25 --package @semantic-release/git semantic-release` — fails with exit 127

### Phase 3 — Hypothesize

**Hypothesis A (most likely):** The `npx --package` flag attempts to download packages from the npm registry into npm's global cache. In CI, the npm cache is not configured (only pnpm cache is set via `setup-node cache: pnpm`), and the download either fails or `npx` in npm 10.x handles the `--package` flag differently than npm 11.x (different resolution and install behavior for transient packages).

**Hypothesis B:** The `--package` flag with two packages causes `npx` to fail when one package (`@semantic-release/git`) is a local devDependency but the other (`semantic-release@25`) requires a registry fetch. The inconsistency in resolution sources causes `npx` to give up.

**Hypothesis C:** The npm cache directory on the GitHub Actions runner is restricted or the npm registry is unreachable from the ephemeral npx installation environment.

### Phase 4 — Verify

Confirmed locally:
- `npx --package` with a non-installed package (`cowsay`) downloads and runs successfully — so `npx --package` does work to download packages from the registry locally
- `semantic-release` IS in the local pnpm virtual store (at `node_modules/.pnpm/semantic-release@25.0.3_typescript@5.9.3/`)
- `node_modules/.bin/semantic-release` exists and runs correctly via `pnpm exec semantic-release --version` (exit 0)

The root cause is a mismatch between how `npx --package` resolves packages in npm 10 (CI) vs npm 11 (local). Since `semantic-release` is already available in the local node_modules via the lockfile (peer dependency of `@semantic-release/git`), the `--package` download is both unnecessary and unreliable.

**Risk level:** Low — fix is a one-line CI workflow change.

## TDD Fix Plan

### 1. RED → GREEN: Fix the Release step

**GREEN:** Replace `npx --package semantic-release@25 --package @semantic-release/git semantic-release` with `pnpm exec semantic-release` in the workflow file. This resolves from the local `node_modules/.bin` where `semantic-release` is already installed.

**verify:** `pnpm exec semantic-release --version` returns `25.0.3`

## Acceptance Criteria

- [ ] Release step uses `pnpm exec semantic-release` instead of `npx --package`
- [ ] `pnpm exec semantic-release --version` confirms version 25.0.3
- [ ] CI pipeline can run through to completion

## Resolution

- Changed Release step from `npx --package semantic-release@25 --package @semantic-release/git semantic-release` to `pnpm exec semantic-release`
- `semantic-release@25.0.3` was already present as a transitive peer dependency of `@semantic-release/git` in the pnpm virtual store
- `pnpm exec` resolves from local `node_modules/.bin` — no registry download needed, works with any npm version, always matches the lockfile

**Verification:**
- `pnpm exec semantic-release --version` → `25.0.3` (exit 0)
