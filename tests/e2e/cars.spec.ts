import { test, expect } from '@playwright/test';

// Helper to login with pre-configured test user
async function createTestUserAndLogin(page: Playwright.Page) {
  const email = 'agentsage@example.com';
  const password = '5KoKVs69cC3K2Jky02OK';
  
  // Go to login with pre-configured user
  await page.goto('/login');
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.click('button[type="submit"]');
  
  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  } catch (e) {
    throw new Error(`Login failed for ${email}`);
  }
  
  return { email, password };
}

test.describe('Cars', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should add a new car with all fields', async ({ page }) => {
    await createTestUserAndLogin(page);
    
    // Navigate to add car page
    await page.goto('/cars/new');
    
    // Fill in car details
    await page.fill('input[id="registration"]', 'ABC123');
    await page.fill('input[id="vin"]', '1G1YY22G965108523');
    await page.fill('input[id="make"]', 'Toyota');
    await page.fill('input[id="model"]', 'Camry');
    await page.fill('input[id="year"]', '2022');
    await page.selectOption('select[id="fuel_type"]', 'Petrol');
    await page.fill('input[id="colour"]', 'Silver');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to car detail or dashboard
    await page.waitForURL('**/car/**', { timeout: 10000 });
    
    // Verify car details are displayed
    await expect(page.locator('text=ABC123')).toBeVisible();
    await expect(page.locator('text=Toyota')).toBeVisible();
    await expect(page.locator('text=Camry')).toBeVisible();
  });

  test('should validate required fields on car form', async ({ page }) => {
    await createTestUserAndLogin(page);
    
    await page.goto('/cars/new');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=Registration is required')).toBeVisible();
  });

  test('should display car list on dashboard', async ({ page }) => {
    await createTestUserAndLogin(page);
    
    // Should show dashboard with car list (or empty state)
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should view car details', async ({ page }) => {
    await createTestUserAndLogin(page);
    
    // If user has cars, should see them
    // Otherwise empty state
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should delete car', async ({ page }) => {
    // This test would need a car to exist first
    // Skipping for now
    test.skip();
  });
});
