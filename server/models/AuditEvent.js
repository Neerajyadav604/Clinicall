const mongoose = require("mongoose");

const auditEventSchema = new mongoose.Schema(
  {
    // FHIR AuditEvent structure
    type: {
      system: String,
      code: String,
      display: String,
    },
    subtype: [
      {
        system: String,
        code: String,
        display: String,
      },
    ],
    action: {
      type: String,
      enum: ["C", "R", "U", "D", "E"], // Create, Read, Update, Delete, Execute
      required: true,
    },
    recorded: {
      type: Date,
      default: Date.now,
      required: true,
    },
    outcome: {
      type: String,
      enum: ["0", "4", "8", "12"], // 0=success, 4=minor failure, 8=serious failure, 12=major failure
      default: "0",
    },
    outcomeDesc: String,
    
    // Who performed the action
    agent: [
      {
        type: {
          system: String,
          code: String,
          display: String,
        },
        name: String,
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userRole: String, // "patient", "doctor", "hospital_admin", "admin"
        requestor: Boolean,
        media: String,
        network: {
          address: String,
          type: String, // "1" = IPv4, "IPv4", "IPv6", etc.
        },
      },
    ],
    
    // What was accessed
    entity: [
      {
        type: {
          system: String,
          code: String,
          display: String,
        },
        role: {
          system: String,
          code: String,
          display: String,
        },
        reference: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "entity.referenceModel",
        },
        referenceModel: String, // "Condition", "Observation", etc.
        name: String,
        description: String,
        query: String,
        detail: [
          {
            type: String,
            value: String,
          },
        ],
      },
    ],
    
    source: {
      site: String,
      observer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      type: [
        {
          system: String,
          code: String,
          display: String,
        },
      ],
    },
    
    // Additional context
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    resourceType: String, // "Condition", "Observation", etc.
    resourceId: mongoose.Schema.Types.ObjectId,
    consentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consent",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
auditEventSchema.index({ patientId: 1, recorded: -1 });
auditEventSchema.index({ action: 1, recorded: -1 });
auditEventSchema.index({ "agent.userId": 1, recorded: -1 });

module.exports = mongoose.model("AuditEvent", auditEventSchema);
