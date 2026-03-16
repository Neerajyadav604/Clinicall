import React from "react";
import { toast } from "react-toastify";
import { store } from "../store";
import { setToken } from "../slices/authSlice";
import { setUser } from "../slices/ProfileSlice";
import { authendpoint } from "./Api";
import axios from "axios";

const LOGOUT_BROADCAST_KEY = "auth:logout";
const WARNING_TOAST_ID = "session-expiry-warning";
const WARNING_THRESHOLD_MS = 2 * 60 * 1000;

let expiryTimerId = null;
let warningTimerId = null;
let listenersRegistered = false;

export const decodeJwt = (token) => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const getTokenExpiryMs = (token) => {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return null;
  return decoded.exp * 1000;
};

export const isTokenExpired = (token, skewMs = 0) => {
  const expMs = getTokenExpiryMs(token);
  if (!expMs) return true;
  return Date.now() + skewMs >= expMs;
};

export const clearSessionTimers = () => {
  if (expiryTimerId) clearTimeout(expiryTimerId);
  if (warningTimerId) clearTimeout(warningTimerId);
  expiryTimerId = null;
  warningTimerId = null;
  toast.dismiss(WARNING_TOAST_ID);
};

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminName");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
};

const broadcastLogout = () => {
  localStorage.setItem(LOGOUT_BROADCAST_KEY, String(Date.now()));
};

export const logout = ({
  reason = "manual",
  message,
  broadcast = true,
  redirectTo = "/login",
} = {}) => {
  clearSessionTimers();
  clearAuthStorage();
  store.dispatch(setToken(null));
  store.dispatch(setUser(null));

  if (reason === "expired") {
    toast.warning(message || "Your session has expired. Please log in again.");
  } else if (message) {
    toast.info(message);
  } else if (reason === "manual") {
    toast.success("Logged out");
  }

  if (broadcast) broadcastLogout();
  if (redirectTo) window.location.assign(redirectTo);
};

export const handleUnauthorized = () => {
  logout({ reason: "expired" });
};

export const refreshSession = async () => {
  try {
    const baseUrl =
      process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1";
    
    const response = await axios.post(
      `${baseUrl}${authendpoint.REFRESH_API}`,
      {}, // Refresh token comes from cookies with withCredentials: true
      { withCredentials: true }
    );
    
    const accessToken = response?.data?.accessToken;
    if (!accessToken) {
      throw new Error("No access token returned from refresh");
    }
    
    localStorage.setItem("token", accessToken);
    store.dispatch(setToken(accessToken));
    startSessionTimers(accessToken);
    toast.dismiss(WARNING_TOAST_ID);
    toast.success("Session extended successfully");
    return accessToken;
  } catch (error) {
    console.error("Session refresh failed:", error.message);
    // Show error message instead of auto-logout
    toast.dismiss(WARNING_TOAST_ID);
    toast.error(
      <div className="flex items-center gap-2">
        <span>Session refresh failed. Please log in again.</span>
      </div>,
      { toastId: "refresh-error", autoClose: 5000 }
    );
    // Give user a moment before logout
    setTimeout(() => {
      handleUnauthorized();
    }, 2000);
    throw error;
  }
};

const showExpiryWarning = () => {
  if (toast.isActive(WARNING_TOAST_ID)) return;
  
  const handleRefreshClick = async () => {
    try {
      await refreshSession();
    } catch (error) {
      // Error already handled in refreshSession() - don't do anything else here
      console.error("Refresh attempt failed:", error.message);
    }
  };
  
  toast.info(
    <div className="flex items-center gap-3">
      <span>Your session is about to expire. Stay logged in?</span>
      <button
        className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        onClick={handleRefreshClick}
      >
        Stay Logged In
      </button>
    </div>,
    { toastId: WARNING_TOAST_ID, autoClose: false, closeOnClick: false }
  );
};

export const startSessionTimers = (token) => {
  clearSessionTimers();
  const expMs = getTokenExpiryMs(token);
  if (!expMs) return;

  const timeUntilExpiry = expMs - Date.now();
  if (timeUntilExpiry <= 0) {
    handleUnauthorized();
    return;
  }

  if (timeUntilExpiry > WARNING_THRESHOLD_MS) {
    warningTimerId = setTimeout(
      showExpiryWarning,
      timeUntilExpiry - WARNING_THRESHOLD_MS
    );
  }

  expiryTimerId = setTimeout(handleUnauthorized, timeUntilExpiry);
};

const registerVisibilityHandler = () => {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const token = localStorage.getItem("token");
    if (token && isTokenExpired(token)) {
      handleUnauthorized();
    }
  });
};

const registerStorageHandler = () => {
  window.addEventListener("storage", (event) => {
    if (event.key === LOGOUT_BROADCAST_KEY) {
      logout({ reason: "expired", broadcast: false });
    }
  });
};

export const initAuthSession = () => {
  const token = localStorage.getItem("token");
  if (token) {
    if (isTokenExpired(token)) {
      handleUnauthorized();
    } else {
      startSessionTimers(token);
    }
  }

  if (!listenersRegistered) {
    registerVisibilityHandler();
    registerStorageHandler();
    listenersRegistered = true;
  }
};
