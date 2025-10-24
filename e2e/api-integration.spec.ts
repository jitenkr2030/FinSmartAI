import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should verify health check endpoint', async ({ page }) => {
    // Make direct API call to health endpoint
    const response = await page.request.get('/api/health');
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
  });

  test('should handle prediction API with valid data', async ({ page }) => {
    const predictionData = {
      symbol: 'NIFTY50',
      timeframe: '1h',
      model: 'SentimentAI'
    };

    const response = await page.request.post('/api/predict', {
      data: predictionData
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('prediction');
  });

  test('should handle prediction API validation errors', async ({ page }) => {
    const invalidData = {
      symbol: '', // Invalid empty symbol
      timeframe: 'invalid', // Invalid timeframe
      model: 'NonExistentModel' // Invalid model
    };

    const response = await page.request.post('/api/predict', {
      data: invalidData
    });

    // Should return validation error
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('error');
  });

  test('should handle sentiment analysis API', async ({ page }) => {
    const sentimentData = {
      text: 'The market is showing positive trends with strong investor confidence.',
      type: 'news'
    };

    const response = await page.request.post('/api/sentiment/analyze', {
      data: sentimentData
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('sentiment');
    expect(body.data).toHaveProperty('confidence');
  });

  test('should handle batch sentiment analysis', async ({ page }) => {
    const batchData = {
      texts: [
        'Market is bullish today',
        'Investors are optimistic',
        'Economic indicators look positive'
      ],
      type: 'social'
    };

    const response = await page.request.post('/api/sentiment/batch', {
      data: batchData
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data.results)).toBe(true);
    expect(body.data.results.length).toBe(3);
  });

  test('should handle options pricing API', async ({ page }) => {
    const optionsData = {
      underlying: 'NIFTY50',
      strike: 19500,
      type: 'call',
      expiry: '2024-12-31',
      volatility: 0.2,
      riskFreeRate: 0.06
    };

    const response = await page.request.post('/api/options/price', {
      data: optionsData
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('price');
  });

  test('should handle options greeks calculation', async ({ page }) => {
    const greeksData = {
      underlying: 'NIFTY50',
      strike: 19500,
      type: 'call',
      expiry: '2024-12-31',
      volatility: 0.2,
      riskFreeRate: 0.06,
      spot: 19450
    };

    const response = await page.request.post('/api/options/greeks', {
      data: greeksData
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('delta');
    expect(body.data).toHaveProperty('gamma');
    expect(body.data).toHaveProperty('theta');
    expect(body.data).toHaveProperty('vega');
  });

  test('should handle risk analysis API', async ({ page }) => {
    const riskData = {
      portfolio: [
        { symbol: 'NIFTY50', weight: 0.6 },
        { symbol: 'BANKNIFTY', weight: 0.4 }
      ],
      timeframe: '1y',
      confidenceLevel: 0.95
    };

    const response = await page.request.post('/api/risk/analyze', {
      data: riskData
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('var');
    expect(body.data).toHaveProperty('expectedShortfall');
  });

  test('should handle fund flow prediction API', async ({ page }) => {
    const fundFlowData = {
      type: 'fii',
      timeframe: '1w',
      historicalData: [100, 150, 200, 180, 220]
    };

    const response = await page.request.post('/api/fundflow/predict', {
      data: fundFlowData
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('prediction');
  });

  test('should handle tax optimization API', async ({ page }) => {
    const taxData = {
      income: 1000000,
      deductions: 150000,
      investments: 200000,
      regime: 'new'
    };

    const response = await page.request.post('/api/tax/optimize', {
      data: taxData
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('optimizedTax');
  });

  test('should handle news summarization API', async ({ page }) => {
    const newsData = {
      content: 'Breaking: Reserve Bank of India announces new monetary policy measures to control inflation while supporting economic growth. The central bank has decided to keep interest rates unchanged but has introduced several liquidity measures.',
      maxLength: 100
    };

    const response = await page.request.post('/api/news/summarize', {
      data: newsData
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('summary');
  });

  test('should handle model listing API', async ({ page }) => {
    const response = await page.request.get('/api/models');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data.models)).toBe(true);
    expect(body.data.models.length).toBeGreaterThan(0);
  });

  test('should handle database backup API', async ({ page }) => {
    // Mock authentication for protected endpoints
    await page.addInitScript(() => {
      localStorage.setItem('nextauth.session', JSON.stringify({
        user: { id: 'admin-user', email: 'admin@example.com', role: 'admin' },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
    });

    const backupData = {
      type: 'full',
      compression: true
    };

    const response = await page.request.post('/api/database/backups', {
      data: backupData
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('backupId');
  });

  test('should handle rate limiting', async ({ page }) => {
    // Make multiple rapid requests to test rate limiting
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(page.request.get('/api/health'));
    }

    const responses = await Promise.all(requests);
    
    // Check if any requests were rate limited (status 429)
    const rateLimited = responses.some(response => response.status() === 429);
    
    if (rateLimited) {
      console.log('Rate limiting is working correctly');
    } else {
      console.log('Rate limiting not triggered (may be configured with higher limits)');
    }
    
    // All requests should either succeed or be rate limited
    for (const response of responses) {
      expect([200, 429]).toContain(response.status());
    }
  });

  test('should handle CORS headers', async ({ page }) => {
    const response = await page.request.get('/api/health', {
      headers: {
        'Origin': 'https://example.com'
      }
    });

    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers).toHaveProperty('access-control-allow-origin');
  });

  test('should handle API authentication', async ({ page }) => {
    // Test protected endpoint without authentication
    const response = await page.request.get('/api/database/backups');

    // Should either redirect or return 401/403
    expect([401, 403, 302]).toContain(response.status());
  });

  test('should handle large payload validation', async ({ page }) => {
    // Create a very large payload
    const largeText = 'x'.repeat(1000000); // 1MB of text
    const largePayload = {
      text: largeText,
      type: 'news'
    };

    const response = await page.request.post('/api/sentiment/analyze', {
      data: largePayload
    });

    // Should reject large payload
    expect([413, 400]).toContain(response.status());
  });

  test('should handle malformed JSON requests', async ({ page }) => {
    const response = await page.request.post('/api/predict', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: 'invalid json {'
    });

    expect(response.status()).toBe(400);
  });

  test('should handle timeout scenarios', async ({ page }) => {
    // Mock a slow response
    await page.route('**/api/predict', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { prediction: 'test' } })
        });
      }, 10000); // 10 second delay
    });

    const startTime = Date.now();
    const response = await page.request.post('/api/predict', {
      data: { symbol: 'NIFTY50', timeframe: '1h', model: 'SentimentAI' },
      timeout: 5000 // 5 second timeout
    });
    const endTime = Date.now();

    // Should timeout
    expect(response.status()).not.toBe(200);
    expect(endTime - startTime).toBeLessThan(6000); // Should be close to timeout
  });
});