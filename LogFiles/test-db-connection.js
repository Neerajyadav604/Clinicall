#!/usr/bin/env node
/**
 * Database Connection Diagnostic Tool
 * Tests MongoDB connection without starting the full server
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({
  path: path.join(__dirname, '.env'),
  override: false
});

const DATABASEURL = process.env.DATABASEURL;

if (!DATABASEURL) {
  console.error('❌ ERROR: DATABASEURL not found in .env file');
  process.exit(1);
}

console.log('🔍 MongoDB Connection Diagnostic Tool');
console.log('=====================================\n');

console.log('📋 Connection Details:');
// Hide password in logs
const maskedUrl = DATABASEURL.replace(/:[^:]*@/, ':***@');
console.log(`   URL: ${maskedUrl}\n`);

console.log('🔄 Attempting connection...');
const startTime = Date.now();

mongoose.connect(DATABASEURL, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  retryReads: true,
  family: 4  // IPv4 only (helps with DNS resolution)
})
.then(() => {
  const duration = Date.now() - startTime;
  console.log(`\n✅ SUCCESS: Connected to MongoDB in ${duration}ms`);
  
  // Get database info
  const db = mongoose.connection;
  console.log(`\n📊 Database Information:`);
  console.log(`   Database: ${db.name}`);
  console.log(`   Host: ${db.host}:${db.port}`);
  
  // Try to ping the server
  db.db.admin().ping()
    .then(() => {
      console.log(`   Status: ✅ Healthy\n`);
      console.log('✨ Database connection is working properly!');
      process.exit(0);
    })
    .catch(err => {
      console.log(`   Status: ❌ Ping failed\n`);
      console.log('Error:', err.message);
      process.exit(1);
    });
})
.catch(err => {
  const duration = Date.now() - startTime;
  console.log(`\n❌ FAILED after ${duration}ms\n`);
  
  console.log('Error Details:');
  console.log(`   Type: ${err.name}`);
  console.log(`   Message: ${err.message}\n`);
  
  if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
    console.log('⚠️  DNS Resolution Issue:');
    console.log('   - MongoDB host cannot be resolved');
    console.log('   - Check internet connection');
    console.log('   - Verify cluster URL is correct\n');
  } else if (err.message.includes('ECONNREFUSED')) {
    console.log('⚠️  Connection Refused:');
    console.log('   - MongoDB server is not accessible');
    console.log('   - Check if MongoDB service is running');
    console.log('   - Verify firewall/network settings\n');
  } else if (err.message.includes('ETIMEDOUT') || err.message.includes('timeout')) {
    console.log('⚠️  Connection Timeout:');
    console.log('   - Server took too long to respond');
    console.log('   - Check network latency');
    console.log('   - MongoDB Atlas may be overloaded');
    console.log('   - Check IP whitelist in MongoDB Atlas\n');
  } else if (err.message.includes('authentication failed')) {
    console.log('⚠️  Authentication Error:');
    console.log('   - Invalid username or password');
    console.log('   - Verify credentials in .env file\n');
  }
  
  console.log('🔧 Troubleshooting Steps:');
  console.log('   1. Check MongoDB Atlas Network Access settings');
  console.log('   2. Verify IP address is whitelisted (0.0.0.0/0 for development)');
  console.log('   3. Test credentials with MongoDB Compass');
  console.log('   4. Check internet connectivity');
  console.log('   5. Verify .env file DATABASEURL is correct\n');
  
  process.exit(1);
});

// Handle timeout
setTimeout(() => {
  console.log('\n⏱️  Connection attempt exceeded 35 seconds');
  console.log('   Likely a network or DNS resolution issue');
  process.exit(1);
}, 35000);
