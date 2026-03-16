import { test, expect } from '@playwright/test';
import { loginTestUser } from './utils';

test.describe('Authorization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should block access to other users cars', async ({ page }) => {
    await loginTestUser(page);
    // Try to access a car that doesn't belong to this user
    await page.goto('/car/some-other-car-id');
    // Should show access denied or redirect
    test.skip(); // TODO: Test after we have test data
  });

  test('should allow owner full access', async ({ page }) => {
    await loginTestUser(page);
    test.skip(); // TODO: Test after we have test data
  });
});
