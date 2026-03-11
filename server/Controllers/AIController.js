const aiService = require('../services/ai.service');
const SymptomAnalysis = require('../models/SymptomAnalysis');

exports.symptomAnalysis = async (req, res, next) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms) return res.status(400).json({ success: false, message: 'Symptoms required' });
    // gather patient history from past EHR or appointments
    const historyData = await SymptomAnalysis.find({ userId: req.user.id }).sort({createdAt: -1}).limit(5);
    const historyText = historyData.map(h=>h.symptoms).join('\n');
    const analysis = await aiService.analyzeSymptoms(symptoms, historyText);
    // persist
    await SymptomAnalysis.create({ userId: req.user.id, symptoms, urgency: analysis.urgency, recommendedDoctors: analysis.doctors.map(d=>({doctorId:d.doctor._id, score:d.score})) });
    res.json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
};

exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const context = req.body.context || '';
    const reply = await aiService.chatbot(message, context);
    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
};