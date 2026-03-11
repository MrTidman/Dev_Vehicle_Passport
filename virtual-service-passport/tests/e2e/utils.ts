/**
 * Test Utilities
 * 
 * Helper functions for E2E tests
 */

import { Page, test as base } from '@playwright/test';

// Pre-configured test user (created in Supabase Auth)
export const TEST_USER = {
  email: 'agentsage@example.com',
  password: '5KoKVs69cC3K2Jky02OK',
};

// Helper to login with pre-configured test user
export async function loginTestUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[id="email"]', TEST_USER.email);
  await page.fill('input[id="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  
  return TEST_USER;
}

export const waitForPageToLoad = async (page: Page, urlPattern?: RegExp, timeout = 10000) => {
  await page.waitForLoadState('networkidle');
  
  if (urlPattern) {
    await page.waitForURL(urlPattern, { timeout }).catch(() => {
      // If we can't match the URL, just continue
    });
  }
};

export const createCar = async (page: Page, registration: string, make: string, model: string) => {
  await page.goto('/cars/new');
  await page.fill('input[id="registration"]', registration);
  await page.fill('input[id="make"]', make);
  await page.fill('input[id="model"]', model);
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/car/**', { timeout: 10000 });
  
  const carUrl = page.url();
  const carId = carUrl.split('/car/')[1];
  
  return carId;
};

export const fillField = async (page: Page, fieldId: string, value: string) => {
  const field = page.locator(`input[id="${fieldId}"]`).or(
    page.locator(`textarea[id="${fieldId}"]`)
  ).or(
    page.locator(`select[id="${fieldId}"]`)
  );
  
  if (await field.count() > 0) {
    await field.fill(value);
    return true;
  }
  return false;
};
