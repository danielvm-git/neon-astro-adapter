# Neon Auth Astro Adapter — OpenCode

Read CONVENTIONS.md before any GitHub or git operation.

## Project
Astro adapter for Neon Auth (Better Auth) — adapter, handler, middleware, client, and Astro integration in one package.
Stack: TypeScript / Astro >=5 / Node 26

## Commands
| Action | Command |
|--------|---------|
| Run    | `npx tsdown` |
| Test   | `npx vitest run` |
| Build  | `npx tsdown` |
| Lint   | `npx tsc --noEmit` |

## Architecture
5 layers: Adapter (maps APIContext to RequestContext) → Handler (proxy requests via handleAuthProxyRequest) → Middleware (auth decisions via processAuthMiddleware) → Unified Entry (createAstroAuth()) → Integration (neonAuth() AstroIntegration). Client (createAuthClient) for browser use.

## Conventions
- TDD: every story starts RED (failing test), then GREEN (impl), then REFACTOR
- Functional style, no classes unless required by framework
- NO `I` prefix on interfaces
- NO comments in code
- Conventional Commits (Angular) — `feat:` for feature adds, `fix:` for bug fixes
- `npx tsdown` for build, `npx vitest run` for tests (never via pnpm scripts)

## Never
- Modify `@neondatabase/auth` internals — import and wrap only
- Use `workspace:*` protocol — deps from npm registry
- Use pnpm scripts for build/test — pnpm v11.1.2 dep-status-check bug
- Use CommonJS or dual format — ESM-only output
- Commit secrets or NPM_TOKEN

## Agent Rules
- **Workflow Mandate:** You MUST use the bigpowers skills (e.g. `plan-work`, `develop-tdd`, `orchestrate-project`) to perform tasks. DO NOT write code directly in response to a user prompt like "build this feature".
- Read specs/ before writing code.
- All planning and specifications MUST be written to `specs/` (e.g. `specs/PLAN.md`) before any code is generated.
- Write the minimum code that solves the stated problem. Nothing extra.
- Never refactor, rename, or reorganize code outside the task scope.
- Run tests after every change. Show evidence before declaring done.
- One clarifying question beats a wrong assumption baked into 200 lines.
