import React, { useState, useEffect } from "react";
import TableComponent from "../../components/admin/TableComponent";
import { HiOutlineEye, HiOutlineX } from "react-icons/hi";
import { toast } from "react-toastify";
import {
  getAdminHospitalRegistrations,
  getAdminHospitalRegistrationById,
  approveAdminHospitalRegistration,
  rejectAdminHospitalRegistration,
} from "../../services/operations/hospitalAdminApi";

const ENTITY_TABS = [
  { label: "All", value: "" },
  { label: "🏥 Hospitals", value: "false" },
  { label: "🩺 Clinics", value: "true" },
];

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const DetailModal = ({ item, onClose, onApprove, onReject, loading }) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject'

  if (!item) return null;

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.warn("Please enter a rejection reason");
      return;
    }
    onReject(item._id, rejectionReason);
  };

  const docs = item.documents || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              item.isClinic ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
            }`}>
              {item.isClinic ? "🩺 Clinic" : `🏥 ${item.entityType}`}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <HiOutlineX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Basic Info */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Basic Info</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-400">Email</p><p className="font-medium">{item.email}</p></div>
              <div><p className="text-gray-400">Phone</p><p className="font-medium">{item.phone}</p></div>
              <div><p className="text-gray-400">City</p><p className="font-medium">{item.address?.city}, {item.address?.state}</p></div>
              <div><p className="text-gray-400">Submitted By</p><p className="font-medium">{item.submittedBy?.email || "—"}</p></div>
              {item.establishedYear && <div><p className="text-gray-400">Est. Year</p><p className="font-medium">{item.establishedYear}</p></div>}
              {!item.isClinic && item.totalBeds && <div><p className="text-gray-400">Total Beds</p><p className="font-medium">{item.totalBeds}</p></div>}
              {item.isClinic && item.consultationFee && <div><p className="text-gray-400">Consultation Fee</p><p className="font-medium">₹{item.consultationFee}</p></div>}
              {item.isClinic && item.appointmentDuration && <div><p className="text-gray-400">Appointment Duration</p><p className="font-medium">{item.appointmentDuration} min</p></div>}
            </div>
          </section>

          {/* Specializations */}
          {(item.specializations || []).length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {item.specializations.map((s) => (
                  <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </section>
          )}

          {/* Contact Person */}
          {item.contactPerson?.name && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Contact Person</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-400">Name</p><p className="font-medium">{item.contactPerson.name}</p></div>
                {item.contactPerson.designation && <div><p className="text-gray-400">Designation</p><p className="font-medium">{item.contactPerson.designation}</p></div>}
                {item.contactPerson.phone && <div><p className="text-gray-400">Phone</p><p className="font-medium">{item.contactPerson.phone}</p></div>}
                {item.contactPerson.email && <div><p className="text-gray-400">Email</p><p className="font-medium">{item.contactPerson.email}</p></div>}
              </div>
            </section>
          )}

          {/* Documents */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Documents</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Registration Certificate", key: "registrationCertificate" },
                { label: "License", key: "hospitalLicense" },
                { label: "Tax Certificate", key: "taxCertificate" },
                { label: "NABH Certificate", key: "nabhCertificate" },
                { label: "Logo", key: "logo" },
                { label: "Cover Image", key: "coverImage" },
                { label: "Owner Medical License", key: "ownerMedicalLicense" },
                { label: "Degree Certificate", key: "degreeCertificate" },
              ].filter((d) => docs[d.key]).map((d) => (
                <a
                  key={d.key}
                  href={docs[d.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-blue-600 hover:underline border border-blue-100 rounded-lg px-3 py-2 bg-blue-50"
                >
                  📄 {d.label}
                </a>
              ))}
              {Object.values(docs).every((v) => !v) && (
                <p className="text-gray-400 text-sm col-span-2">No documents uploaded</p>
              )}
            </div>
          </section>

          {/* Status banner */}
          {item.status === "approved" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 font-medium">
              ✅ This registration has already been approved.
            </div>
          )}
          {item.status === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <p className="font-medium">❌ Rejected</p>
              {item.rejectionReason && <p className="mt-1">Reason: {item.rejectionReason}</p>}
            </div>
          )}

          {/* Actions */}
          {item.status === "pending" && !confirmAction && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmAction("approve")}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => setConfirmAction("reject")}
                className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium text-sm"
              >
                ❌ Reject
              </button>
            </div>
          )}

          {confirmAction === "approve" && (
            <div className="bg-green-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-green-800">Confirm approval of <strong>{item.name}</strong>?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(item._id)}
                  disabled={loading}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm Approve"}
                </button>
                <button onClick={() => setConfirmAction(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          {confirmAction === "reject" && (
            <div className="bg-red-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-red-800">Rejection reason *</p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none"
                rows={3}
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm Reject"}
                </button>
                <button onClick={() => setConfirmAction(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HospitalRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [statusTab, setStatusTab]         = useState("pending");
  const [entityTab, setEntityTab]         = useState("");
  const [selected, setSelected]           = useState(null);
  const [modalOpen, setModalOpen]         = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab, entityTab]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminHospitalRegistrations(statusTab, entityTab);
      setRegistrations(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load registrations");
      toast.error(err.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (row) => {
    try {
      const res = await getAdminHospitalRegistrationById(row._id);
      setSelected(res.data);
      setModalOpen(true);
    } catch (err) {
      toast.error("Failed to load details");
    }
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await approveAdminHospitalRegistration(id);
      toast.success("Hospital registration approved!");
      setModalOpen(false);
      setSelected(null);
      await fetchRegistrations();
    } catch (err) {
      toast.error(err.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id, reason) => {
    try {
      setActionLoading(true);
      await rejectAdminHospitalRegistration(id, reason);
      toast.success("Hospital registration rejected.");
      setModalOpen(false);
      setSelected(null);
      await fetchRegistrations();
    } catch (err) {
      toast.error(err.message || "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "isClinic",
      label: "Type",
      render: (v, row) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${v ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
          {v ? "🩺 Clinic" : `🏥 ${row.entityType || "Hospital"}`}
        </span>
      ),
    },
    { key: "email", label: "Email" },
    { key: "address", label: "City", render: (v) => v?.city || "—" },
    { key: "submittedBy", label: "Submitted By", render: (v) => v?.email || "—" },
    { key: "createdAt", label: "Date", render: (v) => new Date(v).toLocaleDateString() },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          v === "approved" ? "bg-green-100 text-green-700"
          : v === "rejected" ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700"
        }`}>
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <button
          onClick={() => openDetail(row)}
          className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
          title="View Details"
        >
          <HiOutlineEye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospital &amp; Clinic Registrations</h1>
          <p className="text-gray-600 mt-1">Review and manage entity registration requests</p>
        </div>

        {/* Tabs row */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Status tabs */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusTab(t.value)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  statusTab === t.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Entity type tabs */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {ENTITY_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setEntityTab(t.value)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  entityTab === t.value
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <TableComponent columns={columns} data={registrations} loading={loading} />

        {modalOpen && selected && (
          <DetailModal
            item={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onApprove={handleApprove}
            onReject={handleReject}
            loading={actionLoading}
          />
        )}
      </div>
  );
};

export default HospitalRegistrations;
