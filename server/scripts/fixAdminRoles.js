const mongoose = require("mongoose");
const connectDb = require("../config/Database");
const User = require("../models/User");

const fixAdminRoles = async () => {
  try {
    await connectDb();
    console.log("Connected to database");

    // Update all users - ensure role field matches their roles array
    const users = await User.find();
    console.log(`Found ${users.length} total users`);

    let updated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        let needsUpdate = false;

        // Ensure roles array exists
        if (!user.roles || user.roles.length === 0) {
          user.roles = ["user"];
          needsUpdate = true;
        }

        // Determine primary role based on priority
        const rolesPriority = ["admin", "hospital_admin", "doctor", "user"];
        const primaryRole = rolesPriority.find(r => user.roles.includes(r)) || "user";

        // Update role field if different
        if (user.role !== primaryRole) {
          console.log(`Updating user ${user.email}: role "${user.role}" -> "${primaryRole}", roles: [${user.roles}]`);
          user.role = primaryRole;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await user.save();
          updated++;
        }
      } catch (err) {
        console.error(`Error updating user ${user.email}:`, err.message);
        errors++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updated} users`);
    console.log(`   Errors: ${errors}`);
    console.log(`\n   Admin users should now have:`);
    console.log(`   - role: "admin"`);
    console.log(`   - roles: ["admin"]`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

fixAdminRoles();
