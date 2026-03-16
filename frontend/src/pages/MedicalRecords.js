import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  LayoutDashboard,
  ClipboardList,
  Calendar,
  UserCog,
  LogOut,
  Loader,
  Shield,
  X,
  Download,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  setConditions,
  setAllergies,
  setObservations,
  setMedications,
  setDiagnosticReports,
  setProcedures,
  setImmunizations,
  setConditionsLoading,
  setAllergiesLoading,
  setObservationsLoading,
  setMedicationsLoading,
  setDiagnosticReportsLoading,
  setProceduresLoading,
  setImmunizationsLoading,
  setConsentRequests,
  setConsentRequestsLoading,
} from "../slices/fhirSlice";
import { getUserRequests } from "../services/operations/requestApi";
import {
  getConsultationHistory,
  downloadRecord,
} from "../services/operations/consultationApi";
import { Sidebar, SidebarBody, SidebarLinkItem } from "../components/ui/sidebar";
import { logout } from "../services/operations/Authapi";
import jsPDF from "jspdf";
// Clinical UI Components
import AllergyWarningBanner from "../components/clinical/AllergyWarningBanner";
import MedicalTimeline from "../components/clinical/MedicalTimeline";
import VitalSignsChart from "../components/clinical/VitalSignsChart";
import MedicationList from "../components/clinical/MedicationList";
import LabResultsViewer from "../components/clinical/LabResultsViewer";
import ConsentManager from "../components/consent/ConsentManager";
import AccessLogViewer from "../components/consent/AccessLogViewer";
import DocumentVault from "../components/clinical/DocumentVault";

const SectionShell = ({ title, subtitle, children }) => (
  <section className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_16px_34px_-26px_rgba(2,6,23,0.45)] md:p-6">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    <div className="mt-5">{children}</div>
  </section>
);

