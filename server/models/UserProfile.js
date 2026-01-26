const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema(
  {
    userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      required:true

    },
    dob: { type: Date, default: null },
    gender: { type: String, trim: true, default: null },
    address: { type: String, trim: true, default: null },
    bloodGroup: { type: String, trim: true, default: null },
    allergies: { type: [String], default: [] },
    medicalHistory: {
      type:[String],
      default:[],
     
    },
    medications: { type: [String], default: [] },
    emergencyContact: {
     type:String
    },
    insurance: {
      provider: { type: String, trim: true, default: null },
      policyNumber: { type: String, trim: true, default: null }
    },
    image: { type: String, trim: true, default: null }
  },
  
);

module.exports = mongoose.model("userProfile",UserProfileSchema)