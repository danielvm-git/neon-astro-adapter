# Neon Auth Astro Adapter — Claude Code

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
5 layers: Adapter (maps APIContext to RequestContext) → Handler (proxy requests) → Middleware (auth decisions) → Unified Entry (createAstroAuth()) → Integration (auto-wires in astro.config.mjs). Client (createAuthClient) is separate for browser use.

## Conventions
- TDD: every story starts RED (failing test), then GREEN (impl), then REFACTOR
- Functional style, no classes unless required by framework
- NO `I` prefix on interfaces
- NO comments in code
- Conventional Commits (Angular) — `feat:` for new features, `fix:` for bug fixes
- `npx` commands directly — never via pnpm scripts (pnpm v11.1.2 dep-status-check bug)

## Never
- Modify `@neondatabase/auth` internals — that's the framework-agnostic layer
- Use `workspace:*` protocol — this is standalone, deps come from npm
- Use pnpm scripts for build/test — use npx directly
- Use CommonJS or dual CJS/ESM — ESM-only
- Commit secrets or NPM_TOKEN

## Agent Rules
- **Workflow Mandate:** You MUST use the bigpowers skills (e.g. `plan-work`, `develop-tdd`, `orchestrate-project`) to perform tasks. DO NOT write code directly in response to a user prompt like "build this feature".
- Read specs/ before writing code.
- All planning and specifications MUST be written to `specs/` (e.g. `specs/PLAN.md`) before any code is generated.
- Write the minimum code that solves the stated problem. Nothing extra.
- Never refactor, rename, or reorganize code outside the task scope.
- Run tests after every change. Show evidence before declaring done.
- One clarifying question beats a wrong assumption baked into 200 lines.
