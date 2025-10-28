import { test, expect } from '@playwright/test';

test.describe('FinSmartAI Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('h1');
  });

  test('should load the homepage', async ({ page }) => {
    // Check if the main heading is present
    await expect(page.locator('h1')).toContainText('FinSmartAI');
    
    // Check if the description is present
    await expect(page.locator('text=Complete Financial AI Ecosystem')).toBeVisible();
    
    // Check if the main navigation is present
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should display real-time stats', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('.grid.grid-cols-2');
    
    // Check if AI Models stat is present
    await expect(page.locator('text=AI Models')).toBeVisible();
    
    // Check if API Endpoints stat is present
    await expect(page.locator('text=API Endpoints')).toBeVisible();
    
    // Check if Active Users stat is present
    await expect(page.locator('text=Active Users')).toBeVisible();
    
    // Check if Predictions stat is present
    await expect(page.locator('text=Predictions')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    // Click on Models tab
    await page.click('text=Models');
    await expect(page.locator('text=AI Models')).toBeVisible();
    
    // Click on Real-time tab
    await page.click('text=Real-time');
    await expect(page.locator('text=Real-time')).toBeVisible();
    
    // Click on Technology tab
    await page.click('text=Technology');
    await expect(page.locator('text=Technology')).toBeVisible();
    
    // Click on Pricing tab
    await page.click('text=Pricing');
    await expect(page.locator('text=Pricing')).toBeVisible();
  });

  test('should display AI models information', async ({ page }) => {
    // Navigate to Models tab
    await page.click('text=Models');
    
    // Wait for models to load
    await page.waitForSelector('.grid.grid-cols-1');
    
    // Check if some AI models are displayed
    await expect(page.locator('text=Kronos-SentimentAI')).toBeVisible();
    await expect(page.locator('text=Kronos-OptionsAI')).toBeVisible();
    await expect(page.locator('text=Kronos-RiskAI')).toBeVisible();
  });

  test('should display subscription plans', async ({ page }) => {
    // Navigate to Pricing tab
    await page.click('text=Pricing');
    
    // Wait for pricing to load
    await page.waitForSelector('.grid.grid-cols-1');
    
    // Check if subscription plans are displayed
    await expect(page.locator('text=Basic')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Institutional')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test('should handle mobile responsiveness', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile layout is applied
    await expect(page.locator('h1')).toBeVisible();
    
    // Check if navigation is still accessible
    await expect(page.locator('nav')).toBeVisible();
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
  });

  test('should display sign in form', async ({ page }) => {
    // Check if sign in form is present
    await expect(page.locator('text=Sign In')).toBeVisible();
    
    // Check if email input is present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Check if password input is present
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check if sign in button is present
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.click('button:has-text("Sign In")');
    
    // Check if validation errors appear
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Fill invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    
    // Fill password
    await page.fill('input[type="password"]', 'password123');
    
    // Try to submit
    await page.click('button:has-text("Sign In")');
    
    // Check if email validation error appears
    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });
});

test.describe('Dashboard Features', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for dashboard access
    await page.addInitScript(() => {
      localStorage.setItem('nextauth.session', JSON.stringify({
        user: { id: 'test-user', email: 'test@example.com' },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
    });
    
    await page.goto('/dashboard');
  });

  test('should load dashboard page', async ({ page }) => {
    // Check if dashboard heading is present
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check if dashboard content is loaded
    await expect(page.locator('.grid')).toBeVisible();
  });

  test('should display analytics cards', async ({ page }) => {
    // Wait for analytics to load
    await page.waitForSelector('.grid.grid-cols-1');
    
    // Check if analytics cards are present
    await expect(page.locator('text=Market Sentiment')).toBeVisible();
    await expect(page.locator('text=Trading Volume')).toBeVisible();
    await expect(page.locator('text=AI Accuracy')).toBeVisible();
    await expect(page.locator('text=Active Signals')).toBeVisible();
  });

  test('should navigate to analytics page', async ({ page }) => {
    // Click on analytics link
    await page.click('text=Analytics');
    
    // Wait for analytics page to load
    await page.waitForSelector('h1');
    
    // Check if analytics page is loaded
    await expect(page.locator('h1')).toContainText('Analytics');
  });
});

