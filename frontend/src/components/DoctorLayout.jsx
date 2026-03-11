import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
import {
  LayoutDashboard,
  UserCog,
  CalendarDays,
  LogOut,
  Stethoscope,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

/**
 * DoctorLayout Component
 * Provides navigation and layout for all doctor dashboard pages
 * Uses the animated Shadcn-style sidebar
 */
const DoctorLayout = ({ children }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const getDoctorName = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        return user.fullName || "Doctor";
      }
      return "Doctor";
    } catch {
      return "Doctor";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("doctorProfile");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const links = [
    {
      label: "Dashboard",
      href: "/doctor/dashboard",
      icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "My Profile",
      href: "/doctor/profile",
      icon: <Stethoscope className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Appointments",
      href: "/doctor/appointments",
      icon: <CalendarDays className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Edit Profile",
      href: "/doctor/edit-profile",
      icon: <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
  ];

  const doctorName = getDoctorName();
  const initials = doctorName.charAt(0).toUpperCase();

  return (
    // Use min-h-[calc(100vh-96px)] so it fills the remaining screen below the 96px (pt-24) top navbar
    <div className="flex flex-row w-full min-h-[calc(100vh-96px)] bg-gray-50 dark:bg-neutral-900">
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 min-h-[calc(100vh-96px)]">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            {open ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-base text-neutral-800 dark:text-white flex items-center gap-2 py-1"
              >
                <div className="h-5 w-6 bg-blue-600 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
                Clinicall Doctor
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

          {/* Bottom: logout + user */}
          <div className="flex flex-col gap-2">
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
            <SidebarLink
              link={{
                label: doctorName,
                href: "/doctor/profile",
                icon: (
                  <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Doctor Portal
            </h2>
            <p className="text-sm text-gray-500">Welcome back, {doctorName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                {initials}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-white hidden md:block">{doctorName}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-neutral-900">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DoctorLayout;
