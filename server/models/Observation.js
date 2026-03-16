const mongoose = require('mongoose');
const fieldEncryption = require('mongoose-field-encryption').fieldEncryption;

const ObservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Type of observation: vital signs, lab result, etc
    category: {
      type: String,
      enum: ['vital-signs', 'laboratory', 'imaging', 'survey', 'therapy', 'procedure'],
      default: 'vital-signs'
    },
    // FHIR Code - typically LOINC for labs/vitals
    code: {
      system: {
        type: String,
        enum: ['http://loinc.org', 'http://snomed.info/sct', 'http://clinicall.local/observation'],
        default: 'http://clinicall.local/observation'
      },
      coding: String, // e.g., "8480-6" for Systolic Blood Pressure
      display: String // e.g., "Systolic Blood Pressure"
    },
    // Observation status
    status: {
      type: String,
      enum: ['registered', 'preliminary', 'final', 'amended', 'cancelled', 'entered-in-error', 'unknown'],
      default: 'final'
    },
    // Result value
    value: {
      quantity: {
        value: Number,
        unit: String,
        code: String
      },
      codeableConcept: {
        code: String,
        display: String
      },
      string: String,
      boolean: Boolean
    },
    // Reference range info
    referenceRange: {
      low: Number,
      high: Number,
      unit: String,
      text: String
    },
    // Interpretation (normal, high, low, etc)
    interpretation: {
      type: String,
      enum: ['normal', 'abnormal', 'critical-high', 'critical-low', 'high', 'low', 'positive', 'negative'],
      default: 'normal'
    },
    // Effective date/time (when observation was taken)
    effectiveDate: {
      type: Date,
      required: true,
      index: true
    },
    // Who observed (doctor/technician)
    performer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    // Additional notes or comments
    notes: String,
    // Component observations (e.g., systolic and diastolic BP)
    components: [
      {
        code: {
          coding: String,
          display: String
        },
        value: {
          quantity: {
            value: Number,
            unit: String
          }
        }
      }
    ]
  },
  { timestamps: true }
);

// Index for finding observations by date range
ObservationSchema.index({ userId: 1, effectiveDate: -1 });
ObservationSchema.index({ userId: 1, category: 1, effectiveDate: -1 });

// Encrypt sensitive fields
if (!process.env.FIELD_ENC_KEY) {
  throw new Error('FATAL: FIELD_ENC_KEY environment variable is required for PHI encryption');
}
ObservationSchema.plugin(fieldEncryption, {
  fields: ['notes'],
  secret: process.env.FIELD_ENC_KEY
});

module.exports = mongoose.model('Observation', ObservationSchema);
