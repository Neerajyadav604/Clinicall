const mongoose = require('mongoose');
const mongooseFieldEncryption = require('mongoose-field-encryption');

const medicationRequestSchema = new mongoose.Schema(
  {
    medication_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: true,
      index: true,
    },
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
    status: {
      type: String,
      enum: ['active', 'completed', 'stopped', 'cancelled', 'on-hold', 'unknown', 'entered-in-error'],
      default: 'active',
      index: true,
    },
    intent: {
      type: String,
      enum: ['order', 'plan', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option'],
      default: 'order',
    },
    dosageInstruction: {
      text: String,
      dose: {
        value: Number,
        unit: String,
      },
      frequency: {
        value: Number,
        unit: {
          type: String,
          enum: ['per-day', 'per-week', 'per-month', 'per-hour', 'once', 'twice', 'three-times'],
        },
      },
      route: {
        type: String,
        enum: ['oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'rectal', 'sublingual', 'transdermal', 'nasal', 'other'],
      },
      duration: {
        value: Number,
        unit: {
          type: String,
          enum: ['day', 'week', 'month', 'year'],
        },
      },
    },
    authoredOn: {
      type: Date,
      default: Date.now,
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
medicationRequestSchema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['dosageInstruction', 'note'],
  secret: process.env.FIELD_ENC_KEY,
});

module.exports = mongoose.model('MedicationRequest', medicationRequestSchema);
