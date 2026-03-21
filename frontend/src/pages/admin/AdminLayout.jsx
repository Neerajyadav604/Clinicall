import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import PortalLayout from "../../components/layout/PortalLayout";
import { getAdminLinks } from "../../lib/dashboard-nav";

const AdminLayout = ({ children, title, subtitle, fullWidth = false }) => {
  const navigate = useNavigate();
  const { user: reduxUser } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Debug: log the current state
    console.group("AdminLayout Verification");
    console.log("Token:", token);
    console.log("User:", reduxUser);
    console.log("User role:", reduxUser?.role);
    console.log("User roles:", reduxUser?.roles);
    
    // Verify admin access
    const verifyAdmin = () => {
      // Check if token exists
      if (!token) {
        console.log("❌ No token found");
        console.groupEnd();
        setIsChecking(false);
        navigate("/login");
        return;
      }

      // Check if user exists
      if (!reduxUser) {
        console.log("⏳ User data still loading...");
        console.groupEnd();
        return;
      }

      // Check role
      const userRoles = Array.isArray(reduxUser.roles) 
        ? reduxUser.roles.map(r => typeof r === 'string' ? r.toLowerCase() : r) 
        : (reduxUser.role ? [reduxUser.role.toLowerCase()] : []);
      
      console.log("Normalized roles:", userRoles);
      const hasAdminRole = userRoles.includes("admin");
      console.log("Has admin role:", hasAdminRole);

      if (!hasAdminRole) {
        console.error("❌ User is not admin. Roles:", userRoles);
        console.groupEnd();
        toast.error("Access denied. Admin role required.", { autoClose: 5000 });
        setIsChecking(false);
        navigate("/");
        return;
      }

      // User is admin
      console.log("✅ Admin verified!");
      console.groupEnd();
      setIsAdmin(true);
      setIsChecking(false);
    };

    verifyAdmin();
  }, [token, reduxUser, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    isChecking ? (
      <div className="flex items-center justify-center w-full min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    ) : isAdmin ? (
      <PortalLayout
        title={title || "Admin Dashboard"}
        subtitle={subtitle || "Manage users, doctors, hospitals, and operations from one responsive workspace."}
        brand="Clinicall Admin"
        sidebarLinks={getAdminLinks(handleLogout)}
        userPanel={{
          name: reduxUser?.fullName || reduxUser?.name || "Administrator",
          subtitle: reduxUser?.email || "Platform administrator",
          image: null, // Don't show old doctor/user images for admin accounts
        }}
        backgroundClassName="bg-slate-50"
        wrapperClassName={fullWidth ? "app-main-wrapper-fullwidth" : ""}
      >
        {children}
      </PortalLayout>
    ) : (
      <div className="flex items-center justify-center w-full min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-semibold mb-4">Access Denied</p>
          <p className="text-gray-600 mb-6">You do not have admin permissions.</p>
          <div className="bg-slate-100 p-4 rounded-lg mb-6 text-left text-xs max-h-48 overflow-y-auto">
            <p className="font-mono font-semibold mb-2">Debug Info:</p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">User:</span> {reduxUser?.fullName || reduxUser?.name || "N/A"}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Role:</span> {reduxUser?.role || "undefined"}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Roles:</span> {JSON.stringify(reduxUser?.roles || [])}
            </p>
            <p className="text-gray-500 text-xs mt-4">Check browser console for more details</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Log in Again
          </button>
        </div>
      </div>
    )
  );
};

export default AdminLayout;
