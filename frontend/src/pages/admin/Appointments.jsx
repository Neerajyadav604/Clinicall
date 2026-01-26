import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import TableComponent from "../../components/admin/TableComponent";
import { HiOutlineCheck, HiOutlineX, HiOutlineEye } from "react-icons/hi";
import { toast } from "react-toastify";
import {
  getAppointments,
  approveAppointment,
  rejectAppointment,
} from "../../services/adminApi";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [selectedStatus]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = selectedStatus !== "all" ? selectedStatus : null;
      const data = await getAppointments(status);
      setAppointments(data.data || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(err.message || "Failed to load appointments");
      toast.error(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      setActionLoading(true);
      await approveAppointment(appointmentId);
      toast.success("Appointment approved!");
      await fetchAppointments();
    } catch (err) {
      console.error("Error:", err);
      toast.error(err.message || "Failed to approve appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    try {
      setActionLoading(true);
      await rejectAppointment(appointmentId);
      toast.success("Appointment cancelled!");
      await fetchAppointments();
    } catch (err) {
      console.error("Error:", err);
      toast.error(err.message || "Failed to cancel appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status] || ""}`}>
        {status}
      </span>
    );
  };

  const columns = [
    { key: "patientName", label: "Patient Name" },
    { key: "doctorName", label: "Doctor Name" },
    {
      key: "appointmentDate",
      label: "Date",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    { key: "appointmentTime", label: "Time" },
    {
      key: "status",
      label: "Status",
      render: (value) => getStatusBadge(value),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleApproveAppointment(row._id)}
            className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
            title="Approve"
            disabled={row.status !== "PENDING"}
          >
            <HiOutlineCheck className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleRejectAppointment(row._id)}
            className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
            title="Cancel"
            disabled={row.status === "CANCELLED"}
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Manage patient appointments</p>
          </div>
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Appointments</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="CANCELLED">Cancelled</option>
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
        <TableComponent columns={columns} data={appointments} loading={loading} />
      </div>
    </AdminLayout>
  );
};
;

export default Appointments;
