const AuditLog = require('../models/AuditLog');

exports.log = async (actorId, action, target=null, metadata={}) => {
  try {
    await AuditLog.create({ actor: actorId, action, target, metadata });
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
};
