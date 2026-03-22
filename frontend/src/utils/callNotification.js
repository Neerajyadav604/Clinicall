// frontend/src/utils/callNotification.js
// Handles browser push notifications for incoming video calls
// Works even when the tab is in the background

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

let activeNotification = null;

export const showIncomingCallNotification = (callerName, callerRole, onAccept) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Close any existing notification
  if (activeNotification) activeNotification.close();

  const title = `Incoming Video Call`;
  const body  = `${callerRole === "doctor" ? "Dr. " : ""}${callerName} is calling you`;

  activeNotification = new Notification(title, {
    body,
    icon:    "/favicon.ico",
    badge:   "/favicon.ico",
    tag:     "incoming-call",
    renotify: true,
    requireInteraction: true, // stays visible until user interacts
  });

  activeNotification.onclick = () => {
    window.focus();
    activeNotification?.close();
    onAccept?.();
  };
};

export const dismissCallNotification = () => {
  if (activeNotification) {
    activeNotification.close();
    activeNotification = null;
  }
};
