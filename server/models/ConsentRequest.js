const mongoose = require("mongoose");
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;

const consentRequestSchema = new mongoose.Schema(
  {
    doctor_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patient_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    appointment_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
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
    message: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    respondedAt: Date,
  },
  {
    timestamps: false,
  }
);

// Apply field encryption to message field BEFORE pre-hooks - wrapped in try/catch
try {
  consentRequestSchema.plugin(mongooseFieldEncryption, {
    fields: ["message"],
    secret: process.env.ENCRYPTION_KEY || "default_secret_key",
  });
  console.log('✅ [ConsentRequest] Field encryption plugin applied');
} catch (encryptionErr) {
  console.warn('⚠️  [ConsentRequest] Could not apply field encryption:', encryptionErr.message);
  console.warn('   ConsentRequest will work without message encryption');
}

// Pre-save hook to set expiresAt to 48 hours from now if not already set
// Note: This must be AFTER plugin application to avoid hook conflicts
consentRequestSchema.pre("save", function () {
  if (!this.expiresAt) {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 48);
    this.expiresAt = expirationDate;
  }
});

// Compound index for fast lookups
consentRequestSchema.index({ patient_ref: 1, status: 1 });
consentRequestSchema.index({ doctor_ref: 1, status: 1 });

module.exports = mongoose.model("ConsentRequest", consentRequestSchema);
