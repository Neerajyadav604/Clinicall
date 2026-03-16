import { test as setup, expect } from '@playwright/test';
import { existsSync, readFileSync, statSync } from 'fs';

const authFile = 'playwright/.auth/user.json';

setup.setTimeout(120000);

setup('authenticate and save session', async ({ page, context }) => {

  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
  const email    = process.env.TEST_EMAIL    || '';
  const password = process.env.TEST_PASSWORD || '';

  console.log('\n🔐 SETUP: Starting authentication...\n');

  // ✅ CHECK IF SESSION ALREADY EXISTS, IS VALID, AND IS FRESH (< 1 hour old)
  if (existsSync(authFile)) {
    try {
      const stats = statSync(authFile);
      const fileAgeMs = Date.now() - stats.mtimeMs;
      const fileAgeHours = fileAgeMs / (60 * 60 * 1000);

      const sessionData = JSON.parse(readFileSync(authFile, 'utf-8'));
      if (sessionData.cookies && sessionData.cookies.length > 0 && fileAgeHours < 1) {
        console.log(`✅ SETUP: Valid session found (${fileAgeHours.toFixed(2)}h old), skipping re-authentication\n`);
        return; // Exit early, don't login again
      } else if (fileAgeHours >= 1) {
        console.log(`⚠️  SETUP: Session is stale (${fileAgeHours.toFixed(2)}h old), re-authenticating...\n`);
      }
    } catch (error) {
      console.log('⚠️  SETUP: Invalid session file, re-authenticating...\n');
    }
  }

  try {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    // Wait for form fields
    const emailSelector = 'input[type="email"], input[name="email"]';
    const passwordSelector = 'input[type="password"], input[name="password"]';
    const submitSelector = 'button[type="submit"]';
    
    await page.waitForSelector(emailSelector, { state: 'visible', timeout: 30000 });
    await page.waitForSelector(passwordSelector, { state: 'visible', timeout: 30000 });
    await page.waitForSelector(submitSelector, { state: 'visible', timeout: 30000 });
    
    await page.waitForTimeout(2000); // Let React fully hydrate

    // Fill form
    const emailField = page.locator(emailSelector).first();
    await emailField.click();
    await emailField.clear();
    await emailField.type(email, { delay: 50 });
    
    const passwordField = page.locator(passwordSelector).first();
    await passwordField.click();
    await passwordField.clear();
    await passwordField.type(password, { delay: 50 });

    // Click submit and wait for response
    const submitButton = page.locator(submitSelector).first();
    
    let loginResponse: any = null;
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/login') && res.url().includes('api'),
      { timeout: 30000 }
    ).catch(() => null);

    await submitButton.click();
    loginResponse = await responsePromise;

    if (loginResponse && loginResponse.status() === 200) {
      console.log('✅ SETUP: Login successful');
    } else if (!loginResponse) {
      console.warn('⚠️  SETUP: No API response, but continuing...');
    } else {
      console.warn(`⚠️  SETUP: API returned status ${loginResponse.status()}`);
    }

    // Wait for redirect
    await page.waitForURL(
      url => url.pathname === '/my-profile' || url.pathname.includes('/dashboard'),
      { timeout: 15000 }
    ).catch(() => {
      console.warn(`⚠️  SETUP: Redirect not detected, current: ${page.url()}`);
    });

    // Wait for token in localStorage
    await page.waitForFunction(() => {
      const keys = ['token', 'accessToken', 'authToken', 'auth_token'];
      return keys.some(k => {
        const val = localStorage.getItem(k);
        return val !== null && val !== 'undefined' && val !== '';
      });
    }, { timeout: 15000 }).catch(() => {
      console.warn('⚠️  SETUP: Token not in localStorage');
    });

    // Save session
    await context.storageState({ path: authFile });
    console.log('✅ SETUP: Session saved\n');

  } catch (error) {
    console.error('\n❌ SETUP: Authentication failed');
    console.error(`Error: ${(error as Error).message}\n`);
    throw error;
  }
});