test.describe('Billing and Payments', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('nextauth.session', JSON.stringify({
        user: { id: 'test-user', email: 'test@example.com' },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
    });
    
    await page.goto('/billing');
  });

  test('should load billing page', async ({ page }) => {
    // Check if billing heading is present
    await expect(page.locator('h1')).toContainText('Billing & Payments');
    
    // Check if billing content is loaded
    await expect(page.locator('.space-y-6')).toBeVisible();
  });

  test('should toggle between simple and enhanced payment views', async ({ page }) => {
    // Check if toggle button is present
    await expect(page.locator('button:has-text("Show Enhanced Payment")')).toBeVisible();
    
    // Click toggle button
    await page.click('button:has-text("Show Enhanced Payment")');
    
    // Check if button text changes
    await expect(page.locator('button:has-text("Show Simple View")')).toBeVisible();
    
    // Click again to toggle back
    await page.click('button:has-text("Show Simple View")');
    
    // Check if button text changes back
    await expect(page.locator('button:has-text("Show Enhanced Payment")')).toBeVisible();
  });
});

test.describe('Cache Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cache-demo');
  });

  test('should load cache demo page', async ({ page }) => {
    // Check if cache demo heading is present
    await expect(page.locator('h1')).toContainText('Cache Performance Demo');
    
    // Check if cache statistics are displayed
    await expect(page.locator('text=Cache Statistics')).toBeVisible();
  });

  test('should display cache management controls', async ({ page }) => {
    // Check if cache management buttons are present
    await expect(page.locator('button:has-text("Load Market Data")')).toBeVisible();
    await expect(page.locator('button:has-text("Load Predictions")')).toBeVisible();
    await expect(page.locator('button:has-text("Load Analytics")')).toBeVisible();
    await expect(page.locator('button:has-text("Warm Up Cache")')).toBeVisible();
    await expect(page.locator('button:has-text("Clear All Cache")')).toBeVisible();
  });

  test('should load market data when button is clicked', async ({ page }) => {
    // Click load market data button
    await page.click('button:has-text("Load Market Data")');
    
    // Wait for data to load
    await page.waitForSelector('.grid.grid-cols-1');
    
    // Check if market data is displayed
    await expect(page.locator('text=NIFTY50')).toBeVisible();
    await expect(page.locator('text=BANKNIFTY')).toBeVisible();
  });

  test('should navigate between cache demo tabs', async ({ page }) => {
    // Click on Predictions tab
    await page.click('text=Predictions');
    await expect(page.locator('text=Cached AI Predictions')).toBeVisible();
    
    // Click on Analytics tab
    await page.click('text=Analytics');
    await expect(page.locator('text=Cached Analytics')).toBeVisible();
    
    // Click on Dashboard Hook tab
    await page.click('text=Dashboard Hook');
    await expect(page.locator('text=Dashboard Hook Demo')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 pages', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/non-existent-page');
    
    // Check if 404 error is handled gracefully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock failed API response
    await page.route('**/api/health', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/');
    
    // Check if page still loads despite API error
    await expect(page.locator('h1')).toContainText('FinSmartAI');
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    await page.goto('/');
    
    // Check if page still loads with degraded functionality
    await expect(page.locator('h1')).toContainText('FinSmartAI');
  });
});

test.describe('Performance', () => {
  test('should load homepage within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('h1');
    
    const loadTime = Date.now() - startTime;
    
    // Check if page loads within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have fast first contentful paint', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcp) {
            resolve(fcp.startTime);
            observer.disconnect();
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      });
    });
    
    // Check if FCP is under 1.5 seconds
    expect(metrics).toBeLessThan(1500);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Navigate to analytics page
    await page.goto('/analytics');
    
    // Wait for charts to load
    await page.waitForSelector('.recharts-wrapper');
    
    // Check if page remains responsive
    const startTime = Date.now();
    
    // Interact with charts
    await page.click('text=Market Data');
    await page.click('text=AI Models');
    await page.click('text=Predictions');
    
    const interactionTime = Date.now() - startTime;
    
    // Check if interactions are fast
    expect(interactionTime).toBeLessThan(2000);
  });
});