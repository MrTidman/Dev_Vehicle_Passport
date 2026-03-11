# E2E Tests - Virtual Service Passport

This folder contains End-to-End (E2E) tests using Playwright to verify user flows in the Virtual Service Passport application.

## Quick Start

```bash
# Run all tests (against local dev server)
npm test

# Run specific test file
npm test -- auth.spec.ts

# Run tests with visible browser
npm run test:headed

# Run with Playwright UI
npm run test:ui

# View test report
npm run test:report

# Run against deployed URL
BASE_URL=https://your-preproduction-url.com npm test
```

## Running Against Preproduction

To run tests against a deployed (preproduction) environment:

```bash
# Set the base URL to your preproduction deployment
BASE_URL=https://vsp-preproduction.vercel.app npm test

# Or with authentication
TEST_EMAIL=user@test.com TEST_PASSWORD=password123 BASE_URL=https://... npm test
```

## Test Coverage

### 1. Authentication (`auth.spec.ts`)

| Test | Description |
|------|-------------|
| Register with valid credentials | Verifies new user can register with email, name, and password |
| Password validation (mismatch) | Ensures error shown when passwords don't match |
| Login with valid credentials | Tests successful login flow |
| Login with invalid credentials | Verifies error message for wrong credentials |
| Login with empty fields | Tests form validation prevents empty submissions |

### 2. Cars (`cars.spec.ts`)

| Test | Description |
|------|-------------|
| Add new car with all fields | Verifies user can add car with registration, VIN, make, model, year, fuel type, engine, colour |
| Form validation | Ensures required fields are validated |
| Car list on dashboard | Tests that cars appear on the dashboard after creation |
| Empty state handling | Verifies graceful handling when user has no cars |
| Car detail page | Confirms car details page displays all car information |

### 3. Service Records (`service-records.spec.ts`)

| Test | Description |
|------|-------------|
| Add service record | Tests adding a service record with type, description, mileage, cost, garage |
| Service record display | Verifies service records appear in the list |
| Expense summary | Validates expense totals are calculated correctly |

### 4. Reminders (`reminders.spec.ts`)

| Test | Description |
|------|-------------|
| Add reminder | Tests adding reminder with type, title, due date |
| Mark reminder complete | Verifies user can mark reminder as done |
| Overdue reminders | Checks overdue reminders display correctly |

### 5. Ownership Transfer (`transfer.spec.ts`)

| Test | Description |
|------|-------------|
| Initiate transfer | Tests creating a transfer token/邀请 |
| Transfer link creation | Verifies sharing link is generated after initiating transfer |

*Note: The "accept transfer" flow is difficult to test in isolation and requires coordination between two users. This test verifies the initiate flow only.*

### 6. Authorization/Security (`authz.spec.ts`)

| Test | Description |
|------|-------------|
| User cannot access another user's car by URL | Verifies users cannot view other users' cars by manipulating the URL |
| Authorization enforced for service records | Ensures service records are also protected by authorization |

This is the **critical security test** that verifies the authorization fixes work correctly.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:5173` | Base URL to test against |
| `TEST_EMAIL` | - | Test email for pre-configured credentials |
| `TEST_PASSWORD` | - | Test password |
| `SUPABASE_URL` | - | Supabase URL for cleanup |
| `SUPABASE_ANON_KEY` | - | Supabase anon key |

### Playwright Configuration

The `playwright.config.ts` file contains:
- Test directory: `./tests/e2e`
- Browser: Chromium
- Web server: Auto-starts `npm run dev` for local testing
- Retry policy: 2 retries on CI, 0 locally
- Screenshot/Video: On failure only

## Troubleshooting

### Tests fail due to email confirmation

If registration requires email confirmation, some tests may fail. This is expected behavior. The tests attempt to handle this gracefully.

### Authentication issues

For preproduction testing, you may need to:
1. Disable email confirmation in Supabase, or
2. Use pre-configured test credentials via environment variables

### Browser installation issues

```bash
# Reinstall Playwright browsers
npx playwright install chromium
```

## Notes

- Tests are designed to run against any deployment (local dev or production)
- Each test creates its own test user to avoid conflicts
- Tests use unique timestamps to generate fresh emails
- The web server automatically starts when running locally