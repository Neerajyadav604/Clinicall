import React from "react";
import {
  BarChart3,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  FileText,
  Hospital,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";

const iconClassName = "h-5 w-5 flex-shrink-0";

export const getAdminLinks = (onLogout) => [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className={iconClassName} />,
  },
  {
    label: "My Profile",
    href: "/admin/profile",
    icon: <UserCog className={iconClassName} />,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart3 className={iconClassName} />,
  },
  {
    label: "Doctor Registrations",
    href: "/admin/registrations",
    icon: <ClipboardList className={iconClassName} />,
  },
  {
    label: "Appointments",
    href: "/admin/appointments",
    icon: <CalendarDays className={iconClassName} />,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: <Users className={iconClassName} />,
  },
  {
    label: "Approved Doctors",
    href: "/admin/approved-doctors",
    icon: <CheckCircle className={iconClassName} />,
  },
  {
    label: "Rejected Doctors",
    href: "/admin/rejected-doctors",
    icon: <XCircle className={iconClassName} />,
  },
  {
    label: "Hospital Registrations",
    href: "/admin/hospital-registrations",
    icon: <Hospital className={iconClassName} />,
  },
  {
    label: "Approved Hospitals",
    href: "/admin/hospitals",
    icon: <Building2 className={iconClassName} />,
  },
  {
    label: "Logout",
    href: "/login",
    icon: <LogOut className={`${iconClassName} text-rose-500`} />,
    onClick: onLogout,
  },
];

export const getDoctorLinks = (onLogout) => [
  {
    label: "Dashboard",
    href: "/doctor/dashboard",
    icon: <LayoutDashboard className={iconClassName} />,
  },
  {
    label: "My Profile",
    href: "/doctor/profile",
    icon: <Stethoscope className={iconClassName} />,
  },
  {
    label: "Appointments",
    href: "/doctor/appointments",
    icon: <CalendarDays className={iconClassName} />,
  },
  {
    label: "Edit Profile",
    href: "/doctor/edit-profile",
    icon: <UserCog className={iconClassName} />,
  },
  {
    label: "Logout",
    href: "/login",
    icon: <LogOut className={`${iconClassName} text-rose-500`} />,
    onClick: onLogout,
  },
];

export const getPatientLinks = (onLogout) => [
  {
    label: "Dashboard",
    href: "/my-profile",
    icon: <LayoutDashboard className={iconClassName} />,
  },
  {
    label: "Medical Records",
    href: "/medical-records",
    icon: <FileText className={iconClassName} />,
  },
  {
    label: "My Requests",
    href: "/my-requests",
    icon: <ClipboardList className={iconClassName} />,
  },
  {
    label: "Book Appointment",
    href: "/appointment",
    icon: <Calendar className={iconClassName} />,
  },
  {
    label: "Edit Profile",
    href: "/editprofile",
    icon: <UserCog className={iconClassName} />,
  },
  {
    label: "Logout",
    href: "/login",
    icon: <LogOut className={`${iconClassName} text-rose-500`} />,
    onClick: onLogout,
  },
];

export const getHospitalAdminLinks = (onLogout) => [
  {
    label: "Dashboard",
    href: "/hospital-admin",
    icon: <LayoutDashboard className={iconClassName} />,
  },
  {
    label: "Public Listing",
    href: "/hospitals",
    icon: <Building2 className={iconClassName} />,
  },
  {
    label: "Logout",
    href: "/login",
    icon: <LogOut className={`${iconClassName} text-rose-500`} />,
    onClick: onLogout,
  },
];
