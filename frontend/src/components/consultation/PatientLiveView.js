import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import RecordCard from "./RecordCard";

const PatientLiveView = ({ appointmentId, sessionId, activeSession }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [socket, setSocket] = useState(null);

  const baseURL = process.env.REACT_APP_BASE_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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

    // Listen for new records from doctor
    socketInstance.on("new_record_added", (record) => {
      console.log("New record received:", record);
      setRecords((prevRecords) => [record, ...prevRecords]);
      setMessage("New record from doctor");
      setTimeout(() => setMessage(""), 3000);
    });

    // Listen for session end
    socketInstance.on("consultation_ended", (data) => {
      console.log("Consultation ended:", data);
      setMessage("Consultation session has ended");
    });

    setSocket(socketInstance);

    return () => socketInstance.disconnect();
  }, [appointmentId, baseURL, token]);

  // Fetch records when session starts
  useEffect(() => {
    if (sessionId) {
      fetchRecords();
    }
  }, [sessionId]);

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

  // Fetch records for current session
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/consultation/records/${sessionId}`
      );

      if (response.data.success) {
        setRecords(response.data.data.records);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      setMessage("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  // End session from patient side
  const handleEndSession = async () => {
    if (!sessionId) return;

    if (
      !window.confirm("Are you sure you want to end this consultation?")
    ) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await axiosInstance.put(
        `/consultation/end/${sessionId}`
      );

      if (response.data.success) {
        setMessage("Session ended");
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
      {/* Session Status */}
      {activeSession && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Active Consultation
              </h2>
              <p className="text-gray-600 mt-2">
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
      )}

      {!activeSession && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Waiting for doctor to start the consultation...
          </p>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("Failed")
              ? "bg-red-50 border border-red-200 text-red-800"
              : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Medical Records */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Medical Records
        </h2>

        {loading && !records.length ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {activeSession
                ? "No records added yet. Waiting for doctor..."
                : "Session not started yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <RecordCard
                key={record.recordId || record._id}
                record={record}
                isPatient={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientLiveView;
