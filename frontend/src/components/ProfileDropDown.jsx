import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";
import { Link } from "react-router-dom";
import { logout } from "../services/operations/Authapi";

const ProfileDropDown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // ✅ Get user from Redux store (logged-in user from profile slice)
  const { user } = useSelector((state) => state.profile);
  
  // Use the authenticated user directly - don't merge with doctorProfile or other stale data
  const resolvedUser = useMemo(() => {
    return user || {};
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    console.log("Logging out...");
    dispatch(logout(navigate));
  };

  // ✅ Get profile path based on user role
  const getProfilePath = () => {
    const userRole = resolvedUser?.role?.toLowerCase();

    if (userRole === "admin") {
      return "/admin/profile";
    } else if (userRole === "doctor") {
      return "/doctor/profile";
    } else if (userRole === "hospital_admin") {
      return "/hospital-admin/profile";
    }

    return "/my-profile";
  };

  // ✅ Get user initials for fallback
  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // ✅ Truncate email if too long
  const truncateEmail = (email) => {
    if (!email) return "";
    if (email.length > 24) {
      return email.substring(0, 24) + "...";
    }
    return email;
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full transition focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {/* ✅ Profile Image or Initials */}
        {resolvedUser?.image ? (
          <img
            src={resolvedUser.image}
            alt={resolvedUser.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
            {getInitials(resolvedUser?.fullName)}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] max-h-[calc(100vh-80px)] overflow-y-auto">
          {/* ✅ User Info Header (visible on mobile) */}
          <div className="sm:hidden px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {resolvedUser?.image ? (
                <img
                  src={resolvedUser.image}
                  alt={resolvedUser.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {getInitials(resolvedUser?.fullName)}
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {resolvedUser?.fullName || "User"}
                </div>
                <div className="text-xs text-gray-500">
                  {truncateEmail(resolvedUser?.email)}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <Link
            to={getProfilePath()}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-4 h-4" />
            Profile
          </Link>

          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>

          <Link
            to="/notifications"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </Link>

          <div className="border-t my-1" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropDown;
