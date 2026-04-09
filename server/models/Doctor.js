const mongoose = require("mongoose");
const fieldEncryption = require('mongoose-field-encryption').fieldEncryption;

const DoctorSchema = new mongoose.Schema(
  {
     user:{
type:mongoose.Schema.Types.ObjectId,
required:true,
ref:"User"
     },
    role:{
      type:String,
      default:"doctor"
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
      index: true,
    },
    contact: {
      type: String,
      required: true,
    },
   
    specialization: {
      type: String,
      required: true,
    },
    qualification: {
      type: String,
    },
    experienceYears: {
      type: Number,
      min: 0,
    },
    licenseNumber: {
      type: String,
      unique: true,
    },
    hospitalName: {
      type: String,
    },
    consultationFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    documents: {
      type: [String], // proof URLs
    },
    image:{
      type:String
    },
   verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    adminRemarks: {
      type: String,
    },
    additionalDoctorDetails: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DoctorProfile",
      },
    ],

    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Field encryption temporarily disabled due to key mismatch with existing database data
// TODO: Identify original encryption key and re-enable
// If re-enabling, ensure FIELD_ENC_KEY matches the key used to encrypt licenseNumber and contact fields
// SECURITY FIX: When re-enabling, do NOT use fallback encryption keys
/*
if (!process.env.FIELD_ENC_KEY) {
  throw new Error('FATAL: FIELD_ENC_KEY environment variable is required for PHI encryption');
}
DoctorSchema.plugin(fieldEncryption, {
  fields: ['licenseNumber', 'contact'],
  secret: process.env.FIELD_ENC_KEY,
});
*/

module.exports = mongoose.model("Doctor", DoctorSchema);
