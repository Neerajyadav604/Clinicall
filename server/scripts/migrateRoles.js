const mongoose = require("mongoose");
const connectDb = require("../config/Database");
const User = require("../models/User");

const ROLE_MAP = {
  USER: "user",
  DOCTOR: "doctor",
  ADMIN: "admin",
};

const migrateRoles = async () => {
  try {
    await connectDb();

    const result = await User.updateMany(
      { role: { $in: Object.keys(ROLE_MAP) } },
      [
        {
          $set: {
            role: {
              $switch: {
                branches: Object.entries(ROLE_MAP).map(([from, to]) => ({
                  case: { $eq: ["$role", from] },
                  then: to,
                })),
                default: "$role",
              },
            },
          },
        },
      ]
    );

    const matched = result.matchedCount ?? result.n ?? 0;
    const modified = result.modifiedCount ?? result.nModified ?? 0;

    console.log(`Role migration complete. Matched: ${matched}, Modified: ${modified}`);
  } catch (error) {
    console.error("Role migration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

migrateRoles();
