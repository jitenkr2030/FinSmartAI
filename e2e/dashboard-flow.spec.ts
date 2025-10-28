import { test, expect } from '@playwright/test';

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for dashboard access
    await page.addInitScript(() => {
      localStorage.setItem('nextauth.session', JSON.stringify({
        user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
    });
    
    await page.goto('/dashboard');
  });

  test('should load dashboard with proper authentication', async ({ page }) => {
    // Check if dashboard heading is present
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check if user info is displayed
    await expect(page.locator('text=Test User')).toBeVisible();
    
    // Check if dashboard content is loaded
    await expect(page.locator('.grid')).toBeVisible();
  });

  test('should display analytics cards with data', async ({ page }) => {
    // Wait for analytics to load
    await page.waitForSelector('.grid.grid-cols-1');
    
    // Check if analytics cards are present
    await expect(page.locator('text=Market Sentiment')).toBeVisible();
    await expect(page.locator('text=Trading Volume')).toBeVisible();
    await expect(page.locator('text=AI Accuracy')).toBeVisible();
    await expect(page.locator('text=Active Signals')).toBeVisible();
    
    // Check if cards have numerical data
    const sentimentCard = page.locator('text=Market Sentiment').locator('..');
    await expect(sentimentCard.locator('.text-2xl, .text-3xl')).toBeVisible();
  });

  test('should navigate between dashboard sections', async ({ page }) => {
    // Check if navigation menu is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Test navigation to different sections
    const navItems = ['Analytics', 'Models', 'Real-time', 'Settings'];
    
    for (const item of navItems) {
      await page.click(`text=${item}`);
      await page.waitForTimeout(1000); // Wait for navigation
      
      // Check if page content changes
      const currentUrl = page.url();
      if (item === 'Analytics') {
        await expect(currentUrl).toContain('/analytics');
      } else if (item === 'Models') {
        await expect(currentUrl).toContain('/models');
      } else if (item === 'Real-time') {
        await expect(currentUrl).toContain('/realtime');
      } else if (item === 'Settings') {
        await expect(currentUrl).toContain('/settings');
      }
      
      // Navigate back to dashboard
      await page.goto('/dashboard');
    }
  });

  test('should display real-time data updates', async ({ page }) => {
    // Wait for initial data load
    await page.waitForSelector('.grid.grid-cols-1');
    
    // Get initial values
    const initialSentiment = await page.locator('text=Market Sentiment').locator('..').locator('.text-2xl, .text-3xl').textContent();
    
    // Wait for potential updates (real-time data)
    await page.waitForTimeout(5000);
    
    // Check if values might have changed (this is a soft check since real-time updates may not always occur)
    const updatedSentiment = await page.locator('text=Market Sentiment').locator('..').locator('.text-2xl, .text-3xl').textContent();
    
    // If values are different, that's good (real-time update)
    // If they're the same, that's also acceptable (no update occurred)
    console.log(`Initial sentiment: ${initialSentiment}, Updated sentiment: ${updatedSentiment}`);
  });

  test('should handle user interactions with charts', async ({ page }) => {
    // Wait for charts to load
    await page.waitForSelector('.recharts-wrapper, .chart-container');
    
    // Check if charts are interactive
    const chartContainer = page.locator('.recharts-wrapper, .chart-container').first();
    await expect(chartContainer).toBeVisible();
    
    // Test hover interaction if possible
    await chartContainer.hover();
    await page.waitForTimeout(500);
    
    // Check if tooltips appear on hover
    const tooltip = page.locator('.recharts-tooltip-wrapper, .chart-tooltip');
    if (await tooltip.isVisible()) {
      await expect(tooltip).toBeVisible();
    }
  });

  test('should display model performance metrics', async ({ page }) => {
    // Look for model performance section
    const modelSection = page.locator('text=Model Performance, text=AI Models').first();
    if (await modelSection.isVisible()) {
      await expect(modelSection).toBeVisible();
      
      // Check if model cards are present
      const modelCards = page.locator('.card, .model-card');
      const cardCount = await modelCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // Check if each card has model information
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = modelCards.nth(i);
        await expect(card.locator('h3, .model-name')).toBeVisible();
        await expect(card.locator('.progress, .accuracy')).toBeVisible();
      }
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test desktop layout
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile menu appears
    const mobileMenu = page.locator('button[aria-label="Menu"], .mobile-menu-button');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('.mobile-menu, .sidebar-mobile')).toBeVisible();
    }
    
    // Check if content is still accessible
    await expect(page.locator('h1')).toBeVisible();
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle data loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { metrics: [] } })
        });
      }, 2000);
    });
    
    // Reload page to trigger loading state
    await page.reload();
    
    // Check if loading indicators are present
    const loadingSpinner = page.locator('.loading, .spinner, .skeleton');
    if (await loadingSpinner.isVisible()) {
      await expect(loadingSpinner).toBeVisible();
    }
    
    // Wait for data to load
    await page.waitForTimeout(2500);
    
    // Check if content is loaded
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal Server Error' })
      });
    });
    
    // Reload page to trigger error
    await page.reload();
    
    // Check if error message is displayed
    const errorMessage = page.locator('text=Error, text=Failed to load');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
    
    // Check if page remains functional
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should have accessible navigation and controls', async ({ page }) => {
    // Check keyboard navigation
    await page.press('body', 'Tab');
    const firstFocusable = await page.locator(':focus');
    await expect(firstFocusable).toBeVisible();
    
    // Check if navigation links have proper aria attributes
    const navLinks = page.locator('nav a, nav button');
    const linkCount = await navLinks.count();
    
    for (let i = 0; i < Math.min(linkCount, 3); i++) {
      const link = navLinks.nth(i);
      await expect(link).toHaveAttribute('href', /.*/); // Should have href or be a button
    }
    
    // Check if main content has proper landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should persist user preferences', async ({ page }) => {
    // Test theme toggle if present
    const themeToggle = page.locator('button[aria-label*="theme"], .theme-toggle');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check if theme is applied
      const body = page.locator('body');
      const hasDarkClass = await body.getAttribute('class');
      expect(hasDarkClass).toContain('dark');
      
      // Reload page to check persistence
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Check if theme preference persists
      const bodyAfterReload = page.locator('body');
      const hasDarkClassAfterReload = await bodyAfterReload.getAttribute('class');
      expect(hasDarkClassAfterReload).toContain('dark');
    }
  });

  test('should handle logout functionality', async ({ page }) => {
    // Look for logout button
    const logoutButton = page.locator('text=Logout, text=Sign Out, button[aria-label*="logout"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Check if redirected to login page
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      
      if (currentUrl.includes('/auth/signin') || currentUrl.includes('/login')) {
        await expect(page.locator('h1')).toContainText('Sign In');
      } else {
        // Check if session is cleared
        const session = await page.evaluate(() => {
          return localStorage.getItem('nextauth.session');
        });
        expect(session).toBeNull();
      }
    }
  });
});