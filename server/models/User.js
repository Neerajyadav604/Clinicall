const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    
 role: {
  type: String,
  enum: ["user", "admin", "doctor"],
  default: "user",
},

fullName:{
type:String
  } ,

  email: { type: String, unique: true },

  contact: { type:String},

  password: {type:String},

  // security fields
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },

  additionalDetails: { type: mongoose.Schema.Types.ObjectId, ref: "userProfile" }, 
  doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "doctorProfile" },

  // URL of the user’s display picture; persisted on user document
  image: { type: String, trim: true, default: null },
  
  token :{ type: String },


},{timestamps:true})

module.exports = mongoose.model('User',UserSchema)
