#!/usr/bin/env node

/**
 * Test script for FHIR Condition creation
 * 
 * Usage:
 *   node test-condition-fix.js <patient-id> <doctor-token>
 * 
 * Example:
 *   node test-condition-fix.js 507f1f77bcf86cd799439011 "eyJhbGcio..."
 */

const http = require('http');
const https = require('https');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Usage: node test-condition-fix.js <patient-id> <doctor-token>');
  console.error('');
  console.error('Example:');
  console.error('  node test-condition-fix.js 507f1f77bcf86cd799439011 "eyJhbGc..."');
  process.exit(1);
}

const patientId = args[0];
const token = args[1];
const baseUrl = process.env.BASE_URL || 'http://localhost:4000';

console.log('\n🧪 FHIR Condition Creation Test');
console.log('   Patient ID:', patientId);
console.log('   Token:', token.substring(0, 20) + '...');
console.log('   Base URL:', baseUrl);
console.log('');

const payload = {
  user_ref: `Patient/${patientId}`,
  code: 'J45.9',
  display: 'Asthma Unspecified',
  severity: 'moderate',
  clinicalStatus: 'active',
  verificationStatus: 'confirmed',
  notes: 'Test condition - asthma diagnosis'
};

console.log('📨 Sending POST /fhir/R4/Condition');
console.log('   Payload:', JSON.stringify(payload, null, 2));
console.log('');

const url = new URL('/fhir/R4/Condition', baseUrl);
const protocol = url.protocol === 'https:' ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': Buffer.byteLength(JSON.stringify(payload))
  }
};

const req = protocol.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`✅ Response Status: ${res.statusCode} ${res.statusText}`);
    console.log('   Headers:', JSON.stringify(res.headers, null, 2));
    console.log('');

    try {
      const jsonData = JSON.parse(data);
      console.log('📦 Response Body:', JSON.stringify(jsonData, null, 2));
      
      if (res.statusCode === 201) {
        console.log('\n✅ SUCCESS! Condition created with ID:', jsonData.id);
      } else if (res.statusCode === 422) {
        console.log('\n⚠️  VALIDATION ERROR:');
        if (jsonData.issue && Array.isArray(jsonData.issue)) {
          jsonData.issue.forEach(issue => {
            console.log('   -', issue.details?.text || issue.code);
          });
        }
      } else if (res.statusCode === 500) {
        console.log('\n❌ SERVER ERROR (500):');
        console.log('   This indicates the fix may not have been applied properly');
      }
    } catch (e) {
      console.log('📄 Response (raw):', data);
      console.log('\n❌ Could not parse response as JSON - check server logs');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
  console.error('   Make sure the server is running on', baseUrl);
});

req.write(JSON.stringify(payload));
req.end();
