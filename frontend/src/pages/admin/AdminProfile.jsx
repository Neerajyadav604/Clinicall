import React from "react";
import { useSelector } from "react-redux";
import AdminLayout from "./AdminLayout";

const AdminProfile = () => {
  const { user } = useSelector((state) => state.profile);

  return (
   
      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 text-2xl font-semibold text-white">
                {(user?.fullName || user?.name || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">
                  {user?.fullName || user?.name || "Administrator"}
                </p>
                <p className="text-gray-600">System Administrator</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                  {user?.fullName || user?.name || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                  {user?.email || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                  {(user?.role || user?.roles?.[0] || "admin").toUpperCase()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>

              {user?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                    {user.phone}
                  </p>
                </div>
              )}

              {user?.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                    {user.address}
                  </p>
                </div>
              )}
            </div>

            {/* Account Status */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium">Account Status</p>
                  <p className="text-green-900 font-semibold">Active</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 font-medium">Admin Privileges</p>
                  <p className="text-blue-900 font-semibold">Full Access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
};

export default AdminProfile;
