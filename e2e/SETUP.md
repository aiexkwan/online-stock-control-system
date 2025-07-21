# E2E Test Setup Guide

## Required Environment Variables

The E2E tests require valid test user credentials to run successfully. Without these, authentication tests will be skipped.

### Setting Up Test Credentials

The tests will automatically load credentials from `.env.local`. The following environment variables are supported:

```bash
# Primary method (used in .env.local)
PUPPETEER_LOGIN=your_email@pennineindustries.com
PUPPETEER_PASSWORD=your_password

# Alternative method
E2E_USER_EMAIL=testuser@pennineindustries.com
E2E_USER_PASSWORD=your_test_password
E2E_ADMIN_EMAIL=testadmin@pennineindustries.com
E2E_ADMIN_PASSWORD=your_admin_password
```

**Important:**
- Email addresses MUST end with `@pennineindustries.com`
- The test users must exist in your database with valid credentials

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test e2e/auth/login.spec.ts
```

### Run with UI mode (recommended for debugging)
```bash
npm run test:e2e:ui
```

## Test Updates Summary

The following changes were made to align tests with the actual implementation:

1. **Login URL**: Changed from `/login` to `/main-login`
2. **Success Redirect**: Changed from `/dashboard` to `/access`
3. **Email Validation**: Now requires emails ending with `@pennineindustries.com`
4. **Error Messages**: Updated selectors to match the actual error display (motion.div with specific styling)
5. **Logout Flow**: Updated to redirect to `/main-login` instead of `/login`

## Common Issues

### "Invalid login credentials" Error
This means the test credentials are not valid. Ensure:
- The email ends with `@pennineindustries.com`
- The user exists in the database
- The password is correct

### Tests are Skipped
If you see tests being skipped, it means the required environment variables are not set. Set up the `.env.test.local` file as described above.

### Selector Not Found
The error message selector has been updated to match the actual implementation. If you still see issues, use the Playwright Inspector to debug:

```bash
npx playwright test --debug
```

### Timeout Errors
If you encounter timeout errors when running multiple tests:

1. **Reduce parallel workers**:
   ```bash
   npx playwright test --workers=1
   ```

2. **Increase timeout in specific tests**:
   ```typescript
   test.setTimeout(60000); // 60 seconds
   ```

3. **Check if dev server is running properly**:
   ```bash
   npm run dev  # In a separate terminal
   npm run test:e2e
   ```

4. **Use headed mode to see what's happening**:
   ```bash
   npm run test:e2e -- --headed
   ```

## Test Configuration Details

### Global Setup
The tests use a global setup file (`e2e/global-setup.ts`) that automatically loads environment variables from `.env.local`.

### Page Objects
- **LoginPage**: Located at `e2e/pages/login.page.ts`
- Handles login form interactions and error message detection
- Updated selectors match the actual implementation

### Test Data
- Test configuration is in `e2e/utils/test-data.ts`
- Credentials fallback order: E2E_* vars → PUPPETEER_* vars → defaults

### URL Changes Summary
- Login URL: `/main-login` (not `/login`)
- Success redirect: `/access` (not `/dashboard`)
- Admin dashboard: `/admin/dashboard` (not `/dashboard`)
- Logout redirect: `/main-login` (not `/login`)
