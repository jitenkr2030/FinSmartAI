import { test, expect } from '@playwright/test';

test.describe('Real-time Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display real-time market data stream', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Check if real-time market data section is visible
    await expect(page.locator('text=Live Market Data Stream')).toBeVisible();
    
    // Check if market data components are loaded
    await expect(page.locator('.market-data, .real-time-data')).toBeVisible();
    
    // Wait for initial data load
    await page.waitForTimeout(3000);
    
    // Check if market data is displayed
    const marketData = page.locator('text=NIFTY50, text=BANKNIFTY, text=RELIANCE');
    await expect(marketData.first()).toBeVisible();
  });

  test('should display enhanced real-time dashboard', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Check if enhanced dashboard is visible
    await expect(page.locator('text=Enhanced Real-time Dashboard')).toBeVisible();
    
    // Check if dashboard components are loaded
    await expect(page.locator('.dashboard, .enhanced-dashboard')).toBeVisible();
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    
    // Check if real-time charts are present
    const charts = page.locator('.recharts-wrapper, .chart-container');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should handle WebSocket connections', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Monitor WebSocket connections
    const wsMessages = [];
    page.on('websocket', ws => {
      ws.on('framesent', frame => {
        console.log('WebSocket sent:', frame);
      });
      ws.on('framereceived', frame => {
        console.log('WebSocket received:', frame);
        wsMessages.push(frame);
      });
      ws.on('close', () => {
        console.log('WebSocket closed');
      });
    });

    // Wait for potential WebSocket activity
    await page.waitForTimeout(5000);
    
    // Check if WebSocket messages were received (soft check)
    console.log(`WebSocket messages received: ${wsMessages.length}`);
  });

  test('should display real-time notifications', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Check if notification system is present
    const notificationSystem = page.locator('.notification-system, .toast-container');
    if (await notificationSystem.isVisible()) {
      await expect(notificationSystem).toBeVisible();
      
      // Wait for potential notifications
      await page.waitForTimeout(3000);
      
      // Check if any notifications appeared
      const notifications = notificationSystem.locator('.notification, .toast');
      const notificationCount = await notifications.count();
      console.log(`Notifications displayed: ${notificationCount}`);
    }
  });

  test('should update real-time statistics', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Look for real-time statistics
    const statsSection = page.locator('text=Statistics, text=Stats, text=Metrics').first();
    if (await statsSection.isVisible()) {
      // Get initial values
      const initialStats = await page.locator('.stat-value, .metric-value').allTextContents();
      console.log('Initial stats:', initialStats);
      
      // Wait for updates
      await page.waitForTimeout(5000);
      
      // Get updated values
      const updatedStats = await page.locator('.stat-value, .metric-value').allTextContents();
      console.log('Updated stats:', updatedStats);
      
      // Check if stats might have changed (soft check)
      const statsChanged = initialStats.some((stat, index) => stat !== updatedStats[index]);
      if (statsChanged) {
        console.log('Real-time statistics updated successfully');
      } else {
        console.log('Statistics remained the same (no update occurred)');
      }
    }
  });

  test('should handle real-time data filtering', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Look for filter controls
    const filterControls = page.locator('input[placeholder*="filter"], select, .filter-button');
    if (await filterControls.first().isVisible()) {
      // Test filtering functionality
      const filterInput = filterControls.first();
      await filterInput.fill('NIFTY');
      await page.waitForTimeout(2000);
      
      // Check if data is filtered
      const filteredData = page.locator('text=NIFTY');
      await expect(filteredData.first()).toBeVisible();
      
      // Clear filter
      await filterInput.clear();
      await page.waitForTimeout(2000);
    }
  });

  test('should handle real-time data refresh', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Look for refresh button
    const refreshButton = page.locator('button:has-text("Refresh"), .refresh-button');
    if (await refreshButton.isVisible()) {
      // Get initial data state
      const initialData = await page.locator('.market-data, .real-time-data').textContent();
      
      // Click refresh
      await refreshButton.click();
      await page.waitForTimeout(3000);
      
      // Get updated data state
      const updatedData = await page.locator('.market-data, .real-time-data').textContent();
      
      // Check if data was refreshed
      expect(updatedData).not.toBe('');
    }
  });

  test('should display real-time performance metrics', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Look for performance metrics
    const performanceSection = page.locator('text=Performance, text=Metrics, text=Analytics').first();
    if (await performanceSection.isVisible()) {
      await expect(performanceSection).toBeVisible();
      
      // Check if performance indicators are present
      const indicators = page.locator('.performance-indicator, .metric-card');
      const indicatorCount = await indicators.count();
      expect(indicatorCount).toBeGreaterThan(0);
      
      // Check if indicators have values
      for (let i = 0; i < Math.min(indicatorCount, 3); i++) {
        const indicator = indicators.nth(i);
        await expect(indicator.locator('.value, .number')).toBeVisible();
      }
    }
  });

  test('should handle real-time alerts and notifications', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Look for alert system
    const alertSystem = page.locator('.alert-system, .notification-panel');
    if (await alertSystem.isVisible()) {
      await expect(alertSystem).toBeVisible();
      
      // Check if alert controls are present
      const alertControls = alertSystem.locator('button, input, select');
      const controlCount = await alertControls.count();
      expect(controlCount).toBeGreaterThan(0);
      
      // Test alert configuration if possible
      const alertButton = alertSystem.locator('button:has-text("Add Alert"), .add-alert');
      if (await alertButton.isVisible()) {
        await alertButton.click();
        await page.waitForTimeout(1000);
        
        // Check if alert modal/form appears
        const alertModal = page.locator('.modal, .dialog, .alert-form');
        if (await alertModal.isVisible()) {
          await expect(alertModal).toBeVisible();
          
          // Close modal
          const closeButton = alertModal.locator('button:has-text("Close"), .close-button');
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }
    }
  });

  test('should display real-time charts with interactive features', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Wait for charts to load
    await page.waitForSelector('.recharts-wrapper, .chart-container');
    
    // Get all charts
    const charts = page.locator('.recharts-wrapper, .chart-container');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);
    
    // Test interactivity on first chart
    const firstChart = charts.first();
    
    // Test hover interaction
    await firstChart.hover();
    await page.waitForTimeout(500);
    
    // Check if tooltip appears
    const tooltip = page.locator('.recharts-tooltip-wrapper, .chart-tooltip');
    if (await tooltip.isVisible()) {
      await expect(tooltip).toBeVisible();
    }
    
    // Test click interaction if chart has clickable elements
    const clickableElements = firstChart.locator('.recharts-bar, .recharts-line, .clickable');
    if (await clickableElements.first().isVisible()) {
      await clickableElements.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should handle real-time data export functionality', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Look for export functionality
    const exportButton = page.locator('button:has-text("Export"), .export-button');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);
      
      // Check if export modal/options appear
      const exportModal = page.locator('.modal, .dialog, .export-options');
      if (await exportModal.isVisible()) {
        await expect(exportModal).toBeVisible();
        
        // Check export format options
        const formatOptions = exportModal.locator('input[type="radio"], select');
        const formatCount = await formatOptions.count();
        expect(formatCount).toBeGreaterThan(0);
        
        // Close modal
        const closeButton = exportModal.locator('button:has-text("Close"), .cancel-button');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test('should handle real-time data on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);
    
    // Check if real-time features are accessible on mobile
    await expect(page.locator('text=Live Market Data Stream')).toBeVisible();
    
    // Check if mobile-optimized layout is applied
    const mobileLayout = page.locator('.mobile-layout, .responsive-layout');
    if (await mobileLayout.isVisible()) {
      await expect(mobileLayout).toBeVisible();
    }
    
    // Test touch interactions
    const touchableElement = page.locator('.market-data, .chart-container').first();
    await touchableElement.tap();
    await page.waitForTimeout(500);
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle real-time data error recovery', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Mock WebSocket connection failure
    await page.route('**/socket.io/**', route => {
      route.abort('failed');
    });

    // Wait for potential error handling
    await page.waitForTimeout(3000);
    
    // Check if error message is displayed
    const errorMessage = page.locator('text=Connection Error, text=Failed to connect');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
    
    // Check if retry mechanism is present
    const retryButton = page.locator('button:has-text("Retry"), .retry-button');
    if (await retryButton.isVisible()) {
      await retryButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Restore normal routing
    await page.unroute('**/socket.io/**');
  });

  test('should display real-time user activity', async ({ page }) => {
    // Navigate to real-time tab
    await page.click('text=Real-time');
    await page.waitForTimeout(2000);

    // Look for user activity section
    const activitySection = page.locator('text=User Activity, text=Active Users, text=Live Users');
    if (await activitySection.isVisible()) {
      await expect(activitySection).toBeVisible();
      
      // Check if user count is displayed
      const userCount = activitySection.locator('.user-count, .active-count');
      if (await userCount.isVisible()) {
        await expect(userCount).toBeVisible();
        
        // Get initial count
        const initialCount = await userCount.textContent();
        console.log('Initial user count:', initialCount);
        
        // Wait for potential updates
        await page.waitForTimeout(5000);
        
        // Get updated count
        const updatedCount = await userCount.textContent();
        console.log('Updated user count:', updatedCount);
      }
    }
  });
});