const mongoose = require('mongoose');
const fieldEncryption = require('mongoose-field-encryption').fieldEncryption;

const ConditionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // FHIR Code - typically ICD-10 or SNOMED-CT
    code: {
      system: {
        type: String,
        enum: ['http://hl7.org/fhir/sid/icd-10', 'http://hl7.org/fhir/sid/icd-10-cm', 'http://snomed.info/sct', 'http://clinicall.local/condition'],
        default: 'http://clinicall.local/condition'
      },
      coding: String, // e.g., "E11.9" for Type 2 Diabetes
      display: String // e.g., "Type 2 Diabetes Mellitus"
    },
    // Clinical status
    clinicalStatus: {
      type: String,
      enum: ['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved'],
      default: 'active'
    },
    // Verification status
    verificationStatus: {
      type: String,
      enum: ['unconfirmed', 'provisional', 'differential', 'confirmed', 'refuted', 'entered-in-error'],
      default: 'unconfirmed'
    },
    // Severity
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'moderate'
    },
    // Additional notes
    notes: String,
    // Date when condition started
    onsetDate: Date,
    // Date when condition ended (if applicable)
    abatementDate: Date,
    // Diagnosed by doctor
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    // When condition was recorded
    recordedDate: {
      type: Date,
      default: Date.now
    },
    // Associated appointment (for consultation context)
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true
    }
  },
  { timestamps: true }
);

// Encrypt sensitive fields
if (!process.env.FIELD_ENC_KEY) {
  throw new Error('FATAL: FIELD_ENC_KEY environment variable is required for PHI encryption');
}
ConditionSchema.plugin(fieldEncryption, {
  fields: ['notes'],
  secret: process.env.FIELD_ENC_KEY
});

module.exports = mongoose.model('Condition', ConditionSchema);
