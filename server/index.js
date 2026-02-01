const express = require("express");
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const connectDb = require('./config/Database')
require('dotenv').config();
const Auth = require("./routes/Auth")
const Doctor = require("./routes/Doctor")
const UserRequests = require("./routes/UserRequests")
const Payment = require("./routes/Payment")
const fileUpload = require("express-fileupload");
const Registration = require("./routes/Registration")
const Admin = require("./routes/Admin")
const {connectCloudinary} = require('./config/Cloudinary')
const cors = require("cors");
const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://192.168.124.137:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

app.get("/", (req, res) => {
  res.send("Hello Express!");
});


app.use(
  cors({
    origin:[
      "http://localhost:3000",
      "http://192.168.124.137:3000"
    ], 
    credentials: true,              
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use(express.json());
connectCloudinary()
connectDb();

app.use("/api/v1",Auth)
app.use("/api/v1",Doctor)
app.use("/api/v1",UserRequests)
app.use("/api/v1",Payment)
app.use("/api/v1",Registration)
app.use("/api/v1/admin",Admin)

// ============================================
// SOCKET.IO CHAT CONFIGURATION
// ============================================

const Appointment = require("./models/Appointment");

// Store active chat rooms
const activeChatRooms = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const appointmentId = socket.handshake.auth.appointmentId;

    if (!token || !appointmentId) {
      return next(new Error("Authentication failed"));
    }

    // Verify appointment exists and user has access
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return next(new Error("Appointment not found"));
    }

    // Attach appointment to socket
    socket.appointmentId = appointmentId;
    socket.appointment = appointment;
    
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join chat room
  socket.on("join_chat", ({ appointmentId }) => {
    try {
      const roomId = `chat_${appointmentId}`;
      socket.join(roomId);
      
      if (!activeChatRooms.has(roomId)) {
        activeChatRooms.set(roomId, {
          messages: [],
          participants: []
        });
      }
      
      const chatRoom = activeChatRooms.get(roomId);
      chatRoom.participants.push(socket.id);
      
      // Send chat history to user
      socket.emit("chat_history", chatRoom.messages);
      
      // Notify others that user joined
      socket.to(roomId).emit("user_joined", {
        message: "User joined the chat",
        timestamp: new Date()
      });
      
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    } catch (error) {
      console.error("Error joining chat:", error);
      socket.emit("error", "Failed to join chat");
    }
  });

  // Receive and broadcast messages
  socket.on("send_message", ({ appointmentId, message, senderRole }) => {
    try {
      const roomId = `chat_${appointmentId}`;

      const messageData = {
        id: socket.id,
        senderRole,
        message,
        timestamp: new Date(),
      };

      // Store message in room
      if (activeChatRooms.has(roomId)) {
        activeChatRooms.get(roomId).messages.push(messageData);
      }

      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(roomId).emit("receive_message", messageData);

      console.log(`Message in room ${roomId}:`, message);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // Clean up active chat rooms
    activeChatRooms.forEach((room, roomId) => {
      const index = room.participants.indexOf(socket.id);
      if (index > -1) {
        room.participants.splice(index, 1);
      }
      
      // Remove room if no participants
      if (room.participants.length === 0) {
        activeChatRooms.delete(roomId);
      }
    });
  });

  // Error handler
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✔️`);
});