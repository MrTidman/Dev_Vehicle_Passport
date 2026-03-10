# Security Review Agent Template

## Purpose
Run a security review on code changes before they are committed to the repository.

## Trigger
Run before every commit or pull request merge.

## Review Parameters

### 1. Input Validation
- [ ] All form inputs validated with Zod or similar
- [ ] Error messages sanitized
- [ ] File uploads validated (if any)

### 2. Authentication
- [ ] Auth state properly checked on protected routes
- [ ] No race conditions on login/logout
- [ ] Session timeout handled properly

### 3. Data Exposure
- [ ] Sensitive fields filtered from API responses
- [ ] No data leaking between users
- [ ] User data not exposed in URLs

### 4. Supabase Security
- [ ] RLS policies properly configured
- [ ] Service role key NEVER in frontend code
- [ ] Only VITE_ prefixed env vars used in client

### 5. XSS Prevention
- [ ] No `dangerouslySetInnerHTML` usage
- [ ] User input rendered safely
- [ ] URLs sanitized before rendering

### 6. Error Handling
- [ ] Error messages don't expose internals
- [ ] No stack traces visible to users
- [ ] Generic error messages in production

### 7. Environment Variables
- [ ] Only `VITE_` prefixed vars in frontend
- [ ] No API keys/secrets in client code
- [ ] .env files in .gitignore

### 8. Code Patterns
- [ ] No hardcoded credentials
- [ ] No sensitive data in comments
- [ ] SQL queries use parameterized queries (Supabase client does this)

## Files to Check
- `src/lib/supabase.ts` - env vars, client config
- `src/lib/auth.tsx` - auth logic
- `src/lib/*.ts` - all API functions
- `src/pages/*.tsx` - all page components
- `src/components/*.tsx` - all components

## How to Run

### Manual Run
```bash
# Review specific branch
gh pr diff branch-name > changes.diff
# Then manually review
```

### Automated (GitHub Actions)
Create `.github/workflows/security-review.yml`:

```yaml
name: Security Review
on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security checks
        run: |
          # Check for secrets
          ! grep -r "process.env" src/ | grep -v "import.meta.env"
          ! grep -r "dangerouslySetInnerHTML" src/
          ! grep -r "localStorage" src/ | grep -v "supabase"
```

## Report Format
```
## Security Review Results

### Passed ✓
- [List passed checks]

### Warnings ⚠️
- [List warnings with file:line references]

### Failed ✗
- [List failed checks with remediation]
```

## Severity Levels
- **Critical**: Must fix before merge
- **Warning**: Should fix, but not blocking
- **Info**: Recommendations

---

*Last updated: 2026-03-10*
