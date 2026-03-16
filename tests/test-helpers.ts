/**
 * TEST UTILITIES & REUSABLE HELPERS
 * Shared functions for E2E test suite
 */

import { Page, expect } from '@playwright/test';

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const API_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

// ==========================================
// TEST DATA
// ==========================================

export const TEST_USERS = {
  regular: {
    email: 'dheerajyadav72005@gmail.com',
    password: 'rahul@2005',
    fullName: 'Rahul Sharma',
    contact: '9876543210',
  },
  doctor: {
    email: 'testdoctor@example.com',
    password: 'DoctorPassword123!',
    fullName: 'Test Doctor',
    contact: '8765432109',
  },
  admin: {
    email: 'neeraj',
    password: 'AdminPassword123!',
    fullName: 'Test Admin',
    contact: '7654321098',
  },
};

export const FORM_DATA = {
  basic: {
    fullName: 'John Doe',
    email: 'john@example.com',
    contact: '9876543210',
  },
  complete: {
    fullName: 'Complete User Profile',
    email: 'complete@example.com',
    contact: '9876543211',
    address: '123 Test St, Test City, TC 12345',
    dob: '1990-05-15',
    gender: 'Male',
    bloodGroup: 'O+',
    emergencyContact: '9876543212',
    allergies: 'Penicillin, Peanuts',
    medications: 'Aspirin, Vitamin D',
    medicalHistory: 'Asthma, Hypertension',
    insuranceProvider: 'Blue Cross',
    policyNumber: 'BC987654321',
  },
};

export const VALIDATION_DATA = {
  invalidEmails: [
    'not-an-email',
    '@example.com',
    'user@',
    'user name@example.com',
    'user@.com',
  ],
  invalidPhones: [
    '123',
    'abc',
    '(invalid)',
  ],
  validPhones: [
    '9876543210',
    '+1-987-654-3210',
    '(987) 654-3210',
    '+1 987 654 3210',
  ],
  specialCharacters: [
    "O'Brien",
    "Smith-Jones",
    "José García",
    "St. Mary's",
    "A & B",
  ],
};

// ==========================================
// AUTHENTICATION HELPERS
// ==========================================

/**
 * Login user and return token
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string,
  options: { debug?: boolean } = {}
): Promise<string | null> {
  const { debug = false } = options;

  try {
    // Navigate to login (use domcontentloaded instead of networkidle for SPA)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    if (debug) console.log('🔐 Navigated to login page');

    // Fill login form
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);

    if (debug) console.log('📝 Filled login form');

    // Submit
    await page.click('button[type="submit"]');

    // SPA-friendly: Wait for token to appear in localStorage instead of page navigation
    await page.waitForFunction(
      () => localStorage.getItem('token') !== null,
      { timeout: 15000 }
    );

    if (debug) console.log('✅ Login completed');

    // Get token
    const token = await page.evaluate(() => localStorage.getItem('token'));

    if (debug) console.log(`🔑 Token obtained: ${token?.substring(0, 20)}...`);

    return token;
  } catch (error) {
    console.error('❌ Login failed:', error);
    throw error;
  }
}

/**
 * Logout user
 */
export async function logout(page: Page): Promise<void> {
  // Click profile menu
  const profileButton = page.locator('[aria-label*="profile"], [aria-label*="account"]').first();

  if (await profileButton.isVisible()) {
    await profileButton.click();
  }

  // Click logout
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")');
  await logoutButton.click();

  // SPA-friendly: Wait for token to be removed from localStorage
  await page.waitForFunction(
    () => localStorage.getItem('token') === null,
    { timeout: 10000 }
  );

  // Verify not logged in
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeNull();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  return !!token;
}

// ==========================================
// NAVIGATION HELPERS
// ==========================================

/**
 * Navigate to edit profile page
 */
