# Agent Rules

Guidelines for code changes to the Virtual Service Passport project.

## Workflow

1. **Create a branch** from `main` — name it describe the change (e.g., `agent/add-user-auth`)
2. **Make changes** — write code, tests, etc.
3. **Run tests** — verify existing tests pass, then test your changes
4. **Push branch** — push to origin
5. **Open PR** — create a pull request for review

## Rules

- ✅ **Run tests** before AND after making changes
- ✅ **Fix or revert** if tests fail after your changes
- ✅ **Write descriptive commit messages** prefixed with `[Moss]`
- ✅ **Request review** — don't merge your own PRs
- ✅ **Preview deploy must succeed** before requesting merge

- ❌ **DO NOT** modify `.env` files
- ❌ **DO NOT** change auth configuration
- ❌ **DO NOT** install new dependencies without explicit approval
- ❌ **DO NOT** push directly to `main`
- ❌ **DO NOT** merge your own PRs

## Commit Message Format

```
[Moss] Brief description of change

- Optional detail line
- Another detail
```

Example:
```
[Moss] Add user registration form

- Added email/password fields
- Added form validation with Zod
- Connected to Supabase auth
```

## Testing Requirements

Run the following before pushing:

```bash
# Install dependencies (if needed)
npm install

# Lint
npm run lint

# Type check
npm run typecheck

# Tests
npm test

# Build
npm run build
```

All commands must pass with exit code 0.

## Preview Deployments

Vercel automatically deploys branches and PRs to preview URLs. A successful preview build is required before merge.

---

*Last updated: 2026-03-10*