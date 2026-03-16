const mongoose = require('mongoose');
const mongooseFieldEncryption = require('mongoose-field-encryption');

const immunizationSchema = new mongoose.Schema(
  {
    user_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vaccineCode: {
      type: String,
      required: true,
    },
    vaccineDisplay: {
      type: String,
      required: true,
    },
    occurrenceDate: {
      type: Date,
      required: true,
      index: true,
    },
    lotNumber: {
      type: String,
    },
    site: {
      type: String,
      enum: ['LA', 'RA', 'RG', 'LG', 'LU', 'RU', 'LL', 'RL', 'other'],
    },
    route: {
      type: String,
      enum: ['intramuscular', 'subcutaneous', 'intravenous', 'oral', 'nasal', 'percutaneous', 'intradermal', 'other'],
    },
    doseQuantity: {
      value: Number,
      unit: String,
    },
    status: {
      type: String,
      enum: ['completed', 'entered-in-error', 'not-done'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

// Apply field encryption for PHI
immunizationSchema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['vaccineCode', 'vaccineDisplay', 'lotNumber'],
  secret: process.env.FIELD_ENC_KEY,
});

module.exports = mongoose.model('Immunization', immunizationSchema);
