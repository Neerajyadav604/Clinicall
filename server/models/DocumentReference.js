const mongoose = require("mongoose");
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;

const documentReferenceSchema = new mongoose.Schema(
  {
    user_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctor_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      system: String,
      code: {
        type: String,
        required: true, // LOINC code
      },
      display: String,
    },
    status: {
      type: String,
      enum: ["current", "superseded", "entered-in-error"],
      default: "current",
    },
    docStatus: {
      type: String,
      enum: ["preliminary", "final", "amended"],
      default: "final",
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    description: String,
    content: [
      {
        attachment: {
          contentType: String, // "application/pdf", "image/jpeg", etc.
          url: {
            type: String, // Cloudinary URL
            required: true,
          },
          title: String,
          size: Number, // bytes
          hash: String, // SHA-256 hash for integrity
        },
      },
    ],
    context: {
      encounter_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
      period: {
        start: Date,
        end: Date,
      },
      practiceSetting: {
        system: String,
        code: String,
        display: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Apply field encryption
documentReferenceSchema.plugin(mongooseFieldEncryption, {
  fields: ["description"],
  secret: process.env.ENCRYPTION_KEY || "default_secret_key",
});

// Indexes for efficient querying
documentReferenceSchema.index({ user_ref: 1, status: 1 });
documentReferenceSchema.index({ doctor_ref: 1 });
documentReferenceSchema.index({ "type.code": 1 });
documentReferenceSchema.index({ date: -1 });

module.exports = mongoose.model("DocumentReference", documentReferenceSchema);
