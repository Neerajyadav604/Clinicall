# User Profile Edit Flow - E2E Tests

Comprehensive Playwright end-to-end tests for the ClinicAll user profile editing workflow.

## 📋 Test Overview

This test suite provides complete coverage of the user profile edit functionality including:

### Test Categories

1. **Authentication & Navigation** (4 tests)
   - User login with valid credentials
   - Navigation to edit profile from my-profile
   - Direct navigation to edit profile
   - Form completeness indicator

2. **Form Field Validation** (5 tests)
   - Required field validation (full name)
   - Email format validation
   - Phone/contact format validation
   - Valid data acceptance
   - Form pre-population with existing data

3. **Form Submission & Profile Update** (5 tests)
   - Successful form submission
   - Submit button disable state during saving
   - Saving state indicators
   - Multi-section profile updates
   - Form data persistence on reload

4. **Form Field Types & Interactions** (5 tests)
   - Text input field handling
   - Textarea field handling (medical history)
   - Select dropdown fields
   - Date input fields
   - Form completeness tracking

5. **Navigation & User Flow** (3 tests)
   - Cancel button functionality
   - Browser back button behavior
   - Profile header display
   - Profile section cards visibility

6. **Profile Picture Upload** (2 tests)
   - Avatar component detection
   - User name display in avatar

7. **Error Handling & Edge Cases** (4 tests)
   - Network error handling
   - Missing required fields
   - Whitespace trimming
   - Special characters in fields

8. **Session & Authentication** (3 tests)
   - Redirect to login when unauthenticated
   - Session persistence across navigations
   - User profile data loading

9. **Accessibility** (4 tests)
   - Form label associations
   - Error message display
   - Descriptive button text
   - Keyboard navigation

10. **Responsive Design** (3 tests)
    - Mobile viewport rendering (375x667)
    - Tablet viewport rendering (768x1024)
    - Desktop viewport rendering (1280x800)

11. **Performance** (2 tests)
    - Page load time verification
    - Rapid field change handling

12. **Full Integration Flow** (2 tests)
    - Complete profile edit workflow
    - Session preservation

13. **Error Scenarios** (2 tests)
    - Expired token handling
    - User-friendly error messages

**Total: 45+ comprehensive test cases**

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ installed
- Frontend running on `http://localhost:3000`
- Backend running on `http://localhost:4000/api/v1`
- Test user account created with credentials:
  - Email: `testuser@example.com`
  - Password: `TestPassword123!`

### Installation

1. Install dependencies:
```bash
npm install --save-dev @playwright/test
```

2. Install Playwright browsers:
```bash
npx playwright install
```

### Environment Setup

Create a `.env` file in the project root:

```env
# Frontend URL
BASE_URL=http://localhost:3000

# Backend API URL
API_URL=http://localhost:4000/api/v1

# Optional: API authentication
API_USERNAME=
API_PASSWORD=

# Test Configuration
TIMEOUT=30000
NODE_ENV=test
```

## 🧪 Running Tests

### Run all tests
```bash
npx playwright test tests/Userprofileedittest.spec.ts
```

### Run specific test suite
```bash
npx playwright test tests/Userprofileedittest.spec.ts -g "Authentication & Navigation"
```

### Run specific test
```bash
npx playwright test tests/Userprofileedittest.spec.ts -g "should login successfully"
```

### Run in headed mode (see browser)
```bash
npx playwright test tests/Userprofileedittest.spec.ts --headed
```

### Run in specific browser
```bash
# Chromium
npx playwright test tests/Userprofileedittest.spec.ts --project=chromium

# Firefox
npx playwright test tests/Userprofileedittest.spec.ts --project=firefox

# Safari
npx playwright test tests/Userprofileedittest.spec.ts --project=webkit
```

### Run mobile tests
```bash
npx playwright test tests/Userprofileedittest.spec.ts --project="Mobile Chrome"
npx playwright test tests/Userprofileedittest.spec.ts --project="Mobile Safari"
```

### Debug tests
```bash
npx playwright test tests/Userprofileedittest.spec.ts --debug
```

### Watch mode (re-run on file changes)
```bash
npx playwright test tests/Userprofileedittest.spec.ts --watch
```

## 📊 Test Reports

After running tests, reports are generated in `test-results/`:

- **HTML Report**: `test-results/html/index.html`
  ```bash
  npx playwright show-report
  ```

- **JSON Report**: `test-results/results.json`
- **JUnit Report**: `test-results/junit.xml` (for CI/CD integration)

## 🔧 Configuration

### Adjust Timeouts
Edit `playwright.config.ts`:
```typescript
timeout: 60 * 1000,  // 60 seconds
expect: {
  timeout: 15 * 1000,  // 15 seconds
}
```

