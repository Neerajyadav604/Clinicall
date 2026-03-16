# MongoDB Connection Diagnostic Guide
**For: Clinicall Backend (Node.js + Mongoose + MongoDB Atlas)**  
**Environment: Windows 10/11, Node v23.6.1, MongoDB Atlas**  
**Date: March 14, 2026**

---

## Quick Status Check

Your **current setup**:
- ✅ Connection string is present: `mongodb+srv://...` (MongoDB Atlas)
- ✅ Server starts but Database connection is **NOT completing** (logs show "Attempting DB connection..." but no error logged)
- ✅ FHIR route registration waits for DB and times out
- ⚠️ **Issue**: Silent failure - connection hangs without clear error message

---

## DIAGNOSTIC CHECKLIST - All 10 Categories

---

### 1️⃣ CONNECTION STRING ISSUES

#### What can go wrong:
- Malformed URI syntax
- Wrong protocol (`mongodb://` vs `mongodb+srv://`)
- Missing credentials
- Special characters in password not properly URL-encoded
- Wrong database name
- Invalid character in hostname

#### How to detect/verify:

**Check 1A: Connection String Format**
```bash
# In your .env file, the DATABASEURL should be:
# mongodb+srv://username:password@hostname/database?options

# Your current connection string:
DATABASEURL=mongodb+srv://dheeraj0987bhari:%40%21e%2F%25x8FK9%263%2DUn@cluster0.q9qfkhp.mongodb.net/ClinicallDatabase?appName=Cluster0
```

**Verify it's correctly formatted:**
- ✅ Protocol: `mongodb+srv://` ✓
- ✅ Username: `dheeraj0987bhari` ✓
- ✅ Password: `%40%21e%2F%25x8FK9%263%2DUn` (URL-encoded) ✓
- ✅ Host: `cluster0.q9qfkhp.mongodb.net` ✓
- ✅ Database: `ClinicallDatabase` ✓

**Check 1B: URL-Encode Password Correctly**
```bash
# Your password was: @!e/% x8FK9&3-Un
# Should be: %40%21e%2F%25x8FK9%263%2DUn

# Test encoding with Node:
node -e "console.log(encodeURIComponent('@!e/%x8FK9&3-Un'))"
# Output should match what's in your .env

# OR use online tool: https://www.urlencoder.org/
```

**Check 1C: Verify Connection String in Code**
```bash
# Add this diagnostic to your server startup:
node -e "
const uri = process.env.DATABASEURL;
if (!uri) {
  console.error('❌ DATABASEURL not defined');
} else {
  console.log('✅ URI loaded:', uri.substring(0, 30) + '...');
  const urlObj = new URL(uri);
  console.log('   Protocol:', urlObj.protocol);
  console.log('   Hostname:', urlObj.hostname);
  console.log('   Database:', urlObj.pathname.split('/')[1]);
}
"
```

#### How to fix:

**If password isn't URL-encoded:**
```bash
# Run in Node REPL to encode your password
node
> encodeURIComponent('your_plain_password_here')
# Copy the result and replace in .env
```

**Update your .env (if needed):**
```env
# Format: mongodb+srv://username:encoded_password@cluster.mongodb.net/dbname?options
DATABASEURL=mongodb+srv://dheeraj0987bhari:ENCODED_PASSWORD_HERE@cluster0.q9qfkhp.mongodb.net/ClinicallDatabase?authSource=admin&retryWrites=true&w=majority
```

**Add validation to Database.js:**
```javascript
const connectDb = async () => {
  try {
    // VALIDATE EARLY
    if (!process.env.DATABASEURL) {
      throw new Error("DATABASEURL environment variable is not set");
    }

    // Check for common mistakes
    const uri = process.env.DATABASEURL;
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error("DATABASEURL must start with mongodb:// or mongodb+srv://");
    }
    
    if (!uri.includes('@')) {
      throw new Error("DATABASEURL missing credentials (user:pass)");
    }

    if (!uri.includes('mongodb.net') && !uri.includes('localhost')) {
      console.warn("⚠️  [DB] Warning: hostname looks invalid");
    }

    console.log("✅ [DB] Connection string validation passed");
    // ... rest of connection code
  } catch (error) {
    console.error("❌ [DB] Validation Error:", error.message);
    throw error;
  }
};
```

---

### 2️⃣ NETWORK & FIREWALL ISSUES

