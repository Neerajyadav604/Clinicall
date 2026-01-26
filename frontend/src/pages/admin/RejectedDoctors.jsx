import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import TableComponent from "../../components/admin/TableComponent";
import { toast } from "react-toastify";
import { getRejectedDoctors } from "../../services/adminApi";

const RejectedDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRejectedDoctors();
  }, []);

  const fetchRejectedDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRejectedDoctors();
      setDoctors(data.data || []);
    } catch (err) {
      console.error("Error fetching rejected doctors:", err);
      setError(err.message || "Failed to load doctors");
      toast.error(err.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "fullName", label: "Doctor Name" },
    { key: "email", label: "Email" },
    { key: "specialization", label: "Specialization" },
    { key: "experienceYears", label: "Experience (Years)" },
    { key: "licenseNumber", label: "License Number" },
    { key: "rejectionReason", label: "Rejection Reason" },
    {
      key: "rejectedAt",
      label: "Rejected Date",
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rejected Doctors</h1>
          <p className="text-gray-600 mt-1">View rejected doctor registration requests</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Table */}
        <TableComponent columns={columns} data={doctors} loading={loading} />
      </div>
    </AdminLayout>
  );
};


export default RejectedDoctors;
