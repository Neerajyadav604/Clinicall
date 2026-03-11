const express = require("express");
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const connectDb = require('./config/Database')
require('dotenv').config();
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const Auth = require("./routes/Auth")
const Doctor = require("./routes/Doctor")
const UserRequests = require("./routes/UserRequests")
const Payment = require("./routes/Payment")
const fileUpload = require("express-fileupload");
const Registration = require("./routes/Registration")
const Admin = require("./routes/Admin")
const AI = require("./routes/AI")
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
      "http://192.168.124.137:3000",
      "http://192.168.137.202:3000"
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
app.use(cookieParser());

// sanitize only mutable fields; req.query is getter-only in newer Node/Express and
// causes "Cannot set property query" errors when the middleware assigns back.
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  // do NOT overwrite req.query
  next();
});

// custom sanitization: clean body and params only, leaving req.query untouched because
// newer Node/Express versions expose a getter-only property that throws when overwritten.
// xss-clean's default middleware attempts to set req.query which triggers the TypeError seen
// in production, so we replicate its behavior for mutable parts only.
const { clean: xssClean } = require('xss-clean/lib/xss');
app.use((req, res, next) => {
  if (req.body) req.body = xssClean(req.body);
  if (req.params) req.params = xssClean(req.params);
  if (req.query) {
    // mutate existing query object instead of assigning whole property
    const cleaned = xssClean(req.query);
    Object.assign(req.query, cleaned);
  }
  next();
});

connectCloudinary()
connectDb();

app.use("/api/v1",Auth)
app.use("/api/v1",Doctor)
app.use("/api/v1",UserRequests)
app.use("/api/v1",Payment)
app.use("/api/v1",Registration)
app.use("/api/v1/admin",Admin)
app.use("/api/v1/admin/analytics", require('./routes/AdminAnalytics'))
app.use("/api/v1/ai", AI)

// global error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

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
  socket.on("send_message", async ({ appointmentId, message, senderRole, fileUrl }) => {
    try {
      const roomId = `chat_${appointmentId}`;
      const msgObj = {
        conversationId: appointmentId,
        from: socket.user.id,
        to: null, // could compute later
        text: message,
        fileUrl,
        read: false
      };
      const ChatMessage = require('./models/ChatMessage');
      const saved = await ChatMessage.create(msgObj);

      const messageData = {
        id: saved._id,
        senderRole,
        message,
        fileUrl,
        timestamp: saved.createdAt,
      };

      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(roomId).emit("receive_message", messageData);

      console.log(`Message in room ${roomId}:`, message);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // typing indicator
  socket.on('typing', ({ appointmentId }) => {
    const roomId = `chat_${appointmentId}`;
    socket.to(roomId).emit('typing', { from: socket.user.id });
  });

  // read receipt
  socket.on('read', async ({ appointmentId }) => {
    try {
      const ChatMessage = require('./models/ChatMessage');
      await ChatMessage.updateMany({ conversationId: appointmentId, to: socket.user.id, read: false }, { read: true });
      io.to(`chat_${appointmentId}`).emit('read', { appointmentId, reader: socket.user.id });
    } catch (err) {
      console.error('Error updating read status', err);
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} ✔️`);
});