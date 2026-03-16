/**
 * Alternative MongoDB Connection using Native Driver
 * Use this if Mongoose connection hangs
 */

const { MongoClient } = require('mongodb');

let cachedClient = null;

const connectDb = async () => {
  const startTime = Date.now();
  
  try {
    if (!process.env.DATABASEURL) {
      throw new Error("DATABASEURL not set");
    }

    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║     Using Native MongoDB Driver (Alternative)      ║");
    console.log("╚═══════════════════════════════════════════════════════╝\n");

    console.log("🔗 [NATIVE] Attempting connection with MongoClient...");

    // Use native driver with timeout
    const client = new MongoClient(process.env.DATABASEURL, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000
    });

    // Try to connect
    console.log("⏳ [NATIVE] Calling client.connect()...");
    
    const connectPromise = client.connect();
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Native driver connection timeout (15s)")), 15000)
    );

    await Promise.race([connectPromise, timeoutPromise]);

    // Verify connection
    console.log("✅ [NATIVE] Connected to MongoDB");
    
    const admin = client.db("admin");
    const result = await admin.command({ ping: 1 });
    console.log("✅ [NATIVE] Ping successful");

    const duration = Date.now() - startTime;
    console.log(`✅ [NATIVE] Connection time: ${duration}ms`);

    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║     Native Driver Connection Successful!            ║");
    console.log("╚═══════════════════════════════════════════════════════╝\n");

    cachedClient = client;
    return client;

  } catch (error) {
    console.error("\n❌ [NATIVE] Connection failed:", error.message);
    console.error("\nIf native driver also fails, issue is:");
    console.error("  1. MongoDB Atlas cluster down");
    console.error("  2. Network completely blocked");
    console.error("  3. Credentials wrong");
    console.error("  4. Node.js event loop blocked");
    
    throw error;
  }
};

module.exports = connectDb;
module.exports.cachedClient = () => cachedClient;
