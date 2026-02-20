# Testing Guide

## Test Structure

This project uses Jest for testing with separate configurations for unit and integration tests.

### Unit Tests
- Location: `__tests__/lib/**/*.test.ts`
- Environment: jsdom (for React components)
- Run with: `npm run test:unit`

### Integration Tests
- Location: `__tests__/api/**/*.test.ts`
- Environment: Node.js
- Run with: `npm run test:integration`

## Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Database Setup

Integration tests require a database connection. Set up a test database URL:

```bash
# In .env.test or .env.local
TEST_DATABASE_URL=postgresql://user:password@host:port/test_database?sslmode=require
```

**Important**: Use a separate test database to avoid affecting development data.

If `TEST_DATABASE_URL` is not set, tests will use the main `DATABASE_URL` (not recommended for production).

**Note**: Integration tests will fail if no database connection is available. Make sure your database is running and accessible before running integration tests.

## Writing Tests

### Unit Test Example

```typescript
import { validateEmail } from "@/lib/security/validation"

describe("validateEmail", () => {
  it("should validate correct email addresses", () => {
    expect(validateEmail("test@example.com")).toBe("test@example.com")
  })

  it("should reject invalid email addresses", () => {
    expect(validateEmail("invalid")).toBeNull()
  })
})
```

### Integration Test Example

```typescript
import { POST } from "@/app/api/endpoint/route"
import { NextRequest } from "next/server"
import { prisma } from "../../setup/integration-setup"

describe("POST /api/endpoint", () => {
  beforeEach(async () => {
    // Set up test data
  })

  afterEach(async () => {
    // Clean up test data
  })

  it("should handle request correctly", async () => {
    const request = new NextRequest("http://localhost:3000/api/endpoint", {
      method: "POST",
      body: JSON.stringify({ data: "test" }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty("result")
  })
})
```

## Test Coverage

Coverage reports are generated when running `npm run test:coverage`. The coverage threshold is set to 50% for:
- Branches
- Functions
- Lines
- Statements

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data in `afterEach` or `afterAll`
3. **Mocking**: Mock external services and authentication
4. **Descriptive Names**: Use descriptive test names that explain what is being tested
5. **Arrange-Act-Assert**: Structure tests with clear sections
6. **Test Edge Cases**: Test both happy paths and error cases

## Authentication in Tests

For API route tests that require authentication, mock the `getCurrentUser` function:

```typescript
jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}))

// In test
;(getCurrentUser as jest.Mock).mockResolvedValue({
  id: "user-id",
  email: "test@example.com",
})
```

## Database Testing

- Use transactions when possible for faster cleanup
- Create test users with unique emails (e.g., `test-${Date.now()}@example.com`)
- Clean up all test data after each test
- Use a dedicated test database

## CI/CD Integration

Tests should run automatically in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    npm ci
    npm run test:unit
    npm run test:integration
```

## Troubleshooting

### Tests failing with database connection errors
- Verify `TEST_DATABASE_URL` is set correctly
- Check database is accessible
- Ensure Prisma client is generated: `npm run db:generate`

### Tests timing out
- Increase Jest timeout: `jest.setTimeout(10000)`
- Check for hanging database connections
- Verify cleanup is working correctly

### Module resolution errors
- Verify `@/` path alias is working in `jest.config.js`
- Check `moduleNameMapper` configuration
- Ensure TypeScript paths match Jest configuration
