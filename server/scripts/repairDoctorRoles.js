/**
 * repairDoctorRoles.js
 *
 * Finds every User whose matching Doctor record is APPROVED but whose
 * roles array doesn't contain "doctor", then fixes both role fields.
 */
require('../config/Database')();

setTimeout(async () => {
  const User   = require('../models/User');
  const Doctor = require('../models/Doctor');

  const approvedDoctors = await Doctor.find({ verificationStatus: 'APPROVED' }).select('user');
  const userIds = approvedDoctors.map(d => d.user);

  const users = await User.find({ _id: { $in: userIds } });
  const rolesPriority = ['admin', 'hospital_admin', 'doctor', 'user'];

  let fixed = 0;
  for (const user of users) {
    let changed = false;

    if (!Array.isArray(user.roles)) {
      user.roles = [user.role || 'user'];
      changed = true;
    }

    if (!user.roles.includes('doctor')) {
      user.roles.push('doctor');
      changed = true;
    }

    // Sync singular role field
    const correctRole = rolesPriority.find(r => user.roles.includes(r)) || 'user';
    if (user.role !== correctRole) {
      user.role = correctRole;
      changed = true;
    }

    if (changed) {
      await user.save();
      console.log(`✅ Fixed: ${user.email} → role: ${user.role}, roles: [${user.roles}]`);
      fixed++;
    } else {
      console.log(`✔  OK:    ${user.email} → role: ${user.role}, roles: [${user.roles}]`);
    }
  }

  console.log(`\nDone. Fixed ${fixed} of ${users.length} doctor user(s).`);
  process.exit(0);
}, 1500);
