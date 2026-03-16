@echo off
REM ========================================
REM TEST SETUP SCRIPT (Windows)
REM ========================================

echo.
echo 🧪 ClinicAll E2E Test Setup
echo ============================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✓ Node.js %NODE_VERSION% installed
)

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✓ npm %NPM_VERSION% installed
)

echo.
echo 📦 Installing dependencies...
call npm install --save-dev @playwright/test

echo.
echo 🌐 Installing Playwright browsers...
call npx playwright install

echo.
echo 📝 Checking environment files...

REM Create .env if it doesn't exist
if not exist .env (
    if exist .env.example (
        echo Creating .env from .env.example...
        copy .env.example .env
        echo ✓ .env created
    ) else (
        echo ⚠ .env.example not found, creating .env manually
        (
            echo BASE_URL=http://localhost:3000
            echo API_URL=http://localhost:4000/api/v1
            echo NODE_ENV=test
            echo TEST_USER_EMAIL=testuser@example.com
            echo TEST_USER_PASSWORD=TestPassword123!
            echo CI=false
        ) > .env
    )
) else (
    echo ✓ .env already exists
)

echo.
echo 📋 Creating test directories...
if not exist test-results\html mkdir test-results\html
if not exist test-results\screenshots mkdir test-results\screenshots
echo ✓ Test directories created

echo.
echo ✅ Setup Complete!
echo.
echo 📖 Next Steps:
echo 1. Ensure frontend is running: npm start ^(in frontend directory^)
echo 2. Ensure backend is running: npm start ^(in server directory^)
echo 3. Create a test user if needed
echo 4. Run tests: npm run test:e2e
echo.
echo 📚 For more information, see: tests/README.md
echo.
pause
