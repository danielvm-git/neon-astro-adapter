# Release

## How releases work

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automate version management and npm publishing.

### Trigger

Push to one of these branches triggers a release:

| Branch | npm dist-tag | Prerelease |
|---|---|---|
| `main` | `latest` | No |
| `next` | `next` | No |
| `beta` | `beta` | Yes |
| `alpha` | `alpha` | Yes |

### What happens

1. CI runs: `pnpm install` → `npx tsdown` (build)
2. `npx semantic-release` analyzes commits since last tag
3. Determines next version from commit messages (Angular convention)
4. Bumps version in `package.json`, creates git tag `vX.Y.Z`
5. Publishes to npm (via `@semantic-release/npm`)
6. Creates GitHub release with release notes (via `@semantic-release/github`)

### Commit convention

Must follow [Angular Commit Message Conventions](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit):

| Type | Release |
|---|---|
| `fix:` | Patch (0.0.X) |
| `feat:` | Minor (0.X.0) |
| `BREAKING CHANGE:` footer | Major (X.0.0) |

### Required secrets

Set in GitHub repo → Settings → Secrets and variables → Actions:

- `NPM_TOKEN` — npm automation token ([create one](https://docs.npmjs.com/creating-and-viewing-access-tokens))
- `GITHUB_TOKEN` — auto-provided by GitHub Actions

### First-time setup on npm

If the package doesn't exist on npm yet, publish it manually once:

```bash
npm login
npm publish --access public
```

After the initial publish, semantic-release handles all subsequent releases.
