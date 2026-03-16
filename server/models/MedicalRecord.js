const mongoose = require("mongoose");

const MedicalRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsultationSession",
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recordType: {
      type: String,
      enum: ["prescription", "lab_report", "diagnosis", "vitals"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    
    // For prescriptions: medication name, dosage, frequency
    medication: {
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String,
    },
    
    // For lab reports: test name, result, reference range
    labTest: {
      testName: String,
      result: String,
      unit: String,
      referenceRange: String,
      status: String, // normal, abnormal, critical
    },
    
    // For vitals: temperature, blood pressure, heart rate, etc.
    vitals: {
      temperature: String, // Celsius/Fahrenheit
      bloodPressure: String, // systolic/diastolic
      heartRate: String, // BPM
      respiratoryRate: String, // breaths per minute
      oxygenSaturation: String, // SpO2 %
      weight: String, // kg or lbs
      height: String, // cm or inches
    },
    
    // For diagnoses/general notes
    notes: String,
    
    attachmentUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MedicalRecord", MedicalRecordSchema);
