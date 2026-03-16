import { test, expect } from '@playwright/test';
import { loginTestUser } from './utils';

test.describe('Ownership Transfer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should initiate transfer', async ({ page }) => {
    await loginTestUser(page);
    test.skip(); // TODO: Needs existing car ownership
  });

  test('should accept transfer', async ({ page }) => {
    test.skip(); // TODO: Complex multi-user flow
  });
});
