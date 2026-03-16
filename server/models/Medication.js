const mongoose = require('mongoose');
const mongooseFieldEncryption = require('mongoose-field-encryption');

const medicationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      lowercase: true,
    },
    display: {
      type: String,
      required: true,
    },
    form: {
      type: String,
      enum: ['tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 'powder', 'patch', 'other'],
      default: 'tablet',
    },
    strength: {
      type: String,
    },
    unit: {
      type: String,
      enum: ['mg', 'g', 'mcg', 'ml', 'unit', 'mEq', '%', 'other'],
    },
    manufacturer: {
      type: String,
    },
    user_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply field encryption for PHI
medicationSchema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['code', 'display', 'strength'],
  secret: process.env.FIELD_ENC_KEY,
});

module.exports = mongoose.model('Medication', medicationSchema);
