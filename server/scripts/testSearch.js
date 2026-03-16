require('../config/Database')();

const SYMPTOM_MAP = [
  { keywords: ['skin','rash','acne','itch','eczema','hair','nail','dermat'], specialty: 'dermatolog' },
  { keywords: ['brain','neuro','nerve','seizure','headache','migraine','stroke'], specialty: 'neurolog' },
  { keywords: ['heart','chest','cardiac','cardio','palpitation'], specialty: 'cardiolog' },
  { keywords: ['general','fever','cold','flu','fatigue'], specialty: 'general' },
];

function mapQueryToSpecialties(query) {
  const lower = query.toLowerCase();
  const matched = new Set();
  for (const entry of SYMPTOM_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) matched.add(entry.specialty);
  }
  return Array.from(matched);
}

setTimeout(async () => {
  const Doctor = require('../models/Doctor');

  const tests = [
    'skin rash',
    'my skin is itching',
    'headache and dizziness',
    'nervous system',
    'dermatologist',
    'neurology',
    'heart pain',
    'general physician',
  ];

  for (const q of tests) {
    const mapped = mapQueryToSpecialties(q);
    let doctors = [];
    if (mapped.length > 0) {
      doctors = await Doctor.find({
        verificationStatus: 'APPROVED',
        specialization: { $in: mapped.map(s => new RegExp(s, 'i')) },
      });
    }
    console.log(`"${q}" -> mapped: [${mapped}] -> doctors: [${doctors.map(d => d.fullName).join(', ') || 'none'}]`);
  }

  process.exit(0);
}, 1500);
