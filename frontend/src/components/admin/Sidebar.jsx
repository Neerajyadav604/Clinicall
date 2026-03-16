import React from "react";
import { NavLink } from "react-router-dom";
import { HiOutlineHome, HiOutlineUser, HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineDocumentText } from "react-icons/hi";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <HiOutlineHome className="w-6 h-6" />,
    },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: <HiOutlineDocumentText className="w-6 h-6" />,
    },
    {
      name: "Doctor Registrations",
      path: "/admin/registrations",
      icon: <HiOutlineDocumentText className="w-6 h-6" />,
    },
    {
      name: "Appointments",
      path: "/admin/appointments",
      icon: <HiOutlineCalendar className="w-6 h-6" />,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: <HiOutlineUser className="w-6 h-6" />,
    },
    {
      name: "Approved Doctors",
      path: "/admin/approved-doctors",
      icon: <HiOutlineCheckCircle className="w-6 h-6" />,
    },
    {
      name: "Rejected Doctors",
      path: "/admin/rejected-doctors",
      icon: <HiOutlineXCircle className="w-6 h-6" />,
    },
    {
      name: "Hospital Registrations",
      path: "/admin/hospital-registrations",
      icon: <HiOutlineDocumentText className="w-6 h-6" />,
    },
    {
      name: "Approved Hospitals",
      path: "/admin/hospitals",
      icon: <HiOutlineCheckCircle className="w-6 h-6" />,
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 ease-in-out overflow-y-auto`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-blue-700">
          <div className="text-2xl font-bold">
            {isOpen ? "ClinicAll Admin" : "CA"}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-blue-100 hover:bg-blue-700"
                }`
              }
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {isOpen && <span className="font-medium">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