#### What can go wrong:
- Port 27017 blocked by Windows Defender/3rd party firewall
- MongoDB Atlas IP not whitelisted (must whitelist your server's IP)
- Local network firewall blocking outbound to MongoDB.net
- ISP blocking port 27017
- Server's ISP or corporate proxy blocking connections
- Container/VPC subnet can't reach MongoDB

#### How to detect/verify:

**Check 2A: Can you reach MongoDB Atlas server?**
```bash
# Test DNS resolution
nslookup cluster0.q9qfkhp.mongodb.net

# Should return 3-4 IP addresses like:
# Server:  8.8.8.8
# cluster0.q9qfkhp.mongodb.net      canonical name = ...
# Address: 3.xxx.xxx.xxx
```

**Check 2B: Can you connect to port 27017?**
```bash
# Method 1: Using PowerShell Test-Connection (fastest)
Test-NetConnection cluster0.q9qfkhp.mongodb.net -Port 27017

# Should show:
# TcpTestSucceeded : True

# Method 2: Using Telnet (if available)
# First enable Telnet on Windows: 
#   Admin PowerShell: dism /online /Enable-Feature /FeatureName:TelnetClient
# Then test:
telnet cluster0.q9qfkhp.mongodb.net 27017
```

**Check 2C: Windows Firewall Blocking?**
```bash
# Check if Node.js is blocked
Get-NetFirewallRule -DisplayName "*node*" | Format-Table DisplayName, Enabled, Direction

# Check current firewall rules on port 27017
Get-NetFirewallRule -LocalPort 27017 -Direction Outbound -ErrorAction SilentlyContinue

# Check if outbound HTTPS is allowed (MongoDB uses secure connections)
Get-NetFirewallRule -Direction Outbound -Action Allow | Where-Object {$_.DisplayName -like "*https*"}
```

**Check 2D: Test from Node directly**
```javascript
// Create test-db-connection.js
const net = require('net');

const client = new net.Socket();
const host = 'cluster0.q9qfkhp.mongodb.net';
const port = 27017;

console.log(`🔍 Testing connection to ${host}:${port}...`);

client.connect(port, host, () => {
  console.log('✅ TCP connection successful! Network is OK.');
  client.destroy();
});

client.on('error', (err) => {
  console.error('❌ Network error:', err.code);
  console.error('   Message:', err.message);
  
  // Diagnostics based on error code
  switch(err.code) {
    case 'ECONNREFUSED':
      console.error('   → Port 27017 not open or service not listening');
      break;
    case 'ETIMEDOUT':
      console.error('   → Connection timeout - firewall or network blocked');
      break;
    case 'EHOSTUNREACH':
      console.error('   → Host unreachable - network/routing issue');
      break;
    case 'ENOTFOUND':
      console.error('   → DNS resolution failed');
      break;
  }
});

setTimeout(() => {
  console.error('⏱️  Timeout after 10s');
  client.destroy();
  process.exit(1);
}, 10000);
```

Run it:
```bash
cd server
node test-db-connection.js
```

#### How to fix:

**Fix 2A: Add Node to Windows Firewall**
```bash
# As Administrator in PowerShell:
netsh advfirewall firewall add rule name="Node.js Outbound" dir=out action=allow program="C:\Program Files\nodejs\node.exe" enable=yes

# Or manually:
# Settings → Privacy & Security → Windows Defender Firewall → Allow an app through firewall
# Add node.exe for both Private and Public networks
```

**Fix 2B: Whitelist Your IP in MongoDB Atlas**
```
1. Go to https://cloud.mongodb.com/
2. Log in with: dheeraj0987bhari@gmail.com
3. Navigate to: Cluster0 → Network Access (or Security → Network Access)
4. Click "Add IP Address"
5. Either:
   a) Click "Add Current IP" (if connecting from this machine)
   b) Enter 0.0.0.0/0 (allow all IPs - ⚠️ only for development!)
6. Click "Confirm"
7. Wait 2-3 minutes for whitelist to propagate
```

**If connecting from Docker/EC2/different machine:**
```javascript
// Add this to detect your public IP
const https = require('https');

https.get('https://api.ipify.org?format=json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Your public IP:', JSON.parse(data).ip);
    console.log('Add this to MongoDB Atlas Network Access list');
  });
}).on('error', console.error);
```

**Fix 2C: Check MongoDB Atlas Cluster Status**
```
1. Go to https://cloud.mongodb.com/
2. Navigate to Clusters → Cluster0
3. Verify cluster status is "Connected" (not "Paused" or "Provisioning")
4. Check if cluster has been deleted or freed up
```

---

### 3️⃣ AUTHENTICATION ISSUES

#### What can go wrong:
- Wrong username or password
- User doesn't exist in correct auth database
- Password contains special characters not properly escaped
- authSource parameter missing or wrong
- User doesn't have role/permissions for the database
- SCRAM authentication failed
- User created in wrong database

#### How to detect/verify:

**Check 3A: Verify Credentials**
```bash
# Your connection string shows:
# Username: dheeraj0987bhari
# Password (encoded): %40%21e%2F%25x8FK9%263%2DUn

# Decode to verify:
node -e "console.log(decodeURIComponent('%40%21e%2F%25x8FK9%263%2DUn'))"
# Output: @!e/%x8FK9&3-Un

# Check if this matches what you used when creating the user in MongoDB Atlas
```

**Check 3B: List available users in MongoDB Atlas**
```
1. Go to https://cloud.mongodb.com/
2. Click on Cluster0
3. Go to "Database Access" or "Security" → "Database Users"
4. Look for user "dheeraj0987bhari"
5. Verify they have role "readWriteAnyDatabase" or specific database roles
6. Check if user is "Active"
```

**Check 3C: Verify authSource (default or admin)**
```bash
# Add authSource to connection string if needed:
# mongodb+srv://user:pass@host/database?authSource=admin

# For MongoDB Atlas, users are created in "admin" database by default
# So add: ?authSource=admin
```

**Check 3D: Test with Mongoose directly**
```javascript
// Create test-auth.js
const mongoose = require('mongoose');

const testUri = 'mongodb+srv://dheeraj0987bhari:%40%21e%2F%25x8FK9%263%2DUn@cluster0.q9qfkhp.mongodb.net/ClinicallDatabase?authSource=admin';

mongoose.connect(testUri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 5000,
})
.then(() => {
  console.log('✅ Authentication successful!');
  console.log('Connected to:', mongoose.connection.name);
  process.exit(0);
})
.catch(err => {
  console.error('❌ Authentication failed!');
  console.error('Error:', err.message);
  
  // Check error type
  if (err.message.includes('auth failed') || err.message.includes('authentication failed')) {
    console.error('→ Check username/password');
  } else if (err.message.includes('unknown user')) {
    console.error('→ User does not exist');
  } else if (err.message.includes('invalid namespace')) {
    console.error('→ Check database name');
  }
  
  process.exit(1);
});
```

Run it:
```bash
node test-auth.js
```

#### How to fix:

**Fix 3A: Reset Password in MongoDB Atlas**
```
1. Go to https://cloud.mongodb.com/
2. Cluster0 → Database Access
3. Find user "dheeraj0987bhari"
4. Click the ⋮ (three dots) menu → Edit Password
5. Generate a new secure password (copy it)
6. URL-encode the new password
7. Update your .env DATABASEURL
```

**Fix 3B: Create New User with Proper Permissions**
```
1. Go to https://cloud.mongodb.com/
2. Cluster0 → Database Access → Add New Database User
3. Username: dheeraj0987bhari
4. Password: Generate strong password
5. Auth Method: SCRAM (default)
6. Database User Privileges:
   - Select "Specific Privileges"
   - Collection: ClinicallDatabase.*
   - Roles: readWrite
7. Click "Add User"
```

**Fix 3C: Update Database.js with authSource**
```javascript
const connectDb = async () => {
  try {
    if (!process.env.DATABASEURL) {
      throw new Error("DATABASEURL environment variable is not set");
    }

    console.log("🔄 [DB] Starting MongoDB connection...");
    
    // Ensure authSource is present for Atlas
    let uri = process.env.DATABASEURL;
    if (!uri.includes('authSource')) {
      uri += '&authSource=admin';
      console.log("ℹ️  [DB] Added authSource=admin to connection string");
    }
    
    const startTime = Date.now();
    
    await Promise.race([
      mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        retryReads: true,
        family: 4
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout (45s)')), 45000)
      )
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [DB] Connected Successfully (${duration}ms)`);
    
  } catch (error) {
    console.error("❌ [DB] Connection failed:");
    console.error("   Type:", error.name);
    console.error("   Message:", error.message);
    
    // Add auth-specific diagnostics
    if (error.message.includes('auth')) {
      console.error("   Action: Check username/password in .env");
      console.error("   Go to: https://cloud.mongodb.com/ → Cluster0 → Database Access");
    }
    
    throw error;
  }
};

