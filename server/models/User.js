const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    
 role: {
  type: String,
  enum: ["USER", "ADMIN","DOCTOR"],
  default: "USER",
},

fullName:{
type:String
  } ,

  email: { type: String, unique: true },

  contact: { type:String},

  password: {type:String},

  additionalDetails: { type: mongoose.Schema.Types.ObjectId, ref: "userProfile" }, 
  doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "doctorProfile" },

  
  token :{ type: String },


},{timestamps:true})

module.exports = mongoose.model('User',UserSchema)