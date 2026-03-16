import { axiosInstance } from "../ApiConnector";
import {
  setNotifications,
  setUnreadCount,
  setLoading,
  setError,
  markOneRead,
  markAllRead,
  removeNotification,
} from "../../slices/notificationSlice";

export const fetchNotifications = () => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const response = await axiosInstance.get("/notifications");
      dispatch(setNotifications(response.data.notifications || []));
      dispatch(setUnreadCount(response.data.unreadCount || 0));
    } catch (error) {
      dispatch(setError(error.message || "Failed to fetch notifications"));
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const markAllReadApi = () => {
  return async (dispatch) => {
    try {
      await axiosInstance.patch("/notifications/mark-all-read");
      dispatch(markAllRead());
    } catch (error) {
      dispatch(setError(error.message || "Failed to mark all read"));
    }
  };
};

export const markOneReadApi = (id) => {
  return async (dispatch) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/mark-read`);
      dispatch(markOneRead(id));
    } catch (error) {
      dispatch(setError(error.message || "Failed to mark read"));
    }
  };
};

export const deleteNotificationApi = (id) => {
  return async (dispatch) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      dispatch(removeNotification(id));
    } catch (error) {
      dispatch(setError(error.message || "Failed to delete notification"));
    }
  };
};
