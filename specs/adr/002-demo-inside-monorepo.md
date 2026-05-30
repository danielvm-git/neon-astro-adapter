# ADR 002: Example App Lives Inside the Monorepo

## Status

Proposed

## Context

The Astro adapter needs a working example app to demonstrate usage and verify the adapter end-to-end. Two options:

1. **Inside monorepo:** Create `examples/astro-neon-auth/` alongside existing examples.
2. **Separate repo:** Create a standalone `neon-astro-adapter-demo` repository.

## Decision

**Create the example inside the monorepo** at `examples/astro-neon-auth/`.

### Rationale

**Precedent:** The repo already has 8 examples including `examples/nextjs-neon-auth/`, `examples/react-neon-js/`, `examples/react-auth-external-ui/`. All framework examples are co-located.

**CI/E2E Integration:** The Playwright E2E suite (`e2e/tests/`) targets examples within the monorepo. Adding an Astro example keeps it in the same test pipeline.

**Workspace Protocol:** The monorepo uses `"@neondatabase/auth": "workspace:*"` in example `package.json` files. Examples always test the local build. A separate repo would need `npm link` or relative `file:` paths — brittle and error-prone.

**Single PR:** All code — adapter source + example + integration — in one branch, one PR. Reviewers see the whole picture.

## Consequences

**Positive:**
- One PR contains everything — self-contained contribution
- CI tests cover the example automatically
- No `npm link` or cross-repo coordination
- Demonstrated end-to-end without extra setup

**Negative:**
- Slightly larger PR diff
- Example is coupled to monorepo tooling (pnpm workspaces)
- Astro as a dev dependency in the root workspace could affect other packages

**Mitigation:** Astro is added only to `packages/auth/peerDependencies` (optional) and the example's own `package.json` as a dependency. It does not become a root workspace dependency.
