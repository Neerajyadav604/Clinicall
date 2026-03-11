import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import TableComponent from "../../components/admin/TableComponent";
import { toast } from "react-toastify";
import { getUsers } from "../../services/adminApi";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to load users");
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      user: "bg-blue-100 text-blue-800",
      doctor: "bg-green-100 text-green-800",
      admin: "bg-purple-100 text-purple-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${styles[role] || ""}`}>
        {role}
      </span>
    );
  };

  const columns = [
    { key: "fullName", label: "Full Name" },
    { key: "email", label: "Email" },
    { key: "contact", label: "Contact" },
    {
      key: "role",
      label: "Role",
      render: (value) => getRoleBadge(value),
    },
    {
      key: "createdAt",
      label: "Joined Date",
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage system users and their roles</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Table */}
        <TableComponent columns={columns} data={users} loading={loading} />
      </div>
    </AdminLayout>
  );
};


export default Users;
