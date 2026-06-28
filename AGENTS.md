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
| Dep source | `opensrc fetch @neondatabase/auth && code $(opensrc path @neondatabase/auth)` |

## Architecture
5 layers: Adapter (maps APIContext to RequestContext) → Handler (proxy requests via thin HTTP proxy) → Middleware (auth decisions via upstream session check) → Unified Entry (createAstroAuth()) → Integration (neonAuth() AstroIntegration). Client (createAuthClient) for browser use. Standalone — no import of `@neondatabase/auth` server internals.

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

## bts toolchain

`bts` is installed. Prefer its verbs over ad-hoc shell commands.

| Task | Command | Avoid |
|------|---------|-------|
| Search code | `bts find --print <pattern>` | grep / find / cat |
| Interactive search | `bts find <pattern>` | manual grep pipes |
| Compress for context | `bts compress <file>` or `cmd \| bts compress` | summarising by hand |
| Repo map | `bts map` | listing files by hand |
| Library docs | `bts docs <lib>` | guessing from training data |
| Package source | `bts src <pkg>` | git clone |
| Toolchain health | `bts doctor` | which / command -v |

**Rules**
- Search with `bts find` before opening files to locate a symbol or pattern.
- Pipe anything > 200 lines through `bts compress` before adding to context.
- Run `bts map` when asked for a repo overview.
- Use `bts docs <lib>` before answering questions about library APIs.
- If a tool is missing, say so and run `bts doctor` — do not silently substitute.
