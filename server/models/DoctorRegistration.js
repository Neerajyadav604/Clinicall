const mongoose = require("mongoose");

const DoctorRegistrationSchema = new mongoose.Schema(
  {
 user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true
},
 fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    contact: {
      type: String, // string is better than Number for phone
      required: true,
    },
   
    specialization: {
      type: String,
      required: true,
    },
    qualification: {
      type: String,
      required: true,
    },
    experienceYears: {
      type: Number,
      min: 0,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    hospitalName: {
      type: String,
    },
    documents: {
      type: [String], // uploaded proof URLs
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    adminRemarks: {
      type: String,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },

    // ── HOSPITAL ASSOCIATION (optional)
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      default: null,
    },
    hospitalName: { type: String, default: null },
    hospitalStatus: {
      type: String,
      enum: ["pending_hospital", "approved_hospital", "rejected_hospital"],
      default: "pending_hospital",
    },
    hospitalRejectionReason: { type: String, default: null },
    hospitalReviewedAt:      { type: Date, default: null },
    
    // ── MULTI-ROLE SUPPORT
    isHospitalOwnersApplication: {
      type: Boolean,
      default: false, // true if registrant owns the hospital they're registering with
    },
    autoApprovedByHospital: {
      type: Boolean,
      default: false, // true if hospital approval automatically granted (hospital owner scenario)
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
  }
);

DoctorRegistrationSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { verificationStatus: { $in: ["PENDING", "APPROVED"] } },
  }
);

module.exports = mongoose.model(
  "DoctorRegistration",
  DoctorRegistrationSchema
);
