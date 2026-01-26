const mongoose = require("mongoose");

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

module.exports = mongoose.model("Doctor", DoctorSchema);
