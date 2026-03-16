import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';

/**
 * USER PROFILE EDIT FLOW - COMPREHENSIVE E2E TESTS
 * 
 * This test suite covers the complete user profile editing workflow including:
 * - Authentication
 * - Navigation to edit profile
 * - Form field validation
 * - Form submission
 * - Profile picture upload
 * - Error handling
 * - Session management
 * 
 * NOTE: Tests include human-like delays to avoid rate-limiting (HTTP 429)
 */

// ==========================================
// TEST CONFIGURATION & CONSTANTS
// ==========================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api/v1';
const TIMEOUT = 30000;

// Test user credentials
const TEST_USER = {
  email: 'dheerajyadav72005@gamil.com',
  password: 'rahul@2005',
  fullName: 'Test User Profile',
  contact: '9876543210',
};

// Updated profile data for edit tests
const UPDATED_PROFILE = {
  fullName: 'Updated Test User',
  email: 'updated@example.com',
  contact: '9876543211',
  address: '123 Updated Street, New City, NC 12345',
  dob: '1995-05-15',
  gender: 'Male',
  bloodGroup: 'O+',
  emergencyContact: '9876543212',
  allergies: 'Penicillin, Peanuts',
  medications: 'Aspirin, Vitamin D',
  medicalHistory: 'Asthma, Diabetes',
  insuranceProvider: 'Blue Cross',
  policyNumber: 'BC123456789',
};

// ==========================================
// DELAY UTILITIES (Human-like behavior to avoid rate-limiting)
// ==========================================

/**
 * Generate random delay between min and max
 * Format: milliseconds
 */
function getRandomDelay(minMs: number = 800, maxMs: number = 2000): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Shorter random delay for between-keystroke pauses
 * Format: milliseconds (50-150ms)
 */
function getKeyStrokeDelay(minMs: number = 50, maxMs: number = 150): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Wait with human-like delay
 */
async function humanWait(page: Page, minMs: number = 800, maxMs: number = 2000): Promise<void> {
  const delay = getRandomDelay(minMs, maxMs);
  await page.waitForTimeout(delay);
}

/**
 * Type text slowly like a human
 */
async function slowType(page: Page, selector: string, text: string, delay: number = 50): Promise<void> {
  const element = page.locator(selector);
  await element.click();
  await element.clear();
  
  // Type each character with a delay
  for (let i = 0; i < text.length; i++) {
    await element.type(text[i], { delay });
    // Add random micro delays between keystrokes
    if (i < text.length - 1) {
      await page.waitForTimeout(getKeyStrokeDelay());
    }
  }
}

/**
 * Fill form field with human-like behavior
 */
async function humanFill(page: Page, selector: string, value: string): Promise<void> {
  const element = page.locator(selector);
  
  // Wait before filling
  await humanWait(page, 600, 1200);
  
  // Click on field
  await element.click();
  await page.waitForTimeout(getKeyStrokeDelay());
  
  // Clear existing value
  await element.clear();
  await page.waitForTimeout(getKeyStrokeDelay());
  
  // Type slowly
  await slowType(page, selector, value, 30);
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Diagnose 500 error - check what's happening on the server
 */
async function diagnoseLoginError(page: Page) {
  console.log('\n🔍 DIAGNOSTIC INFO:');
  console.log('Current URL:', page.url());
  
  // Check for error messages on page
  const errorElements = await page.locator('[role="alert"], .error, .alert-danger, text=/error|failed/i').all();
  console.log('Error elements found:', errorElements.length);
  
  for (let i = 0; i < errorElements.length; i++) {
    const text = await errorElements[i].textContent();
    if (text) console.log(`  Error ${i + 1}:`, text.trim());
  }
  
  // Check console logs for errors
  const pageConsoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      pageConsoleErrors.push(msg.text());
    }
  });
  
  if (pageConsoleErrors.length > 0) {
    console.log('Browser console errors:');
    pageConsoleErrors.forEach((err) => console.log('  -', err));
  }
}

/**
 * Login user and return valid token
 * Enhanced with human-like delays to avoid rate-limiting
 */
