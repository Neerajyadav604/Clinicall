import React, { useState, useEffect } from "react";
import TableComponent from "../../components/admin/TableComponent";
import { HiOutlineX } from "react-icons/hi";
import { toast } from "react-toastify";
import {
  getAdminAllHospitals,
  suspendAdminHospital,
} from "../../services/operations/hospitalAdminApi";

const ENTITY_TABS = [
  { label: "All", value: "" },
  { label: "🏥 Hospitals", value: "false" },
  { label: "🩺 Clinics", value: "true" },
];

const ConfirmModal = ({ hospital, onClose, onConfirm, loading }) => {
  if (!hospital) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-gray-900">Suspend Hospital</h2>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to suspend <strong>{hospital.name}</strong>? This will prevent them from accepting new appointments.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(hospital._id)}
            disabled={loading}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Suspending..." : "Confirm Suspend"}
          </button>
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const ApprovedHospitals = () => {
  const [hospitals, setHospitals]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [entityTab, setEntityTab]       = useState("");
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchHospitals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityTab]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      const isClinic = entityTab === "" ? undefined : entityTab === "true";
      const res = await getAdminAllHospitals(isClinic);
      setHospitals(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load hospitals");
      toast.error(err.message || "Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id) => {
    try {
      setActionLoading(true);
      await suspendAdminHospital(id);
      toast.success("Hospital suspended successfully.");
      setSuspendTarget(null);
      await fetchHospitals();
    } catch (err) {
      toast.error(err.message || "Failed to suspend hospital");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (v, row) => (
        <div className="flex items-center gap-2">
          {row.logo
            ? <img src={row.logo} alt="" className="w-7 h-7 rounded object-cover" />
            : <span className="text-lg">{row.isClinic ? "🩺" : "🏥"}</span>
          }
          <span className="font-medium">{v}</span>
        </div>
      ),
    },
    {
      key: "isClinic",
      label: "Type",
      render: (v, row) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${v ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
          {v ? "🩺 Clinic" : `🏥 ${row.entityType || "Hospital"}`}
        </span>
      ),
    },
    { key: "address", label: "City", render: (v) => `${v?.city || "—"}, ${v?.state || ""}` },
    { key: "doctors", label: "Doctors", render: (v) => (v || []).length },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          v === "approved" ? "bg-green-100 text-green-700"
          : v === "suspended" ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700"
        }`}>
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </span>
      ),
    },
    { key: "createdAt", label: "Registered On", render: (v) => new Date(v).toLocaleDateString() },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) =>
        row.status !== "suspended" ? (
          <button
            onClick={() => setSuspendTarget(row)}
            className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded hover:bg-red-100 transition"
          >
            Suspend
          </button>
        ) : (
          <span className="text-xs text-gray-400 italic">Suspended</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approved Hospitals &amp; Clinics</h1>
          <p className="text-gray-600 mt-1">Manage approved entities on the platform</p>
        </div>

        {/* Entity type tabs */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden w-fit">
          {ENTITY_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setEntityTab(t.value)}
              className={`px-4 py-2 text-sm font-medium transition ${
                entityTab === t.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <TableComponent columns={columns} data={hospitals} loading={loading} />

      {suspendTarget && (
        <ConfirmModal
          hospital={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onConfirm={handleSuspend}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default ApprovedHospitals;

