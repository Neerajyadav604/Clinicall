const mongoose = require('mongoose');
const mongooseFieldEncryption = require('mongoose-field-encryption');

const diagnosticReportSchema = new mongoose.Schema(
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
      enum: ['registered', 'partial', 'preliminary', 'final', 'amended', 'corrected', 'appended', 'cancelled', 'entered-in-error', 'unknown'],
      default: 'final',
      index: true,
    },
    effectiveDate: {
      type: Date,
    },
    issued: {
      type: Date,
      default: Date.now,
    },
    result: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Observation',
      },
    ],
    conclusion: {
      type: String,
    },
    attachment: {
      contentType: String,
      url: String,
      title: String,
    },
  },
  {
    timestamps: true,
  }
);

// Apply field encryption for PHI
diagnosticReportSchema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['conclusion'],
  secret: process.env.FIELD_ENC_KEY,
});

module.exports = mongoose.model('DiagnosticReport', diagnosticReportSchema);
