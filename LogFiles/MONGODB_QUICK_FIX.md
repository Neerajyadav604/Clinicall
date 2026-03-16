# MongoDB Connection: Quick Reference Guide

**Your Current Environment:**
- OS: Windows 10/11
- Node.js: v23.6.1
- Database: MongoDB Atlas (mongodb+srv://)
- Status: **Connection failing silently (no error logged)**

---

## 🚀 START HERE - Top 3 Most Likely Issues

### Issue #1: ⭐ IP NOT WHITELISTED (60% probability)

**Symptom:** Server starts but DB connection hangs without error

**Fix:**
```
1. Go to https://cloud.mongodb.com/
2. Click on "Cluster0"
3. Select "Network Access" (left menu under Security)
4. Click "Add IP Address"
5. Click "Add Current IP" (if same machine) OR
6. Enter: 0.0.0.0/0 (for development only - allows all IPs)
7. Click "Confirm"
8. WAIT 2-3 MINUTES for whitelist to propagate
9. Restart server: node index.js
```

After adding to whitelist, you should see in logs:
```
✅ [DB] Connected Successfully (XXXms)
```

---

### Issue #2: ⭐ WRONG USERNAME/PASSWORD (20% probability)

**Symptom:** Authentication error or "unknown user"

**Fix:**
```
1. Go to https://cloud.mongodb.com/
2. Click on "Cluster0"
3. Select "Database Users" (under Security)
4. Look for user: dheeraj0987bhari
5. If NOT listed → Click "Add New Database User"
   - Username: dheeraj0987bhari
   - Password: Generate strong password (copy it!)
   - Role: readWriteAnyDatabase
   - Click "Add User"

6. If EXISTS but wrong password:
   - Click the ⋮ (three dots) menu next to user
   - Select "Edit Password"
   - Generate new password (copy it!)
   
7. URL-encode the password:
   node -e "console.log(encodeURIComponent('your_plain_password'))"
   
8. Update .env file:
   DATABASEURL=mongodb+srv://dheeraj0987bhari:ENCODED_PASSWORD@cluster0.q9qfkhp.mongodb.net/ClinicallDatabase?authSource=admin
   
9. Restart server
```

---

### Issue #3: ⭐ CLUSTER PAUSED (15% probability)

**Symptom:** Connection timeout, server hangs

**Fix:**
```
1. Go to https://cloud.mongodb.com/
2. Look at "Cluster0" status
3. If it says "PAUSED":
   a. Click the ⋮ (three dots) menu
   b. Click "Resume"
   c. Wait 5-10 minutes for cluster to start
   d. Restart server

Status should change to "Connected" or "Active"
```

---

## 🧪 Run Diagnostic Script

To automatically test all categories, run:

```bash
cd server
node test-mongo-diagnostic.js
```

This will:
- ✓ Check if .env exists
- ✓ Verify DATABASEURL is set
- ✓ Validate connection string format
- ✓ Test DNS resolution
- ✓ Test network connectivity
- ✓ Test MongoDB authentication
- ✓ Provide specific error diagnostics

---

## 📋 Manual Testing

### Test 1: Check DNS
```bash
nslookup cluster0.q9qfkhp.mongodb.net

# Should return IP addresses like 3.xxx.xxx.xxx
```

### Test 2: Check Network
```bash
Test-NetConnection cluster0.q9qfkhp.mongodb.net -Port 27017

# Should show: TcpTestSucceeded : True
```

### Test 3: Check MongoDB Connection
```bash
cd server
node -e "
  require('dotenv').config({path:'./.env'});
  const mongoose = require('mongoose');
  mongoose.connect(process.env.DATABASEURL, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000
  })
    .then(() => {
      console.log('✅ MongoDB connected!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Failed:', err.message);
      process.exit(1);
    });
"
```

### Test 4: Check Environment Variables
```bash
cd server
node -e "
  require('dotenv').config({path:'./.env'});
  console.log('DATABASEURL:', process.env.DATABASEURL ? 'SET' : 'NOT SET');
  console.log('Length:', process.env.DATABASEURL?.length || 0);
  console.log('Starts with mongodb:', process.env.DATABASEURL?.startsWith('mongodb'));
"
```

---

## 🔧 Common Fixes

### Fix: Password not URL-encoded
```bash
# Get your plain password from MongoDB Atlas
# Then run:
node -e "console.log(decodeURIComponent('%40%21e%2F%25x8FK9%263%2DUn'))"

# Should output: @!e/%x8FK9&3-Un
# If doesn't match what you remember, reset password in Atlas

# To encode a password:
node -e "console.log(encodeURIComponent('@!e/% x8FK9&3-Un'))"
# Output: %40%21e%2F%25x8FK9%263%2DUn
```

### Fix: Add authSource to connection string
```env
# In .env, if connection string doesn't have ?authSource=admin, add it:
DATABASEURL=mongodb+srv://dheeraj0987bhari:PASSWORD@cluster0.q9qfkhp.mongodb.net/ClinicallDatabase?authSource=admin&retryWrites=true&w=majority
```

### Fix: Check MongoDB Atlas Status
```
1. Go to https://cloud.mongodb.com/
2. Login with: dheeraj0987bhari@gmail.com
3. Look at Cluster0
4. Status should be:
   ✅ "Connected" or "Active"
   ❌ NOT "Paused" or "Provisioning"
5. If wrong, click Resume or wait for provisioning
```

### Fix: Windows Firewall
```bash
# Run as Administrator:
netsh advfirewall firewall add rule name="Node.js Outbound" dir=out action=allow program="C:\Program Files\nodejs\node.exe" enable=yes

# Or manually in Windows Settings:
# Settings → Privacy & Security → Windows Defender Firewall → Allow an app through firewall
# Add node.exe for both Private and Public networks
```

---

## 📚 Full Documentation

For complete details on all 10 categories of MongoDB issues, see:

**[MONGODB_CONNECTION_DIAGNOSTIC.md](./MONGODB_CONNECTION_DIAGNOSTIC.md)**

This file contains:
1. Connection String Issues
2. Network & Firewall
3. Authentication
4. MongoDB Server Status
5. TLS/SSL
6. Driver & Code Issues
7. Cloud-Specific (Atlas)
8. Environment & Config
9. Replica Set / Cluster
10. Timeout & Resource Limits

---

## ✅ Expected Results When Fixed

### Server should show:
```
╔═══════════════════════════════════════════════════════╗
║     MongoDB Connection Diagnostics Starting...      ║
╚═══════════════════════════════════════════════════════╝

✅ [STEP 1] Environment validation passed
   ✓ DATABASEURL is defined

🔍 [STEP 2] Validating connection string format...
   ✓ Protocol valid: mongodb+srv://
   ✓ Credentials detected in URI
   ✓ Hostname: cluster0.q9qfkhp.mongodb.net
   ✓ Database: ClinicallDatabase
   ✓ Username: dheeraj0987bhari

⚙️  [STEP 3] Configuring connection options...
   ✓ Timeouts configured: serverSelection=30000ms, socket=45000ms
   ✓ Pool size: 2-10 connections
   ✓ TLS enabled: true
   ✓ authSource: admin

🔗 [STEP 4] Attempting connection...
   → Target: cluster0.q9qfkhp.mongodb.net

✅ [STEP 5] Connected successfully!
   ✓ Connection time: 1234ms
   ✓ Database: ClinicallDatabase
   ✓ Host: cluster0.q9qfkhp.mongodb.net
   ✓ Ready state: 1 (connected)
   ✓ Database ping: OK

╔═══════════════════════════════════════════════════════╗
║           MongoDB Connection Successful!            ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🆘 Still Not Working?

1. **Run the diagnostic:** `node test-mongo-diagnostic.js`
2. **Check the full guide:** `MONGODB_CONNECTION_DIAGNOSTIC.md`
3. **Verify these in order:**
   - [ ] .env file exists in `server/` directory
   - [ ] DATABASEURL is set in .env
   - [ ] Connection string has credentials (user:pass@host)
   - [ ] Password is URL-encoded if it has special chars
   - [ ] MongoDB Atlas cluster is "Connected" (not "Paused")
   - [ ] Your IP is whitelisted in Network Access
   - [ ] Database user exists and is "Active"
   - [ ] Windows Firewall allows Node.js outbound

4. **If still stuck:**
   - Recreate MongoDB Atlas cluster
   - Create new database user
   - Copy exact credentials from Atlas UI
   - URL-encode the password
   - Update .env and restart

---

**Last Updated:** March 14, 2026  
**Status:** Ready for troubleshooting