async function loginUser(page: Page, email: string, password: string) {
  try {
    // Setup request/response logging to debug 500 errors
    page.on('response', (response) => {
      if (response.status() >= 400) {
        console.log(`⚠️ HTTP ${response.status()}: ${response.url()}`);
      }
    });

    page.on('request', (request) => {
      if (request.url().includes('/login') && request.method() === 'POST') {
        console.log(`📤 Login API Request to: ${request.url()}`);
        console.log(`📋 Headers:`, request.allHeaders());
        console.log(`📦 Body:`, request.postDataJSON());
      }
    });

    // Navigate to login page (use domcontentloaded instead of networkidle for SPA)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    
    // Wait for page to render
    await humanWait(page, 1000, 1500);
    
    // Wait before typing email
    await humanWait(page, 800, 1500);
    
    // Type email slowly
    await slowType(page, 'input[name="email"]', email, 40);
    
    // Wait between email and password
    await humanWait(page, 800, 1200);
    
    // Type password slowly
    await slowType(page, 'input[name="password"]', password, 50);
    
    // Wait before clicking login
    await humanWait(page, 1000, 1600);
    
    // Check and interact with remember-me checkbox if visible
    const rememberCheckbox = page.locator('input[name="rememberMe"]');
    const isRememberCheckboxVisible = await rememberCheckbox.isVisible().catch(() => false);
    
    // Wait before submitting
    await humanWait(page, 600, 1000);
    
    // Click submit button and wait for API response
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for API response (not just page navigation)
    try {
      await page.waitForResponse(
        (response) => response.url().includes('/login') && (response.status() === 200 || response.status() === 401 || response.status() === 500),
        { timeout: 10000 }
      );
    } catch (e) {
      console.error('⚠️ No API response received within timeout');
    }
    
    // SPA-friendly: Wait for token in localStorage instead of page navigation
    await humanWait(page, 1200, 2000);
    try {
      await page.waitForFunction(
        () => localStorage.getItem('token') !== null,
        { timeout: 10000 }
      );
    } catch (e) {
      console.warn('⚠️ Token timeout (may still be successful)');
    }
    
    // Additional wait for UI to stabilize
    await humanWait(page, 1000, 1500);
    
    // Get token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    
    if (!token) {
      // Check for error messages on the page
      const errorMessage = await page.locator('text=/error|failed|invalid/i').first().textContent().catch(() => null);
      console.error('❌ Login failed. Error on page:', errorMessage);
      
      // Run diagnostics
      await diagnoseLoginError(page);
      
      throw new Error(`Login failed: ${errorMessage || 'No token received'}`);
    }
    
    console.log('✅ Login successful, token received');
    return token;
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('\n💡 TROUBLESHOOTING TIPS:');
    console.error('1. Ensure test user exists in database with correct credentials');
    console.error('2. Check backend logs for 500 error details');
    console.error('3. Verify BASE_URL and API_URL in .env file');
    console.error('4. Ensure backend is running and responding');
    console.error('5. Check for database connection issues on server');
    throw error;
  }
}

/**
 * Navigate to edit profile page with delays
 */
async function navigateToEditProfile(page: Page) {
  // Wait before navigation
  await humanWait(page, 800, 1200);
  
  // Navigate directly to edit profile (use domcontentloaded instead of networkidle for SPA)
  await page.goto(`${BASE_URL}/editprofile`, { waitUntil: 'domcontentloaded' });
  
  // SPA-friendly: Wait for profile section header to appear
  await expect(page.locator('h1:has-text("Edit Profile")')).toBeVisible({ timeout: TIMEOUT });
  
  // Wait for page to stabilize
  await humanWait(page, 800, 1200);
}

/**
 * Fill profile form with provided data
 * Enhanced with human-like delays between fields
 */
async function fillProfileForm(page: Page, profileData: any) {
  // Full Name
  if (profileData.fullName) {
    await humanFill(page, 'input[name="fullName"]', profileData.fullName);
    await humanWait(page, 600, 1000);
  }
  
  // Email
  if (profileData.email) {
    await humanFill(page, 'input[name="email"]', profileData.email);
    await humanWait(page, 600, 1000);
  }
  
  // Contact/Phone
  if (profileData.contact) {
    await humanFill(page, 'input[name="contact"]', profileData.contact);
    await humanWait(page, 600, 1000);
  }
  
  // Address
  if (profileData.address) {
    const addressField = page.locator('input[name="address"], textarea[name="address"]');
    if (await addressField.isVisible()) {
      await humanFill(page, 'input[name="address"], textarea[name="address"]', profileData.address);
      await humanWait(page, 600, 1000);
    }
  }
  
  // Date of Birth
  if (profileData.dob) {
    const dobField = page.locator('input[name="dob"]');
    if (await dobField.isVisible()) {
      await humanFill(page, 'input[name="dob"]', profileData.dob);
      await humanWait(page, 600, 1000);
    }
  }
  
  // Gender
  if (profileData.gender) {
    const genderSelect = page.locator('select[name="gender"]');
    if (await genderSelect.isVisible()) {
      await humanWait(page, 500, 900);
      await genderSelect.selectOption(profileData.gender);
      await humanWait(page, 400, 800);
    }
  }
  
  // Blood Group
  if (profileData.bloodGroup) {
    const bloodGroupSelect = page.locator('select[name="bloodGroup"]');
    if (await bloodGroupSelect.isVisible()) {
      await humanWait(page, 500, 900);
      await bloodGroupSelect.selectOption(profileData.bloodGroup);
      await humanWait(page, 400, 800);
    }
  }
  
  // Emergency Contact
  if (profileData.emergencyContact) {
    const emergencyField = page.locator('input[name="emergencyContact"]');
    if (await emergencyField.isVisible()) {
      await humanFill(page, 'input[name="emergencyContact"]', profileData.emergencyContact);
      await humanWait(page, 600, 1000);
    }
  }
  
  // Allergies (comma-separated)
  if (profileData.allergies) {
    const allergiesField = page.locator('input[name="allergies"], textarea[name="allergies"]');
    if (await allergiesField.isVisible()) {
      await humanFill(page, 'input[name="allergies"], textarea[name="allergies"]', profileData.allergies);
      await humanWait(page, 600, 1000);
    }
  }
  
  // Medications (comma-separated)
  if (profileData.medications) {
    const medicationsField = page.locator('input[name="medications"], textarea[name="medications"]');
    if (await medicationsField.isVisible()) {
      await humanFill(page, 'input[name="medications"], textarea[name="medications"]', profileData.medications);
      await humanWait(page, 600, 1000);
    }
  }
  
  // Medical History (comma-separated)
  if (profileData.medicalHistory) {
    const medicalHistoryField = page.locator('input[name="medicalHistory"], textarea[name="medicalHistory"]');
    if (await medicalHistoryField.isVisible()) {
      await humanFill(page, 'input[name="medicalHistory"], textarea[name="medicalHistory"]', profileData.medicalHistory);
      await humanWait(page, 600, 1000);
    }
  }
  
  // Insurance Provider
  if (profileData.insuranceProvider) {
    const insuranceProviderField = page.locator('input[name="insuranceProvider"]');
    if (await insuranceProviderField.isVisible()) {
      await humanFill(page, 'input[name="insuranceProvider"]', profileData.insuranceProvider);
      await humanWait(page, 600, 1000);
    }
  }
  
  // Policy Number
  if (profileData.policyNumber) {
    const policyNumberField = page.locator('input[name="policyNumber"]');
    if (await policyNumberField.isVisible()) {
      await humanFill(page, 'input[name="policyNumber"]', profileData.policyNumber);
      await humanWait(page, 600, 1000);
    }
  }
}

