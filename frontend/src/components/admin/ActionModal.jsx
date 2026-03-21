import React, { useState } from "react";
import { HiOutlineX } from "react-icons/hi";

const ActionModal = ({ isOpen, onClose, doctor, type, onApprove, onReject }) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !doctor) return null;

  const handleApproveClick = async () => {
    setLoading(true);
    await onApprove();
    setLoading(false);
  };

  const handleRejectClick = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    setLoading(true);
    await onReject();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {type === "view" && "Doctor Profile"}
            {type === "approve" && "Approve Registration"}
            {type === "reject" && "Reject Registration"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <HiOutlineX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {type === "view" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900 font-semibold">{doctor.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{doctor.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Specialization</label>
                <p className="text-gray-900">{doctor.specialization}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Experience</label>
                <p className="text-gray-900">{doctor.experienceYears} years</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">License Number</label>
                <p className="text-gray-900">{doctor.licenseNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Hospital</label>
                <p className="text-gray-900">{doctor.hospitalName}</p>
              </div>
            </div>
          )}

          {type === "approve" && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  Are you sure you want to approve Dr. {doctor.fullName}?
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Doctor Name</label>
                <p className="text-gray-900">{doctor.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Specialization</label>
                <p className="text-gray-900">{doctor.specialization}</p>
              </div>
            </div>
          )}

          {type === "reject" && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">
                  Are you sure you want to reject Dr. {doctor.fullName}?
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Doctor Name</label>
                <p className="text-gray-900">{doctor.fullName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows="3"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            disabled={loading}
          >
            Cancel
          </button>

          {type === "approve" && (
            <button
              onClick={handleApproveClick}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Processing..." : "Approve"}
            </button>
          )}

          {type === "reject" && (
            <button
              onClick={handleRejectClick}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Processing..." : "Reject"}
            </button>
          )}

          {type === "view" && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionModal;
