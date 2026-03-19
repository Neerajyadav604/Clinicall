import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  CheckCircle,
  XCircle,
  Stethoscope,
  Calendar,
  User,
} from "lucide-react";
import {
  fetchNotifications,
  markAllReadApi,
  markOneReadApi,
  deleteNotificationApi,
} from "../services/operations/notificationApi";

const iconMap = {
  DOCTOR_APPROVED: CheckCircle,
  DOCTOR_REJECTED: XCircle,
  DOCTOR_REGISTRATION_SUBMITTED: Stethoscope,
  APPOINTMENT_BOOKED: Calendar,
  APPOINTMENT_CANCELLED: Calendar,
  APPOINTMENT_UPDATED: Calendar,
  USER_REGISTERED: User,
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading } = useSelector(
    (state) => state.notifications
  );
  const token = useSelector((state) => state.auth.token);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    dispatch(fetchNotifications());
    const interval = setInterval(() => {
      dispatch(fetchNotifications());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!token) return null;

  const badgeText = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label={`Notifications. You have ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={20} className="text-gray-700" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white" aria-hidden="true">
            {badgeText}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 px-3 sm:px-4 py-3 gap-2">
            <p className="text-xs sm:text-sm font-semibold text-gray-900">Notifications</p>
            <button
              onClick={() => dispatch(markAllReadApi())}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-xs sm:text-sm text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-xs sm:text-sm text-gray-500">No notifications yet 🔔</div>
            ) : (
              notifications.map((n) => {
                const Icon = iconMap[n.type] || Bell;
                return (
                  <button
                    key={n._id}
                    className={`w-full flex gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                      n.isRead ? "bg-white" : "bg-blue-50"
                    }`}
                    onClick={() => {
                      if (!n.isRead) {
                        dispatch(markOneReadApi(n._id));
                      }
                    }}
                  >
                    <div className="mt-1 text-blue-600 flex-shrink-0">
                      <Icon size={16} className="sm:w-4 sm:h-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm ${n.isRead ? "font-medium text-gray-700" : "font-semibold text-gray-900"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(deleteNotificationApi(n._id));
                      }}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      ✕
                    </button>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
