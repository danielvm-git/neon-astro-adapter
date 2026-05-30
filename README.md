# Neon Auth Astro Adapter

[![npm version](https://img.shields.io/npm/v/@danielvm/neon-astro-auth)](https://www.npmjs.com/package/@danielvm/neon-astro-auth)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@danielvm/neon-astro-auth)](https://www.npmjs.com/package/@danielvm/neon-astro-auth)

Astro adapter for [Neon Auth](https://neon.tech/docs/guides/neon-auth) — a Better Auth integration. Provides an adapter, API handler, middleware, client, and Astro integration in a single package.

## Features

- **Adapter** — Maps Astro's `APIContext` to Neon Auth's `RequestContext` interface
- **API Handler** — Proxy auth requests to your Better Auth server
- **Middleware** — Protect routes with role-based auth decisions
- **Client** — Pre-configured `createAuthClient()` for browser usage
- **Integration** — One-liner `neonAuth()` auto-wires routes and middleware in `astro.config.mjs`
- **ESM-only** — Modern output, tree-shakeable

## Installation

```bash
npm install @danielvm/neon-astro-auth
# or
pnpm add @danielvm/neon-astro-auth
# or
yarn add @danielvm/neon-astro-auth
```

> **Peer dependency:** Astro >=5.0.0 (optional — only needed if you use the integration or middleware).

## Quick Start

### Option 1: Integration (recommended)

Add the integration to your `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import neonAuth from '@danielvm/neon-astro-auth/integration';

export default defineConfig({
  integrations: [
    neonAuth({
      baseUrl: 'https://your-better-auth-server.com',
      cookies: {
        secret: process.env.AUTH_SECRET!,
      },
    }),
  ],
});
```

This automatically injects the API route and middleware.

### Option 2: Manual wiring

**API route** — `src/pages/api/auth/[...slug].ts`:

```ts
import type { APIRoute } from 'astro';
import { createAstroAuth } from '@danielvm/neon-astro-auth/server';

const auth = createAstroAuth({
  baseUrl: 'https://your-better-auth-server.com',
  cookies: { secret: process.env.AUTH_SECRET! },
});

export const ALL: APIRoute = auth.handler;
```

**Middleware** — `src/middleware.ts`:

```ts
import { defineMiddleware } from 'astro/middleware';
import { createAstroAuth } from '@danielvm/neon-astro-auth/server';

const auth = createAstroAuth({
  baseUrl: 'https://your-better-auth-server.com',
  cookies: { secret: process.env.AUTH_SECRET! },
});

export const onRequest = defineMiddleware(auth.middleware);
```

**Client** — `src/lib/auth.ts`:

```ts
import { createAuthClient } from '@danielvm/neon-astro-auth';

export const authClient = createAuthClient();
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | — | URL of your Better Auth server |
| `cookies.secret` | `string` | — | Auth cookie secret (min 32 chars) |
| `cookies.sessionDataTtl` | `number` | `600` | Session data TTL in seconds |
| `cookies.domain` | `string` | — | Cookie domain override |
| `cookies.sameSite` | `string` | `'lax'` | SameSite policy (`'lax'` \| `'strict'` \| `'none'`) |

## API

### `@danielvm/neon-astro-auth`

```ts
import { createAuthClient } from '@danielvm/neon-astro-auth';
```

Creates a pre-configured Better Auth client for browser usage.

### `@danielvm/neon-astro-auth/server`

```ts
import { createAstroAuth } from '@danielvm/neon-astro-auth/server';

const auth = createAstroAuth(config);
//    ^?.handler     — Astro API route handler
//    ^?.middleware  — Astro middleware function
//    ^?.auth        — Better Auth server instance
```

## Development

```bash
# Install
pnpm install

# Build
npx tsdown

# Test
npx vitest run

# Typecheck
npx tsc --noEmit

# Watch mode
npx tsdown --watch
```

> Note: Use `npx` commands directly. Do not use `pnpm run` for build/test (see [pnpm v11.1.2 issue](https://github.com/pnpm/pnpm/issues/1234)).

## Contributing

1. Read `specs/` and `CONVENTIONS.md`
2. Every change follows TDD: RED (failing test) → GREEN (impl) → REFACTOR
3. Run tests after every change: `npx vitest run`
4. Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) (Angular)
5. Open a PR against `main`

## License

Apache-2.0 — see [LICENSE](LICENSE)
