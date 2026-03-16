import { test as teardown } from '@playwright/test';
import { unlinkSync, existsSync } from 'fs';

const authFile = 'playwright/.auth/user.json';

teardown('cleanup auth state', () => {
  /**
   * Optional teardown: removes stale credentials after full test run.
   * This ensures that stale tokens don't cause authentication issues
   * in the next test run. The next run will always perform fresh login.
   */
  if (existsSync(authFile)) {
    try {
      unlinkSync(authFile);
      console.log('✅ TEARDOWN: Auth state cleaned up for next run\n');
    } catch (error) {
      console.warn(`⚠️  TEARDOWN: Could not delete auth file: ${(error as Error).message}\n`);
    }
  } else {
    console.log('ℹ️  TEARDOWN: No auth file to clean\n');
  }
});
