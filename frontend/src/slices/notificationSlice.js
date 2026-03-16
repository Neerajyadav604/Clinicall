import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications(state, action) {
      state.notifications = action.payload || [];
    },
    setUnreadCount(state, action) {
      state.unreadCount = action.payload || 0;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    markOneRead(state, action) {
      const id = action.payload;
      state.notifications = state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      );
      state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
    },
    markAllRead(state) {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    },
    removeNotification(state, action) {
      const id = action.payload;
      state.notifications = state.notifications.filter((n) => n._id !== id);
      state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
    },
  },
});

export const {
  setNotifications,
  setUnreadCount,
  setLoading,
  setError,
  markOneRead,
  markAllRead,
  removeNotification,
} = notificationSlice.actions;

export default notificationSlice.reducer;
