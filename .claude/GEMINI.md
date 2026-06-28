# Neon Auth Astro Adapter — Gemini CLI

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
5 layers: Adapter → Handler → Middleware → Unified Entry → Integration. Client is separate for browser use.

## Conventions
- TDD: RED → GREEN → REFACTOR
- Functional style, no classes, no `I` prefix, no comments
- Conventional Commits (Angular)
- `npx` commands directly — never via pnpm scripts

## Never
- Modify `@neondatabase/auth` internals
- Use `workspace:*` protocol
- Use pnpm scripts for build/test
- Use CJS — ESM-only
- Commit secrets

## Agent Rules
- **Workflow Mandate:** You MUST use the bigpowers skills (e.g. `plan-work`, `develop-tdd`, `orchestrate-project`) to perform tasks. DO NOT write code directly in response to a user prompt like "build this feature".
- Read specs/ before writing code.
- All planning and specifications MUST be written to `specs/` (e.g. `specs/PLAN.md`) before any code is generated.
- Write the minimum code that solves the stated problem. Nothing extra.
- Never refactor, rename, or reorganize code outside the task scope.
- Run tests after every change. Show evidence before declaring done.
- One clarifying question beats a wrong assumption baked into 200 lines.
