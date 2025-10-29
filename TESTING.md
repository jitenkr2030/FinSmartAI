# Testing Configuration

This project includes a comprehensive testing infrastructure with unit tests, integration tests, and end-to-end tests.

## Test Structure

```
src/
├── __tests__/
│   ├── services/           # Unit tests for services
│   ├── integration/        # Integration tests
│   └── utils/             # Test utilities
├── components/             # Component tests (co-located)
└── app/                   # Page tests (co-located)

e2e/
└── app.spec.ts            # End-to-end tests
```

## Test Types

### 1. Unit Tests
- **Location**: `src/__tests__/services/`
- **Framework**: Jest + React Testing Library
- **Purpose**: Test individual functions, classes, and components in isolation
- **Coverage**: Business logic, utilities, services

### 2. Integration Tests
- **Location**: `src/__tests__/integration/`
- **Framework**: Jest + Supertest
- **Purpose**: Test API endpoints and database interactions
- **Coverage**: API routes, database operations, authentication flows

### 3. End-to-End Tests
- **Location**: `e2e/`
- **Framework**: Playwright
- **Purpose**: Test complete user flows and application behavior
- **Coverage**: User journeys, UI interactions, cross-browser compatibility

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests
```bash
npm run test              # Run all unit tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Run with UI mode
npm run test:e2e:debug    # Run in debug mode
```

## Test Configuration

### Jest Configuration
- **Environment**: jsdom (for React components)
- **Setup**: `jest.setup.js` (mocks and global setup)
- **Coverage**: 80% threshold for all metrics
- **Transform**: TypeScript support via ts-jest

### Playwright Configuration
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Features**: Screenshots on failure, video recording, tracing
- **Parallel**: Fully parallel test execution

## Writing Tests

### Unit Test Example
```typescript
import { EnhancedCacheManager } from '@/lib/services/cacheService';

describe('EnhancedCacheManager', () => {
  let cacheManager: EnhancedCacheManager;

  beforeEach(() => {
    cacheManager = new EnhancedCacheManager();
  });

  it('should set and get values', async () => {
    await cacheManager.set('test', 'key1', 'value1');
    const value = await cacheManager.get('test', 'key1');
    expect(value).toBe('value1');
  });
});
```

### Integration Test Example
```typescript
import request from 'supertest';

describe('API Integration Tests', () => {
  it('should return health status', async () => {
    const response = await request(server)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status');
  });
});
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';

test('should load homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('FinSmartAI');
});
```

## Test Best Practices

### 1. Test Naming
- Use descriptive test names that explain what is being tested
- Follow the pattern: `should [do something] when [condition]`
- Group related tests in `describe` blocks

### 2. Test Structure
- **Arrange**: Set up test data and conditions
- **Act**: Execute the code being tested
- **Assert**: Verify the expected outcome

### 3. Mocking
- Mock external dependencies (APIs, databases, services)
- Use Jest mocks for functions and modules
- Reset mocks between tests

### 4. Assertions
- Use specific assertions (`toBe`, `toEqual`, `toContain`)
- Test both positive and negative cases
- Include error handling tests

### 5. Performance
- Keep tests fast and isolated
- Use `beforeEach` and `afterEach` for setup/teardown
- Avoid shared state between tests

## Coverage

The project aims for 80% code coverage across:
- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

Coverage reports are generated in the `coverage/` directory.

## Continuous Integration

Tests are configured to run:
- On every commit (pre-commit hooks)
- On pull requests
- On main branch deployment

## Debugging Tests

### Unit Tests
```bash
npm run test:watch -- --verbose
```

### E2E Tests
```bash
npm run test:e2e:debug
```

### With Breakpoints
Add `debugger;` statements in your test code and run in debug mode.

## Test Data Management

### Fixtures
- Store test data in `__tests__/fixtures/`
- Use consistent data across tests
- Avoid hardcoding values in tests

### Environment Variables
- Use `.env.test` for test-specific configuration
- Keep test environment isolated from development/production

## Performance Testing

### Load Testing
- Use Artillery or k6 for load testing
- Test API endpoints under heavy load
- Monitor response times and error rates

### Performance Budgets
- Page load time: < 3 seconds
- First Contentful Paint: < 1.5 seconds
- API response time: < 500ms

## Accessibility Testing

### Automated Testing
- Include accessibility checks in E2E tests
- Use `@playwright/test` accessibility features
- Test keyboard navigation and screen readers

### Manual Testing
- Test with screen readers (NVDA, VoiceOver)
- Verify keyboard accessibility
- Test color contrast and font sizes