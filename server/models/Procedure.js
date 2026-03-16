const mongoose = require('mongoose');
const mongooseFieldEncryption = require('mongoose-field-encryption');

const procedureSchema = new mongoose.Schema(
  {
    user_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctor_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    display: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['preparation', 'in-progress', 'not-done', 'on-hold', 'stopped', 'completed', 'entered-in-error', 'unknown'],
      default: 'completed',
      index: true,
    },
    performedDate: {
      type: Date,
      required: true,
    },
    bodySite: {
      type: String,
    },
    outcome: {
      type: String,
    },
    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Apply field encryption for PHI
procedureSchema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['note', 'outcome'],
  secret: process.env.FIELD_ENC_KEY,
});

module.exports = mongoose.model('Procedure', procedureSchema);
