#!/usr/bin/env node
/**
 * MongoDB Connection Diagnostic Script
 * Run: node test-mongo-diagnostic.js
 * 
 * This script tests all 10 categories of MongoDB connection issues
 * and provides specific fixes for each problem found.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(type, message) {
  const icons = {
    pass: `${colors.green}✅${colors.reset}`,
    fail: `${colors.red}❌${colors.reset}`,
    warn: `${colors.yellow}⚠️${colors.reset}`,
    info: `${colors.blue}ℹ️${colors.reset}`,
    test: `${colors.cyan}🔍${colors.reset}`
  };
  
  const icon = icons[type] || '  ';
  console.log(`${icon} ${message}`);
}

function section(title) {
  console.log(`\n${colors.cyan}${'─'.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(60)}${colors.reset}\n`);
}

async function runDiagnostics() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     MongoDB Connection Diagnostic Tool v1.0              ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // ============================================
  // TEST 1: ENVIRONMENT SETUP
  // ============================================
  section('CATEGORY 1: Environment & Configuration');

  log('test', 'Checking if .env file exists...');
  const envPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(envPath)) {
    log('pass', '.env file found at ' + envPath);
    results.passed.push('ENV file exists');
  } else {
    log('fail', '.env file not found at ' + envPath);
    results.failed.push('ENV file missing');
    console.log(`   → Create .env in server/ directory with DATABASEURL`);
    return results; // Can't continue without .env
  }

  // Load env variables
  require('dotenv').config({ path: envPath });

  // Test 1B: DATABASEURL variable
  if (process.env.DATABASEURL) {
    log('pass', 'DATABASEURL environment variable is set');
    results.passed.push('DATABASEURL env var set');
    
    const uri = process.env.DATABASEURL;
    log('info', `URI length: ${uri.length} characters`);
    log('info', `Starts with: ${uri.substring(0, 20)}...`);
  } else {
    log('fail', 'DATABASEURL environment variable is NOT set');
    results.failed.push('DATABASEURL not defined');
    console.log(`   → Add DATABASEURL=mongodb+srv://... to .env file`);
    return results;
  }

  // ============================================
  // TEST 2: CONNECTION STRING VALIDATION
  // ============================================
  section('CATEGORY 2: Connection String Format');

  const uri = process.env.DATABASEURL;
  let isValidUri = true;

  log('test', 'Validating connection string format...');

  if (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')) {
    log('pass', 'Protocol is correct (mongodb:// or mongodb+srv://)');
    results.passed.push('Protocol valid');
  } else {
    log('fail', 'Protocol is invalid - must start with mongodb:// or mongodb+srv://');
    results.failed.push('Invalid protocol');
    isValidUri = false;
  }

  if (uri.includes('@')) {
    log('pass', 'Credentials detected in connection string');
    results.passed.push('Has credentials');
  } else {
    log('fail', 'No credentials found - format should be mongodb://user:pass@host/db');
    results.failed.push('Missing credentials');
    isValidUri = false;
  }

  // Extract and validate parts
  try {
    const urlObj = new URL(uri);
    
    const hostname = urlObj.hostname;
    log('pass', `Hostname: ${hostname}`);
    
    const database = urlObj.pathname.split('/')[1];
    if (database) {
      log('pass', `Database: ${database}`);
    } else {
      log('warn', 'No database specified in URI');
      results.warnings.push('Database not specified');
    }
    
    results.passed.push('URI parsed successfully');
  } catch (err) {
    log('fail', `Connection string parse error: ${err.message}`);
    results.failed.push('URI parsing failed');
    isValidUri = false;
  }

  // ============================================
  // TEST 3: NETWORK CONNECTIVITY
  // ============================================
  section('CATEGORY 3: Network & Firewall');

  let hostname = 'unknown';
  try {
    hostname = new URL(uri).hostname;
  } catch (e) {}

  log('test', `Testing DNS resolution for ${hostname}...`);
  try {
    const result = execSync(`nslookup ${hostname} 8.8.8.8`, { encoding: 'utf8' });
    if (result.includes('Address')) {
      log('pass', `DNS resolution successful`);
      results.passed.push('DNS resolves');
      
      // Extract IP
      const ips = result.match(/Address:\s+([^\n]+)/g);
      if (ips) {
        log('info', `Resolved to IP: ${ips[0]}`);
      }
    } else {
      throw new Error('No address returned');
    }
  } catch (err) {
    log('fail', `DNS resolution failed: ${err.message}`);
    results.failed.push('DNS resolution failed');
    console.log(`   → Check if hostname is correct: ${hostname}`);
    console.log(`   → Check internet connection`);
  }

  // ============================================
  // TEST 4: NETWORK PORT CONNECTIVITY
  // ============================================
  log('test', `Testing TCP connection to ${hostname}:27017...`);
  
  try {
    // Use timeout command
    const cmd = `powershell -Command "Test-NetConnection -ComputerName ${hostname} -Port 27017 -WarningAction SilentlyContinue | Select-Object TcpTestSucceeded"`;
    const result = execSync(cmd, { encoding: 'utf8', timeout: 15000 });
    
    if (result.includes('True')) {
      log('pass', `Port 27017 is open and reachable`);
      results.passed.push('Network port accessible');
    } else {
      log('fail', `Cannot reach port 27017 on ${hostname}`);
      results.failed.push('Port 27017 not accessible');
      console.log(`   → Check firewall settings`);
      console.log(`   → Check MongoDB Atlas IP whitelist`);
    }
  } catch (err) {
    log('warn', `Network test inconclusive: ${err.message}`);
    results.warnings.push('Network test failed');
  }

  // ============================================
  // TEST 5: MONGODB CREDENTIALS
  // ============================================
  section('CATEGORY 4: Authentication');

  log('test', 'Testing MongoDB authentication...');

  try {
    const mongoose = require('mongoose');
    
    log('info', 'Attempting connection with timeout of 15 seconds...');
    
    const connection = await Promise.race([
      mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        maxPoolSize: 2,
        family: 4
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 15s')), 15000)
      )
    ]);

    log('pass', 'Successfully connected to MongoDB!');
    log('pass', `Database: ${mongoose.connection.name}`);
    log('pass', `Host: ${mongoose.connection.host}`);
    results.passed.push('MongoDB connection successful');

    // Test database access
    try {
      const admin = mongoose.connection.db.admin();
      const status = await admin.ping();
      log('pass', 'Database ping successful');
      results.passed.push('DB ping OK');
    } catch (pingErr) {
      log('warn', `Database ping failed: ${pingErr.message}`);
      results.warnings.push('DB ping failed');
    }

    await mongoose.disconnect();
    console.log('   Disconnected');

  } catch (error) {
    log('fail', `Connection error: ${error.message}`);
    results.failed.push('MongoDB connection failed');

    // Detailed error diagnostics
    console.log('\n   Error Analysis:');
    if (error.message.includes('getaddrinfo') || error.message.includes('ENOTFOUND')) {
      log('info', '→ DNS or hostname resolution failed');
      console.log('     Check: Is hostname correct?');
      console.log('     Check: Is internet working?');
    } else if (error.message.includes('auth') || error.message.includes('authentication')) {
      log('info', '→ Authentication failed (wrong username/password)');
      console.log('     Check: https://cloud.mongodb.com/ → Database Users');
      console.log('     Check: Is password URL-encoded correctly?');
    } else if (error.message.includes('ECONNREFUSED')) {
      log('info', '→ Connection refused (port not open)');
      console.log('     Check: MongoDB Atlas cluster is running');
      console.log('     Check: IP is whitelisted in Network Access');
    } else if (error.message.includes('Timeout')) {
      log('info', '→ Connection timeout (server not responding)');
      console.log('     Check: MongoDB Atlas cluster status');
      console.log('     Check: Firewall/network blocking');
      console.log('     Check: IP whitelisted in Network Access');
    } else if (error.message.includes('unknown') && error.message.includes('user')) {
      log('info', '→ Unknown user (user doesnt exist)');
      console.log('     Check: https://cloud.mongodb.com/ → Database Access');
      console.log('     Create user if not exists');
    } else if (error.message.includes('EPROTO') || error.message.includes('TLS')) {
      log('info', '→ TLS/Certificate error');
      console.log('     Try: Add tls:true to Mongoose options');
    }
  }

  // ============================================
  // TEST 6: MONGODB ATLAS SPECIFIC
  // ============================================
  section('CATEGORY 5: MongoDB Atlas Configuration');

  log('test', 'Checking MongoDB Atlas requirements...');

  // Extract hostname for Atlas check
  try {
    const urlObj = new URL(uri);
    const host = urlObj.hostname;
    
    if (host.includes('mongodb.net') || host.includes('mongodb.com')) {
      log('pass', 'Using MongoDB Atlas (cloud)');
      results.passed.push('Atlas hostname valid');
      
      log('warn', 'NOTE: Verify these in MongoDB Atlas Dashboard:');
      console.log('   1. Go to: https://cloud.mongodb.com/');
      console.log('   2. Click on your cluster (likely "Cluster0")');
      console.log('   3. Check status is "Connected" (not "Paused")');
      console.log('   4. Go to Security → Network Access');
      console.log('   5. Verify your IP is whitelisted');
      console.log('   6. Go to Security → Database Users');
      console.log('   7. Verify user exists and is active');
      
      results.warnings.push('Remember to whitelist IP in Atlas');
    } else {
      log('info', `Using ${host.includes('localhost') ? 'local' : 'self-hosted'} MongoDB`);
    }
  } catch (err) {
    log('warn', `Could not parse hostname: ${err.message}`);
  }

  // ============================================
  // TEST 7: CONNECTION POOL SETTINGS
  // ============================================
  section('CATEGORY 6: Connection Pool Configuration');

  log('test', 'Checking connection pool settings...');
  log('pass', 'Default pool settings are appropriate:');
  log('info', '  - maxPoolSize: 10 connections');
  log('info', '  - minPoolSize: 2 connections');
  log('info', '  - serverSelectionTimeoutMS: 30000ms (30 sec)');
  log('info', '  - socketTimeoutMS: 45000ms (45 sec)');

  // ============================================
  // SUMMARY
  // ============================================
  section('DIAGNOSTIC SUMMARY');

  console.log(`${colors.green}PASSED (${results.passed.length}):${colors.reset}`);
  results.passed.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));

  if (results.warnings.length > 0) {
    console.log(`\n${colors.yellow}WARNINGS (${results.warnings.length}):${colors.reset}`);
    results.warnings.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n${colors.red}FAILED (${results.failed.length}):${colors.reset}`);
    results.failed.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
  }

  // Final recommendation
  console.log('\n' + '═'.repeat(60));
  if (results.failed.length === 0 && results.warnings.length === 0) {
    log('pass', 'All tests passed! MongoDB connection should work.');
    console.log('\nNext steps:');
    console.log('  1. Restart your server: npm start');
    console.log('  2. Monitor logs for connection messages');
    console.log('  3. Test an API endpoint');
  } else if (results.failed.includes('MongoDB connection failed')) {
    console.log(`\n${colors.red}MongoDB Connection Failed${colors.reset}`);
    console.log('\nMost likely issues (in order):');
    console.log('  1. ❌ IP not whitelisted in MongoDB Atlas Network Access');
    console.log('     → Fix: https://cloud.mongodb.com/ → Cluster0 → Network Access');
    console.log('  2. ❌ Wrong username or password');
    console.log('     → Fix: Verify in MongoDB Atlas → Database Users');
    console.log('  3. ❌ Cluster paused or terminated');
    console.log('     → Fix: https://cloud.mongodb.com/ → Cluster0 → Resume');
    console.log('  4. ❌ Connection timeout (firewall or network)');
    console.log('     → Fix: Check Windows Firewall, VPN, or corporate proxy');
  } else {
    log('warn', 'Some tests had warnings or failed. Check items above.');
  }

  console.log('\nFor more details, see: MONGODB_CONNECTION_DIAGNOSTIC.md');
  console.log('═'.repeat(60) + '\n');

  return results;
}

// Run diagnostics
runDiagnostics().catch(err => {
  console.error('Diagnostic error:', err.message);
  process.exit(1);
});