export async function navigateToEditProfile(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/edit-profile`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1:has-text("Edit Profile")')).toBeVisible({ timeout: 30000 });
}

/**
 * Navigate to my profile
 */
export async function navigateToMyProfile(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/my-profile`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1, h2').filter({ hasText: 'Profile' })).toBeVisible({ timeout: 30000 });
}

/**
 * Navigate to home
 */
export async function navigateToHome(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
}

// ==========================================
// FORM HELPERS
// ==========================================

/**
 * Fill profile form with data
 */
export async function fillProfileForm(page: Page, data: any): Promise<void> {
  const fieldMap: { [key: string]: string } = {
    fullName: 'fullName',
    email: 'email',
    contact: 'contact',
    phone: 'contact',
    address: 'address',
    dob: 'dob',
    dateOfBirth: 'dob',
    gender: 'gender',
    bloodGroup: 'bloodGroup',
    emergencyContact: 'emergencyContact',
    allergies: 'allergies',
    medications: 'medications',
    medicalHistory: 'medicalHistory',
    insuranceProvider: 'insuranceProvider',
    policyNumber: 'policyNumber',
  };

  for (const [key, value] of Object.entries(data)) {
    const fieldName = fieldMap[key] || key;

    if (!value) continue;

    // Try to find input
    let field = page.locator(`input[name="${fieldName}"]`);

    if (!(await field.isVisible())) {
      // Try textarea
      field = page.locator(`textarea[name="${fieldName}"]`);
    }

    if (!(await field.isVisible())) {
      // Try select
      field = page.locator(`select[name="${fieldName}"]`);

      if (await field.isVisible()) {
        await field.selectOption(String(value));
        continue;
      }
    }

    if (await field.isVisible()) {
      await field.fill(String(value));
    }
  }
}

/**
 * Clear all form fields
 */
export async function clearProfileForm(page: Page): Promise<void> {
  const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], textarea');

  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    await inputs.nth(i).fill('');
  }
}

/**
 * Get form field value
 */
export async function getFormFieldValue(page: Page, fieldName: string): Promise<string | null> {
  const field = page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);

  if (await field.isVisible()) {
    return await field.inputValue();
  }

  return null;
}

/**
 * Get form completeness percentage
 */
export async function getFormCompleteness(page: Page): Promise<number> {
  try {
    const completenessText = await page.locator('p:has-text("Form completeness")').evaluate((el) =>
      el.nextElementSibling?.textContent
    );

    if (completenessText) {
      const match = completenessText.match(/(\d+)%/);
      return match ? parseInt(match[1], 10) : 0;
    }
  } catch (e) {
    // Element might not exist
  }

  return 0;
}

/**
 * Submit form
 */
export async function submitForm(page: Page): Promise<void> {
  const submitButton = page.locator('button[type="submit"]:has-text("Save")');
  await submitButton.click();
}

/**
 * Check form validation error
 */
export async function hasValidationError(page: Page, fieldName?: string): Promise<boolean> {
  if (fieldName) {
    const errorText = page.locator(`text=*${fieldName}*`).filter({ hasText: /error|required|invalid/i });
    return await errorText.isVisible().catch(() => false);
  }

  const errors = page.locator('text=/error|required|invalid/i');
  return (await errors.count()) > 0;
}

/**
 * Get validation error message
 */
export async function getValidationError(page: Page): Promise<string | null> {
  const errorMessages = page.locator('[role="alert"], text=/error|required|invalid/i');

  if (await errorMessages.isVisible()) {
    return await errorMessages.first().textContent();
  }

  return null;
}

// ==========================================
// ASSERTION HELPERS
// ==========================================

/**
 * Expect page to be on edit profile
 */
export async function expectEditProfilePage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/edit-profile/);
  await expect(page.locator('h1:has-text("Edit Profile")')).toBeVisible();
}

/**
 * Expect page to be on my profile
 */
export async function expectMyProfilePage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/my-profile|profile/);
}

/**
 * Expect login page
 */
export async function expectLoginPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/login/);
  await expect(page.locator('h1, h2').filter({ hasText: 'Login' })).toBeVisible();
}

