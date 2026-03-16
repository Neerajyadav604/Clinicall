const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
// ✅ SECURITY: Use proper XSS sanitization library
let xss;
try {
  xss = require('xss');
} catch (e) {
  // Fallback if xss package not available
  xss = null;
}
const ConsultationSession = require("../models/ConsultationSession");
const MedicalRecord = require("../models/MedicalRecord");
const Appointment = require("../models/Appointment");

/**
 * ✅ FIX 3: Helper function to sanitize strings against XSS attacks
 * Uses proper XSS library if available, falls back to stricter regex
 */
const sanitizeString = (str, maxLength = 500) => {
  if (!str || typeof str !== 'string') return "";
  
  let sanitized;
  
  if (xss) {
    // ✅ Use proper XSS library for robust sanitization
    sanitized = xss(str, {
      whiteList: {},  // No HTML tags allowed
      stripIgnoredTag: true,
      stripLeadingAndTrailingWhitespace: true,
    });
  } else {
    // ✅ Fallback: More robust regex that handles encoded tags and attributes
    // Remove HTML tags, comments, and event handlers
    sanitized = str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')  // Remove iframes
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')  // Remove event handlers (double quoted)
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')  // Remove event handlers (single quoted)
      .replace(/<[^>]*>/g, '')  // Remove all HTML tags
      .replace(/&lt;|&gt;|&quot;|&#x27;|&#/g, ' ')  // Remove encoded tags
      .replace(/javascript:/gi, ' ');  // Remove javascript: protocol
  }
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Start consultation session
 * Doctor initiates the session, updates appointment status to active
 * Emits socket event to patient
 */
exports.startSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // ✅ FIX 1: Guard against undefined req.doctor
    if (!req.doctor?._id) {
      return res.status(401).json({
        success: false,
        message: "Doctor not authenticated",
      });
    }
    
    const doctorId = req.doctor._id;
    const userId = req.user._id;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[👨‍⚕️ CONSULTATION] Starting session for appointment: ${appointmentId}`);
    }

    // Validate appointment exists and belongs to this doctor-patient pair
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not the doctor for this appointment",
      });
    }

    // ✅ FIX 1: Approval status check
    if (appointment.approvalstatus !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Appointment has not been approved yet",
      });
    }

    // ✅ FIX 1: Payment verification
    if (appointment.paymentStatus !== "paid") {
      return res.status(403).json({
        success: false,
        message: "Payment not completed. Cannot start consultation.",
      });
    }

    // ✅ FIX 1: Must be online consultation
    if (appointment.consultationMode !== "online") {
      return res.status(403).json({
        success: false,
        message: "This appointment is not scheduled for online consultation",
      });
    }

    // ✅ FIX 1: Chat must be enabled
    if (!appointment.isChatEnabled) {
      return res.status(403).json({
        success: false,
        message: "Chat is not enabled for this appointment",
      });
    }

    // Update appointment consultation status
    appointment.consultationStatus = "active";
    await appointment.save();

    // Create consultation session
    const session = new ConsultationSession({
      appointmentId,
      doctorId,
      userId: appointment.userId,
      status: "active",
      startedAt: new Date(),
    });

    await session.save();

    // ✅ FIX 4: Audit logging for session start
    const auditTimestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] [${auditTimestamp}] SESSION_STARTED | sessionId: ${session._id} | appointmentId: ${appointmentId} | doctorId: ${doctorId} | userId: ${session.userId}`);

      console.log(`[👨‍⚕️ CONSULTATION] ✅ Session started: ${session._id}`);
    }

    // Emit socket event
    const io = req.app.get("io");
    const roomId = `consultation_${appointmentId}`;
    io.to(roomId).emit("consultation_started", {
      sessionId: session._id,
      doctorId,
      startedAt: session.startedAt,
      appointmentId,
    });

    return res.status(201).json({
      success: true,
      message: "Consultation session started",
      data: {
        sessionId: session._id,
        appointmentId,
        doctorId,
        status: session.status,
        startedAt: session.startedAt,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[👨‍⚕️ CONSULTATION] ❌ Error starting session:`, error.message);
    }
    return res.status(500).json({
      success: false,
      message: "Error starting consultation session",
      error: error.message,
    });
  }
};

/**
 * End consultation session
 * Either doctor or patient can end the session
 * Updates consultation status to completed
 * Emits socket event to both parties
 */
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.roles ? req.user.roles[0].toLowerCase() : (req.user.role || "").toLowerCase();

    if (process.env.NODE_ENV === 'development') {
      console.log(`[👨‍⚕️ CONSULTATION] Ending session: ${sessionId} by ${userRole}`);
    }

    // Find session
    const session = await ConsultationSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Verify user is a participant
    const isDoctor = session.doctorId.toString() === userId.toString();
    const isPatient = session.userId.toString() === userId.toString();

    if (!isDoctor && !isPatient) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this session",
      });
    }

    // Update session
    const endedBy = isDoctor ? "doctor" : "patient";
    session.status = "completed";
    session.endedAt = new Date();
    session.endedBy = endedBy;
    session.duration = Math.floor((session.endedAt - session.startedAt) / 1000); // duration in seconds
    await session.save();

    // Update appointment status
    const appointment = await Appointment.findById(session.appointmentId);
    if (appointment) {
      appointment.consultationStatus = "completed";
      await appointment.save();
    }

    // ✅ FIX 4: Audit logging for session end
    const auditTimestamp = new Date().toISOString();
    const durationMinutes = Math.floor(session.duration / 60);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] [${auditTimestamp}] SESSION_ENDED | sessionId: ${session._id} | endedBy: ${endedBy} | durationMinutes: ${durationMinutes}`);

      console.log(`[👨‍⚕️ CONSULTATION] ✅ Session ended by ${endedBy}`);
    }

    // Emit socket event
    const io = req.app.get("io");
    const roomId = `consultation_${session.appointmentId}`;
    io.to(roomId).emit("consultation_ended", {
      sessionId: session._id,
      endedAt: session.endedAt,
      endedBy,
      duration: session.duration,
    });

    return res.status(200).json({
      success: true,
      message: "Consultation session ended",
      data: {
        sessionId: session._id,
        status: session.status,
        endedAt: session.endedAt,
        endedBy,
        duration: session.duration,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[👨‍⚕️ CONSULTATION] ❌ Error ending session:`, error.message);
    }
    return res.status(500).json({
      success: false,
      message: "Error ending consultation session",
      error: error.message,
    });
  }
};

/**
 * Add medical record during consultation
 * Doctor adds prescription, lab report, diagnosis, or vitals
 * Saved to database and emitted to patient in real time
 */
exports.addMedicalRecord = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // ✅ FIX 1: Guard against undefined req.doctor
    if (!req.doctor?._id) {
      return res.status(401).json({
        success: false,
        message: "Doctor not authenticated",
      });
    }
    
    // ✅ FIX 2: Validate sessionId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }
    
    const doctorId = req.doctor._id;
    let {
      recordType, // prescription, lab_report, diagnosis, vitals
      title,
      content,
      medication,
      labTest,
      vitals,
      notes,
    } = req.body;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[👨‍⚕️ CONSULTATION] Adding medical record: ${recordType} to session ${sessionId}`);
      console.log(`[👨‍⚕️ CONSULTATION] File attached: ${req.file ? req.file.originalname : "No file"}`);
    }

    // ✅ FIX: Parse JSON strings from multipart/form-data
    if (typeof medication === "string") {
      try {
        medication = JSON.parse(medication);
      } catch (e) {
        medication = undefined;
      }
    }
    if (typeof labTest === "string") {
      try {
        labTest = JSON.parse(labTest);
      } catch (e) {
        labTest = undefined;
      }
    }
    if (typeof vitals === "string") {
      try {
        vitals = JSON.parse(vitals);
      } catch (e) {
        vitals = undefined;
      }
    }

    // Validate session exists and doctor is authorized
    const session = await ConsultationSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the treating doctor can add records",
      });
    }

    // ✅ FIX 2: Check session is active
    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Session is not active",
      });
    }

    // ✅ FIX 2: Check appointment is APPROVED and get appointment details
    const appointment = await Appointment.findById(session.appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.approvalstatus !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Appointment has not been approved for this record to be added",
      });
    }

    // Validate required fields
    if (!recordType || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "recordType, title, and content are required",
      });
    }

    // ✅ FIX 3: Sanitize input fields with string type coercion
    const sanitizedTitle = sanitizeString(String(title || ""), 200);
    const sanitizedContent = sanitizeString(String(content || ""), 2000);
    const sanitizedNotes = sanitizeString(String(notes || ""), 1000);

    // Sanitize medication object
    let sanitizedMedication = undefined;
    if (medication && typeof medication === "object") {
      sanitizedMedication = {
        name: sanitizeString(medication?.name || "", 100),
        dosage: medication?.dosage || "",
        frequency: medication?.frequency || "",
        duration: medication?.duration || "",
        instructions: sanitizeString(medication?.instructions || "", 500),
      };
    }

    // Sanitize lab test object
    let sanitizedLabTest = undefined;
    if (labTest && typeof labTest === "object") {
      sanitizedLabTest = {
        testName: sanitizeString(labTest?.testName || "", 100),
        result: labTest?.result || "",
        unit: labTest?.unit || "",
        referenceRange: labTest?.referenceRange || "",
        status: labTest?.status || "normal",
      };
    }

    // ✅ FIX 4 & 5: Handle file attachment for lab reports - store on disk instead of base64
    let attachmentUrl = null;
    let attachmentTitle = null;
    
    if (recordType === "lab_report" && req.file) {
      try {
        // ✅ FIX 4: Validate Buffer before use
        if (!Buffer.isBuffer(req.file.buffer)) {
          return res.status(400).json({
            success: false,
            message: "Invalid file buffer",
          });
        }
        
        // ✅ FIX 5: Validate payload size before saving to prevent MongoDB document size limit
        const maxAttachmentSize = 10 * 1024 * 1024; // 10MB
        if (req.file.buffer.length > maxAttachmentSize) {
          return res.status(413).json({
            success: false,
            message: `File too large. Maximum size is ${maxAttachmentSize / 1024 / 1024}MB`,
          });
        }
        
        // Store file on disk instead of base64 in MongoDB
        const uploadsDir = path.join(__dirname, "../../uploads/medical-records");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const fileName = `${sessionId}_${timestamp}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = path.join(uploadsDir, fileName);
        
        fs.writeFileSync(filePath, req.file.buffer);
        attachmentUrl = `/uploads/medical-records/${fileName}`;
        attachmentTitle = req.body.attachmentTitle || req.file.originalname;
        if (process.env.NODE_ENV === 'development') {
          console.log(`[👨‍⚕️ CONSULTATION] ✅ File attached: ${attachmentTitle} at ${attachmentUrl}`);
        }
      } catch (fileError) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[👨‍⚕️ CONSULTATION] ⚠️ Error processing attachment:`, fileError.message);
        }
        // Continue without attachment if there's an error
      }
    }

    // Create medical record with sanitized data
    const record = new MedicalRecord({
      sessionId,
      appointmentId: session.appointmentId,
      doctorId,
      userId: session.userId,
      recordType,
      title: sanitizedTitle,
      content: sanitizedContent,
      medication: recordType === "prescription" ? sanitizedMedication : undefined,
      labTest: recordType === "lab_report" ? sanitizedLabTest : undefined,
      vitals: recordType === "vitals" && vitals ? vitals : undefined,
      notes: recordType === "diagnosis" ? sanitizedNotes || sanitizedContent : sanitizedNotes,
      attachmentUrl: attachmentUrl || null,
    });

    await record.save();
    if (process.env.NODE_ENV === 'development') {
      console.log(`[👨‍⚕️ CONSULTATION] ✅ Medical record created: ${record._id}${attachmentUrl ? " with attachment" : ""}`);
    }

    // ✅ FIX 6: Guard against undefined io and wrap emit in try/catch
    const io = req.app.get("io");
    if (io) {
      try {
        const roomId = `consultation_${session.appointmentId}`;
        io.to(roomId).emit("new_record_added", {
          recordId: record._id,
          recordType,
          title: sanitizedTitle,
          content: sanitizedContent,
          createdAt: record.createdAt,
          createdBy: "doctor",
          medication: record.medication,
          labTest: record.labTest,
          vitals: record.vitals,
          notes: record.notes,
        });
      } catch (ioError) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[👨‍⚕️ CONSULTATION] ⚠️ Error emitting socket event:`, ioError.message);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: "Medical record added successfully",
      data: {
        recordId: record._id,
        sessionId,
        recordType,
        title: sanitizedTitle,
        createdAt: record.createdAt,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[👨‍⚕️ CONSULTATION] ❌ Error adding record:`, error.message);
      console.error(`[👨‍⚕️ CONSULTATION] Stack:`, error.stack);
    }
    return res.status(500).json({
      success: false,
      message: "Error adding medical record",
      error: error.message,
    });
  }
};

