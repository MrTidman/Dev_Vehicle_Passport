import { test, expect } from '@playwright/test';
import { loginTestUser } from './utils';

test.describe('Service Records', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should add a service record', async ({ page }) => {
    await loginTestUser(page);
    test.skip(); // TODO: Needs existing car
  });

  test('should display service records list', async ({ page }) => {
    await loginTestUser(page);
    test.skip(); // TODO: Needs existing car
  });

  test('should calculate expense summary', async ({ page }) => {
    await loginTestUser(page);
    test.skip(); // TODO: Needs existing car
  });
});
