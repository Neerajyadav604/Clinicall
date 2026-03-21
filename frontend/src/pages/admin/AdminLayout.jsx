import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import PortalLayout from "../../components/layout/PortalLayout";
import { getAdminLinks } from "../../lib/dashboard-nav";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);

  // Check if user is admin
  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    
    // Debug logging
    console.log("AdminLayout - User object:", user);
    console.log("AdminLayout - User roles:", user.roles);
    console.log("AdminLayout - User role:", user.role);
    console.log("AdminLayout - Token exists:", !!token);
    
    // Support both old (role string) and new (roles array) schema
    const userRoles = Array.isArray(user.roles) 
      ? user.roles.map(r => r.toLowerCase()) 
      : (user.role ? [user.role.toLowerCase()] : []);
    
    console.log("AdminLayout - Normalized roles:", userRoles);
    const isAdminUser = userRoles.includes("admin");
    console.log("AdminLayout - Is admin?", isAdminUser);
    
    return isAdminUser;
  }, [user, token]);

  React.useEffect(() => {
    // IMPORTANT: Redirect if user is logged in but NOT admin
    // We check "user &&" to make sure we have user data before redirecting
    if (user && !isAdmin) {
      console.warn("AdminLayout - User is not admin, redirecting to home");
      console.warn("User object:", user);
      console.warn("User roles:", user.roles);
      console.warn("User role:", user.role);
      
      // Toast error with helpful message
      toast.error("Access denied. Admin role required.", { 
        autoClose: 5000,
        hideProgressBar: false 
      });
      navigate("/");
    }
    
    // Also redirect if no user is logged in at all
    if (!user && user !== undefined) {
      console.log("AdminLayout - No user logged in, redirecting to login");
      navigate("/login");
    }
  }, [isAdmin, user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    isAdmin ? (
      <PortalLayout
        title="Admin Dashboard"
        subtitle="Manage users, doctors, hospitals, and operations from one responsive workspace."
        brand="Clinicall Admin"
        sidebarLinks={getAdminLinks(handleLogout)}
        userPanel={{
          name: user?.fullName || user?.name || "Administrator",
          subtitle: user?.email || "Platform administrator",
          image: user?.image,
        }}
        backgroundClassName="bg-slate-50"
      >
        {children}
      </PortalLayout>
    ) : (
      <div className="flex items-center justify-center w-full min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  );
};

export default AdminLayout;
