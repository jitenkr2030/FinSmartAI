import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to sign in page from homepage', async ({ page }) => {
    // Click on sign in button if it exists
    const signInButton = page.locator('text=Sign In').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await expect(page).toHaveURL('/auth/signin');
    } else {
      // Alternative navigation
      await page.goto('/auth/signin');
    }
    
    // Check if sign in form is present
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Try to submit without filling fields
    await page.click('button:has-text("Sign In")');
    
    // Check if validation errors appear
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Fill invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    
    // Try to submit
    await page.click('button:has-text("Sign In")');
    
    // Check if email validation error appears
    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Fill valid email but short password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123');
    
    // Try to submit
    await page.click('button:has-text("Sign In")');
    
    // Check if password validation error appears
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should handle successful authentication simulation', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Fill valid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Mock successful authentication response
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 'test-user', email: 'test@example.com' }
        })
      });
    });
    
    // Submit form
    await page.click('button:has-text("Sign In")');
    
    // Wait for potential redirect or success message
    await page.waitForTimeout(2000);
    
    // Check if we're redirected or see a success message
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      await expect(page.locator('h1')).toContainText('Dashboard');
    } else {
      // If not redirected, check for success message
      await expect(page.locator('text=Successfully signed in')).toBeVisible();
    }
  });

  test('should handle authentication failure', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Fill invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Mock authentication failure
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        })
      });
    });
    
    // Submit form
    await page.click('button:has-text("Sign In")');
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should have accessible form elements', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check if form elements have proper labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    
    // Check if inputs have proper aria attributes
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('aria-required', 'true');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('aria-required', 'true');
    
    // Check if submit button has proper aria attributes
    const submitButton = page.locator('button:has-text("Sign In")');
    await expect(submitButton).toHaveAttribute('type', 'submit');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Test keyboard navigation through form
    await page.press('body', 'Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.press('body', 'Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.press('body', 'Tab');
    await expect(page.locator('button:has-text("Sign In")')).toBeFocused();
    
    // Submit with Enter key
    await page.press('button:has-text("Sign In")', 'Enter');
    
    // Check if validation errors appear (since form is empty)
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if form is properly laid out
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    
    // Check if elements are properly sized for mobile
    const emailInput = page.locator('input[type="email"]');
    const emailBox = await emailInput.boundingBox();
    expect(emailBox?.width).toBeGreaterThan(300); // Should be wide enough for mobile
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should show loading state during form submission', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Mock slow response
    await page.route('**/api/auth/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: { id: 'test-user' } })
        });
      }, 2000);
    });
    
    // Submit form
    await page.click('button:has-text("Sign In")');
    
    // Check if button shows loading state
    await expect(page.locator('button:has-text("Signing in...")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeDisabled();
  });
});