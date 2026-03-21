import React, { useState, useEffect } from "react";
import TableComponent from "../../components/admin/TableComponent";
import ActionModal from "../../components/admin/ActionModal";
import { HiOutlineEye, HiOutlineCheck, HiOutlineX } from "react-icons/hi";
import { toast } from "react-toastify";
import {
  getDoctorRegistrations,
  approveDoctorRegistration,
  rejectDoctorRegistration,
  sendNotificationEmail,
} from "../../services/adminApi";

const DoctorRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredStatus, setFilteredStatus] = useState("PENDING");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'approve' or 'reject'
  const [actionLoading, setActionLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchRegistrations();
  }, [filteredStatus]);
// Removed debug log
  const fetchRegistrations = async () => {
    try {
      // Debug removed

      setLoading(true);
      setError(null);
      const data = await getDoctorRegistrations(filteredStatus);
      // Data logging removed
      setRegistrations(data.data || []);
    } catch (err) {
      console.error("Error fetching registrations:", err);
      setError(err.message || "Failed to load registrations");
      toast.error(err.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDoctor?._id) return;
    try {
      setActionLoading(true);
      await approveDoctorRegistration(selectedDoctor._id);
      toast.success(`Dr. ${selectedDoctor.fullName} approved successfully!`);
      await sendNotificationEmail(selectedDoctor.email, "approved", selectedDoctor.fullName);
      await fetchRegistrations();
      setModalOpen(false);
      setSelectedDoctor(null);
    } catch (err) {
      console.error("Error approving registration:", err);
      toast.error(err.message || "Failed to approve registration");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoctor?._id) return;
    try {
      setActionLoading(true);
      await rejectDoctorRegistration(selectedDoctor._id);
      toast.success(`Dr. ${selectedDoctor.fullName} rejected!`);
      await sendNotificationEmail(selectedDoctor.email, "rejected", selectedDoctor.fullName);
      await fetchRegistrations();
      setModalOpen(false);
      setSelectedDoctor(null);
    } catch (err) {
      console.error("Error rejecting registration:", err);
      toast.error(err.message || "Failed to reject registration");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: "fullName", label: "Doctor Name" },
    { key: "email", label: "Email" },
    { key: "specialization", label: "Specialization" },
    { key: "experienceYears", label: "Experience (Years)" },
    { key: "submittedAt", label: "Registration Date", render: (value) => new Date(value).toLocaleDateString() },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedDoctor(row);
              setModalType("view");
              setModalOpen(true);
            }}
            className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
            title="View Profile"
          >
            <HiOutlineEye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedDoctor(row);
              setModalType("approve");
              setModalOpen(true);
            }}
            className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
            title="Approve"
          >
            <HiOutlineCheck className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedDoctor(row);
              setModalType("reject");
              setModalOpen(true);
            }}
            className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
            title="Reject"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctor Registrations</h1>
            <p className="text-gray-600 mt-1">Manage doctor registration requests</p>
          </div>
          <div>
            <select
              value={filteredStatus}
              onChange={(e) => setFilteredStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Table */}
        <TableComponent columns={columns} data={registrations} loading={loading} />

        {/* Modal */}
        {selectedDoctor && (
          <ActionModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelectedDoctor(null);
            }}
            doctor={selectedDoctor}
            type={modalType}
            onApprove={handleApprove}
            onReject={handleReject}
            loading={actionLoading}
          />
        )}
      </div>
  );
};

export default DoctorRegistrations;
