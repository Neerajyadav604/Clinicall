import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DoctorConsultationPanel from "../components/consultation/DoctorConsultationPanel";
import PatientLiveView from "../components/consultation/PatientLiveView";

const ConsultationPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);

  const baseURL = process.env.REACT_APP_BASE_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");

  // Memoize axiosInstance to prevent infinite loops
  const axiosInstance = useMemo(() => axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [baseURL, token]);

  // Fetch appointment to determine if user is doctor or patient
  useEffect(() => {
    const fetchAppointmentAndRole = async () => {
      try {
        setLoading(true);
        const userDataStr = localStorage.getItem("user");
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        
        if (!userData || !userData._id) {
          setError("User information not found");
          return;
        }

        console.log(`[👨‍⚕️ CONSULTATION] User data:`, userData);
        console.log(`[👨‍⚕️ CONSULTATION] Appointment ID: ${appointmentId}`);

        // Check if user is a doctor by checking roles/role
        const roles = userData.roles ? userData.roles.map(r => r.toLowerCase()) : [(userData.role || "").toLowerCase()];
        const isDoctor = roles.includes("doctor");

        console.log(`[👨‍⚕️ CONSULTATION] User roles: ${roles}, Is Doctor: ${isDoctor}`);

        if (isDoctor) {
          // User is a doctor - fetch from doctor appointments
          console.log(`[👨‍⚕️ CONSULTATION] Fetching as DOCTOR`);
          try {
            const appointmentRes = await axiosInstance.get(`/appointments/doctor`);
            if (appointmentRes.data.success || appointmentRes.data.data) {
              const appointments = appointmentRes.data.data || appointmentRes.data;
              const apt = Array.isArray(appointments) 
                ? appointments.find(a => a._id === appointmentId)
                : null;
              
              if (apt) {
                console.log(`[👨‍⚕️ CONSULTATION] ✅ Found appointment as DOCTOR:`, apt);
                setAppointment(apt);
                setUserRole("doctor");
                console.log(`[👨‍⚕️ CONSULTATION] ✅ Appointment data:`, {
                  approvalstatus: apt.approvalstatus,
                  paymentStatus: apt.paymentStatus,
                  consultationMode: apt.consultationMode,
                  isChatEnabled: apt.isChatEnabled,
                });
              } else {
                setError("Appointment not found in your doctor appointments");
              }
            }
          } catch (err) {
            console.error("Error fetching doctor appointments:", err);
            setError("Failed to load doctor appointments");
          }
        } else {
          // User is a patient - fetch from user appointments
          console.log(`[👨‍⚕️ CONSULTATION] Fetching as PATIENT`);
          try {
            const appointmentRes = await axiosInstance.get(`/user/appointments`);
            if (appointmentRes.data.success || appointmentRes.data.data) {
              const appointments = appointmentRes.data.data || appointmentRes.data;
              const apt = Array.isArray(appointments) 
                ? appointments.find(a => a._id === appointmentId)
                : null;
              
              if (apt) {
                console.log(`[👨‍⚕️ CONSULTATION] ✅ Found appointment as PATIENT:`, apt);
                setAppointment(apt);
                setUserRole("patient");
                console.log(`[👨‍⚕️ CONSULTATION] ✅ Appointment data:`, {
                  approvalstatus: apt.approvalstatus,
                  paymentStatus: apt.paymentStatus,
                  consultationMode: apt.consultationMode,
                  isChatEnabled: apt.isChatEnabled,
                });
              } else {
                setError("Appointment not found in your appointments");
              }
            }
          } catch (err) {
            console.error("Error fetching user appointments:", err);
            setError("Failed to load appointments");
          }
        }
      } catch (err) {
        console.error("Error in fetchAppointmentAndRole:", err);
        setError(err.response?.data?.message || "Failed to load appointment");
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId && token) {
      fetchAppointmentAndRole();
    }
  }, [appointmentId, token]);

  // Check for active session
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response = await axiosInstance.get(
          `/consultation/active/${appointmentId}`
        );

        if (response.data.success && response.data.data) {
          setActiveSession(response.data.data);
          setSessionId(response.data.data._id);
        } else {
          setActiveSession(null);
          setSessionId(null);
        }
      } catch (err) {
        console.error("Error checking active session:", err);
        setActiveSession(null);
        setSessionId(null);
      }
    };

    if (appointmentId && userRole) {
      checkActiveSession();
      // Refresh every 5 seconds
      const interval = setInterval(checkActiveSession, 5000);
      return () => clearInterval(interval);
    }
  }, [appointmentId, userRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to determine your role</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Consultation Session
          </h1>
          <p className="text-gray-600 mt-2">
            Appointment ID: {appointmentId}
          </p>
        </div>

        {/* Status Banner */}
        {activeSession && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              ✓ Active consultation session in progress
            </p>
          </div>
        )}

        {!activeSession && userRole === "doctor" && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              No active session. Start a new consultation session to begin.
            </p>
          </div>
        )}

        {/* Main Content */}
        {userRole === "doctor" ? (
          <DoctorConsultationPanel
            appointmentId={appointmentId}
            appointment={appointment}
            sessionId={sessionId}
            activeSession={activeSession}
            onSessionStarted={(session) => {
              setSessionId(session._id);
              setActiveSession(session);
            }}
          />
        ) : (
          <PatientLiveView
            appointmentId={appointmentId}
            sessionId={sessionId}
            activeSession={activeSession}
          />
        )}
      </div>
    </div>
  );
};

export default ConsultationPage;
