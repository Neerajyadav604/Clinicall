const mongoose = require("mongoose");

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
    
    paymentStatus:{
      type:String,
      enum:["paid","unpaid"],
      default:"paid"

    },
    approvalstatus:{
      type:String,
      enum:["APPROVED","REJECTED","PENDING","CANCELLED"],
      default:"PENDING"
    },
    cancellationReason:{
      type:String
    }
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("Appointment", AppointmentSchema);
