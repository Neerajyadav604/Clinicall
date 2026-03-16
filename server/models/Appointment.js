const mongoose = require("mongoose");
const fieldEncryption = require('mongoose-field-encryption').fieldEncryption;

const AppointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "NOT SCHEDULED"],
      default: "NOT SCHEDULED",
    },
    reason: {
      type: String,
    },
    
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    consultationStatus: {
      type: String,
      enum: ["locked", "active", "completed"],
      default: "locked",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    approvalstatus:{
      type:String,
      enum:["APPROVED","REJECTED","PENDING","CANCELLED"],
      default:"PENDING"
    },
    cancellationReason:{
      type:String
    },
    consultationMode:{
      type:String,
      enum:["online","offline"],
      default:null
    },
    isChatEnabled:{
      type:Boolean,
      default:false
    }
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

// Encrypt sensitive fields
if (!process.env.FIELD_ENC_KEY) {
  throw new Error('FATAL: FIELD_ENC_KEY environment variable is required for PHI encryption');
}
AppointmentSchema.plugin(fieldEncryption, {
  fields: ['reason', 'cancellationReason'],
  secret: process.env.FIELD_ENC_KEY,
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
