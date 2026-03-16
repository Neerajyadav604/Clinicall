import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../../components/ui/sidebar";
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  CalendarDays,
  Users,
  CheckCircle,
  XCircle,
  Building2,
  Hospital,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const AdminLayout = ({ children }) => {
  const [open, setOpen] = useState(false);
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
  }, [user]);

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

  const links = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Analytics",
      href: "/admin/analytics",
      icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Doctor Registrations",
      href: "/admin/registrations",
      icon: <ClipboardList className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Appointments",
      href: "/admin/appointments",
      icon: <CalendarDays className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Approved Doctors",
      href: "/admin/approved-doctors",
      icon: <CheckCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Rejected Doctors",
      href: "/admin/rejected-doctors",
      icon: <XCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Hospital Registrations",
      href: "/admin/hospital-registrations",
      icon: <Hospital className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Approved Hospitals",
      href: "/admin/hospitals",
      icon: <Building2 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
  ];

  return (
    isAdmin ? (
    <div className="flex flex-row w-full min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 min-h-screen">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            {open ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-base text-neutral-800 dark:text-white flex items-center gap-2 py-1"
              >
                <div className="h-5 w-6 bg-blue-600 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
                Clinicall Admin
              </motion.div>
            ) : (
              <div className="h-5 w-6 bg-blue-600 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            )}

            {/* Nav Links */}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Logout */}
          <div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 group/sidebar py-2 text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-sm whitespace-pre inline-block !p-0 !m-0"
              >
                Logout
              </motion.span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 py-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h2>
          <p className="text-sm text-gray-500">Manage your platform from here.</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </div>
    </div>
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
