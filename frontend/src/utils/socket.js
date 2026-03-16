import { io } from "socket.io-client";

const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:4000";

const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,  // Increase from 5 to 10
  reconnectionDelay: 1000,   // Reduced from 2000
  reconnectionDelayMax: 5000, // Reduced from 10000
  randomizationFactor: 0.1,
});

export default socket;
