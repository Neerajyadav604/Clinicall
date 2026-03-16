const { getDoctorSpecialties } = require('../services/phi3.service');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// Hardcoded fallback: common symptom/keyword → specialty keywords to search in DB
const SYMPTOM_MAP = [
  { keywords: ['skin','rash','acne','itch','eczema','psoriasis','hair','nail','dermat'], specialty: 'dermatolog' },
  { keywords: ['heart','chest pain','cardiac','cardio','palpitation','arrhythmia','blood pressure'], specialty: 'cardiolog' },
  { keywords: ['brain','neuro','nerve','seizure','headache','migraine','stroke','memory','alzheimer'], specialty: 'neurolog' },
  { keywords: ['bone','joint','knee','spine','ortho','fracture','back pain','arthritis'], specialty: 'orthop' },
  { keywords: ['child','pediatric','baby','infant','toddler','kid'], specialty: 'pediatric' },
  { keywords: ['eye','vision','glasses','retina','cataract','opthal'], specialty: 'ophthalmol' },
  { keywords: ['ear','nose','throat','ent','sinus','tonsil','hearing'], specialty: 'ent' },
  { keywords: ['stomach','gastro','digestion','ibs','liver','ulcer','bowel','colon','acid'], specialty: 'gastroenterol' },
  { keywords: ['lung','breath','respiratory','asthma','cough','pneumonia','copd'], specialty: 'pulmonol' },
  { keywords: ['diabetes','thyroid','hormone','endocrine','obesity'], specialty: 'endocrinol' },
  { keywords: ['cancer','tumor','oncol','chemotherapy'], specialty: 'oncol' },
  { keywords: ['kidney','renal','urine','urolog','bladder','prostate'], specialty: 'urolog' },
  { keywords: ['woman','women','pregnancy','gynec','uterus','period','menstrual','ovary'], specialty: 'gynecol' },
  { keywords: ['mental','anxiety','depression','psychiatr','psycholog','stress','mood'], specialty: 'psychiatr' },
  { keywords: ['teeth','dental','gum','mouth','tooth'], specialty: 'dent' },
  { keywords: ['general','fever','cold','flu','fatigue','weakness','viral','infection'], specialty: 'general' },
];

/**
 * Map the raw query to specialty search strings using the symptom table.
 */
function mapQueryToSpecialties(query) {
  const lower = query.toLowerCase();
  const matched = new Set();
  for (const entry of SYMPTOM_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) {
      matched.add(entry.specialty);
    }
  }
  return Array.from(matched);
}

/**
 * Build a list of approved doctors matching specialties extracted from an AI result,
 * falling back to symptom-map then raw text search.
 */
async function findDoctorsBySpecialties(specialties, fallbackQuery) {
  // 1. Try AI-extracted specialties with partial match
  if (specialties.length > 0) {
    // Strip trailing "ist"/"ologist" etc. so "Cardiologist" matches "Cardiology" and vice-versa
    const regexes = specialties.map(s => new RegExp(s.replace(/(?:ologist|ologist|ist)$/i, ''), "i"));
    const doctors = await Doctor.find({
      verificationStatus: "APPROVED",
      specialization: { $in: regexes },
    });
    if (doctors.length > 0) return doctors;
  }

  // 2. Symptom-map fallback (Ollama not running or returned nothing)
  const mappedSpecialties = mapQueryToSpecialties(fallbackQuery);
  if (mappedSpecialties.length > 0) {
    const regexes = mappedSpecialties.map(s => new RegExp(s, "i"));
    const doctors = await Doctor.find({
      verificationStatus: "APPROVED",
      specialization: { $in: regexes },
    });
    if (doctors.length > 0) return doctors;
  }

  // 3. Last resort: raw word match on specialization / name
  const words = fallbackQuery.trim().split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return [];
  const wordRegexes = words.map(w => new RegExp(w, "i"));
  return Doctor.find({
    verificationStatus: "APPROVED",
    $or: [
      { specialization: { $in: wordRegexes } },
      { fullName:       { $in: wordRegexes } },
      { hospitalName:   { $in: wordRegexes } },
    ],
  });
}

exports.searchdoctors = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.body;
    const userId = req.user.id;

    // ✅ SECURITY: Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50);  // Max 50 items per page
    const skip = (pageNum - 1) * pageSize;

    if (process.env.NODE_ENV === 'development') {
      console.log("searchdoctors — query:", query, "page:", pageNum, "limit:", pageSize);
    }

    if (!query) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    // ── Step 1: Try AI specialty extraction (Ollama). If it's not running, skip. ──
    let specialties = [];
    let aiResult = null;
    try {
      aiResult = await getDoctorSpecialties(query);
      if (aiResult.conditions && Array.isArray(aiResult.conditions)) {
        const set = new Set();
        aiResult.conditions.forEach(cond => {
          cond.primarySpecialty?.forEach(s => set.add(s));
          cond.relatedSubspecialties?.forEach(s => set.add(s));
        });
        specialties = Array.from(set);
      }
      if (process.env.NODE_ENV === 'development') {
        console.log("AI extracted specialties:", specialties);
      }
    } catch (aiErr) {
      // Ollama not running or model unavailable — fall through to text search
      if (process.env.NODE_ENV === 'development') {
        console.warn("AI specialty extraction failed (Ollama unavailable?), falling back to text search:", aiErr.message);
      }
    }

    // ── Step 2: Query DB (with fallback) ──
    const allDoctors = await findDoctorsBySpecialties(specialties, query);
    if (process.env.NODE_ENV === 'development') {
      console.log(`Found ${allDoctors.length} total APPROVED doctor(s)`);
    }

    // ✅ Apply pagination to search results
    const doctors = allDoctors.slice(skip, skip + pageSize);
    const totalResults = allDoctors.length;
    const totalPages = Math.ceil(totalResults / pageSize);

    // ── Step 3: Attach appointment status for this user ──
    // FIX: Appointment model uses `userId` and `doctorId` — not `user`/`doctor`
    // BUGFIX: Sort by createdAt descending to get the most recent appointment
    // BUGFIX: Only consider PENDING appointments - allows rebooking after APPROVED/COMPLETED
    const appointments = await Appointment.find({
      userId,
      doctorId: { $in: doctors.map(d => d._id) },
      approvalstatus: "PENDING"
    }).sort({ createdAt: -1 });

    const doctorsWithStatus = doctors.map(doc => {
      // FIX: was incorrectly using `a.doc` — field is `a.doctorId`
      const appointment = appointments.find(
        a => a.doctorId.toString() === doc._id.toString()
      );

      let buttonStatus = "Book Appointment";
      if (appointment) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`DEBUG: Found PENDING appointment for doctor ${doc._id}:`, {
            approvalstatus: appointment.approvalstatus,
            status: appointment.status,
            createdAt: appointment.createdAt
          });
        }
        // Only show "Request Sent" if there's a PENDING appointment
        buttonStatus = "Request Sent";
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`DEBUG: No PENDING appointment found for doctor ${doc._id} - button enabled`);
        }
      }

      return { ...doc.toObject(), buttonStatus };
    });

    // ✅ Return paginated results with metadata
    return res.json({ 
      success: true, 
      doctors: doctorsWithStatus,
      pagination: {
        currentPage: pageNum,
        pageSize,
        totalResults,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      aiResult 
    });

  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error("searchdoctors error:", err);
    }
    return res.status(500).json({ success: false, message: "Search failed. Please try again." });
  }
};
