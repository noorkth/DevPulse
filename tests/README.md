# DevPulse Unit Testing - Quick Start

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── unit/
│   ├── validation/      # Validation schema & validator tests
│   ├── security/        # Rate limiter & security tests
│   └── ipc/             # IPC handler tests (future)
├── mocks/
│   └── prisma.ts        # Prisma Client mock
└── setup.ts             # Global test configuration
```

## Current Coverage

**28 tests passing** ✅

Coverage breakdown:
- **Validation Schemas**: 9 tests
- **Validator Utilities**: 7 tests  
- **Rate Limiter**: 12 tests

## Writing New Tests

### Example Test File

```typescript
import { YourFunction } from '../../../electron/path/to/module';

describe('YourModule', () => {
  describe('YourFunction', () => {
    it('should do something', () => {
      const result = YourFunction('input');
      expect(result).toBe('expected');
    });
  });
});
```

### Using Mocks

```typescript
import mockPrisma from '../../mocks/prisma';

// Mock return value
mockPrisma.issue.findMany.mockResolvedValue([{ id: '1', title: 'Test' }]);

// Test your function
const result = await yourFunction();

// Verify mock was called
expect(mockPrisma.issue.findMany).toHaveBeenCalled();
```

## What's Tested

✅ **Validation Layer** (100% coverage)
- Email schedule schemas
- Issue/Project validation
- UUID validation
- Error formatting

✅ **Security Layer** (100% coverage)
- Rate limiting algorithm
- Sliding window implementation
- Multiple client tracking
- Presets

## Next Steps

- Add IPC handler tests
- Add ML prediction tests
- Target: 50%+ overall coverage
