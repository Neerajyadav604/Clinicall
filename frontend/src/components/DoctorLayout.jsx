import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Bell } from "lucide-react";
import PortalLayout from "./layout/PortalLayout";
import { getDoctorLinks } from "../lib/dashboard-nav";

/**
 * DoctorLayout Component
 * Provides navigation and layout for all doctor dashboard pages
 * Uses the animated Shadcn-style sidebar
 */
const DoctorLayout = ({ children }) => {
  const navigate = useNavigate();

  const getDoctorInfo = () => {
    try {
      const doctorProfile = localStorage.getItem("doctorProfile");
      if (doctorProfile) {
        const doctor = JSON.parse(doctorProfile);
        return {
          name: doctor.fullName || "Doctor",
          image: doctor.image || null,
        };
      }

      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        return {
          name: user.fullName || "Doctor",
          image: user.image || null,
        };
      }
      return { name: "Doctor", image: null };
    } catch {
      return { name: "Doctor", image: null };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("doctorProfile");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const doctorInfo = getDoctorInfo();
  const doctorName = doctorInfo.name;

  return (
    <PortalLayout
      title="Doctor Portal"
      subtitle={`Welcome back, ${doctorName}`}
      brand="Clinicall Doctor"
      sidebarLinks={getDoctorLinks(handleLogout)}
      userPanel={{
        name: doctorName,
        subtitle: "Doctor account",
        image: doctorInfo.image,
      }}
      headerActions={
        <button className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50">
          <Bell className="h-5 w-5" />
        </button>
      }
      backgroundClassName="bg-slate-50"
    >
      {children}
    </PortalLayout>
  );
};

export default DoctorLayout;