const HIPAABanner = ({ onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50 flex items-start gap-3"
    >
      <Shield className="w-5 h-5 flex-shrink-0 text-blue-700 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-blue-900">HIPAA Compliance Notice</p>
        <p className="text-xs text-blue-800 mt-1">
          Your medical records are protected under HIPAA. All access is logged and monitored. Review your&nbsp;
          <button className="underline font-medium hover:text-blue-700">access log</button>
          &nbsp;anytime.
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-blue-600 hover:text-blue-700"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

const MedicalRecords = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarLinks = [
    {
      label: "Dashboard",
      href: "/my-profile",
      icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0 text-slate-600" />,
    },
    {
      label: "Medical Records",
      href: "/medical-records",
      icon: <FileText className="h-5 w-5 flex-shrink-0 text-slate-600" />,
    },
    {
      label: "My Requests",
      href: "/my-requests",
      icon: <ClipboardList className="h-5 w-5 flex-shrink-0 text-slate-600" />,
    },
    {
      label: "Book Appointment",
      href: "/appointment",
      icon: <Calendar className="h-5 w-5 flex-shrink-0 text-slate-600" />,
    },
    {
      label: "Edit Profile",
      href: "/editprofile",
      icon: <UserCog className="h-5 w-5 flex-shrink-0 text-slate-600" />,
    },
    {
      label: "Logout",
      href: "",
      icon: <LogOut className="h-5 w-5 flex-shrink-0 text-rose-500" />,
      onClick: () => dispatch(logout(navigate)),
    },
  ];

  const { user } = useSelector((state) => state.profile);
  const {
    conditions,
    conditionsLoading,
    allergies,
    allergiesLoading,
    observations,
    observationsLoading,
    medications,
    medicationsLoading,
    diagnosticReports,
    diagnosticReportsLoading,
    procedures,
    proceduresLoading,
    immunizations,
    immunizationsLoading,
  } = useSelector((state) => state.fhir);

  // Local state for consultation records
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [consultationError, setConsultationError] = useState(null);
  const [showHIPAABanner, setShowHIPAABanner] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportResourceTypes, setExportResourceTypes] = useState([]);
  const [paidAppointmentIds, setPaidAppointmentIds] = useState([]);
  const [hasAnyPaidConsultation, setHasAnyPaidConsultation] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // User will be loaded by the profile slice
    }
  }, [dispatch, token]);

  // Fetch paid/active appointments for access gating
  useEffect(() => {
    if (!user?._id) return;

    let isActive = true;

    const fetchPaidAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        const response = await getUserRequests("ALL");
        const appointments = response?.data || response?.appointments || [];

        const paid = (Array.isArray(appointments) ? appointments : []).filter(
          (apt) =>
            apt.paymentStatus === "paid" &&
            apt.consultationStatus === "active"
        );

        const paidIds = paid.map((apt) => apt._id);

        if (!isActive) return;
        setPaidAppointmentIds(paidIds);
        setHasAnyPaidConsultation(paidIds.length > 0);
      } catch (error) {
        console.error("Error loading paid appointments:", error);
        if (!isActive) return;
        setPaidAppointmentIds([]);
        setHasAnyPaidConsultation(false);
      } finally {
        if (isActive) {
          setAppointmentsLoading(false);
        }
      }
    };

    fetchPaidAppointments();

    return () => {
      isActive = false;
    };
  }, [user?._id]);

  // Load consultation medical records + FHIR clinical notes (replaces FHIR loading)
  useEffect(() => {
    if (!user?._id || appointmentsLoading || paidAppointmentIds.length === 0) return;

    let isActive = true;

    const loadAllMedicalData = async () => {
      try {
        setConsultationLoading(true);
        setConsultationError(null);

        // ===== SOURCE 1: Consultation Records (MedicalRecord model) =====
        const historyResponse = await getConsultationHistory();
        const sessions = historyResponse?.data?.sessions || [];

        // Collect all records with their session info (for doctor details)
        const allRecords = [];
        sessions.forEach((session) => {
          if (Array.isArray(session.records)) {
            session.records.forEach(record => {
              allRecords.push({
                ...record,
                _session: session.session
              });
            });
          }
        });

        if (!isActive) return;

        // DEBUG: Log actual record structure
        console.log("All Records received:", allRecords);
        console.log("First record sample:", allRecords[0]);
        console.log("Record types found:", allRecords.map(r => r.recordType));
        console.log("All record keys:", allRecords.map(r => Object.keys(r)));

        // Step 1: Separate consultation records by type
        const diagnosisList = allRecords.filter((r) => r.recordType === "diagnosis");
        const prescriptions = allRecords.filter((r) => r.recordType === "prescription");
        const labRecords = allRecords.filter(
          (r) => r.recordType === "lab" || r.recordType === "lab_report"
        );
        const vitalsList = allRecords.filter((r) => r.recordType === "vitals");

        console.log("Diagnosis:", diagnosisList);
        console.log("Prescriptions:", prescriptions);
        console.log("Lab Records:", labRecords);
        console.log("Vitals:", vitalsList);

        // Step 2: Transform consultation diagnosis records
        const conditionsData = diagnosisList.map((record) => ({
          id: record._id,
          resourceType: "Condition",
          code: { text: record.title },
          clinicalStatus: { coding: [{ code: "active" }] },
          onsetDateTime: record.createdAt,
          note: [{ text: record.notes || record.content }],
          recordDate: record.createdAt,
          doctorId: record.doctorId,
        }));

        // EXTRACT DIAGNOSIS FROM PRESCRIPTION CONTENT
        // If a prescription has clinical context in its content, create a diagnosis record
        const extractedDiagnosis = prescriptions
          .filter(r => r.content && r.content.toLowerCase().includes("diagnos"))
          .map((record) => ({
            id: record._id + "_diagnosis",
            resourceType: "Condition",
            code: { text: record.title.replace(/Treatment|Medication|Prescription/gi, "").trim() || "Clinical Condition" },
            clinicalStatus: { coding: [{ code: "active" }] },
            onsetDateTime: record.createdAt,
            note: [{ text: record.content }],
            recordDate: record.createdAt,
            doctorId: record.doctorId,
          }));

        // Combine original diagnoses with extracted ones
        const allConditions = [...conditionsData, ...extractedDiagnosis];

        // Step 3: Transform consultation prescription records
        const medicationsData = prescriptions.map((record) => ({
          id: record._id,
          resourceType: "MedicationRequest",
          medicationCodeableConcept: {
            text: record.medication?.name || record.title,
          },
          dosageInstruction: [
            {
              text: `${record.medication?.dosage} - ${record.medication?.frequency}`,
              doseAndRate: [{ doseQuantity: { value: record.medication?.dosage } }],
            },
          ],
          note: [
            {
              text: record.notes || record.medication?.instructions || record.content,
            },
          ],
          authoredOn: record.createdAt,
          recordDate: record.createdAt,
          doctorId: record.doctorId,
          requester: record._session?.doctorId?.fullName ? `Dr. ${record._session.doctorId.fullName}` : "Unknown Practitioner",
          status: "active"
        }));

        // Step 4: Transform consultation lab records
        const reportsData = labRecords.map((record) => ({
          id: record._id,
          resourceType: "DiagnosticReport",
          code: { text: record.labTest?.testName || record.title },
          result: [
            {
              valueString: record.labTest?.result,
              referenceRange: record.labTest?.referenceRange,
              unit: record.labTest?.unit,
            },
          ],
          effectiveDateTime: record.createdAt,
          note: [{ text: record.notes || record.content }],
          recordDate: record.createdAt,
          doctorId: record.doctorId,
          attachmentUrl: record.attachmentUrl,
          title: record.title,
        }));

        // Step 5: Transform vital signs records to observations format
        const observationsData = vitalsList.map((record) => ({
          id: record._id,
          resourceType: "Observation",
          code: { text: "Vital Signs" },
          component: [
            ...(record.vitals?.temperature
              ? [
                  {
                    code: { text: "Temperature" },
                    valueQuantity: {
                      value: record.vitals.temperature,
                      unit: "Celsius",
                    },
                  },
                ]
              : []),
            ...(record.vitals?.bloodPressure
              ? [
                  {
                    code: { text: "Blood Pressure" },
                    valueString: record.vitals.bloodPressure,
                  },
                ]
              : []),
            ...(record.vitals?.heartRate
              ? [
                  {
                    code: { text: "Heart Rate" },
                    valueQuantity: {
                      value: record.vitals.heartRate,
                      unit: "bpm",
                    },
                  },
                ]
              : []),
            ...(record.vitals?.oxygenSaturation
              ? [
                  {
                    code: { text: "Oxygen Saturation" },
                    valueQuantity: {
                      value: record.vitals.oxygenSaturation,
                      unit: "%",
                    },
                  },
                ]
              : []),
            ...(record.vitals?.weight
              ? [
                  {
                    code: { text: "Weight" },
                    valueQuantity: { value: record.vitals.weight, unit: "kg" },
                  },
                ]
              : []),
            ...(record.vitals?.height
              ? [
                  {
                    code: { text: "Height" },
                    valueQuantity: { value: record.vitals.height, unit: "cm" },
                  },
                ]
              : []),
            ...(record.vitals?.respiratoryRate
              ? [
                  {
                    code: { text: "Respiratory Rate" },
                    valueQuantity: {
                      value: record.vitals.respiratoryRate,
                      unit: "breaths/min",
                    },
                  },
                ]
              : []),
          ],
          effectiveDateTime: record.createdAt,
          note: [{ text: record.notes || record.content }],
          recordDate: record.createdAt,
          doctorId: record.doctorId,
        }));

        dispatch(setConditions(allConditions));
        dispatch(setObservations(observationsData));
        dispatch(setMedications(medicationsData));
        dispatch(setDiagnosticReports(reportsData));

        // Keep empty allergies and other empty collections
        dispatch(setAllergies([]));
        dispatch(setProcedures([]));
        dispatch(setImmunizations([]));
      } catch (error) {
        console.error("Error loading medical data:", error);
        if (!isActive) return;
        setConsultationError(
          error?.response?.data?.message ||
            "Failed to load medical records. Please try again."
        );
        // Set empty data on error
        dispatch(setConditions([]));
        dispatch(setObservations([]));
        dispatch(setMedications([]));
        dispatch(setDiagnosticReports([]));
        dispatch(setAllergies([]));
        dispatch(setProcedures([]));
        dispatch(setImmunizations([]));
      } finally {
        if (isActive) {
          setConsultationLoading(false);
          dispatch(setConditionsLoading(false));
          dispatch(setObservationsLoading(false));
          dispatch(setMedicationsLoading(false));
          dispatch(setDiagnosticReportsLoading(false));
          dispatch(setAllergiesLoading(false));
          dispatch(setProceduresLoading(false));
          dispatch(setImmunizationsLoading(false));
        }
      }
    };

    loadAllMedicalData();

    return () => {
      isActive = false;
    };
  }, [user?._id, dispatch, paidAppointmentIds, appointmentsLoading]);

  // Handle PDF export for a specific record
  const handleExportRecord = async (recordId, recordTitle) => {
    try {
      const pdfBlob = await downloadRecord(recordId);
      // Create a download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${recordTitle || "medical-record"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting record:", error);
      alert("Failed to download record. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-96 animate-pulse rounded-2xl bg-slate-200 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (appointmentsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-12 w-64 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-96 animate-pulse rounded-2xl bg-slate-200 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!hasAnyPaidConsultation) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <Shield className="w-10 h-10 text-cyan-700 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900">Medical Records Locked</h2>
          <p className="text-slate-600 mt-2">
            Your medical records will appear here after you complete payment for an approved
            appointment.
          </p>
          <button
            onClick={() => navigate("/my-requests")}
            className="mt-6 w-full rounded-lg bg-cyan-700 px-4 py-2.5 text-white font-medium hover:bg-cyan-800 transition"
          >
            View My Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--page)]">
      {/* ── Sidebar ── */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10 h-full min-h-screen">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            <div className="flex items-center gap-2 px-2 py-4 mb-4 border-b border-slate-100">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0" />
              {sidebarOpen && (
                <span className="font-semibold text-slate-800 text-sm">Clinicall</span>
              )}
            </div>
            {/* Nav links */}
            <div className="flex flex-col gap-1">
              {sidebarLinks.map((link, idx) => (
                <SidebarLinkItem key={idx} link={link} />
              ))}
            </div>
          </div>
          {/* User avatar at bottom */}
          {user && (
            <div className="flex items-center gap-2 px-2 py-2 border-t border-slate-100 mt-4">
              <img
                src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=0f3b4a&color=fff`}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
              />
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-800 truncate">{user.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              )}
            </div>
          )}
        </SidebarBody>
      </Sidebar>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="bg-[var(--page)] px-4 py-8 md:px-8"
          style={{
            "--page": "#f3f7fb",
            "--surface": "#ffffff",
            "--line": "#d9e2ec",
          }}
        >
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#0f3b4a] to-[#0d1f2d] p-6 text-white shadow-[0_28px_60px_-36px_rgba(2,6,23,0.85)] md:p-8">
              <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-cyan-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-cyan-100">Healthcare Information</p>
                    <h1
                      className="mt-1 text-3xl leading-tight md:text-4xl"
                      style={{ fontFamily: 'Fraunces, "Times New Roman", serif' }}
                    >
                      Medical Records
                    </h1>
                    <p className="mt-2 text-sm text-cyan-100">
                      Your complete clinical records in one secure location
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="space-y-6">
              {/* HIPAA Compliance Banner */}
              {showHIPAABanner && (
                <HIPAABanner onDismiss={() => setShowHIPAABanner(false)} />
              )}

              {/* Consultation Error Banner */}
              {consultationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-700 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">Unable to Load Records</p>
                    <p className="text-xs text-red-800 mt-1">{consultationError}</p>
                  </div>
                  <button
                    onClick={() => setConsultationError(null)}
                    className="flex-shrink-0 text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/*  Clinical Timeline */}
              <SectionShell title="Clinical Timeline" subtitle="All your medical events in chronological order">
                <MedicalTimeline
                  conditions={conditions}
                  observations={observations}
                  procedures={procedures}
                  immunizations={immunizations}
                  loading={consultationLoading}
                />
              </SectionShell>

              {/* Vital Signs Chart */}
              <SectionShell title="Vital Signs Trend" subtitle="Your vital signs over time">
                <VitalSignsChart
                  observations={observations}
                  loading={consultationLoading}
                />
              </SectionShell>

              {/* Medications */}
              <SectionShell title="Current Medications" subtitle="Your active and past prescriptions">
                <MedicationList
                  medications={medications}
                  loading={consultationLoading}
                />
              </SectionShell>

              {/* Lab Results / Diagnostic Reports */}
              <SectionShell title="Lab Results & Reports" subtitle="Your diagnostic reports and test results">
                <LabResultsViewer
                  reports={diagnosticReports}
                  loading={consultationLoading}
                />
              </SectionShell>

              {/* My Documents */}
              <SectionShell title="My Documents">
                <DocumentVault patientId={user?._id} isDoctor={false} />
              </SectionShell>

              {/* Privacy & Consent */}
              <SectionShell title="Privacy & Consent">
                <ConsentManager patientId={user?._id} />
              </SectionShell>

              {/* Access Log */}
              <SectionShell title="Access Log">
                <AccessLogViewer patientId={user?._id} />
              </SectionShell>

              {/* Security Information */}
              <SectionShell title="Security & Privacy">
                <div className="space-y-3 text-sm text-slate-600">
                  <p>Your medical records are securely encrypted according to HIPAA standards.</p>
                  <p>
                    All access to your records is logged and monitored for security. You have the right to access, update, and control your medical records.
                  </p>
                  <p>
                    For more information about your privacy rights, please contact support.
                  </p>
                </div>
              </SectionShell>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords;