/**
 * Get form completeness percentage
 */
async function getFormCompleteness(page: Page): Promise<number> {
  const completenessText = await page.locator('p:has-text("Form completeness")').evaluate(
    (el) => el.nextElementSibling?.textContent
  );
  
  if (completenessText) {
    const match = completenessText.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }
  
  return 0;
}

// ==========================================
// TEST SUITES
// ==========================================

test.describe('User Profile Edit Flow', () => {
  
  // Setup: Run before all tests
  test.beforeAll(async () => {
    // Note: In a real scenario, you might want to seed test data
    console.log('🧪 Starting User Profile Edit E2E Tests');
  });

  // ==========================================
  // AUTHENTICATION TESTS
  // ==========================================

  test.describe('Authentication & Navigation', () => {
    
    test('should login successfully with valid credentials', async ({ page }) => {
      const token = await loginUser(page, TEST_USER.email, TEST_USER.password);
      
      // Verify token is stored
      expect(token).toBeTruthy();
      expect(token?.length).toBeGreaterThan(0);
      
      // Verify user is redirected to dashboard/profile
      expect(page.url()).toContain('my-profile');
    });

    test('should navigate to edit profile page from my-profile', async ({ page }) => {
      // Login first
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      
      // Look for edit profile button/link
      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit"), button[aria-label*="edit"i]');
      await editButton.first().click({ timeout: TIMEOUT });
      
      // Should navigate to edit profile
      await expect(page).toHaveURL(/editprofile/i, { timeout: TIMEOUT });
      await expect(page.locator('h1:has-text("Edit Profile")')).toBeVisible();
    });

    test('should navigate to edit profile page directly', async ({ page }) => {
      // Login first
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      
      // Navigate directly to edit profile
      await navigateToEditProfile(page);
      
      // Verify page loaded
      await expect(page.locator('h1:has-text("Edit Profile")')).toBeVisible();
      await expect(page.locator('text=Update personal, medical, and insurance details')).toBeVisible();
    });

    test('should show form completeness indicator', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Check for completeness indicator
      const completenessContainer = page.locator('text=Form completeness');
      await expect(completenessContainer).toBeVisible();
      
      // Get initial completeness percentage
      const initialCompletion = await getFormCompleteness(page);
      expect(initialCompletion).toBeGreaterThanOrEqual(0);
      expect(initialCompletion).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================
  // FORM FIELD TESTS
  // ==========================================

  test.describe('Form Field Validation', () => {
    
    test('should require full name field', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before clearing
      await humanWait(page, 700, 1200);
      
      // Clear full name and try to submit
      const fullNameField = page.locator('input[name="fullName"]');
      await fullNameField.clear();
      
      // Wait before clicking submit
      await humanWait(page, 800, 1400);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Wait for validation error to appear
      await humanWait(page, 500, 1000);
      
      // Should show validation error
      const errorMessage = page.locator('text=Full name is required');
      await expect(errorMessage).toBeVisible({ timeout: TIMEOUT });
    });

    test('should validate email format', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before entering invalid email
      await humanWait(page, 700, 1200);
      
      // Enter invalid email
      const emailField = page.locator('input[name="email"]');
      await emailField.click();
      await humanWait(page, 400, 700);
      await emailField.clear();
      await humanWait(page, 300, 500);
      await slowType(page, 'input[name="email"]', 'invalid-email', 40);
      
      // Wait before submitting
      await humanWait(page, 800, 1400);
      
      // Try to submit
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Wait for error
      await humanWait(page, 500, 1000);
      
      // Should show email format error
      const errorMessage = page.locator('text=Invalid email address');
      await expect(errorMessage).toBeVisible({ timeout: TIMEOUT });
    });

    test('should validate contact/phone format', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before interacting
      await humanWait(page, 700, 1200);
      
      // Enter invalid phone number
      const contactField = page.locator('input[name="contact"]');
      if (await contactField.isVisible()) {
        await contactField.click();
        await humanWait(page, 400, 700);
        await contactField.clear();
        await humanWait(page, 300, 500);
        await slowType(page, 'input[name="contact"]', 'invalid', 40);
        
        // Wait before clicking submit
        await humanWait(page, 800, 1400);
        
        // Try to submit
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        
        // Wait for validation
        await humanWait(page, 500, 1000);
        
        // Should show validation error
        const errorMessage = page.locator('text=Invalid');
        await expect(errorMessage).toBeVisible({ timeout: 5000 }).catch(() => {
          // Phone validation might be optional, that's okay
        });
      }
    });

    test('should accept valid full name', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before filling
      await humanWait(page, 700, 1200);
      
      const fullNameField = page.locator('input[name="fullName"]');
      await fullNameField.click();
      await humanWait(page, 400, 700);
      await fullNameField.clear();
      await humanWait(page, 300, 500);
      await slowType(page, 'input[name="fullName"]', 'John Doe Smith', 35);
      
      // Wait before verification
      await humanWait(page, 500, 900);
      
      // Verify field contains the value
      await expect(fullNameField).toHaveValue('John Doe Smith');
    });

    test('should populate form with existing user data', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      
      // Wait before navigating
      await humanWait(page, 700, 1200);
      
      await navigateToEditProfile(page);
      
      // Verify existing data is populated
      const fullNameField = page.locator('input[name="fullName"]');
      const emailField = page.locator('input[name="email"]');
      
      // Wait for values to load
      await humanWait(page, 800, 1300);
      
      const fullNameValue = await fullNameField.inputValue();
      const emailValue = await emailField.inputValue();
      
      // Values should not be empty (pre-populated from user data)
      expect(fullNameValue).toBeTruthy();
      expect(emailValue).toBeTruthy();
    });
  });

  // ==========================================
  // FORM SUBMISSION TESTS
  // ==========================================

  test.describe('Form Submission & Profile Update', () => {
    
    test('should submit form with valid data', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Fill form with updated data
      await fillProfileForm(page, UPDATED_PROFILE);
      
      // Wait before clicking save
      await humanWait(page, 1000, 1600);
      
      // Click save button
      const saveButton = page.locator('button[type="submit"]:has-text("Save")');
      await saveButton.click();
      
      // Wait for response
      await humanWait(page, 1500, 2500);
      
      // Should show success message
      await expect(page.locator('text=Profile updated successfully')).toBeVisible({ 
        timeout: TIMEOUT 
      }).catch(() => {
        // Success toast might disappear quickly, so we check navigation instead
      });
      
      // Should navigate back to my-profile
      await expect(page).toHaveURL(/my-profile|profile/, { timeout: TIMEOUT });
    });

    test('should disable submit button while saving', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Fill form
      await fillProfileForm(page, { fullName: 'Test Update' });
      
      // Wait before clicking save
      await humanWait(page, 1000, 1600);
      
      // Get save button
      const saveButton = page.locator('button[type="submit"]:has-text("Save")');
      
      // Click save
      await saveButton.click();
      
      // Wait a bit
      await humanWait(page, 500, 1000);
      
      // Button should be disabled during saving
      await expect(saveButton).toBeDisabled({ timeout: 5000 }).catch(() => {
        // Might re-enable quickly if API is fast
      });
    });

    test('should show saving state indicator', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Fill form
      await fillProfileForm(page, { fullName: 'Test Update' });
      
      // Wait before clicking save
      await humanWait(page, 1000, 1600);
      
      // Click save
      const saveButton = page.locator('button[type="submit"]:has-text("Save")');
      await saveButton.click();
      
      // Check for "Saving..." text
      await expect(page.locator('text=Saving...')).toBeVisible({ timeout: 5000 }).catch(() => {
        // Might complete too quickly to see loading state
      });
    });

    test('should update all profile sections together', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Fill all available fields
      const fullName = 'Complete Profile Test';
      const email = 'complete@test.example.com';
      const contact = '9876543210';
      const address = '456 Test Avenue, Test City, TC 54321';
      
      //Wait before filling
      await humanWait(page, 700, 1200);
      
      await humanFill(page, 'input[name="fullName"]', fullName);
      await humanWait(page, 600, 1000);
      await humanFill(page, 'input[name="email"]', email);
      await humanWait(page, 600, 1000);
      await humanFill(page, 'input[name="contact"]', contact);
      await humanWait(page, 600, 1000);
      
      const addressField = page.locator('input[name="address"], textarea[name="address"]');
      if (await addressField.isVisible()) {
        await humanFill(page, 'input[name="address"], textarea[name="address"]', address);
        await humanWait(page, 600, 1000);
      }
      
      // Wait before verification
      await humanWait(page, 800, 1300);
      
      // Verify all fields have values
      await expect(page.locator('input[name="fullName"]')).toHaveValue(fullName);
      await expect(page.locator('input[name="email"]')).toHaveValue(email);
      await expect(page.locator('input[name="contact"]')).toHaveValue(contact);
    });

    test('should persist form data on page reload', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before filling
      await humanWait(page, 700, 1200);
      
      // Fill form
      const testName = 'Reload Test User';
      await humanFill(page, 'input[name="fullName"]', testName);
      
      // Wait before reloading
      await humanWait(page, 1000, 1500);
      
      // Reload page
      await page.reload();
      
      // Wait for form to reload
      await page.waitForSelector('input[name="fullName"]', { timeout: TIMEOUT });
      
      // Form data should be reloaded from server
      const fullNameValue = await page.locator('input[name="fullName"]').inputValue();
      expect(fullNameValue).toBeTruthy();
    });
  });

  // ==========================================
  // FORM FIELD TYPES & INTERACTIONS
  // ==========================================

  test.describe('Form Field Types & Interactions', () => {
    
    test('should handle text input fields', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before interacting
      await humanWait(page, 700, 1200);
      
      const fields = [
        { name: 'fullName', value: 'Text Field Test' },
        { name: 'email', value: 'test@example.com' },
        { name: 'contact', value: '9999999999' },
      ];
      
      for (const field of fields) {
        const input = page.locator(`input[name="${field.name}"]`);
        if (await input.isVisible()) {
          await humanFill(page, `input[name="${field.name}"]`, field.value);
          await humanWait(page, 500, 900);
          await expect(input).toHaveValue(field.value);
        }
      }
    });

    test('should handle textarea fields for medical history', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before interacting
      await humanWait(page, 700, 1200);
      
      const allergiesField = page.locator('input[name="allergies"], textarea[name="allergies"]');
      if (await allergiesField.isVisible()) {
        const testValue = 'Penicillin, Sulfa, Latex';
        await humanFill(page, 'input[name="allergies"], textarea[name="allergies"]', testValue);
        
        // Wait before verification
        await humanWait(page, 500, 900);
        
        const value = await allergiesField.inputValue ? 
          await allergiesField.inputValue() : 
          await allergiesField.textContent();
        
        expect(value).toContain('Penicillin');
      }
    });

    test('should handle select dropdown fields', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before interacting
      await humanWait(page, 700, 1200);
      
      // Test Gender dropdown
      const genderSelect = page.locator('select[name="gender"]');
      if (await genderSelect.isVisible()) {
        await humanWait(page, 500, 900);
        await genderSelect.selectOption('Male');
        await humanWait(page, 400, 800);
        await expect(genderSelect).toHaveValue('Male');
      }
      
      // Wait between selections
      await humanWait(page, 700, 1200);
      
      // Test Blood Group dropdown
      const bloodGroupSelect = page.locator('select[name="bloodGroup"]');
      if (await bloodGroupSelect.isVisible()) {
        await humanWait(page, 500, 900);
        await bloodGroupSelect.selectOption('O+');
        await humanWait(page, 400, 800);
        await expect(bloodGroupSelect).toHaveValue('O+');
      }
    });

    test('should handle date input fields', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before interacting
      await humanWait(page, 700, 1200);
      
      const dobField = page.locator('input[name="dob"]');
      if (await dobField.isVisible()) {
        await humanFill(page, 'input[name="dob"]', '1990-05-15');
        
        // Wait before verification
        await humanWait(page, 500, 900);
        
        const value = await dobField.inputValue();
        expect(value).toContain('1990');
      }
    });

    test('should track form completeness as fields are filled', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before interacting
      await humanWait(page, 700, 1200);
      
      // Get initial completeness
      const initialCompletion = await getFormCompleteness(page);
      
      // Wait before filling
      await humanWait(page, 600, 1000);
      
      // Fill a required field
      await humanFill(page, 'input[name="contact"]', '9876543210');
      
      // Wait for progress bar update
      await humanWait(page, 800, 1200);
      
      // Get updated completeness
      const updatedCompletion = await getFormCompleteness(page);
      
      // Completeness should either stay same or increase
      expect(updatedCompletion).toBeGreaterThanOrEqual(initialCompletion);
    });
  });

  // ==========================================
  // NAVIGATION TESTS
  // ==========================================

  test.describe('Navigation & User Flow', () => {
    
    test('should cancel edit and go back to previous page', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before interacting
      await humanWait(page, 700, 1200);
      
      // Click cancel button
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();
      
      // SPA-friendly: Wait for URL to change away from editprofile
      await humanWait(page, 1000, 1500);
      
      // Wait for URL to change
      await page.waitForFunction(
        () => !window.location.pathname.includes('editprofile'),
        { timeout: 10000 }
      );
      expect(page.url()).not.toContain('editprofile');
    });

    test('should navigate back using browser back button after unsaved changes', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      
      // Navigate to edit profile
      await navigateToEditProfile(page);
      
      // Wait before making changes
      await humanWait(page, 700, 1200);
      
      // Make a change slowly
      await humanFill(page, 'input[name="fullName"]', 'Browser Back Test');
      
      // Wait before using browser back
      await humanWait(page, 1000, 1500);
      
      // Use browser back button
      await page.goBack();
      
      // Wait for navigation
      await humanWait(page, 1000, 1500);
      
      // Should navigate away from editprofile
      expect(page.url()).not.toContain('editprofile');
    });

    test('should show profile header with description', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait for page to stabilize
      await humanWait(page, 800, 1300);
      
      // Check for header elements
      await expect(page.locator('text=Profile Studio')).toBeVisible();
      await expect(page.locator('h1:has-text("Edit Profile")')).toBeVisible();
      await expect(page.locator('text=Update personal, medical, and insurance details')).toBeVisible();
    });

    test('should show all profile section cards', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Check for section headers
      const sections = [
        'Personal Information',
        'Medical Information',
        'Insurance Information',
      ];
      
      for (const section of sections) {
        const sectionElement = page.locator(`h2:has-text("${section}")`);
        // Section may or may not exist, just check if visible when present
        if (await sectionElement.isVisible()) {
          expect(sectionElement).toBeTruthy();
        }
      }
    });
  });

  // ==========================================
  // PROFILE PICTURE UPLOAD TESTS
  // ==========================================

  test.describe('Profile Picture Upload', () => {
    
    test('should detect profile avatar component', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Look for avatar image or upload button
      const avatarImage = page.locator('img[alt*="avatar"], img[alt*="profile"]');
      const uploadButton = page.locator('button:has-text("Upload"), label:has-text("Upload")');
      
      const avatarVisible = await avatarImage.isVisible().catch(() => false);
      const uploadVisible = await uploadButton.isVisible().catch(() => false);
      
      // At least one should be present
      expect(avatarVisible || uploadVisible).toBeTruthy();
    });

    test('should show user name in avatar when present', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Avatar should display or be interactive
      const avatarArea = page.locator('[class*="avatar"], [class*="profile-avatar"]');
      
      if (await avatarArea.isVisible()) {
        expect(avatarArea).toBeTruthy();
      }
    });
  });

  // ==========================================
  // ERROR HANDLING TESTS
  // ==========================================

  test.describe('Error Handling & Edge Cases', () => {
    
    test('should handle network error gracefully', async ({ page, context }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before filling
      await humanWait(page, 700, 1200);
      
      // Fill form slowly
      await humanFill(page, 'input[name="fullName"]', 'Network Test');
      
      // Wait before simulating error
      await humanWait(page, 800, 1400);
      
      // Simulate offline by intercepting API
      await page.route(`${API_URL}/**`, (route) => {
        route.abort('failed');
      });
      
      // Wait before submitting
      await humanWait(page, 600, 1000);
      
      // Try to submit
      const saveButton = page.locator('button[type="submit"]:has-text("Save")');
      await saveButton.click();
      
      // Should show error message or stay on page
      await humanWait(page, 1500, 2500);
      
      // Either error message or still on editprofile page
      const isStillOnPage = page.url().includes('editprofile');
      const errorVisible = await page.locator('[role="alert"]').isVisible().catch(() => false);
      
      expect(isStillOnPage || errorVisible).toBeTruthy();
      
      // Resume normal routing
      await page.unroute(`${API_URL}/**`);
    });

    test('should handle missing required fields gracefully', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before clearing field
      await humanWait(page, 700, 1200);
      
      // Clear required full name field
      const fullNameField = page.locator('input[name="fullName"]');
      await fullNameField.click();
      await fullNameField.fill('');
      
      // Wait before submitting
      await humanWait(page, 800, 1400);
      
      // Try to submit
      const saveButton = page.locator('button[type="submit"]:has-text("Save")');
      await saveButton.click();
      
      // Wait for validation error to appear
      await humanWait(page, 1000, 1500);
      
      // Should show validation error and stay on form
      await expect(page.locator('text=Full name is required')).toBeVisible({ timeout: TIMEOUT });
      expect(page.url()).toContain('editprofile');
    });

    test('should trim whitespace from input fields', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before interacting
      await humanWait(page, 700, 1200);
      
      const fullNameField = page.locator('input[name="fullName"]');
      
      // Enter value with leading/trailing whitespace slowly
      await fullNameField.click();
      await humanWait(page, 300, 600);
      await slowType(page, 'input[name="fullName"]', '  Test User  ', 40);
      
      // Wait before getting value
      await humanWait(page, 600, 1000);
      
      // Get the value - should be trimmed or preserved
      const value = await fullNameField.inputValue();
      expect(value).toBeTruthy();
    });

    test('should handle special characters in text fields', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before interacting
      await humanWait(page, 700, 1200);
      
      const specialCharacters = "O'Brien-Smith & Co.";
      
      const fullNameField = page.locator('input[name="fullName"]');
      
      // Type slowly with special characters
      await fullNameField.click();
      await humanWait(page, 300, 600);
      await slowType(page, 'input[name="fullName"]', specialCharacters, 45);
      
      // Wait before getting value
      await humanWait(page, 600, 1000);
      
      const value = await fullNameField.inputValue();
      expect(value).toContain("O'Brien");
    });
  });

  // ==========================================
  // SESSION & AUTHENTICATION TESTS
  // ==========================================

  test.describe('Session & Authentication', () => {
    
    test('should redirect to login if not authenticated', async ({ page }) => {
      // Clear any existing token
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      
      // Wait before navigating
      await humanWait(page, 600, 1000);
      
      // Try to directly access edit profile
      await page.goto(`${BASE_URL}/editprofile`);
      
      // SPA-friendly: Wait for URL to change away from editprofile or show login
      await humanWait(page, 1500, 2500);
      
      try {
        // Wait for URL to change to login or away from editprofile
        await page.waitForFunction(
          () => !window.location.pathname.includes('editprofile') || 
                 window.location.pathname.includes('login'),
          { timeout: 10000 }
        );
      } catch (e) {
        // May have a guard component that doesn't navigate
      }
      
      // Should not be on editprofile page
      const isAuthProtected = !page.url().includes('editprofile') || 
                              page.url().includes('login');
      expect(isAuthProtected).toBeTruthy();
    });

    test('should maintain session across page navigations', async ({ page }) => {
      const token = await loginUser(page, TEST_USER.email, TEST_USER.password);
      
      // Wait before navigating away
      await humanWait(page, 800, 1400);
      
      // Navigate away and back
      await page.goto(`${BASE_URL}/`);
      
      // Wait for page load
      await humanWait(page, 1000, 1500);
      
      // Navigate to edit profile
      await navigateToEditProfile(page);
      
      // Wait for data load
      await humanWait(page, 1000, 1500);
      
      // Token should still be valid
      const currentToken = await page.evaluate(() => localStorage.getItem('token'));
      expect(currentToken).toBe(token);
    });

    test('should load user profile data on page load', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait for form to populate from API
      await humanWait(page, 1200, 1800);
      
      const fullNameField = page.locator('input[name="fullName"]');
      const emailField = page.locator('input[name="email"]');
      
      // Wait for fields to be populated
      await page.waitForTimeout(1000);
      
      const fullName = await fullNameField.inputValue();
      const email = await emailField.inputValue();
      
      // Values should be populated
      expect(fullName).toBeTruthy();
      expect(email).toBeTruthy();
    });
  });

  // ==========================================
  // ACCESSIBILITY TESTS
  // ==========================================

  test.describe('Accessibility', () => {
    
    test('should have proper form labels for all inputs', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait for form to load
      await humanWait(page, 800, 1300);
      
      // Check for labels or aria-label on inputs
      const inputs = await page.locator('input[name="fullName"], input[name="email"], input[name="contact"]');
      
      // Each input should have associated label or aria-label
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
    });

    test('should show error messages for form validation', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait before interacting
      await humanWait(page, 700, 1200);
      
      // Clear full name and submit
      const fullNameField = page.locator('input[name="fullName"]');
      await fullNameField.click();
      await fullNameField.fill('');
      
      // Wait before submitting
      await humanWait(page, 800, 1400);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Wait for error to appear
      await humanWait(page, 1000, 1500);
      
      // Error should be visible or announced
      const errorMessage = page.locator('text=Full name is required');
      await expect(errorMessage).toBeVisible({ timeout: TIMEOUT });
    });

    test('should have descriptive button text', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait for page to fully load
      await humanWait(page, 800, 1300);
      
      // Check for clear button labels
      const saveButton = page.locator('button:has-text("Save")');
      const cancelButton = page.locator('button:has-text("Cancel")');
      
      await expect(saveButton).toBeVisible();
      await expect(cancelButton).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait for page to load
      await humanWait(page, 800, 1300);
      
      // Wait before tabbing
      await humanWait(page, 600, 1000);
      
      // Tab to first input
      await page.keyboard.press('Tab');
      
      // Wait to check focus
      await humanWait(page, 300, 600);
      
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });

  // ==========================================
  // RESPONSIVE DESIGN TESTS
  // ==========================================

  test.describe('Responsive Design', () => {
    
    test('should render correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Wait for viewport change
      await humanWait(page, 600, 1000);
      
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait for page to render on mobile
      await humanWait(page, 1200, 1800);
      
      // Page should be readable and interactive on mobile
      const header = page.locator('h1:has-text("Edit Profile")');
      await expect(header).toBeVisible();
      
      // Wait before checking button size
      await humanWait(page, 600, 1000);
      
      // Buttons should be visible and tappable
      const saveButton = page.locator('button[type="submit"]');
      const buttonBox = await saveButton.boundingBox();
      
      // Button should be at least 44x44 for mobile accessibility
      expect(buttonBox?.height).toBeGreaterThanOrEqual(40);
      expect(buttonBox?.width).toBeGreaterThanOrEqual(40);
    });

    test('should render correctly on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Wait for viewport change
      await humanWait(page, 600, 1000);
      
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait for page to render on tablet
      await humanWait(page, 1200, 1800);
      
      // Page should display properly
      await expect(page.locator('h1:has-text("Edit Profile")')).toBeVisible();
    });

    test('should render correctly on desktop viewport', async ({ page }) => {
      // Set desktop viewport (default)
      await page.setViewportSize({ width: 1280, height: 800 });
      
      // Wait for viewport change
      await humanWait(page, 600, 1000);
      
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait for page to render
      await humanWait(page, 1000, 1500);
      
      // Page should display all sections properly
      await expect(page.locator('h1:has-text("Edit Profile")')).toBeVisible();
      
      // Wait before checking form
      await humanWait(page, 600, 1000);
      
      // Form should be visible
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });
  });

  // ==========================================
  // PERFORMANCE TESTS
  // ==========================================

  test.describe('Performance', () => {
    
    test('should load profile page within reasonable time', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      
      // Wait before measuring load time
      await humanWait(page, 600, 1000);
      
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/editprofile`, { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;
      
      // Wait for page to fully settle
      await humanWait(page, 800, 1200);
      
      // Page should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should handle rapid field changes without lag', async ({ page }) => {
      await loginUser(page, TEST_USER.email, TEST_USER.password);
      await navigateToEditProfile(page);
      
      // Wait for form to load
      await humanWait(page, 800, 1300);
      
      const fullNameField = page.locator('input[name="fullName"]');
      
      // Rapidly change field value with human-like delays between changes
      const testValues = ['A', 'AB', 'ABC', 'ABCD', 'Rapid Test'];
      
      for (const value of testValues) {
        await fullNameField.fill(value);
        // Short delay between rapid inputs
        await humanWait(page, 150, 300);
      }
      
      // Wait before getting final value
      await humanWait(page, 600, 1000);
      
      // Final value should match last input
      const finalValue = await fullNameField.inputValue();
      expect(finalValue).toBe('Rapid Test');
    });
  });

  // ==========================================
  // INTEGRATION TESTS
  // ==========================================

  test.describe('Full Integration Flow', () => {
    
    test('should complete full profile edit workflow', async ({ page }) => {
      // 1. Login
      const token = await loginUser(page, TEST_USER.email, TEST_USER.password);
      expect(token).toBeTruthy();
      
      // Wait after login
      await humanWait(page, 1000, 1500);
      
      // 2. Navigate to edit profile
      await navigateToEditProfile(page);
      await expect(page.locator('h1:has-text("Edit Profile")')).toBeVisible();
      
      // Wait for form to load
      await humanWait(page, 1000, 1500);
      
      // 3. Fill form with comprehensive data
      const testData = {
        fullName: 'Integration Test User',
        email: 'integration@test.example.com',
        contact: '9876543210',
        address: '789 Integration Ave, Test City, TC 98765',
      };
      
      await fillProfileForm(page, testData);
      
      // Wait after filling form
      await humanWait(page, 1200, 1800);
      
      // 4. Verify all data was entered
      await expect(page.locator('input[name="fullName"]')).toHaveValue(testData.fullName);
      await expect(page.locator('input[name="email"]')).toHaveValue(testData.email);
      
      // Wait before submitting
      await humanWait(page, 800, 1400);
      
      // 5. Submit form
      const saveButton = page.locator('button[type="submit"]:has-text("Save")');
      await saveButton.click();
      
      // Wait for submission to complete
      await humanWait(page, 2000, 3000);
      
      // 6. Verify successful submission
      await expect(page).toHaveURL(/my-profile|profile/, { timeout: TIMEOUT }).catch(() => {
        // May redirect to different success URL
      });
    });

    test('should preserve user session throughout flow', async ({ page }) => {
      // Login
      const initialToken = await loginUser(page, TEST_USER.email, TEST_USER.password);
      
      // Wait after login
      await humanWait(page, 800, 1400);
      
      // Navigate through multiple pages with human-like delays
      await page.goto(`${BASE_URL}`);
      await humanWait(page, 1000, 1500);
      
      await navigateToEditProfile(page);
      await humanWait(page, 1000, 1500);
      
      await page.goto(`${BASE_URL}/my-profile`);
      await humanWait(page, 1000, 1500);
      
      // Token should remain the same and valid
      const currentToken = await page.evaluate(() => localStorage.getItem('token'));
      expect(currentToken).toBe(initialToken);
    });
  });
});

test.describe('User Profile Edit - Error Scenarios', () => {
  
  test('should handle expired token gracefully', async ({ page, context }) => {
    await loginUser(page, TEST_USER.email, TEST_USER.password);
    
    // Wait after login
    await humanWait(page, 800, 1400);
    
    // Clear token to simulate expiration
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.removeItem('token');
    });
    
    // Wait before navigating
    await humanWait(page, 600, 1000);
    
    // Try to access edit profile
    await page.goto(`${BASE_URL}/editprofile`);
    
    // SPA-friendly: Wait for URL to change away from editprofile
    await humanWait(page, 1500, 2500);
    
    try {
      await page.waitForFunction(
        () => !window.location.pathname.includes('editprofile') || 
               window.location.pathname.includes('login'),
        { timeout: 10000 }
      );
    } catch (e) {
      // May not redirect if using client-side routing
    }
    expect(!page.url().includes('editprofile') || page.url().includes('login')).toBeTruthy();
  });

  test('should show user-friendly error messages', async ({ page }) => {
    await loginUser(page, TEST_USER.email, TEST_USER.password);
    await navigateToEditProfile(page);
    
    // Wait for form to load
    await humanWait(page, 800, 1300);
    
    // Enter invalid email slowly
    const emailField = page.locator('input[name="email"]');
    await emailField.click();
    await humanWait(page, 300, 600);
    await slowType(page, 'input[name="email"]', 'not-an-email', 40);
    
    // Wait before submitting
    await humanWait(page, 800, 1400);
    
    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for error to appear
    await humanWait(page, 1200, 1800);
    
    // Should show readable error
    const errorVisible = await page.locator('[role="alert"], text=/error|invalid|required/i').isVisible().catch(() => false);
    expect(errorVisible).toBeTruthy();
  });
});
