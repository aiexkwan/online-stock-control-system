# Testing Standards and Guidelines

## Overview

This document outlines the testing standards and conventions for the NewPennine WMS project. All contributors must follow these guidelines to ensure consistent and high-quality test coverage.

## Coverage Goals

### Minimum Coverage Requirements
- **Overall**: 80% (Progressive target, currently 10%)
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Priority Areas
1. Business-critical functions: 95%+ coverage
2. API endpoints: 90%+ coverage
3. Core services: 85%+ coverage
4. UI components: 70%+ coverage
5. Utilities: 80%+ coverage

## Directory Structure

```
__tests__/
├── unit/                   # Unit tests
│   ├── components/        # React component tests
│   ├── hooks/            # Custom hook tests
│   ├── services/         # Service layer tests
│   └── utils/            # Utility function tests
├── integration/           # Integration tests
│   ├── api/              # API integration tests
│   └── database/         # Database integration tests
├── e2e/                   # End-to-end tests
│   ├── workflows/        # User workflow tests
│   └── pages/            # Page-specific tests
├── mocks/                 # Mock data and factories
├── fixtures/              # Test fixtures
└── utils/                 # Test utilities

lib/[module]/__tests__/    # Colocated tests for lib modules
app/[feature]/__tests__/   # Colocated tests for app features
```

## Naming Conventions

### Test Files
- Unit tests: `[name].test.ts(x)`
- Integration tests: `[name].integration.test.ts`
- E2E tests: `[name].e2e.test.ts`

### Test Descriptions
```typescript
// Good
describe('PalletService', () => {
  describe('createPallet', () => {
    it('should create a new pallet with valid data', () => {});
    it('should throw error when product code is invalid', () => {});
  });
});

// Bad
describe('test pallet', () => {
  it('works', () => {});
});
```

## Test Categories

### 1. Unit Tests
- Test individual functions/components in isolation
- Mock all external dependencies
- Fast execution (<100ms per test)
- Located in `__tests__/unit/` or colocated

Example:
```typescript
import { LocationMapper } from '@/lib/inventory/utils/locationMapper';

describe('LocationMapper', () => {
  it('should map location code to coordinates', () => {
    const result = LocationMapper.toCoordinates('A01-02');
    expect(result).toEqual({ row: 'A', shelf: 1, level: 2 });
  });
});
```

### 2. Integration Tests
- Test interaction between modules
- Use test database/services
- May involve real network calls
- Located in `__tests__/integration/`

Example:
```typescript
describe('Stock Transfer Integration', () => {
  it('should transfer stock between locations', async () => {
    const { data } = await supabase.rpc('transfer_stock', {
      pallet_code: 'PLT12345678',
      to_location: 'B01-01'
    });
    expect(data.success).toBe(true);
  });
});
```

### 3. E2E Tests
- Test complete user workflows
- Use real browser environment
- Test from user perspective
- Located in `__tests__/e2e/`

## Best Practices

### 1. Test Structure (AAA Pattern)
```typescript
it('should calculate total correctly', () => {
  // Arrange
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 }
  ];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(35);
});
```

### 2. Use Test Factories
```typescript
import { createMockPallet } from '@/__tests__/mocks/factories';

it('should update pallet status', () => {
  const pallet = createMockPallet({ status: 'active' });
  // Test logic
});
```

### 3. Descriptive Test Names
- Use `should` to describe expected behavior
- Be specific about conditions and outcomes
- Include edge cases

### 4. Mock External Dependencies
```typescript
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => createMockSupabaseClient())
}));
```

### 5. Avoid Test Interdependence
- Each test should be independent
- Use `beforeEach` for setup
- Clean up in `afterEach`

### 6. Test Error Cases
```typescript
it('should throw error for invalid input', async () => {
  await expect(
    processOrder({ quantity: -1 })
  ).rejects.toThrow('Quantity must be positive');
});
```

## Custom Matchers

Use our custom matchers for domain-specific assertions:

```typescript
expect(id).toBeValidUUID();
expect(code).toBeValidPalletCode();
expect(productCode).toBeValidProductCode();
expect(value).toBeWithinRange(1, 100);
expect(date).toBeValidDate();
```

## Performance Testing

For performance-critical code:

```typescript
it('should process large dataset efficiently', async () => {
  const { duration } = await measurePerformance(
    () => processLargeDataset(10000),
    'Large dataset processing'
  );
  expect(duration).toBeLessThan(1000); // Less than 1 second
});
```

## Continuous Integration

All tests run automatically on:
- Push to main/develop branches
- Pull request creation/update
- Scheduled daily runs

### CI Requirements
- All tests must pass
- Coverage thresholds must be met
- No linting errors
- Build must succeed

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- LocationMapper.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create"
```

## Writing New Tests

1. Check if test already exists
2. Choose appropriate test type (unit/integration/e2e)
3. Follow naming conventions
4. Use factories for test data
5. Include positive and negative cases
6. Add to appropriate directory
7. Run locally before committing
8. Ensure coverage increases

## Test Review Checklist

- [ ] Tests follow naming conventions
- [ ] Tests are in correct directory
- [ ] Tests use AAA pattern
- [ ] Tests are independent
- [ ] Both success and error cases covered
- [ ] Performance considerations addressed
- [ ] Custom matchers used where appropriate
- [ ] No hardcoded values
- [ ] Mocks are properly cleaned up
- [ ] Coverage meets requirements

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- Project test utilities: `__tests__/utils/`
- Mock factories: `__tests__/mocks/factories.ts`