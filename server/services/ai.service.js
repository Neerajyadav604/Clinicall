const phi3 = require('./phi3.service');
const Doctor = require('../models/Doctor');

/**
 * Analyze symptom text along with optional history and return urgency & doctor rankings
 */
exports.analyzeSymptoms = async (symptomsText, historyText) => {
  // construct prompt for phi3
  let prompt = `You are a medical AI.
Patient history: ${historyText || 'None'}
Symptoms: ${symptomsText}
Provide:
1. urgency level (Low/Medium/Emergency)
2. list of doctor specializations ranked with confidence (json array)
`;
  const response = await phi3.request({ model: 'clinicall-ai', prompt });
  // chat wrapper returns object with message.content
  const text = response?.message?.content || '';
  // parse output (assuming JSON)
  let result;
  try {
    result = JSON.parse(text);
  } catch (e) {
    // fallback simple parse
    result = { urgency: 'Medium', doctors: [] };
  }
  // map doctor specializations to actual doctor documents with score
  const doctors = [];
  if (result.doctors && result.doctors.length) {
    for (let item of result.doctors) {
      // item might have specialization and score
      const docs = await Doctor.find({ specialization: item.specialization, verificationStatus: 'APPROVED' }).limit(10);
      docs.forEach(d => doctors.push({ doctor: d, score: item.score }));
    }
  }
  return { urgency: result.urgency || 'Medium', doctors };
};

exports.chatbot = async (userQuery, contextText) => {
  const prompt = `You are a health assistant. Context: ${contextText || ''}
User: ${userQuery}
Assistant:`;
  // use the same phi3:mini model since custom 'clinicall-chat' is not available
  const resp = await phi3.request({ model: 'phi3:mini', prompt });
  return resp?.message?.content || '';
};