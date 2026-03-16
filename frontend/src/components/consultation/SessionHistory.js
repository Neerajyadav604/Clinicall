import React, { useState, useEffect } from "react";
import axios from "axios";
import RecordCard from "./RecordCard";

const SessionHistory = () => {
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSessions, setExpandedSessions] = useState(new Set());

  const baseURL = process.env.REACT_APP_BASE_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    fetchSessionHistory();
  }, []);

  const fetchSessionHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(
        "/consultation/history"
      );

      if (response.data.success) {
        setSessionHistory(response.data.data.sessions);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to load session history";
      setError(errorMsg);
      console.error("Error fetching session history:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = (sessionId) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading consultation history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchSessionHistory}
          className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (sessionHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">No past consultation sessions yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          Consultation History
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          {sessionHistory.length} past consultation{" "}
          {sessionHistory.length === 1 ? "session" : "sessions"}
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {sessionHistory.map((item) => {
          const session = item.session;
          const records = item.records || [];
          const isExpanded = expandedSessions.has(session.sessionId);

          return (
            <div key={session.sessionId} className="p-6">
              {/* Session Summary */}
              <button
                onClick={() => toggleSession(session.sessionId)}
                className="w-full text-left hover:bg-gray-50 p-4 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {formatDate(session.startedAt)}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Duration: {formatDuration(session.duration)} • {records.length} record
                      {records.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                      Completed
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transform transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded Records */}
              {isExpanded && (
                <div className="mt-4 pl-4 space-y-3 border-l-2 border-gray-200">
                  {records.length === 0 ? (
                    <p className="text-gray-600 text-sm">
                      No medical records for this session.
                    </p>
                  ) : (
                    records.map((record) => (
                      <RecordCard
                        key={record._id}
                        record={record}
                        isPatient={true}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionHistory;
