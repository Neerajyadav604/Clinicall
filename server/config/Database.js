/**
 * Enhanced MongoDB Connection Configuration
 * With comprehensive diagnostics for all 10 failure categories
 */

const mongoose = require("mongoose");
const path = require('path');

// Load .env FIRST, before anything else
require("dotenv").config({
  path: path.join(__dirname, '../.env'),
  override: false
});

const connectDb = async () => {
  const startTime = Date.now();
  
  try {
    // ============================================
    // STEP 1: VALIDATE ENVIRONMENT (Category 1, 8)
    // ============================================
    process.stdout.write("\n╔═══════════════════════════════════════════════════════╗\n");
    process.stdout.write("║     MongoDB Connection Diagnostics Starting...      ║\n");
    process.stdout.write("╚═══════════════════════════════════════════════════════╝\n\n");

    if (!process.env.DATABASEURL) {
      throw new Error(
        "❌ CRITICAL: DATABASEURL environment variable not set.\n" +
        "   → Check if .env file exists in server/ directory\n" +
        "   → Check if DATABASEURL=... line is present in .env\n" +
        "   → Restart server after adding/fixing .env"
      );
    }

    process.stdout.write("✅ [STEP 1] Environment validation passed\n");
    console.log(`   ✓ DATABASEURL is defined (length: ${process.env.DATABASEURL.length})`);

    const uri = process.env.DATABASEURL;

    // ============================================
    // STEP 2: VALIDATE CONNECTION STRING (Category 2)
    // ============================================
    console.log("\n🔍 [STEP 2] Validating connection string format...");

    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error(
        "❌ Invalid protocol in DATABASEURL.\n" +
        "   → Must start with: mongodb:// or mongodb+srv://\n" +
        "   → Your URI starts with: " + uri.substring(0, 20)
      );
    }
    console.log("   ✓ Protocol valid: " + (uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://'));

    if (!uri.includes('@')) {
      throw new Error(
        "❌ Missing credentials in connection string.\n" +
        "   → Format should be: mongodb+srv://username:password@host/database\n" +
        "   → Your URI has no '@' symbol"
      );
    }
    console.log("   ✓ Credentials detected in URI");

    // Parse URL to extract details
    let urlObj, hostname, database, username;
    try {
      urlObj = new URL(uri);
      hostname = urlObj.hostname;
      database = urlObj.pathname.split('/')[1] || 'N/A';
      username = urlObj.username;
      
      console.log(`   ✓ Hostname: ${hostname}`);
      console.log(`   ✓ Database: ${database}`);
      console.log(`   ✓ Username: ${username}`);
    } catch (err) {
      throw new Error(
        `❌ Could not parse connection string.\n` +
        `   → Error: ${err.message}\n` +
        `   → Check for special characters that need URL encoding\n` +
        `   → Example: @ → %40, # → %23, / → %2F`
      );
    }

    // ============================================
    // STEP 3: CONFIGURE CONNECTION OPTIONS
    // ============================================
    console.log("\n⚙️  [STEP 3] Configuring connection options...");

    const options = {
      // Timeouts (Category 10)
      serverSelectionTimeoutMS: 30000,  // 30 seconds to find a server
      socketTimeoutMS: 45000,            // 45 seconds for socket operations
      maxPoolSize: 10,                   // Maximum connections
      minPoolSize: 2,                    // Minimum connections (keep warm)
      maxIdleTimeMS: 30000,              // Close connection if idle > 30s
      
      // Retry logic
      retryWrites: true,
      retryReads: true,
      
      // Network
      family: 4,  // Use IPv4 (prefer IPv6 if available)
      
      // TLS/SSL (Category 5)
      tls: true,
      tlsAllowInvalidCertificates: process.env.NODE_ENV === 'development' ? false : false,
      tlsAllowInvalidHostnames: process.env.NODE_ENV === 'development' ? false : false,
      
      // Auth (Category 3)
      authSource: 'admin'  // For MongoDB Atlas
    };

    console.log("   ✓ Timeouts configured: " + 
      `serverSelection=${options.serverSelectionTimeoutMS}ms, ` +
      `socket=${options.socketTimeoutMS}ms`);
    console.log(`   ✓ Pool size: ${options.minPoolSize}-${options.maxPoolSize} connections`);
    console.log(`   ✓ TLS enabled: ${options.tls}`);
    console.log(`   ✓ authSource: ${options.authSource}`);

    // ============================================
    // STEP 4: ATTEMPT CONNECTION
    // ============================================
    console.log("\n🔗 [STEP 4] Attempting connection...");
    console.log(`   → Target: ${hostname}\n`);

    console.log("   ⏳ Calling mongoose.connect()...");
    const connectionPromise = mongoose.connect(uri, options);
    console.log("   ⏳ Connection promise created, waiting for settlement...");
    
    // Add event listeners to mongoose for additional diagnostics
    const onConnected = () => {
      console.log("   📊 Mongoose 'connected' event fired");
    };
    const onError = (err) => {
      console.error("   📊 Mongoose 'error' event fired:", err.message.substring(0, 50));
    };
    
    mongoose.connection.once('connected', onConnected);
    mongoose.connection.once('error', onError);
    
    // Add timeout wrapper (Category 10)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        console.error("   ⏱️  TIMEOUT: 45-second timeout fired");
        mongoose.connection.removeListener('connected', onConnected);
        mongoose.connection.removeListener('error', onError);
        reject(new Error(
          "❌ CONNECTION TIMEOUT (45 seconds)\n" +
          "   → Server selection took too long\n" +
          "   → Most likely causes:\n" +
          "     1. IP not whitelisted in MongoDB Atlas Network Access\n" +
          "     2. Firewall blocking outbound to MongoDB\n" +
          "     3. MongoDB Atlas cluster paused or down\n" +
          "     4. Network/DNS issues\n" +
          "   → Check: https://cloud.mongodb.com/ → Cluster0 → Network Access"
        ));
      }, 45000)
    );

    // Race between connection and timeout - log which wins
    console.log("   ⏳ Racing connection promise vs timeout...");
    try {
      const result = await Promise.race([connectionPromise, timeoutPromise]);
      console.log("   ✅ Promise.race completed successfully");
      mongoose.connection.removeListener('connected', onConnected);
      mongoose.connection.removeListener('error', onError);
    } catch (raceErr) {
      console.error("   ❌ Promise.race threw error:", raceErr.message.substring(0, 50));
      mongoose.connection.removeListener('connected', onConnected);
      mongoose.connection.removeListener('error', onError);
      throw raceErr;
    }

    const duration = Date.now() - startTime;

    // ============================================
    // STEP 5: VERIFY CONNECTION
    // ============================================
    process.stdout.write(`\n✅ [STEP 5] Connected successfully!\n`);
    process.stdout.write(`   ✓ Connection time: ${duration}ms\n`);
    process.stdout.write(`   ✓ Database: ${mongoose.connection.name}\n`);
    process.stdout.write(`   ✓ Host: ${mongoose.connection.host}\n`);
    process.stdout.write(`   ✓ Ready state: ${mongoose.connection.readyState} (1=connected)\n`);

    // Test ping
    try {
      const admin = mongoose.connection.db.admin();
      await admin.ping();
      process.stdout.write(`   ✓ Database ping: OK\n`);
    } catch (pingErr) {
      process.stderr.write(`   ⚠️  Database ping failed: ${pingErr.message}\n`);
    }

    // Monitor connection events
    setupConnectionMonitoring();

    process.stdout.write("\n╔═════════════════════════════════════════════════════╗\n");
    process.stdout.write("║            MongoDB Connection Successful!           ║\n");
    process.stdout.write("╚═════════════════════════════════════════════════════╝\n\n");

    return mongoose.connection;

  } catch (error) {
    // ============================================
    // ERROR HANDLING & DIAGNOSTICS
    // ============================================
    const duration = Date.now() - startTime;

    console.error(`\n❌ [ERROR] Connection failed after ${duration}ms`);
    console.error("╔═══════════════════════════════════════════════════════╗");
    console.error("║           MongoDB Connection Failed                  ║");
    console.error("╚═══════════════════════════════════════════════════════╝\n");

    console.error(`Error Type: ${error.name}`);
    console.error(`Message: ${error.message}`);
    if (error.code) console.error(`Code: ${error.code}`);

    // ============================================
    // CATEGORY-SPECIFIC ERROR DIAGNOSTICS
    // ============================================
    console.error("\n📋 DIAGNOSTIC ANALYSIS:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Category 2: Connection String
    if (error.message.includes('ERR_INVALID_URL') || error.message.includes('invalid hostname')) {
      console.error("\n[Category 2] Connection String Issue:");
      console.error("  Problem: URI format is invalid");
      console.error("  Check:");
      console.error("    • Protocol: mongodb:// or mongodb+srv:// ?");
      console.error("    • Credentials: username:password@host ?");
      console.error("    • Special chars in password must be URL-encoded");
      console.error("  Fix:");
      console.error("    node -e \"console.log(encodeURIComponent('your_password'))\"");
    }

    // Category 3: Network/Firewall
    if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      console.error("\n[Category 3] Network Issue - DNS Resolution Failed:");
      console.error("  Problem: Cannot resolve hostname");
      console.error("  Check:");
      console.error("    • Is hostname correct? " + (hostname || 'unknown'));
      console.error("    • nslookup cluster0.q9qfkhp.mongodb.net");
      console.error("    • Is internet working?");
      console.error("    • Try: nslookup 8.8.8.8 (to test DNS)");
    }

    // Category 3: Firewall/Network
    if (error.code === 'ECONNREFUSED' || error.code === 'EHOSTUNREACH') {
      console.error("\n[Category 3] Network Issue - Connection Refused:");
      console.error("  Problem: Cannot reach server on port 27017");
      console.error("  Check:");
      console.error("    • Windows Firewall: add node.exe for outbound");
      console.error("    • MongoDB Atlas IP whitelist: add 0.0.0.0/0 (dev only)");
      console.error("    • Corporate firewall/proxy blocking port 27017");
      console.error("    • VPN or ISP restrictions");
    }

    // Category 4: Authentication
    if (error.message.includes('auth') || error.message.includes('Authentication')) {
      console.error("\n[Category 4] Authentication Failed:");
      console.error("  Problem: Username or password incorrect");
      console.error("  Check:");
      console.error("    • https://cloud.mongodb.com/ → Cluster0 → Database Users");
      console.error("    • Verify username: dheeraj0987bhari");
      console.error("    • Verify password matches .env DATABASEURL");
      console.error("    • Password must be URL-encoded in connection string");
      console.error("  Fix:");
      console.error("    1. Click user in Database Users → Edit");
      console.error("    2. Generate new password");
      console.error("    3. URL-encode it");
      console.error("    4. Update .env DATABASEURL");
    }

    // Category 4: Unknown user
    if (error.message.includes('unknown') && error.message.includes('user')) {
      console.error("\n[Category 4] User Not Found:");
      console.error("  Problem: User does not exist in MongoDB");
      console.error("  Check:");
      console.error("    • https://cloud.mongodb.com/ → Database Users");
      console.error("    • Is user 'dheeraj0987bhari' listed?");
      console.error("  Fix:");
      console.error("    1. Create new user if missing");
      console.error("    2. Give role: readWriteAnyDatabase");
      console.error("    3. Copy new password and URL-encode it");
      console.error("    4. Update .env and restart");
    }

    // Category 5: TLS/Certificate
    if (error.message.includes('TLS') || error.message.includes('certificate') || 
        error.code === 'EPROTO' || error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
      console.error("\n[Category 5] TLS/Certificate Issue:");
      console.error("  Problem: TLS handshake or certificate error");
      console.error("  Check:");
      console.error("    • Windows cert store has MongoDB CA?");
      console.error("    • Try: certutil -store ROOT | findstr MongoDB");
      console.error("  Fix (development only):");
      console.error("    • Set: tlsAllowInvalidCertificates: true");
      console.error("    • (Production: update system certificates)");
    }

    // Category 7/4: MongoDB Atlas specific
    if (error.message.includes('Cluster') || error.message.includes('cluster') ||
        hostname?.includes('mongodb.net')) {
      console.error("\n[Category 7] MongoDB Atlas Issue:");
      console.error("  Check:");
      console.error("    1. Cluster status: https://cloud.mongodb.com/");
      console.error("       → Should show 'Connected' (not 'Paused')");
      console.error("    2. Network Access:");
      console.error("       → Add your IP or 0.0.0.0/0 (dev)");
      console.error("    3. Database Users:");
      console.error("       → Verify user exists and is Active");
      console.error("    4. Storage limit:");
      console.error("       → Free tier M0: max 512 MB");
    }

    // Category 10: Timeout
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      console.error("\n[Category 10] Timeout Issue:");
      console.error("  Problem: Connection took too long");
      console.error("  Check:");
      console.error("    • MongoDB Atlas cluster status");
      console.error("    • IP whitelisted in Network Access");
      console.error("    • Firewall/network not blocking");
      console.error("    • Free tier auto-paused?");
      console.error("  Fix:");
      console.error("    • Increase serverSelectionTimeoutMS to 60000");
      console.error("    • Check MongoDB Atlas dashboard");
      console.error("    • Resume cluster if paused");
    }

    console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("\n🔧 QUICK FIXES (in order of likelihood):");
    console.error("  1. ⭐ Check IP is whitelisted:");
    console.error("     https://cloud.mongodb.com/ → Cluster0 → Network Access");
    console.error("     → Add: 0.0.0.0/0 (development) or your IP");
    console.error("\n  2. ⭐ Verify username/password:");
    console.error("     https://cloud.mongodb.com/ → Cluster0 → Database Users");
    console.error("     → Check: dheeraj0987bhari exists and is active");
    console.error("\n  3. ⭐ Check cluster status:");
    console.error("     https://cloud.mongodb.com/ → Cluster0");
    console.error("     → Status should be 'Connected' not 'Paused'");
    console.error("     → If paused, click 'Resume'");
    console.error("\n  4. Run diagnostic script:");
    console.error("     node test-mongo-diagnostic.js");
    console.error("\n  5. See full guide:");
    console.error("     MONGODB_CONNECTION_DIAGNOSTIC.md\n");

    throw error;
  }
};

/**
 * Setup monitoring for connection events
 */
function setupConnectionMonitoring() {
  mongoose.connection.on('connected', () => {
    console.log('📊 [DB] MongoDB event: Connected');
  });

  mongoose.connection.on('disconnected', () => {
    console.error('📊 [DB] MongoDB event: Disconnected (server may have closed connection)');
  });

  mongoose.connection.on('error', (err) => {
    console.error('📊 [DB] MongoDB event: Error -', err.message);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('📊 [DB] MongoDB event: Reconnected');
  });
}

module.exports = connectDb;