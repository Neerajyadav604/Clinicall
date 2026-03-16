const mongoose = require('mongoose');
const fieldEncryption = require('mongoose-field-encryption').fieldEncryption;

const AllergyIntoleranceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Type: allergy or intolerance
    type: {
      type: String,
      enum: ['allergy', 'intolerance'],
      default: 'allergy'
    },
    // Category: medication, food, environment, biologic
    category: {
      type: String,
      enum: ['medication', 'food', 'environment', 'biologic', 'other'],
      default: 'medication'
    },
    // The substance code (SNOMED-CT or other)
    substance: {
      code: String, // e.g., "J07AX" for vaccine code
      display: String, // e.g., "Penicillin G"
      system: {
        type: String,
        enum: ['http://snomed.info/sct', 'http://www.nlm.nih.gov/research/umls/rxnorm', 'http://clinicall.local/substance'],
        default: 'http://clinicall.local/substance'
      }
    },
    // Clinical status
    clinicalStatus: {
      type: String,
      enum: ['active', 'inactive', 'resolved'],
      default: 'active'
    },
    // Verification status
    verificationStatus: {
      type: String,
      enum: ['unconfirmed', 'confirmed', 'refuted', 'entered-in-error'],
      default: 'confirmed'
    },
    // Criticality
    criticality: {
      type: String,
      enum: ['low', 'high', 'unable-to-assess'],
      default: 'low'
    },
    // Reaction details
    reaction: [
      {
        substance: String, // manifestation substance
        manifestation: [String], // e.g., ["fever", "rash", "anaphylaxis"]
        severity: {
          type: String,
          enum: ['mild', 'moderate', 'severe'],
          default: 'moderate'
        },
        onset: Date,
        exposureRoute: String, // e.g., "oral", "intravenous", "intramuscular"
        notes: String
      }
    ],
    // When allergy was recorded
    recordedDate: {
      type: Date,
      default: Date.now
    },
    // Who recorded the allergy
    recorder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    // Last occurrence
    lastOccurrence: Date,
    // Additional notes
    notes: String
  },
  { timestamps: true }
);

// Index for quick lookup
AllergyIntoleranceSchema.index({ userId: 1, clinicalStatus: 1 });

// Encrypt sensitive fields
if (!process.env.FIELD_ENC_KEY) {
  throw new Error('FATAL: FIELD_ENC_KEY environment variable is required for PHI encryption');
}
AllergyIntoleranceSchema.plugin(fieldEncryption, {
  fields: ['substance.display', 'notes', 'reaction'],
  secret: process.env.FIELD_ENC_KEY
});

module.exports = mongoose.model('AllergyIntolerance', AllergyIntoleranceSchema);
