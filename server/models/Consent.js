const mongoose = require("mongoose");
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;

const consentSchema = new mongoose.Schema(
  {
    patient_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    grantedTo_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    grantedToType: {
      type: String,
      enum: ["doctor", "hospital", "researcher"],
      required: true,
    },
    appointment_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
      index: true,
    },
    resourceTypes: [
      {
        type: String,
        enum: [
          "Condition",
          "Observation",
          "AllergyIntolerance",
          "MedicationRequest",
          "DiagnosticReport",
          "Procedure",
          "Immunization",
          "DocumentReference",
        ],
      },
    ],
    purpose: {
      type: String,
      enum: ["treatment", "referral", "research", "operations"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "rejected"],
      default: "active",
    },
    period: {
      start: {
        type: Date,
        required: true,
      },
      end: Date, // Optional - if not provided, consent is indefinite until revoked
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Apply field encryption
consentSchema.plugin(mongooseFieldEncryption, {
  fields: ["purpose", "resourceTypes"],
  secret: process.env.ENCRYPTION_KEY || "default_secret_key",
});

// Index for fast lookup
consentSchema.index({ patient_ref: 1, status: 1 });
consentSchema.index({ grantedTo_ref: 1, status: 1 });
consentSchema.index({ "period.end": 1 });

module.exports = mongoose.model("Consent", consentSchema);
