# ADR 001: Astro Integration is Optional

## Status

Proposed

## Context

The Astro adapter needs to provide auth functionality for Astro apps. Two approaches are available:

1. **Integration-only:** User adds `neonAuth()` to `astro.config.mjs`, everything is auto-wired via `astro:config:setup` hooks (`injectRoute` + `addMiddleware`).
2. **Manual + Integration:** User can either import handler/middleware directly from subpath exports OR use the integration for zero-config setup.

The Next.js adapter already supports manual setup — `createNeonAuth()` returns `.handler()` and `.middleware()` that users wire themselves. Should Astro follow the same pattern or go integration-only?

## Decision

**Support both.** The subpath exports (`@neondatabase/auth/astro/server`) work standalone for manual setup. The `neonAuth()` AstroIntegration wraps them for zero-config.

This mirrors:
- `@astrojs/node` — has both a manual SSR mode and an integration
- `@neondatabase/auth/next/server` — `createNeonAuth()` wraps individual exports but both work standalone

User flows:

```
// Manual setup (power users, existing Astro projects with custom middleware)
// src/pages/api/auth/[...slug].ts
import { astroApiHandler } from '@neondatabase/auth/astro/server';
export const ALL = astroApiHandler({ baseUrl: '...', cookies: { secret: '...' } });

// Zero-config (new projects, quick start)
// astro.config.mjs
import { neonAuth } from '@neondatabase/auth/astro';
export default defineConfig({ integrations: [neonAuth({ baseUrl: '...', cookies: { secret: '...' } })] });
```

## Consequences

**Positive:**
- Best DX — users choose the abstraction level that fits their project
- Consistent with Next.js adapter philosophy (wrapper over standalone primitives)
- Integration can be added incrementally to existing projects

**Negative:**
- More code to maintain (integration file + manual exports)
- Two code paths to document and test
- Integration must stay in sync with manual API surface

**Mitigation:** The integration delegates to the same primitives used by manual setup. Tests for manual setup cover the integration too. Integration-specific tests verify only the `astro:config:setup` hook wiring.