/**
 * Expect success message
 */
export async function expectSuccessMessage(page: Page, text?: string): Promise<void> {
  const successMessage = text
    ? page.locator(`text=${text}`)
    : page.locator('text=/success|updated|saved/i');

  // May disappear quickly, so give it time
  try {
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  } catch {
    // Success message might have disappeared
  }
}

/**
 * Expect error message
 */
export async function expectErrorMessage(page: Page, text?: string): Promise<void> {
  const errorMessage = text
    ? page.locator(`text=${text}`)
    : page.locator('text=/error|failed|invalid/i');

  await expect(errorMessage).toBeVisible({ timeout: 5000 });
}

// ==========================================
// UTILITY HELPERS
// ==========================================

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page, timeout = 10000): Promise<void> {
  // Wait for loading spinner to disappear
  const loader = page.locator('[class*="spinner"], [class*="loading"], [aria-busy="true"]');

  if (await loader.isVisible({ timeout: 1000 }).catch(() => false)) {
    await loader.waitFor({ state: 'hidden', timeout });
  }
}

/**
 * Take screenshot with timestamp
 */
export async function takeScrenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-results/screenshots/${name}-${timestamp}.png`;

  await page.screenshot({
    path: filename,
    fullPage: true,
  });

  console.log(`📸 Screenshot saved: ${filename}`);
}

/**
 * Get all console messages
 */
export async function getConsoleMessages(page: Page): Promise<any[]> {
  const messages: any[] = [];

  page.on('console', (msg) => {
    messages.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  return messages;
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page,
  path: string,
  response: any,
  options: { status?: number; headers?: any } = {}
): Promise<void> {
  await page.route(path, (route) => {
    route.abort('failed');
  });

  await page.route(path, (route) => {
    route.continue();
  });
}

/**
 * Get stored token
 */
export async function getToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => localStorage.getItem('token'));
}

/**
 * Set token
 */
export async function setToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => localStorage.setItem('token', t), token);
}

/**
 * Clear all storage
 */
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Wait for condition
 */
export async function waitForCondition(
  page: Page,
  condition: () => Promise<boolean>,
  timeout = 10000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }

    await page.waitForTimeout(100);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  return (await element.count()) > 0;
}

/**
 * Retry action
 */
export async function retryAction(
  action: () => Promise<void>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<void> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await action();
      return;
    } catch (error) {
      lastError = error as Error;
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  pathPattern: string | RegExp,
  timeout = 10000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const responseHandler = (response: any) => {
      if (typeof pathPattern === 'string') {
        if (response.url().includes(pathPattern)) {
          page.off('response', responseHandler);
          resolve(response);
        }
      } else if (pathPattern.test(response.url())) {
        page.off('response', responseHandler);
        resolve(response);
      }
    };

    page.on('response', responseHandler);

    setTimeout(() => {
      page.off('response', responseHandler);
      reject(new Error(`API response not received within ${timeout}ms`));
    }, timeout);
  });
}

// ==========================================
// EXPORT ALL HELPERS
// ==========================================

export default {
  // Data
  TEST_USERS,
  FORM_DATA,
  VALIDATION_DATA,

  // Auth
  loginUser,
  logout,
  isAuthenticated,

  // Navigation
  navigateToEditProfile,
  navigateToMyProfile,
  navigateToHome,

  // Form
  fillProfileForm,
  clearProfileForm,
  getFormFieldValue,
  getFormCompleteness,
  submitForm,
  hasValidationError,
  getValidationError,

  // Assertions
  expectEditProfilePage,
  expectMyProfilePage,
  expectLoginPage,
  expectSuccessMessage,
  expectErrorMessage,

  // Utilities
  waitForLoading,
  takeScrenshot,
  getConsoleMessages,
  mockApiResponse,
  getToken,
  setToken,
  clearStorage,
  waitForCondition,
  elementExists,
  retryAction,
  waitForApiResponse,
};
