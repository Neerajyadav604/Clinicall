const mongoose = require("mongoose");
const connectDb = require("../config/Database");
const User = require("../models/User");

// This will check the admin account and ensure role is properly set
const verifyAndFixAdminRole = async () => {
  try {
    await connectDb();
    console.log("Connected to database\n");

    console.log("=" .repeat(60));
    console.log("ADMIN ROLE VERIFICATION SCRIPT");
    console.log("=" .repeat(60));

    // Find all admin users (check both role and roles fields)
    const adminUsers = await User.find({
      $or: [
        { role: "admin" },
        { role: "ADMIN" },
        { roles: "admin" },
        { roles: "ADMIN" }
      ]
    }).select("_id email fullName role roles");

    console.log(`\n📋 Found ${adminUsers.length} admin user(s):\n`);

    if (adminUsers.length === 0) {
      console.log("❌ NO ADMIN USERS FOUND!");
      console.log("\nTo create an admin user, you need to:");
      console.log("  1. Have a user account");
      console.log("  2. Manually update it with: role: 'admin', roles: ['admin']");
      console.log("  3. Or use the promoteToAdmin.js script\n");
      process.exit(0);
    }

    // Check and fix each admin user
    for (let i = 0; i < adminUsers.length; i++) {
      const user = adminUsers[i];
      console.log(`User ${i + 1}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Full Name: ${user.fullName}`);
      console.log(`  Current role (string): ${user.role || "NOT SET"}`);
      console.log(`  Current roles (array): [${(user.roles || []).join(", ") || "EMPTY"}]`);

      // Check if role needs fixing
      let needsFix = false;
      
      if (user.role !== "admin") {
        console.log(`  ⚠️  role field is '${user.role}' (should be 'admin')`);
        needsFix = true;
      }

      if (!Array.isArray(user.roles) || !user.roles.includes("admin")) {
        console.log(`  ⚠️  roles array missing 'admin'`);
        needsFix = true;
      }

      if (needsFix) {
        console.log(`  🔧 FIXING...`);
        user.role = "admin";
        user.roles = ["admin"];
        await user.save();
        console.log(`  ✅ FIXED!\n`);
      } else {
        console.log(`  ✅ Role is correct!\n`);
      }
    }

    // Verify fix worked
    console.log("=" .repeat(60));
    console.log("VERIFICATION AFTER FIX:");
    console.log("=" .repeat(60) + "\n");

    for (let i = 0; i < adminUsers.length; i++) {
      const user = await User.findById(adminUsers[i]._id);
      console.log(`User ${i + 1}: ${user.email}`);
      console.log(`  role: ${user.role}`);
      console.log(`  roles: [${user.roles.join(", ")}]\n`);
    }

    console.log("=====================================");
    console.log("✅ ADMIN ROLE VERIFICATION COMPLETE");
    console.log("=====================================\n");
    console.log("📝 NEXT STEPS:");
    console.log("  1. Log OUT of your application");
    console.log("  2. Log IN again with your admin account");
    console.log("  3. Your new JWT token will have the admin role");
    console.log("  4. Admin routes should now work!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
};

verifyAndFixAdminRole();
