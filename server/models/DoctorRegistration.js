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
      unique: true,
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
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
  }
);

module.exports = mongoose.model(
  "DoctorRegistration",
  DoctorRegistrationSchema
);
