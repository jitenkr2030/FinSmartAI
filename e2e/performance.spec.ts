import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('h1');
    
    const loadTime = Date.now() - startTime;
    
    // Check if page loads within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    console.log(`Homepage loaded in ${loadTime}ms`);
  });

  test('should have fast first contentful paint', async ({ page }) => {
    await page.goto('/');
    
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
    console.log(`First Contentful Paint: ${metrics}ms`);
  });

  test('should have fast largest contentful paint', async ({ page }) => {
    await page.goto('/');
    
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries.find(entry => entry.name === 'largest-contentful-paint');
          if (lcp) {
            resolve(lcp.startTime);
            observer.disconnect();
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    // Check if LCP is under 2.5 seconds
    expect(metrics).toBeLessThan(2500);
    console.log(`Largest Contentful Paint: ${metrics}ms`);
  });

  test('should have low cumulative layout shift', async ({ page }) => {
    await page.goto('/');
    
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.name === 'layout-shift' && !entry.hadRecentInput) {
              cls += entry.value;
            }
          });
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Wait a bit to collect layout shifts
        setTimeout(() => {
          observer.disconnect();
          resolve(cls);
        }, 3000);
      });
    });
    
    // Check if CLS is under 0.1
    expect(metrics).toBeLessThan(0.1);
    console.log(`Cumulative Layout Shift: ${metrics}`);
  });

  test('should have fast first input delay', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForSelector('h1');
    
    // Find a clickable element
    const clickableElement = page.locator('button, a').first();
    await expect(clickableElement).toBeVisible();
    
    // Click the element
    await clickableElement.click();
    
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fid = entries.find(entry => entry.name === 'first-input');
          if (fid) {
            resolve(fid.processingStart - fid.startTime);
            observer.disconnect();
          }
        });
        observer.observe({ entryTypes: ['first-input'] });
        
        // Timeout if no FID is recorded
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 2000);
      });
    });
    
    // Check if FID is under 100ms
    expect(metrics).toBeLessThan(100);
    console.log(`First Input Delay: ${metrics}ms`);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Navigate to analytics page
    await page.goto('/analytics');
    
    // Wait for charts to load
    await page.waitForSelector('.recharts-wrapper, .chart-container');
    
    // Check if page remains responsive
    const startTime = Date.now();
    
    // Interact with charts
    await page.click('text=Market Data');
    await page.click('text=AI Models');
    await page.click('text=Predictions');
    
    const interactionTime = Date.now() - startTime;
    
    // Check if interactions are fast
    expect(interactionTime).toBeLessThan(2000);
    console.log(`Chart interactions completed in ${interactionTime}ms`);
  });

  test('should handle rapid tab switching', async ({ page }) => {
    await page.goto('/');
    
    const tabs = ['Models', 'Real-time', 'Technology', 'Pricing'];
    const startTime = Date.now();
    
    for (const tab of tabs) {
      await page.click(`text=${tab}`);
      await page.waitForTimeout(100);
    }
    
    const switchTime = Date.now() - startTime;
    
    // Check if tab switching is fast
    expect(switchTime).toBeLessThan(3000);
    console.log(`Tab switching completed in ${switchTime}ms`);
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    // Perform multiple interactions
    for (let i = 0; i < 5; i++) {
      await page.click('text=Models');
      await page.waitForTimeout(100);
      await page.click('text=Real-time');
      await page.waitForTimeout(100);
    }
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    // Check if memory usage is reasonable (less than 50MB increase)
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    console.log(`Memory increase: ${memoryIncrease} bytes`);
  });

  test('should handle API response times', async ({ page }) => {
    const apiEndpoints = [
      '/api/health',
      '/api/models'
    ];
    
    for (const endpoint of apiEndpoints) {
      const startTime = Date.now();
      
      const response = await page.request.get(endpoint);
      const responseTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(1000); // 1 second
      console.log(`${endpoint} responded in ${responseTime}ms`);
    }
  });

  test('should handle concurrent requests efficiently', async ({ page }) => {
    const requests = [];
    const numRequests = 10;
    
    for (let i = 0; i < numRequests; i++) {
      requests.push(page.request.get('/api/health'));
    }
    
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const totalTime = Date.now() - startTime;
    
    // All requests should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
    
    // Concurrent requests should be faster than sequential
    expect(totalTime).toBeLessThan(3000); // 3 seconds for 10 concurrent requests
    console.log(`${numRequests} concurrent requests completed in ${totalTime}ms`);
  });

  test('should handle page size efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Get page resources
    const resources = await page.evaluate(() => {
      const resources: Array<{ url: string; size: number }> = [];
      
      performance.getEntriesByType('resource').forEach(entry => {
        if (entry.transferSize) {
          resources.push({
            url: entry.name,
            size: entry.transferSize
          });
        }
      });
      
      return resources;
    });
    
    // Calculate total page size
    const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);
    
    // Check if page size is reasonable (less than 2MB)
    expect(totalSize).toBeLessThan(2 * 1024 * 1024); // 2MB
    console.log(`Total page size: ${totalSize} bytes`);
    
    // Check individual resource sizes
    const largeResources = resources.filter(r => r.size > 500 * 1024); // 500KB
    expect(largeResources.length).toBeLessThan(5); // Less than 5 large resources
    console.log(`Large resources (>500KB): ${largeResources.length}`);
  });

  test('should handle image loading efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Wait for images to load
    await page.waitForLoadState('networkidle');
    
    // Get image loading performance
    const imageMetrics = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const metrics: Array<{ url: string; loadTime: number }> = [];
      
      images.forEach(img => {
        const src = img.src;
        if (src && !src.startsWith('data:')) {
          const entries = performance.getEntriesByName(src);
          if (entries.length > 0) {
            const entry = entries[0] as PerformanceResourceTiming;
            metrics.push({
              url: src,
              loadTime: entry.duration
            });
          }
        }
      });
      
      return metrics;
    });
    
    // Check if images load quickly
    for (const metric of imageMetrics) {
      expect(metric.loadTime).toBeLessThan(2000); // 2 seconds
      console.log(`Image ${metric.url} loaded in ${metric.loadTime}ms`);
    }
  });

  test('should handle JavaScript execution time', async ({ page }) => {
    await page.goto('/');
    
    // Get JavaScript execution metrics
    const jsMetrics = await page.evaluate(() => {
      const metrics: Array<{ name: string; duration: number }> = [];
      
      performance.getEntriesByType('measure').forEach(entry => {
        metrics.push({
          name: entry.name,
          duration: entry.duration
        });
      });
      
      return metrics;
    });
    
    // Check if JavaScript execution is fast
    for (const metric of jsMetrics) {
      expect(metric.duration).toBeLessThan(100); // 100ms
      console.log(`JavaScript task "${metric.name}" took ${metric.duration}ms`);
    }
  });

  test('should handle CSS rendering performance', async ({ page }) => {
    await page.goto('/');
    
    // Force style recalculation
    await page.evaluate(() => {
      document.body.style.display = 'none';
      document.body.offsetHeight; // Force reflow
      document.body.style.display = '';
    });
    
    // Measure style recalculation time
    const styleTime = await page.evaluate(() => {
      const startTime = performance.now();
      
      // Force style recalculation
      document.body.style.color = 'red';
      document.body.offsetHeight;
      
      return performance.now() - startTime;
    });
    
    // Check if style recalculation is fast
    expect(styleTime).toBeLessThan(50); // 50ms
    console.log(`Style recalculation took ${styleTime}ms`);
  });

  test('should handle animation performance', async ({ page }) => {
    await page.goto('/');
    
    // Look for animated elements
    const animatedElements = page.locator('.animate, .transition, .hover-effect');
    const elementCount = await animatedElements.count();
    
    if (elementCount > 0) {
      // Test animation performance
      const startTime = Date.now();
      
      // Hover over animated elements
      for (let i = 0; i < Math.min(elementCount, 3); i++) {
        const element = animatedElements.nth(i);
        await element.hover();
        await page.waitForTimeout(100);
      }
      
      const animationTime = Date.now() - startTime;
      
      // Check if animations are smooth
      expect(animationTime).toBeLessThan(1000); // 1 second
      console.log(`Animations completed in ${animationTime}ms`);
    }
  });

  test('should handle scroll performance', async ({ page }) => {
    await page.goto('/');
    
    // Get page height
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    
    if (pageHeight > window.innerHeight) {
      const startTime = Date.now();
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(100);
      
      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);
      
      const scrollTime = Date.now() - startTime;
      
      // Check if scrolling is smooth
      expect(scrollTime).toBeLessThan(1000); // 1 second
      console.log(`Scrolling completed in ${scrollTime}ms`);
    }
  });
});