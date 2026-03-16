# E2E Test Execution Guide

Complete guide for running Playwright E2E tests for ClinicAll User Profile Edit Flow.

## 📋 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:headed` | Run tests with browser visible |
| `npm run test:e2e:debug` | Debug tests interactively |
| `npm run test:e2e:report` | View HTML test report |
| `npm run test:e2e:auth` | Run only authentication tests |
| `npm run test:e2e:form` | Run only form tests |
| `npm run test:e2e:mobile` | Run mobile device tests |

## 🚀 Getting Started

### 1. Prerequisites

```bash
# Verify Node.js (14+ required)
node --version  # Should output v14.0.0 or higher

# Verify npm
npm --version   # Should output 6.0.0 or higher
```

### 2. Initial Setup

**Windows:**
```bash
.\setup-tests.bat
```

**Mac/Linux:**
```bash
chmod +x setup-tests.sh
./setup-tests.sh
```

**Or Manual Setup:**
```bash
# Install Playwright
npm install --save-dev @playwright/test

# Install browsers
npx playwright install

# Create .env file from template
cp .env.example .env
```

### 3. Configuration

Edit `.env` file:
```env
BASE_URL=http://localhost:3000
API_URL=http://localhost:4000/api/v1
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=TestPassword123!
```

### 4. Start Services

**Terminal 1 - Frontend:**
```bash
cd frontend
npm start
# Runs on http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
cd server
npm start
# Runs on http://localhost:4000
```

### 5. Create Test User (if needed)

**Option A: Via Frontend Signup**
1. Navigate to http://localhost:3000/signup
2. Fill signup form with test credentials
3. Complete email verification (skip if available)

**Option B: Via API**
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

**Option C: Database**
Connect to MongoDB and insert test user directly with hashed password

## 🧪 Running Tests

### Basic Execution

#### Run All Tests
```bash
npm run test:e2e
```

#### Run with Browser Visible
```bash
npm run test:e2e:headed
```

#### Run in Debug Mode
```bash
npm run test:e2e:debug
```

Allows step-by-step execution with:
- Inspector panel
- Locator picking tool
- Console access

### Running Specific Tests

#### By Test Group
```bash
# Authentication tests
npx playwright test -g "Authentication"

# Form submission tests
npx playwright test -g "Form Submission"

# Navigation tests
npx playwright test -g "Navigation"

# All profile edit tests
npx playwright test -g "User Profile Edit Flow"
```

#### By Test Name
```bash
npx playwright test -g "should login successfully"
npx playwright test -g "should submit form with valid data"
```

#### By File
```bash
npx playwright test tests/Userprofileedittest.spec.ts
```

### Browser-Specific Tests

#### Chromium Only
```bash
npm run test:e2e:chromium
# or
npx playwright test --project=chromium
```

#### Firefox Only
```bash
npm run test:e2e:firefox
npx playwright test --project=firefox
```

#### WebKit (Safari) Only
```bash
npm run test:e2e:webkit
npx playwright test --project=webkit
```

#### Mobile Chrome
```bash
npm run test:e2e:mobile
npx playwright test --project="Mobile Chrome"
```

#### Mobile Safari
```bash
npx playwright test --project="Mobile Safari"
```

#### iPad
```bash
npx playwright test --project="iPad"
```

#### All Browsers
```bash
npx playwright test
```

### Advanced Options

#### Run with Specific Number of Workers
```bash
npx playwright test --workers=1       # Sequential
npx playwright test --workers=2       # 2 parallel
npx playwright test --workers=4       # 4 parallel
```

#### Run with Retries
```bash
npx playwright test --retries=2
```

#### Run with Timeout Override
```bash
npx playwright test --timeout=60000
```

#### Run Tests Serially
```bash
npx playwright test --workers=1 --no-retries
```

#### List Tests Without Running
```bash
npx playwright test --list
```

#### Update Snapshots
```bash
npx playwright test --update-snapshots
```

## 📊 Viewing Results

### HTML Report
```bash
npm run test:e2e:report
# Opens detailed HTML report in browser
```

Report includes:
- Test results by browser
- Screenshots on failure
- Videos on failure
- Traces for debugging
- Execution timeline

### JSON Results
```bash
cat test-results/results.json
```

### JUnit XML (for CI/CD)
```bash
cat test-results/junit.xml
```

## 🐛 Debugging

