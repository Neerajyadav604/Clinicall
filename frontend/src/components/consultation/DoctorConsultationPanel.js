import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";

const DoctorConsultationPanel = ({
  appointmentId,
  appointment,
  sessionId,
  activeSession,
  onSessionStarted,
}) => {
  const [recordType, setRecordType] = useState("prescription");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Prescription fields
  const [medication, setMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  // Lab test fields
  const [labTest, setLabTest] = useState({
    testName: "",
    result: "",
    unit: "",
    referenceRange: "",
    status: "normal",
  });

  // Vitals fields
  const [vitals, setVitals] = useState({
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
  });

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [socket, setSocket] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentTitle, setAttachmentTitle] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const baseURL = process.env.REACT_APP_BASE_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // ✅ FIX: Validate appointment meets all 4 requirements
  const validateAppointmentRequirements = () => {
    console.log("[CONSULTATION DEBUG] validateAppointmentRequirements called");
    console.log("[CONSULTATION DEBUG] appointment object:", appointment);
    
    if (!appointment) {
      console.log("[CONSULTATION DEBUG] Appointment is null/undefined");
      return {
        canStart: false,
        requirements: [
          { met: false, label: "Appointment data loading..." }
        ],
      };
    }

    console.log("[CONSULTATION DEBUG] Checking requirements:");
    console.log("  - approvalstatus:", appointment.approvalstatus, "| Should be: APPROVED");
    console.log("  - paymentStatus:", appointment.paymentStatus, "| Should be: paid");
    console.log("  - consultationMode:", appointment.consultationMode, "| Should be: online");
    console.log("  - isChatEnabled:", appointment.isChatEnabled, "| Should be: true");

    const requirements = [
      {
        met: appointment.approvalstatus === "APPROVED",
        label: "Appointment must be APPROVED",
      },
      {
        met: appointment.paymentStatus === "paid",
        label: "Payment must be completed",
      },
      {
        met: appointment.consultationMode === "online",
        label: "Appointment must be for ONLINE consultation",
      },
      {
        met: appointment.isChatEnabled === true,
        label: "Chat must be enabled",
      },
    ];

    const allMet = requirements.every(req => req.met);
    console.log("[CONSULTATION DEBUG] All requirements met:", allMet);

    return {
      canStart: allMet,
      requirements,
    };
  };

  const appointmentValidation = validateAppointmentRequirements();

  // Socket.IO connection
  useEffect(() => {
    const socketInstance = io(baseURL, {
      auth: {
        token,
        appointmentId,
      },
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      socketInstance.emit("join_consultation", { appointmentId });
    });

    setSocket(socketInstance);

    return () => socketInstance.disconnect();
  }, [appointmentId, baseURL, token]);

  // Timer for active session
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const start = new Date(activeSession.startedAt).getTime();
      const now = new Date().getTime();
      const duration = Math.floor((now - start) / 1000);
      setSessionDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Start session
  const handleStartSession = async () => {
    try {
      setLoading(true);
      setMessage("");

      console.log(`[CONSULTATION DEBUG] Starting session for appointment: ${appointmentId}`);
      console.log(`[CONSULTATION DEBUG] Current validation status:`, appointmentValidation);

      const response = await axiosInstance.post(
        `/consultation/start/${appointmentId}`
      );

      console.log(`[CONSULTATION DEBUG] Start session response:`, response.data);

      if (response.data.success) {
        setMessage("Session started successfully");
        onSessionStarted(response.data.data);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to start session";
      console.error(`[CONSULTATION DEBUG] Error starting session:`, error.response?.data || error);
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // End session
  const handleEndSession = async () => {
    if (!sessionId) return;

    if (!window.confirm("Are you sure you want to end this consultation?")) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await axiosInstance.put(
        `/consultation/end/${sessionId}`
      );

      if (response.data.success) {
        setMessage("Session ended successfully");
        // Reload page or handle end session
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to end session";
      setMessage(errorMsg);
      console.error("Error ending session:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add medical record
  const handleAddRecord = async (e) => {
    e.preventDefault();

    if (!sessionId) {
      setMessage("No active session. Start a session first.");
      return;
    }

    if (!title || !content) {
      setMessage("Title and content are required");
      return;
    }

    // Additional validation for specific record types
    if (recordType === "lab_report" && !labTest.testName) {
      setMessage("Test Name is required for lab reports");
      return;
    }

    if (recordType === "prescription" && !medication.name) {
      setMessage("Medication Name is required for prescriptions");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Create FormData to handle file uploads
      const formData = new FormData();
      formData.append("recordType", recordType);
      formData.append("title", title);
      formData.append("content", content);

      if (recordType === "prescription") {
        formData.append("medication", JSON.stringify(medication));
      } else if (recordType === "lab_report") {
        formData.append("labTest", JSON.stringify(labTest));
        // Add attachment if present for lab reports
        if (attachmentFile) {
          formData.append("attachmentFile", attachmentFile);
          formData.append("attachmentTitle", attachmentTitle || attachmentFile.name);
        }
      } else if (recordType === "vitals") {
        formData.append("vitals", JSON.stringify(vitals));
      } else if (recordType === "diagnosis") {
        formData.append("notes", notes || content);
      }

      // ✅ FIX: Let axios/browser automatically set multipart/form-data Content-Type with correct boundary
      // DO NOT explicitly set Content-Type - it prevents proper multipart boundary handling
      const response = await axiosInstance.post(
        `/consultation/record/${sessionId}`,
        formData
      );

      if (response.data.success) {
        setMessage("Record added successfully");
        // Clear form
        setTitle("");
        setContent("");
        setNotes("");
        setAttachmentFile(null);
        setAttachmentTitle("");
        setPreviewUrl(null);
        setMedication({
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
        });
        setLabTest({
          testName: "",
          result: "",
          unit: "",
          referenceRange: "",
          status: "normal",
        });
        setVitals({
          temperature: "",
          bloodPressure: "",
          heartRate: "",
          respiratoryRate: "",
          oxygenSaturation: "",
          weight: "",
          height: "",
        });
      }
    } catch (error) {
      let errorMsg = "Failed to add record";
      
      // Try to get detailed error information
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error_details) {
        errorMsg = error.response.data.error_details;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setMessage(errorMsg);
      
      // Log full error for debugging
      console.error("Error adding record:");
      console.error("  Response Data:", error.response?.data);
      console.error("  Error Message:", error.message);
      console.error("  Full Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for attachments
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
      
      if (file.size > maxSize) {
        setMessage("File size must be less than 10MB");
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        setMessage("Only JPEG, PNG, or PDF files are allowed");
        return;
      }
      
      setAttachmentFile(file);
      
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Session Control Panel */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Session Control
        </h2>

        {activeSession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
              <div>
                <p className="text-green-800 font-semibold">
                  Session Active
                </p>
                <p className="text-green-700 text-sm">
                  Duration: {formatDuration(sessionDuration)}
                </p>
              </div>
              <button
                onClick={handleEndSession}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Ending..." : "End Session"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ✅ FIX: Show appointment requirements validation */}
            {!appointmentValidation.canStart && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-900 font-semibold mb-3">
                  Cannot start consultation. Please check:
                </p>
                <ul className="space-y-2">
                  {appointmentValidation.requirements.map((req, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start text-sm ${
                        req.met ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      <span className="mr-2 mt-0.5">
                        {req.met ? "✓" : "✗"}
                      </span>
                      <span>{req.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleStartSession}
              disabled={loading || !appointmentValidation.canStart}
              className={`w-full px-4 py-2 rounded text-white font-medium transition-colors ${
                appointmentValidation.canStart
                  ? "bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Starting..." : "Start Session"}
            </button>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("successfully")
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Medical Records Form */}
      {activeSession && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Add Medical Record
          </h2>

          <form onSubmit={handleAddRecord} className="space-y-4">
            {/* Record Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Record Type
              </label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="prescription">Prescription</option>
                <option value="lab_report">Lab Report</option>
                <option value="diagnosis">Diagnosis</option>
                <option value="vitals">Vitals</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Antibiotic Prescription"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Record Type Specific Fields */}
            {recordType === "prescription" && (
              <div className="space-y-3 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Medication Name"
                    value={medication.name}
                    onChange={(e) =>
                      setMedication({ ...medication, name: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g., 500mg)"
                    value={medication.dosage}
                    onChange={(e) =>
                      setMedication({ ...medication, dosage: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Frequency (e.g., Twice daily)"
                    value={medication.frequency}
                    onChange={(e) =>
                      setMedication({ ...medication, frequency: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g., 7 days)"
                    value={medication.duration}
                    onChange={(e) =>
                      setMedication({ ...medication, duration: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <textarea
                  placeholder="Instructions"
                  value={medication.instructions}
                  onChange={(e) =>
                    setMedication({ ...medication, instructions: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            )}

            {recordType === "lab_report" && (
              <div className="space-y-3 border-t pt-4">
                <input
                  type="text"
                  placeholder="Test Name"
                  value={labTest.testName}
                  onChange={(e) =>
                    setLabTest({ ...labTest, testName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Result"
                    value={labTest.result}
                    onChange={(e) =>
                      setLabTest({ ...labTest, result: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={labTest.unit}
                    onChange={(e) =>
                      setLabTest({ ...labTest, unit: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Reference Range"
                  value={labTest.referenceRange}
                  onChange={(e) =>
                    setLabTest({ ...labTest, referenceRange: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={labTest.status}
                  onChange={(e) =>
                    setLabTest({ ...labTest, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="abnormal">Abnormal</option>
                  <option value="critical">Critical</option>
                </select>
                
                {/* Attachment Section */}
                <div className="border-t pt-3 mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach Document (X-ray, Report, etc.)
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: JPEG, PNG, PDF (Max 10MB)
                  </p>
                  
                  {attachmentFile && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {attachmentFile.name}
                          </p>
                          <input
                            type="text"
                            placeholder="Document title (e.g., X-ray Chest)"
                            value={attachmentTitle}
                            onChange={(e) => setAttachmentTitle(e.target.value)}
                            className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachmentFile(null);
                            setAttachmentTitle("");
                            setPreviewUrl(null);
                          }}
                          className="ml-2 text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      {previewUrl && (
                        <div className="mt-3">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-h-32 rounded border border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {recordType === "vitals" && (
              <div className="space-y-3 border-t pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Temperature (°C)"
                    value={vitals.temperature}
                    onChange={(e) =>
                      setVitals({ ...vitals, temperature: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="BP (120/80)"
                    value={vitals.bloodPressure}
                    onChange={(e) =>
                      setVitals({ ...vitals, bloodPressure: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="HR (BPM)"
                    value={vitals.heartRate}
                    onChange={(e) =>
                      setVitals({ ...vitals, heartRate: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="RR (breaths/min)"
                    value={vitals.respiratoryRate}
                    onChange={(e) =>
                      setVitals({ ...vitals, respiratoryRate: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="O2 Sat (%)"
                    value={vitals.oxygenSaturation}
                    onChange={(e) =>
                      setVitals({ ...vitals, oxygenSaturation: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Weight (kg)"
                    value={vitals.weight}
                    onChange={(e) =>
                      setVitals({ ...vitals, weight: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Height (cm)"
                  value={vitals.height}
                  onChange={(e) =>
                    setVitals({ ...vitals, height: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {recordType === "diagnosis" && (
              <div className="border-t pt-4">
                <textarea
                  placeholder="Diagnosis notes and observations"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
            )}

            {/* General Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Details / Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Additional details about this record"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Record"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DoctorConsultationPanel;
