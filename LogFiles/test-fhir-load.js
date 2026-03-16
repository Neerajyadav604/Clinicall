// Load environment variables first
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
  override: false
});

console.log('✅ Environment loaded');
console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
console.log('REFRESH_TOKEN_SECRET set:', !!process.env.REFRESH_TOKEN_SECRET);

console.log('Testing FHIR module load with timeout...');

let loaded = false;
const startTime = Date.now();

const timeout = setTimeout(() => {
  if (!loaded) {
    console.error('❌ FHIR module load timed out after 5 seconds!');
    console.error('This module is hanging on require, likely due to circular dependencies or blocking operations');
    process.exit(1);
  }
}, 5000);

console.log('Starting require at:', new Date().toISOString());

try {
  const fhir = require('./routes/fhir');
  loaded = true;
  clearTimeout(timeout);
  const elapsed = Date.now() - startTime;
  console.log(`✅ FHIR module loaded successfully in ${elapsed}ms`);
  console.log('Module type:', typeof fhir);
} catch (err) {
  clearTimeout(timeout);
  console.error('❌ Error loading FHIR module:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
}