### Debug Mode
```bash
npm run test:e2e:debug
```

Features:
- Playwright Inspector opens
- Step through tests
- Pick locators
- Inspect elements
- View console logs

### Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```

Allows:
- Step-through DOM changes
- Network requests
- Console logs
- Screenshots at each step

### With Console Logs
```bash
npx playwright test --reporter=verbose
```

### With Full Web Server Output
```bash
DEBUG=pw:api npx playwright test
```

## 🔍 Troubleshooting

### Tests Timeout
```bash
# Check if servers are running
# Increase timeout in playwright.config.ts
# Run single test in debug mode
npm run test:e2e:debug
```

### Element Not Found
```bash
# Run in headed mode to see actual page
npm run test:e2e:headed

# Use debug mode to inspect selectors
npm run test:e2e:debug

# Check if form field names match test selectors
```

### Login Fails
```bash
# Verify test user exists
# Check credentials in .env
# Test login manually in browser
# Check backend logs

# Run only login test
npx playwright test -g "should login successfully"
```

### Network Errors
```bash
# Ensure backend is running
# Check API_URL in .env
# Run with verbose logging
npx playwright test --reporter=verbose

# Check network tab in trace
npx playwright show-trace test-results/trace.zip
```

### Database Connection Issues
```bash
# Verify MongoDB is running
# Check database credentials in backend .env
# Run backend diagnostic
node server/test-db-connection.js
```

## 📈 Performance Testing

### Measure Test Performance
```bash
npx playwright test --reporter=json > test-results/perf.json

# Parse results
node -e "const r=require('./test-results/results.json'); console.log(r.suites[0].tests.map(t=>({name:t.title, duration:t.duration}))"
```

### Profile Tests
```bash
npx playwright test --profile
```

### Slow Motion
```bash
npx playwright test --slow-mo=1000
```

## 🔐 Security Notes

- Never commit real credentials to repository
- Use .env for sensitive data
- Use test users only
- Invalidate test tokens after testing
- Don't run tests on production servers

## 📋 CI/CD Integration

### GitHub Actions
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: test-results/html/
```

### GitLab CI
```yaml
e2e_tests:
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  script:
    - npm install
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - test-results/
```

### Jenkins
```groovy
stage('E2E Tests') {
  steps {
    sh 'npm install'
    sh 'npx playwright install --with-deps'
    sh 'npm run test:e2e'
  }
  post {
    always {
      junit 'test-results/junit.xml'
      publishHTML([
        reportDir: 'test-results/html',
        reportFiles: 'index.html'
      ])
    }
  }
}
```

## 🎯 Common Workflows

### Development Testing
```bash
# Run tests while developing
npm run test:e2e:watch

# Or in one terminal:
npm run test:e2e:headed

# Make changes, re-run in headed mode
```

### Pre-commit Testing
```bash
# Run all tests locally
npm run test:e2e

# Check report
npm run test:e2e:report

# Commit only if all pass
```

### Mobile Testing
```bash
# Test on various mobile viewports
npm run test:e2e:mobile

# Test on specific device
npx playwright test --project="iPhone 12"
npx playwright test --project="Pixel 5"
```

### Cross-browser Testing
```bash
# Test on all browsers
npx playwright test

# View reports
npm run test:e2e:report
```

## 📚 Resources

- **Playwright Docs**: https://playwright.dev
- **Test File**: `tests/Userprofileedittest.spec.ts`
- **Configuration**: `playwright.config.ts`
- **Helpers**: `tests/test-helpers.ts`
- **README**: `tests/README.md`

## 💡 Tips & Tricks

### Generate Test Code
```bash
npx playwright codegen http://localhost:3000
```

### Slow Down Execution
```bash
# See exactly what's happening
npx playwright test --slow-mo=1000
```

### Run Single Test File
```bash
npx playwright test tests/Userprofileedittest.spec.ts
```

### View Test Structure
```bash
npx playwright test --list
```

### Clear Cache
```bash
rm -rf test-results/
npx playwright install --with-deps
```

## 🆘 Getting Help

1. Check README in tests/ directory
2. Review Playwright documentation
3. Run in debug mode to inspect
4. Check test traces for failures
5. Review backend logs
6. Check browser console errors

---

**Last Updated**: March 2026  
**Playwright Version**: 1.58.2+  
**Node Version**: 14+ required
