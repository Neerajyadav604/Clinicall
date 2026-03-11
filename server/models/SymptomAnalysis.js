const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  symptoms: { type: String, required: true },
  urgency: { type: String, enum:['Low','Medium','Emergency'], default:'Medium' },
  recommendedDoctors: [
    {
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      score: Number
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SymptomAnalysis', analysisSchema);