### Change Parallel Workers
```bash
npx playwright test --workers=1  # Sequential execution
npx playwright test --workers=4  # 4 parallel workers
```

### Enable Traces
Traces are automatically generated on test failure. View with:
```bash
npx playwright show-trace test-results/trace.zip
```

## 🧩 Test Structure

### Helper Functions

All tests use helper functions for common actions:

- **loginUser(page, email, password)** - Authenticates user and returns token
- **navigateToEditProfile(page)** - Goes to edit profile page
- **fillProfileForm(page, data)** - Fills form with provided data
- **getFormCompleteness(page)** - Gets form completion percentage

### Test Data

Test users are defined in the test file:

```typescript
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'TestPassword123!',
  fullName: 'Test User Profile',
  contact: '9876543210',
};

const UPDATED_PROFILE = {
  fullName: 'Updated Test User',
  email: 'updated@example.com',
  // ... more fields
};
```

## 🐛 Troubleshooting

### Test Fails with "Login Failed"
- Verify test user account exists in database
- Check credentials in test file match your test account
- Verify backend is running on correct port

### "Element not found" errors
- Check element selectors match your HTML structure
- Use `--headed --debug` mode to inspect
- Verify form field names match `name` attributes

### Timeout errors
- Increase timeout values in `playwright.config.ts`
- Check backend API response times
- Verify network connectivity

### "Session expired" errors
- Check token storage in localStorage
- Verify API authentication endpoints
- Check for CORS issues in network tab

### Mobile tests failing
- Verify responsive design is working
- Check viewport sizes in config
- Test in actual browsers for best results

## 🔒 Test User Management

### Create Test User

Option 1: Via Frontend
1. Go to signup page
2. Register with test credentials
3. Skip email verification (if available)

Option 2: Via API
```bash
curl -X POST http://localhost:4000/api/v1/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123!",
    "fullName": "Test User Profile",
    "contact": "9876543210",
    "role": "user"
  }'
```

### Reset Test User Data
Before running tests:
```bash
# Reset profile to default state via API or database
# Or use a cleanup script
node ./tests/cleanup-test-user.js
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start servers
        run: |
          npm start &
          cd server && npm start &
        env:
          REACT_APP_BASE_URL: http://localhost:4000/api/v1
      
      - name: Run E2E tests
        run: npx playwright test
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: test-results/html/
```

## 🎯 Best Practices

1. **Always Clean Up State**
   - Reset user data before tests
   - Clear localStorage/cookies between tests
   - Use beforeAll/afterAll hooks

2. **Use Page Objects** (optional)
   - Create page objects for complex workflows
   - Improves maintainability

3. **Wait Properly**
   - Use `waitForNavigation()` after actions that navigate
   - Use `waitForSelector()` for dynamic content
   - Avoid hard `setTimeout()` delays

4. **Handle Async Operations**
   - Always await async actions
   - Use proper timeouts for network requests

5. **Test Real User Flows**
   - Follow actual user workflows
   - Test common error scenarios
   - Don't skip validation

## 📝 Test Patterns

### Basic Test Pattern
```typescript
test('descriptive test name', async ({ page }) => {
  // Arrange - Setup test data
  await loginUser(page, TEST_USER.email, TEST_USER.password);
  
  // Act - Perform action
  await navigateToEditProfile(page);
  
  // Assert - Verify result
  await expect(page.locator('h1')).toContain('Edit Profile');
});
```

### Testing Form Validation
```typescript
test('should validate required field', async ({ page }) => {
  await navigateToEditProfile(page);
  await page.fill('input[name="fullName"]', '');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=required')).toBeVisible();
});
```

### Testing Navigation
```typescript
test('should navigate back on cancel', async ({ page }) => {
  await navigateToEditProfile(page);
  await page.click('button:has-text("Cancel")');
  
  await expect(page).toHaveURL(/my-profile/);
});
```

## 🚦 Test Execution Flow

1. **Setup**
   - Browser launched
   - User logged in
   - Navigated to edit profile page

2. **Test Execution**
   - Form interactions
   - API calls
   - Response validation

3. **Cleanup**
   - Browser closed
   - Screenshots/videos on failure
   - Results reported

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [API Locators](https://playwright.dev/docs/locators)

## 🤝 Contributing

To add new tests:

1. Follow existing test patterns
2. Use descriptive test names
3. Add appropriate test tags/groups
4. Update this README with new test categories
5. Ensure tests pass locally before committing

## 📞 Support

For issues or questions:
1. Check this README troubleshooting section
2. Run tests in debug mode: `--debug`
3. Check Playwright documentation
4. Review similar test patterns in file

---

**Last Updated**: March 2026  
**Playwright Version**: 1.58.2+  
**Node Version**: 14+ required
