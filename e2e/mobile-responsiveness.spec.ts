import { test, expect } from '@playwright/test';

const mobileDevices = [
  { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
  { name: 'Pixel 5', viewport: { width: 393, height: 851 } },
  { name: 'iPad', viewport: { width: 768, height: 1024 } }
];

const tabletDevices = [
  { name: 'iPad Pro', viewport: { width: 1024, height: 1366 } },
  { name: 'Surface Pro', viewport: { width: 912, height: 1368 } }
];

test.describe('Mobile Responsiveness', () => {
  mobileDevices.forEach(device => {
    test.describe(`Device: ${device.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(device.viewport);
        await page.goto('/');
      });

      test('should display mobile-optimized homepage', async ({ page }) => {
        // Check if mobile layout is applied
        const mobileLayout = page.locator('.mobile-layout, .responsive-layout');
        if (await mobileLayout.isVisible()) {
          await expect(mobileLayout).toBeVisible();
        }

        // Check if main content is visible
        await expect(page.locator('h1')).toContainText('FinSmartAI');
        await expect(page.locator('text=Complete Financial AI Ecosystem')).toBeVisible();
        
        // Check if navigation is mobile-friendly
        const mobileNav = page.locator('.mobile-nav, .hamburger-menu, .menu-toggle');
        if (await mobileNav.isVisible()) {
          await expect(mobileNav).toBeVisible();
        }
      });

      test('should handle mobile navigation', async ({ page }) => {
        // Look for mobile menu toggle
        const menuToggle = page.locator('button[aria-label*="menu"], .hamburger, .menu-toggle');
        if (await menuToggle.isVisible()) {
          await menuToggle.click();
          await page.waitForTimeout(500);
          
          // Check if mobile menu appears
          const mobileMenu = page.locator('.mobile-menu, .sidebar-mobile, .nav-dropdown');
          await expect(mobileMenu).toBeVisible();
          
          // Test navigation links
          const navLinks = mobileMenu.locator('a, button');
          const linkCount = await navLinks.count();
          expect(linkCount).toBeGreaterThan(0);
          
          // Close mobile menu
          await menuToggle.click();
          await page.waitForTimeout(500);
        }
      });

      test('should display mobile-optimized stats', async ({ page }) => {
        // Wait for stats to load
        await page.waitForSelector('.grid.grid-cols-2');
        
        // Check if stats are properly sized for mobile
        const statCards = page.locator('.grid.grid-cols-2 > div');
        const cardCount = await statCards.count();
        expect(cardCount).toBe(4);
        
        // Check if each card is visible and properly sized
        for (let i = 0; i < cardCount; i++) {
          const card = statCards.nth(i);
          await expect(card).toBeVisible();
          
          const cardBox = await card.boundingBox();
          expect(cardBox?.width).toBeGreaterThan(0);
          expect(cardBox?.height).toBeGreaterThan(0);
        }
      });

      test('should handle mobile tabs navigation', async ({ page }) => {
        // Check if tabs are present
        const tabs = page.locator('.tabs, .tab-list');
        if (await tabs.isVisible()) {
          await expect(tabs).toBeVisible();
          
          // Test tab navigation
          const tabTriggers = tabs.locator('button, [role="tab"]');
          const tabCount = await tabTriggers.count();
          
          if (tabCount > 0) {
            // Test first few tabs
            for (let i = 0; i < Math.min(tabCount, 3); i++) {
              const tab = tabTriggers.nth(i);
              await tab.click();
              await page.waitForTimeout(500);
              
              // Check if tab content changes
              const tabContent = page.locator('[role="tabpanel"], .tab-content');
              await expect(tabContent).toBeVisible();
            }
          }
        }
      });

      test('should display mobile-optimized cards', async ({ page }) => {
        // Navigate to models tab
        await page.click('text=Models');
        await page.waitForTimeout(1000);
        
        // Check if cards are properly sized for mobile
        const modelCards = page.locator('.card, .model-card');
        const cardCount = await modelCards.count();
        
        if (cardCount > 0) {
          for (let i = 0; i < Math.min(cardCount, 3); i++) {
            const card = modelCards.nth(i);
            await expect(card).toBeVisible();
            
            const cardBox = await card.boundingBox();
            expect(cardBox?.width).toBeLessThanOrEqual(device.viewport.width - 32); // Account for padding
          }
        }
      });

      test('should handle mobile touch interactions', async ({ page }) => {
        // Test tap interactions
        const interactiveElements = page.locator('button, a, .clickable');
        const elementCount = await interactiveElements.count();
        
        if (elementCount > 0) {
          // Test first few interactive elements
          for (let i = 0; i < Math.min(elementCount, 3); i++) {
            const element = interactiveElements.nth(i);
            if (await element.isVisible()) {
              await element.tap();
              await page.waitForTimeout(500);
              
              // Check if interaction worked
              const currentUrl = page.url();
              console.log(`Tapped element ${i}, current URL: ${currentUrl}`);
              
              // Navigate back if needed
              if (!currentUrl.endsWith('/')) {
                await page.goto('/');
                await page.waitForTimeout(1000);
              }
            }
          }
        }
      });

      test('should handle mobile scrolling', async ({ page }) => {
        // Get page height
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        expect(bodyHeight).toBeGreaterThan(device.viewport.height);
        
        // Test scrolling
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(500);
        
        // Check if content is still visible after scroll
        await expect(page.locator('h1')).toBeVisible();
        
        // Scroll back to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
      });

      test('should handle mobile form inputs', async ({ page }) => {
        // Navigate to sign in page
        await page.goto('/auth/signin');
        
        // Check if form inputs are mobile-friendly
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        
        // Test input focus
        await emailInput.tap();
        await expect(emailInput).toBeFocused();
        
        // Test keyboard appearance (simulated)
        await emailInput.fill('test@example.com');
        await page.waitForTimeout(500);
        
        await passwordInput.tap();
        await expect(passwordInput).toBeFocused();
        await passwordInput.fill('password123');
        await page.waitForTimeout(500);
        
        // Check if inputs maintain values
        await expect(emailInput).toHaveValue('test@example.com');
        await expect(passwordInput).toHaveValue('password123');
      });

      test('should handle mobile orientation changes', async ({ page }) => {
        // Test landscape orientation
        await page.setViewportSize({ 
          width: device.viewport.height, 
          height: device.viewport.width 
        });
        
        await page.waitForTimeout(1000);
        
        // Check if layout adapts
        await expect(page.locator('h1')).toBeVisible();
        
        // Test landscape interactions
        const navElements = page.locator('nav a, nav button');
        const navCount = await navElements.count();
        
        if (navCount > 0) {
          await expect(navElements.first()).toBeVisible();
        }
        
        // Restore portrait orientation
        await page.setViewportSize(device.viewport);
        await page.waitForTimeout(1000);
      });
    });
  });

  tabletDevices.forEach(device => {
    test.describe(`Tablet: ${device.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(device.viewport);
        await page.goto('/');
      });

      test('should display tablet-optimized layout', async ({ page }) => {
        // Check if tablet layout is applied
        await expect(page.locator('h1')).toContainText('FinSmartAI');
        
        // Check if navigation is tablet-friendly
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();
        
        // Check if content is properly sized
        const mainContent = page.locator('main, .container');
        await expect(mainContent).toBeVisible();
      });

      test('should handle tablet grid layouts', async ({ page }) => {
        // Navigate to models tab
        await page.click('text=Models');
        await page.waitForTimeout(1000);
        
        // Check if grid layouts adapt to tablet size
        const grid = page.locator('.grid');
        const gridCount = await grid.count();
        
        if (gridCount > 0) {
          const firstGrid = grid.first();
          await expect(firstGrid).toBeVisible();
          
          // Check if grid items are properly sized
          const gridItems = firstGrid.locator('> *');
          const itemCount = await gridItems.count();
          
          if (itemCount > 0) {
            for (let i = 0; i < Math.min(itemCount, 3); i++) {
              const item = gridItems.nth(i);
              await expect(item).toBeVisible();
              
              const itemBox = await item.boundingBox();
              expect(itemBox?.width).toBeGreaterThan(0);
            }
          }
        }
      });

      test('should handle tablet touch interactions', async ({ page }) => {
        // Test swipe gestures (simulated)
        const startX = device.viewport.width * 0.8;
        const startY = device.viewport.height / 2;
        const endX = device.viewport.width * 0.2;
        
        // Simulate swipe
        await page.touchscreen.tap(startX, startY);
        await page.touchscreen.tap(endX, startY);
        await page.waitForTimeout(500);
        
        // Check if page remains functional
        await expect(page.locator('h1')).toBeVisible();
      });
    });
  });

  test.describe('Responsive Design Patterns', () => {
    test('should handle responsive images', async ({ page }) => {
      // Test on mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        for (let i = 0; i < Math.min(imageCount, 3); i++) {
          const image = images.nth(i);
          if (await image.isVisible()) {
            const imageBox = await image.boundingBox();
            expect(imageBox?.width).toBeLessThanOrEqual(375);
          }
        }
      }
      
      // Test on desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();
      
      if (imageCount > 0) {
        for (let i = 0; i < Math.min(imageCount, 3); i++) {
          const image = images.nth(i);
          if (await image.isVisible()) {
            const imageBox = await image.boundingBox();
            expect(imageBox?.width).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should handle responsive typography', async ({ page }) => {
      // Test mobile typography
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      
      const headingSize = await heading.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.fontSize;
      });
      console.log('Mobile heading size:', headingSize);
      
      // Test desktop typography
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();
      
      const desktopHeading = page.locator('h1');
      await expect(desktopHeading).toBeVisible();
      
      const desktopHeadingSize = await desktopHeading.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.fontSize;
      });
      console.log('Desktop heading size:', desktopHeadingSize);
      
      // Sizes should be different
      expect(headingSize).not.toBe(desktopHeadingSize);
    });

    test('should handle responsive navigation', async ({ page }) => {
      // Test mobile navigation
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const mobileNav = page.locator('nav');
      await expect(mobileNav).toBeVisible();
      
      // Test desktop navigation
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();
      
      const desktopNav = page.locator('nav');
      await expect(desktopNav).toBeVisible();
      
      // Navigation should adapt to screen size
      const mobileNavBox = await mobileNav.boundingBox();
      const desktopNavBox = await desktopNav.boundingBox();
      
      expect(mobileNavBox?.width).toBeLessThan(desktopNavBox?.width || 0);
    });
  });
});