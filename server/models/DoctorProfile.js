const mongoose = require("mongoose");
const { Schema } = mongoose;

const DoctorProfileSchema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      index: true,
    },
    clinicAddress: {
      type: String,
      trim: true,
    },
    availableDays: {
      type: [String],
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    availableHours: {
      from: {
        type: String,
        trim: true,
      },
      to: {
        type: String,
        trim: true,
      },
    },
    consultationFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    languages: {
      type: [String],
      trim: true,
    },
   
    bio: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorProfile", DoctorProfileSchema);
