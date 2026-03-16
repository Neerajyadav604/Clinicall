#!/usr/bin/env node

console.log('\n🔍 [TEST] Console logging test started');
process.stdout.write('✅ [TEST] process.stdout test\n');
console.error('⚠️  [TEST] process.stderr test');

setTimeout(() => {
  console.log('✅ [TEST] Logged after 500ms delay');
  process.exit(0);
}, 500);