module.exports = connectDb;
```

---

### 4️⃣ MongoDB SERVER STATUS ISSUES

#### What can go wrong:
- MongoDB service not running
- MongoDB crashed or stopped
- MongoDB listening on wrong host/port
- mongod.conf bindIp set to 127.0.0.1 only
- MongoDB out of memory or disk space
- MongoDB locked due to Windows updates or system restart

#### How to detect/verify:

**Check 4A: Is MongoDB Atlas cluster running?**
```
1. Go to https://cloud.mongodb.com/
2. Navigate to Clusters
3. Look at Cluster0 status:
   - ✅ "Connected" or "Active" = Running
   - ⚠️ "Paused" = Cluster was paused (free tier only)
   - ❌ "Deleted" or missing = Cluster is gone
```

**Check 4B: Check cluster monitoring**
```
1. Click on Cluster0
2. Go to "Monitoring" tab
3. Check graphs:
   - Connections: Should show recent spikes
   - Operations: Should show data
   - Network I/O: Should show activity
   
If all graphs are flat/empty, cluster is not receiving connections
```

**Check 4C: Check cluster logs**
```
1. Click on Cluster0
2. Go to "Logs" tab
3. Look for errors in last 1 hour:
   - Connection refused
   - Authentication failures
   - Memory errors
   - Disk space errors
```

#### How to fix:

**Fix 4A: Resume Paused Cluster (Free Tier)**
```
1. If cluster shows "Paused":
   a. Go to Cluster0 → ⋮ menu (three dots)
   b. Click "Resume"
   c. Wait 5-10 minutes for cluster to become ready
   d. Try connecting again
```

**Fix 4B: Check Free Tier Limitations**
```
MongoDB Atlas Free Tier (M0) limitations:
- 512 MB storage
- Auto-paused after 30 days of inactivity
- Connection timeout after 15 minutes of inactivity
- No replica set (standalone only)

If hitting storage limit:
1. Go to https://cloud.mongodb.com/
2. Databases → Cluster0 → Collections
3. Check size of collections
4. Delete old test/unnecessary data
5. If needed, upgrade cluster (paid)
```

**Fix 4C: Recreate cluster if corrupted**
```
⚠️ WARNING: This deletes all data!

1. Go to https://cloud.mongodb.com/
2. Cluster0 → ⋮ Terminate
3. Create new cluster:
   - Click "Create" → "Build a Cluster"
   - Select "M0 Free" (if free tier)
   - Name: "Cluster0"
   - Confirm
4. Wait for cluster to deploy (5-10 minutes)
5. Create database user again (see Authentication section)
6. Whitelist IP again (see Network section)
7. Test connection
```

---

### 5️⃣ TLS/SSL CERTIFICATE ISSUES

#### What can go wrong:
- TLS required but not configured in connection options
- Self-signed certificate not trusted on Windows
- Certificate expired
- Wrong CA certificate provided
- mongodb+srv protocol issues with TLS

#### How to detect/verify:

**Check 5A: Verify TLS is enabled**
```bash
# MongoDB Atlas requires TLS
# Your connection string uses mongodb+srv:// which REQUIRES TLS

# Check if TLS is being used:
node -e "
const uri = 'mongodb+srv://dheeraj0987bhari:%40%21e%2F%25x8FK9%263%2DUn@cluster0.q9qfkhp.mongodb.net/ClinicallDatabase';
const opts = new URL(uri);
console.log('TLS Required:', opts.protocol === 'mongodb+srv:');
console.log('Has tls param:', uri.includes('tls='));
"
```

**Check 5B: Test if certificate is valid**
```bash
# Download and check MongoDB Atlas certificate
# Using OpenSSL or PowerShell:

