const mongoose = require("mongoose");
const connectDb = require("../config/Database");
const User = require("../models/User");

// Replace with your admin email
const ADMIN_EMAIL = "neerajyadav72005@gmail.com";

const promoteToAdmin = async () => {
  try {
    await connectDb();
    console.log("Connected to database");

    const user = await User.findOne({ email: ADMIN_EMAIL });
    if (!user) {
      console.error(`❌ User with email "${ADMIN_EMAIL}" not found`);
      process.exit(1);
    }

    console.log(`\n📋 Current user data:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Roles: [${user.roles.join(', ')}]`);

    // Ensure admin role
    if (!user.roles.includes("admin")) {
      user.roles = ["admin"];
    }
    user.role = "admin";

    await user.save();

    console.log(`\n✅ User promoted to admin!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Roles: [${user.roles.join(', ')}]`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to promote user:", error);
    process.exit(1);
  }
};

promoteToAdmin();