/**
 * Get all records for a specific session
 */
exports.getSessionRecords = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[👨‍⚕️ CONSULTATION] Fetching records for session: ${sessionId}`);
    }

    // ✅ FIX 2: Validate sessionId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }
    
    // Find session and verify user is a participant
    const session = await ConsultationSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const isDoctor = session.doctorId.toString() === userId.toString();
    const isPatient = session.userId.toString() === userId.toString();

    if (!isDoctor && !isPatient) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this session's records",
      });
    }

    // Fetch all records for this session
    const records = await MedicalRecord.find({ sessionId }).sort({
      createdAt: -1,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[👨‍⚕️ CONSULTATION] ✅ Found ${records.length} records`);
    }

    return res.status(200).json({
      success: true,
      message: "Session records retrieved",
      data: {
        sessionId,
        totalRecords: records.length,
        records,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[👨‍⚕️ CONSULTATION] ❌ Error fetching records:`, error.message);
    }
    return res.status(500).json({
      success: false,
      message: "Error fetching session records",
      error: error.message,
    });
  }
};

/**
 * Get consultation history for a patient
 * Returns all past consultation sessions with their records
 */
exports.getSessionHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[👨‍⚕️ CONSULTATION] Fetching consultation history for user: ${userId}`);
    }

    // Fetch all sessions (both active and completed) for this user
    // Now includes active sessions so records appear immediately after doctor adds them
    const sessions = await ConsultationSession.find({
      userId,
      status: { $in: ["active", "completed"] }  // Get BOTH active and completed sessions
    })
      .populate("appointmentId", "appointmentDate doctorId")
      .populate("doctorId", "fullName specialization")
      .sort({ endedAt: -1, createdAt: -1 });  // Sort by endedAt desc, fallback to createdAt

    // For each session, fetch its medical records
    const sessionHistory = await Promise.all(
      sessions.map(async (session) => {
        const records = await MedicalRecord.find({ sessionId: session._id }).sort({
          createdAt: 1,
        });

        return {
          session: {
            sessionId: session._id,
            appointmentId: session.appointmentId,
            doctorId: session.doctorId,
            status: session.status,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            endedBy: session.endedBy,
            duration: session.duration,
          },
          records,
        };
      })
    );

    if (process.env.NODE_ENV === 'development') {
      console.log(`[👨‍⚕️ CONSULTATION] ✅ Found ${sessionHistory.length} consultation sessions`);
    }

    return res.status(200).json({
      success: true,
      message: "Consultation history retrieved",
      data: {
        totalSessions: sessionHistory.length,
        sessions: sessionHistory,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[👨‍⚕️ CONSULTATION] ❌ Error fetching records:`, error.message);
    }
    return res.status(500).json({
      success: false,
      message: "Error fetching consultation history",
      error: error.message,
    });
  }
};

/**
 * Download a single medical record
 * Returns record data for PDF generation on frontend
 */
exports.downloadRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user._id;

    console.log(`[👨‍⚕️ CONSULTATION] Downloading record: ${recordId}`);

    // ✅ FIX 2: Validate recordId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid record ID",
      });
    }
    
    // Find record
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    // Verify user is authorized
    if (record.userId.toString() !== userId.toString()) {
      const userRole = req.user.roles ? req.user.roles[0].toLowerCase() : (req.user.role || "").toLowerCase();
      if (userRole !== "doctor") {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this record",
        });
      }
    }

    // Fetch full session info
    const session = await ConsultationSession.findById(record.sessionId).populate(
      "appointmentId",
      "appointmentDate"
    );

    console.log(`[👨‍⚕️ CONSULTATION] ✅ Record retrieved for download`);

    return res.status(200).json({
      success: true,
      message: "Record data for download",
      data: {
        record: {
          _id: record._id,
          recordType: record.recordType,
          title: record.title,
          content: record.content,
          medication: record.medication,
          labTest: record.labTest,
          vitals: record.vitals,
          notes: record.notes,
          attachmentUrl: record.attachmentUrl,
          createdAt: record.createdAt,
        },
        session: {
          sessionId: session._id,
          appointmentDate: session.appointmentId?.appointmentDate,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
        },
      },
    });
  } catch (error) {
    console.error(`[👨‍⚕️ CONSULTATION] ❌ Error downloading record:`, error.message);
    return res.status(500).json({
      success: false,
      message: "Error downloading record",
      error: error.message,
    });
  }
};

/**
 * Get active session for an appointment
 * Used to check if a session is currently active
 */
exports.getActiveSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // ✅ FIX 2: Validate appointmentId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }
    
    const session = await ConsultationSession.findOne({
      appointmentId,
      status: "active",
    });

    if (!session) {
      return res.status(200).json({
        success: true,
        message: "No active session",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active session found",
      data: session,
    });
  } catch (error) {
    console.error(`[👨‍⚕️ CONSULTATION] ❌ Error getting active session:`, error.message);
    return res.status(500).json({
      success: false,
      message: "Error getting active session",
      error: error.message,
    });
  }
};
