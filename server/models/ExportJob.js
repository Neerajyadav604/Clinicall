const mongoose = require("mongoose");

const exportJobSchema = new mongoose.Schema(
  {
    user_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requestedBy_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "failed"],
      default: "pending",
    },
    resourceTypes: [
      {
        type: String,
        enum: [
          "Patient",
          "Practitioner",
          "Organization",
          "Encounter",
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
    outputUrls: {
      type: Map,
      of: String, // { "Condition": "https://...", "Observation": "https://..." }
      default: new Map(),
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: Date,
    completedAt: Date,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      index: { expireAfterSeconds: 0 }, // Auto-delete when expiresAt is reached
    },
    errorMessage: String,
  },
  {
    timestamps: true,
  }
);

// Index for fast lookup by user and status
exportJobSchema.index({ user_ref: 1, status: 1 });
exportJobSchema.index({ requestedAt: 1 });

module.exports = mongoose.model("ExportJob", exportJobSchema);
