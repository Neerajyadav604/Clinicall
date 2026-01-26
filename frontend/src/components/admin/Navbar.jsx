import React from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineMenu, HiOutlineLogout, HiOutlineUser } from "react-icons/hi";

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const adminName = localStorage.getItem("adminName") || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    navigate("/admin-login");
  };

  return (
    <nav className="bg-white shadow-md h-20 flex items-center justify-between px-6 border-b border-gray-200">
      {/* Left - Menu Button */}
      <button
        onClick={onMenuClick}
        className="text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <HiOutlineMenu className="w-6 h-6" />
      </button>

      {/* Center - Title */}
      <h1 className="text-2xl font-bold text-gray-800">Doctor Appointment Admin</h1>

      {/* Right - Profile & Logout */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <HiOutlineUser className="w-6 h-6" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900">{adminName}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <HiOutlineLogout className="w-5 h-5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