$hostname = "cluster0.q9qfkhp.mongodb.net"
$port = 27017

# PowerShell method:
$cert = [System.Net.Sockets.TcpClient]::new($hostname, $port)
# If this hangs, certificate handshake is failing

# Or use nmap if installed:
nmap --script ssl-cert -p 27017 cluster0.q9qfkhp.mongodb.net
```

**Check 5C: Check Node.js cert store**
```bash
# MongoDB uses system certificate store on Windows
# Verify Windows has MongoDB's CA certificate:

certutil -store ROOT | findstr MongoDB
# Should return MongoDB certificate info
```

#### How to fix:

**Fix 5A: Update Mongoose options for TLS**
```javascript
const connectDb = async () => {
  try {
    if (!process.env.DATABASEURL) {
      throw new Error("DATABASEURL environment variable is not set");
    }

    console.log("🔄 [DB] Starting MongoDB connection...");
    
    const startTime = Date.now();
    
    await Promise.race([
      mongoose.connect(process.env.DATABASEURL, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        retryReads: true,
        family: 4,
        
        // TLS/SSL options
        tls: true,
        tlsAllowInvalidCertificates: false,  // ⚠️ Only use true for development!
        tlsAllowInvalidHostnames: false,     // ⚠️ Only use true for development!
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout (45s)')), 45000)
      )
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [DB] Connected Successfully (${duration}ms)`);
    
  } catch (error) {
    console.error("❌ [DB] Connection failed:");
    
    if (error.message.includes('certificate') || error.message.includes('TLS') || error.message.includes('EPROTO')) {
      console.error("   Issue: TLS/Certificate error");
      console.error("   Try: Add tls:true to Mongoose options");
    }
    
    throw error;
  }
};
```

**Fix 5B: For self-signed certificates (development only)**
```javascript
const fs = require('fs');
const path = require('path');

const connectDb = async () => {
  try {
    let options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      tls: true,
    };

    // For self-signed certs (development only!)
    if (process.env.NODE_ENV !== 'production') {
      options.tlsAllowInvalidCertificates = true;
      options.tlsAllowInvalidHostnames = true;
      console.warn("⚠️  [DB] TLS certificate validation disabled (development only!)");
    }

    await mongoose.connect(process.env.DATABASEURL, options);
    console.log(`✅ [DB] Connected Successfully`);
    
  } catch (error) {
    console.error("❌ [DB] Connection failed:", error.message);
    throw error;
  }
};
```

---

### 6️⃣ DRIVER & CODE ISSUES

#### What can go wrong:
- Mongoose version too old
- `connect()` never awaited
- `connect()` not called at all
- Wrong environment variable name/case
- .env not loaded before database initialization
- Synchronous code trying to use async connection
- Multiple concurrent connect() calls

#### How to detect/verify:

**Check 6A: Verify Mongoose version**
```bash
cd server
npm list mongoose

# Should show version >= 7.0.0
# Minimum: 6.x.x (7.x.x recommended)
# If 5.x.x or older, upgrade
```

**Check 6B: Verify dotenv is loaded FIRST**
```javascript
// In server/index.js, check this is FIRST line:

require('dotenv').config({
  path: path.join(__dirname, '.env'),
  override: false
});

// Your current code does this correctly ✅
// But verify it's before ANY route requires
```

**Check 6C: Verify connect() is awaited**
```javascript
// In server/index.js look at:

(async () => {
  try {
    console.log("✅ [STARTUP] Attempting DB connection...");
    await connectDb();  // ← Must have 'await'
    dbReady = true;
    // ...
  } catch (err) {
    dbReady = false;
    // ...
  }
})();

// Your code does this correctly ✅
```

**Check 6D: Verify .env variable name consistency**
```bash
# In .env:
DATABASEURL=mongodb+srv://...

# In code, reference as:
process.env.DATABASEURL  # ← Case sensitive!

# Check they match:
grep -n "DATABASEURL" .env config/Database.js
```

**Check 6E: Enable Mongoose debug logging**
```javascript
// Add to Database.js before connect():

if (process.env.DEBUG_DB === 'true') {
  mongoose.set('debug', true);
  mongoose.set('debug', (collectionName, method, query, doc) => {
    console.log(`🔍 [MONGOOSE] ${collectionName}.${method}`, 
      JSON.stringify(query).substring(0, 100));
  });
}

// Then run with:
// DEBUG_DB=true node index.js
```

#### How to fix:

**Fix 6A: Upgrade Mongoose**
```bash
cd server
npm install mongoose@latest

# Verify installation:
npm list mongoose
```

**Fix 6B: Add comprehensive error handling**
```javascript
// server/config/Database.js

const mongoose = require("mongoose");
const path = require('path');
require("dotenv").config({
  path: path.join(__dirname, '../.env')
});

const connectDb = async () => {
  try {
    // ✅ STEP 1: Validate environment
    if (!process.env.DATABASEURL) {
      throw new Error("❌ DATABASEURL env var not found. Check if .env is loaded.");
    }

    console.log("🔄 [DB] Environment validation passed");
    console.log("🔄 [DB] Starting MongoDB connection...");
    
    const uri = process.env.DATABASEURL;
    const urlObj = new URL(uri);
    console.log(`🔄 [DB] Target: ${urlObj.hostname}`);

    // ✅ STEP 2: Configure connection options
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
      family: 4,
      tls: true,
      authSource: 'admin'
    };

    // ✅ STEP 3: Connect with timeout safety
    const startTime = Date.now();
    
    const connectionPromise = mongoose.connect(uri, options);
    
    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => rejectj(new Error('Connection timeout after 45s')), 45000)
    );

    await Promise.race([connectionPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    console.log(`✅ [DB] Connected successfully in ${duration}ms`);
    console.log(`✅ [DB] Database: ${mongoose.connection.name}`);
    console.log(`✅ [DB] Host: ${urlObj.hostname}`);

    return mongoose.connection;

  } catch (error) {
    console.error("❌ [DB] CONNECTION FAILED");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(`Error Type: ${error.name}`);
    console.error(`Message: ${error.message}`);
    console.error(`Code: ${error.code}`);
    
    // Detailed diagnostics
    if (error.message.includes('getaddrinfo')) {
      console.error("\n→ DNS resolution failed");
      console.error("  Check: Is hostname correct? Is DNS working?");
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error("\n→ Connection refused");
      console.error("  Check: Is MongoDB running? Is port open?");
    } else if (error.message.includes('auth')) {
      console.error("\n→ Authentication failed");
      console.error("  Check: Username/password in .env file");
    } else if (error.message.includes('timeout')) {
      console.error("\n→ Connection timeout");
      console.error("  Check: Network/firewall blocking? MongoDB Atlas IP whitelisted?");
    }
    
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    throw error;
  }
};

module.exports = connectDb;
```

**Fix 6C: Create manual test script**
```javascript
// test-db-comprehensive.js

const mongoose = require('mongoose');
require('dotenv').config({
  path: require('path').join(__dirname, '.env')
});

async function testConnection() {
  console.log('\n🔍 MongoDB Connection Test\n');
  
  // Test 1: Environment
  console.log('📋 TEST 1: Environment Variables');
  console.log('  DATABASEURL defined:', !!process.env.DATABASEURL);
  if (process.env.DATABASEURL) {
    const uri = process.env.DATABASEURL;
    console.log('  URI length:', uri.length);
    console.log('  Starts with mongodb:', uri.startsWith('mongodb'));
  }

  // Test 2: DNS
  console.log('\n📋 TEST 2: DNS Resolution');
  try {
    const { execSync } = require('child_process');
    const result = execSync('nslookup cluster0.q9qfkhp.mongodb.net').toString();
    console.log('  ✅ DNS resolution succeeded');
  } catch (err) {
    console.log('  ❌ DNS resolution failed');
  }

  // Test 3: Connect
  console.log('\n📋 TEST 3: Mongoose Connection');
  try {
    await mongoose.connect(process.env.DATABASEURL, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      maxPoolSize: 5
    });
    console.log('  ✅ Connection successful');
    console.log('  Database:', mongoose.connection.name);
    console.log('  Host:', mongoose.connection.host);
    
    await mongoose.disconnect();
    console.log('\n✅ All tests passed!');
  } catch (err) {
    console.log('  ❌ Connection failed');
    console.log('  Error:', err.message);
  }
}

testConnection();
```

Run it:
```bash
node test-db-comprehensive.js
```

---

### 7️⃣ CLOUD-SPECIFIC ISSUES (MongoDB Atlas)

#### What can go wrong:
- IP not added to Network Access whitelist
- Cluster paused (free tier auto-pause)
- Cluster deleted or terminated
- Free tier M0 limitations hit (512 MB storage)
- Wrong cluster region selected
- DNS resolution failing for cluster name

#### How to detect/verify:

**Check 7A: Check IP Access List**
```
1. Go to https://cloud.mongodb.com/
2. Cluster0 → Network Access (or Security → Network Access)
3. Look for your IP address in the list
4. If not there → Add IP
5. If there → Check if "Active" (not "Updating")
```

**Check 7B: Check cluster state**
```
1. Go to https://cloud.mongodb.com/
2. Clusters → Cluster0
3. Status should be:
   - ✅ "Connected" = Running
   - ⚠️ "Paused" = Auto-paused (free tier)
   - ❌ Other states = Problem
4. Click on cluster name to see detailed status
```

**Check 7C: Verify you're using correct cluster**
```bash
# Your connection string shows:
# cluster0.q9qfkhp.mongodb.net

# Check if this cluster exists at https://cloud.mongodb.com/
# Verify the subdomain matches (q9qfkhp)
```

**Check 7D: Check database storage**
```
1. Go to https://cloud.mongodb.com/
2. Cluster0 → Collections (or Databases)
3. Check total size:
   - Should be < 512 MB for M0 (free tier)
   - If ≥ 512 MB → Upgrade or delete data
```

#### How to fix:

**Fix 7A: Add IP to Network Access**
```
1. Go to https://cloud.mongodb.com/
2. Cluster0 → Network Access
3. Click "Add IP Address"
4. Option A: Click "Add Current IP" (if on same machine)
   Option B: Enter specific IP
   Option C: Enter 0.0.0.0/0 (allow all - development only!)
5. Click "Confirm"
6. Wait 2-3 minutes for propagation
7. Test connection again
```

**Fix 7B: Resume paused cluster**
```
1. If Cluster0 shows "Paused":
   a. Click three-dot menu (⋮)
   b. Click "Resume"
   c. Wait 5-10 minutes
   d. Verify status changed to "Connected"
```

**Fix 7C: Check free tier auto-pause setting**
```
1. Go to Cluster0 → Edit Configuration
2. Look for "Auto-Pause"
3. If enabled, cluster auto-pauses after 15 min of inactivity
4. For development: Disable auto-pause or keep connections active
5. Apply changes and wait for cluster to restart
```

**Fix 7D: Clean up storage**
```
1. Go to https://cloud.mongodb.com/
2. Cluster0 → Database → Collections
3. View size of each collection
4. Drop test collections or clear unnecessary data:
   db.collection.deleteMany({})
5. Verify total size < 512 MB
```

**Fix 7E: Recreate cluster if necessary**
```
1. ⚠️ WARNING: This deletes all data!
2. Go to Cluster0 → ⋮ → Terminate
3. Confirm deletion
4. Create new cluster:
   - Name: Cluster0
   - Select: M0 (Free)
   - Region: Choose closest to your location
   - Confirm
5. Wait 5-10 minutes for cluster to deploy
6. Create database user again
7. Add IP to whitelist
8. Create database and collections
9. Update DATABASEURL in .env
10. Test connection
```

---

### 8️⃣ ENVIRONMENT & CONFIG ISSUES

#### What can go wrong:
- MONGO_URI vs DATABASEURL variable name inconsistency
- NODE_ENV='production' loading wrong .env file
- .env not loaded at all
- .env file in wrong directory
- Docker/container not sharing .env mount
- Multiple .env files loading (development vs production)

#### How to detect/verify:

**Check 8A: Verify .env is loaded**
```bash
# Add this to index.js BEFORE database connection:

console.log('🔍 Environment Debug:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  DATABASEURL defined:', !!process.env.DATABASEURL);
console.log('  DATABASEURL length:', process.env.DATABASEURL?.length || 0);
console.log('  .env file path:', require('path').join(__dirname, '.env'));
console.log('  .env exists:', require('fs').existsSync(require('path').join(__dirname, '.env')));
```

**Check 8B: Verify .env file location**
```bash
# Windows PowerShell:
ls -Path "C:\Users\DELL\OneDrive\Documents\Clinicall Backend\server" -Filter ".env"

# Should show:
# .env  (file exists)

# If not found, .env might be in wrong location
```

**Check 8C: Verify .env contents not corrupted**
```bash
# PowerShell:
Get-Content "server\.env" | Select-Object -First 5

# Should show:
# PORT = 4000
# DATABASEURL =mongodb+srv://...
# (without corruption marks like ΓÜÖ or ≡ƒ)
```

**Check 8D: Check if .env in .gitignore (for production)**
```bash
cat .gitignore | grep "\.env"

# Should include:
# .env
# .env.local
# .env.*.local
```

#### How to fix:

**Fix 8A: Ensure dotenv loads from correct location**
```javascript
// At VERY TOP of server/index.js (before anything else):

const path = require('path');
const result = require('dotenv').config({
  path: path.join(__dirname, '.env'),
  override: false  // Don't override existing env vars
});

if (result.error) {
  console.warn("⚠️  [STARTUP] .env file not found:", result.error.message);
} else {
  console.log("✅ [STARTUP] Loaded .env file successfully");
  console.log("   Variables loaded:", Object.keys(result.parsed).length);
}

// Verify critical variables
if (!process.env.DATABASEURL) {
  console.error("❌ [STARTUP] CRITICAL: DATABASEURL not defined in .env");
  process.exit(1);
}
```

**Fix 8B: Create separate .env files for different environments**
```bash
# For development:
# .env (loaded by default)

# For production:
# .env.production (loaded when NODE_ENV=production)

# Update code to load correct file:
```

```javascript
const path = require('path');

let envFile = '.env';
if (process.env.NODE_ENV === 'production') {
  envFile = '.env.production';
} else if (process.env.NODE_ENV === 'test') {
  envFile = '.env.test';
}

const result = require('dotenv').config({
  path: path.join(__dirname, envFile),
  override: false
});

console.log(`✅ [STARTUP] Loaded ${envFile}`);
```

**Fix 8C: For Docker containers**
```bash
# In Dockerfile, if using .env:

# Option 1: Copy .env into container
COPY server/.env /app/server/.env

# Option 2: Use build args
ARG DATABASEURL
ENV DATABASEURL=$DATABASEURL

# In docker-compose.yml:
services:
  server:
    build: ./server
    env_file:
      - ./server/.env
    environment:
      NODE_ENV: production
```

**Fix 8D: Create .env.example (no secrets)**
```bash
# server/.env.example (commit to git, safe)

PORT=4000
DATABASEURL=mongodb+srv://username:password@cluster.mongodb.net/dbname
NODE_ENV=development
JWT_SECRET=your_secret_here
CLOUD_NAME=your_cloudinary_name
# ... etc

# Instructions:
# 1. Copy .env.example to .env
# 2. Fill in actual values
# 3. NEVER commit .env to git
```

---

### 9️⃣ REPLICA SET / CLUSTER ISSUES

#### What can go wrong:
- MongoDB connection uses replica set but `replicaSet` parameter missing
- Wrong replica set name in connection string
- Not all replica set members reachable
- DNS SRV record issues with `mongodb+srv://`
- Replica set requires specific readPreference settings

#### How to detect/verify:

**Check 9A: Verify SRV record (mongodb+srv)**
```bash
# Your connection uses: mongodb+srv://
# This means DNS SRV lookup is happening

# Verify SRV record resolves:
nslookup -type=SRV _mongodb._tcp.cluster0.q9qfkhp.mongodb.net

# Should return:
# _mongodb._tcp.cluster0.q9qfkhp.mongodb.net  SRV service location:
#     priority       = 0
#     weight         = 0
#     port           = 27017
#     svr hostname   = ...
```

**Check 9B: Check if replica set parameter needed**
```bash
# MongoDB Atlas clusters use replica sets by default
# Your connection string might need replicaSet parameter

# Check Atlas cluster details:
# 1. Go to https://cloud.mongodb.com/
# 2. Cluster0 → Overview
# 3. Look for "Replica Set Name" (usually "Cluster0")
4. If not in connection string, add it:
   ?replicaSet=Cluster0
```

**Check 9C: Verify replica set members**
```javascript
//Create test-replica-set.js
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

mongoose.connect(process.env.DATABASEURL)
  .then(() => {
    const admin = mongoose.connection.db.admin();
    return admin.replSetGetStatus();
  })
  .then(status => {
    console.log('✅ Replica set members:');
    status.members.forEach(member => {
      console.log(`  ${member.name}: ${member.state} (${member.health})`);
    });
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
```

#### How to fix:

**Fix 9A: Add replicaSet parameter**
```bash
# Update your .env:
DATABASEURL=mongodb+srv://dheeraj0987bhari:%40%21e%2F%25x8FK9%263%2DUn@cluster0.q9qfkhp.mongodb.net/ClinicallDatabase?replicaSet=Cluster0&appName=Cluster0

# For MongoDB Atlas, the replica set name is usually your cluster name
```

**Fix 9B: Fix SRV DNS issues**
```bash
# If SRV record doesn't resolve, use direct connection:

# Instead of:
# mongodb+srv://user:pass@cluster0.mongodb.net/db

# Use:
# mongodb://user:pass@cluster0-shard-00-00.mongodb.net,cluster0-shard-00-01.mongodb.net/db?replicaSet=Cluster0

# Get shard node hostnames from Atlas:
# 1. Cluster0 → Connect → Drivers
# 2. Copy the alternate connection string for SRV issues
```

**Fix 9C: Set proper readPreference**
```javascript
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DATABASEURL, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
      family: 4,
      
      // Replica set options
      replicaSet: 'Cluster0',  // or check your replica set name
      readPreference: 'primary',  // or 'primaryPreferred' for read load balancing
    });
    
    console.log(`✅ [DB] Connected to replica set`);
  } catch (error) {
    console.error("❌ [DB] Connection failed:", error.message);
    throw error;
  }
};
```

---

### 🔟 TIMEOUT & RESOURCE LIMIT ISSUES

#### What can go wrong:
- serverSelectionTimeoutMS too low (default 30s)
- socketTimeoutMS too low
- Connection pool exhausted
- Too many open connections (hitting max per user/deployment)
- Free tier max 500 concurrent connections
- Long-running operations blocking connections
- Memory leak causing connection pool bloat

#### How to detect/verify:

**Check 10A: Monitor connection pool**
```javascript
// Add to Database.js

mongoose.connection.on('open', () => {
  console.log('✅ [DB] Connection opened');
  
  // Monitor pool size
  setInterval(() => {
    const client = mongoose.connection.getClient();
    const poolStats = client?.topology?.s?.pool?.totalConnectionCount;
    console.log(`📊 [DB] Active connections: ${poolStats}`);
  }, 30000); // Every 30 seconds
});
```

**Check 10B: Check for connection leaks**
```javascript
// Log every new connection
mongoose.connection.on('connect', () => {
  console.log('📉 [DB] New connection established');
});

// Log every connection close
mongoose.connection.on('disconnected', () => {
  console.log('📈 [DB] Connection closed');
});
```

**Check 10C: Verify timeout settings**
```bash
# Check current timeout values in Database.js:

serverSelectionTimeoutMS: 30000,  // 30 seconds to select a server
socketTimeoutMS: 45000,            // 45 seconds for socket operations

# These are reasonable defaults
# MongoDB Atlas needs at least 30s selection timeout
```

**Check 10D: Check free tier limits**
```
MongoDB Atlas M0 (Free Tier) Limits:
- Max 512 MB storage
- Max 500 concurrent connections
- Max 100 databases (shared)
- No compression
- No custom roles

If hitting limits, upgrade to M2+ cluster
```

#### How to fix:

**Fix 10A: Increase timeout values if needed**
```javascript
// server/config/Database.js

const connectDb = async () => {
  try {
    console.log("🔄 [DB] Starting MongoDB connection...");
    
    const uri = process.env.DATABASEURL;
    
    // Increase timeouts for slow networks
    const options = {
      serverSelectionTimeoutMS: 60000,    // ← Increased to 60s
      socketTimeoutMS: 90000,              // ← Increased to 90s
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 45000,               // ← New: close idle connections after 45s
      retryWrites: true,
      retryReads: true,
      family: 4
    };

    await Promise.race([
      mongoose.connect(uri, options),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 90s')), 90000)
      )
    ]);
    
    console.log(`✅ [DB] Connected successfully`);
    
  } catch (error) {
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error("❌ [DB] Timeout error - possible causes:");
      console.error("   - serverSelectionTimeoutMS too low");
      console.error("   - MongoDB Atlas IP not whitelisted");
      console.error("   - Network/firewall blocking connection");
    }
    throw error;
  }
};
```

**Fix 10B: Implement connection pool monitoring**
```javascript
// server/config/Database.js

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DATABASEURL, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,      // Max 10 connections per process
      minPoolSize: 2,       // Keep at least 2 warm connections
      maxIdleTimeMS: 30000, // Close connection if idle > 30s
      retryWrites: true,
      retryReads: true,
      family: 4
    });

    // Monitor pool
    mongoose.connection.on('open', () => {
      console.log('✅ [DB] Connected successfully');
      
      // Log pool stats periodically
      setInterval(() => {
        const stats = {
          readyState: mongoose.connection.readyState,  // 0=disconnected, 1=connected
          collections: Object.keys(mongoose.connection.collections).length,
          models: Object.keys(mongoose.models).length
        };
        console.log(`📊 [DB] Pool stats:`, stats);
      }, 60000); // Every minute
    });

    return mongoose.connection;

  } catch (error) {
    console.error("❌ [DB] Connection failed:", error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error("   → MongoDB not running or wrong host");
    } else if (error.message.includes('timeout')) {
      console.error("   → Timeout - check serverSelectionTimeoutMS");
    } else if (error.message.includes('pool')) {
      console.error("   → Connection pool exhausted");
    }
    
    throw error;
  }
};
```

**Fix 10C: Implement graceful shutdown**
```javascript
// At end of server/index.js

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('⏹️  [SHUTDOWN] SIGTERM received, closing connections...');
  
  try {
    // Close server
    server.close(() => {
      console.log('✅ [SHUTDOWN] Server closed');
    });
    
    // Close database connection
    await mongoose.disconnect();
    console.log('✅ [SHUTDOWN] Database disconnected');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ [SHUTDOWN] Error:', err.message);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('\n⏹️  [SHUTDOWN] SIGINT received, closing connections...');
  
  try {
    await mongoose.disconnect();
    console.log('✅ [SHUTDOWN] Database disconnected');
    process.exit(0);
  } catch (err) {
    console.error('❌ [SHUTDOWN] Error:', err.message);
    process.exit(1);
  }
});
```

**Fix 10D: For free tier limits, upgrade cluster**
```
To upgrade from M0 → M2:
1. Go to https://cloud.mongodb.com/
2. Cluster0 → ⋮ Upgrade
3. Select M2 (paid tier starts ~$9/month)
4. Apply changes (downtime ~1 minute)
5. Verify upgrade complete
```

---

## QUICK DIAGNOSTIC CHECKLIST

Run through these in order:

```bash
# 1. Check if .env exists and DATABASEURL is set
test -f server/.env && echo "✅ .env exists" || echo "❌ .env missing"
grep "DATABASEURL" server/.env && echo "✅ DATABASEURL set" || echo "❌ DATABASEURL missing"

# 2. Test DNS resolution
nslookup cluster0.q9qfkhp.mongodb.net

# 3. Test network connectivity
Test-NetConnection cluster0.q9qfkhp.mongodb.net -Port 27017

# 4. Test connection with Node
cd server
rm -f node_modules/.bin/mongoose  # Clear cache
node -e "
  require('dotenv').config({path:'./.env'});
  const mongoose = require('mongoose');
  mongoose.connect(process.env.DATABASEURL, {serverSelectionTimeoutMS:10000})
    .then(() => { 
      console.log('✅ Connection successful!'); 
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Failed:', err.message);
      process.exit(1);
    });
"

# 5. Check MongoDB Atlas status
echo "Open https://cloud.mongodb.com/ and verify:"
echo "  - Cluster0 status is 'Connected'"
echo "  - IP whitelisted in Network Access"
echo "  - Database user exists and is active"
```

---

## DIAGNOSIS DECISION TREE

```
MongoDB Connection Failed?
│
├─ Server won't even start?
│  └─ Check: Syntax errors in Database.js or index.js
│     → Fix: npm run lint or node -c index.js
│
├─ Server starts but no "Connected Successfully" message?
│  │
│  ├─ Check: Is .env being loaded?
│  │  → Fix: Add console.log(process.env.DATABASEURL) at startup
│  │
│  ├─ Check: Is DATABASEURL correct?
│  │  → Fix: Test with node test-auth.js
│  │
│  ├─ Check: Network connectivity?
│  │  → Fix: Test-NetConnection cluster0.q9qfkhp.mongodb.net -Port 27017
│  │
│  ├─ Check: MongoDB Atlas IP whitelisted?
│  │  → Fix: Add IP to https://cloud.mongodb.com/ Network Access
│  │
│  ├─ Check: Cluster paused?
│  │  → Fix: Click "Resume" on https://cloud.mongodb.com/ Cluster0
│  │
│  └─ Check: Auth credentials wrong?
│     → Fix: Reset password in MongoDB Atlas Database Users
│
├─ Server starts, connects, then fails later?
│  │
│  ├─ Check: Connection timeout
│  │  → Fix: Increase serverSelectionTimeoutMS in Database.js
│  │
│  ├─ Check: Memory leak
│  │  → Fix: Check for unclosed connections or loops
│  │
│  └─ Check: Connection pool exhausted
│     → Fix: Implement pool monitoring and graceful shutdown
│
└─ Other errors?
   └─ Check: See categories 1-10 above
```

---

## FINAL RECOMMENDATIONS

**Based on your current setup:**

1. **Immediate Action**: Run the comprehensive test script:
   ```bash
   cd server
   node test-db-comprehensive.js
   ```

2. **If still failing**, check MongoDB Atlas:
   - Go to https://cloud.mongodb.com/
   - Verify Cluster0 status is "Connected"
   - Go to Network Access and whitelist your IP (0.0.0.0/0 for dev)
   - Wait 2-3 minutes and retry

3. **If network is OK**, check credentials:
   ```bash
   # Test password encoding
   node -e "console.log(encodeURIComponent('@!e/%x8FK9&3-Un'))"
   # Should output: %40%21e%2F%25x8FK9%263%2DUn (matches your .env)
   ```

4. **Add better error logging to Database.js** (see Fix 6B above)

5. **Never commit .env to git**. Use .env.example instead.

6. **For production**, consider:
   - Using AWS Secrets Manager or environment variables
   - Upgrading from M0 free tier to M2+ paid cluster
   - Enabling automated backups
   - Setting up replica monitoring

---

**Last Updated**: March 14, 2026  
**Status**: Ready for deployment diagnostics
