import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('redirects unauthenticated users to login page', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('displays guest login option', async ({ page }) => {
    await expect(page.getByText('Try Demo (No Signup Needed)')).toBeVisible();
    await expect(page.getByText('demo@taskmesh.io')).toBeVisible();
  });

  test('shows validation errors for empty form', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.getByText('Invalid email')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('navigates to registration page', async ({ page }) => {
    await page.click('text=Create an account');
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Task Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'john@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/workspaces/);
  });

  test('displays workspace list after login', async ({ page }) => {
    await expect(page.getByText('Acme Corp')).toBeVisible();
  });

  test('navigates to board view', async ({ page }) => {
    await page.getByText('Acme Corp').click();
    await page.waitForTimeout(2000);
    await page.getByText('Product Development').click();
    await page.waitForTimeout(2000);
    await expect(page.getByText('To Do')).toBeVisible();
  });
});
