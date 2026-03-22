# JITSI MEET INTEGRATION ANALYSIS REPORT

**Report Date:** March 22, 2026  
**Project:** Clinicall Backend (Medical Consultation Platform)  
**Status:** Complete Code Analysis - No Modifications Made

---

## TABLE OF CONTENTS

1. [Project Structure](#1-project-structure)
2. [Frontend — Chat System](#2-frontend--chat-system)
3. [Frontend — Authentication](#3-frontend--authentication)
4. [Backend — Server Setup](#4-backend--server-setup)
5. [Backend — Chat Logic & Socket.io Events](#5-backend--chat-logic--socketio-events)
6. [Package Dependencies](#6-package-dependencies)
7. [Deployment & Environment](#7-deployment--environment)
8. [Integration Summary](#integration-summary-for-jitsi-meet)

---

## 1. PROJECT STRUCTURE

### 1.1 Architecture Type

**Monorepo with separate frontend and backend:**
- `frontend/` — React 19 application (react-scripts)
- `server/` — Node.js/Express backend
- `ml-service/` — Python ML service
- `tests/` — Playwright E2E tests

### 1.2 Frontend Entry Point

- **Main Entry:** `frontend/src/index.js`
- **App Router:** `frontend/src/App.js`
- **Routing:** React Router v7 with protected routes
- **State Management:** Redux Toolkit

### 1.3 Backend Entry Point

- **Main Server:** `server/index.js` (Express + Socket.io on port 4000)
- **Architecture:** MVC with routes, controllers, models, middleware
- **Database:** MongoDB + Mongoose
- **Key Dependencies:** Express, Socket.io, JWT auth, Cloudinary (file uploads)

### 1.4 Frontend File Structure (Key Paths)

```
frontend/src/
├── pages/
│   ├── Chat.jsx ..................... Chat/messaging page (socket.io-based)
│   ├── AIChat.jsx ................... AI health assistant widget
│   ├── ConsultationPage.js .......... Consultation session management
│   ├── doctor/
│   │   └── ClinicalNotes.jsx ........ Doctor notes with consent requests
│   └── [other pages]
├── components/
│   ├── chat/
│   │   └── ChatWidget.jsx ........... Floating chat widget (embedded AIChat)
│   └── consultation/
│       ├── DoctorConsultationPanel.js ... Doctor-side consultation UI
│       ├── PatientLiveView.js ........ Patient-side live records viewer
│       └── RecordCard.js ............ Medical record display
├── utils/
│   ├── socket.js ................... Socket.io client initialization
│   └── socketManager.js ............ Global socket connection manager
├── services/
│   ├── authSession.js .............. Auth session management
│   ├── operations/Authapi.js ........ REST API calls
│   └── aiApi.js .................... AI chat endpoint
├── slices/
│   └── authSlice.js ................ Redux auth state (token, loading)
└── [routes, store, etc.]
```

### 1.5 Backend File Structure (Key Routes)

```
server/
├── index.js ....................... Server setup, Socket.io handlers, auth middleware
├── routes/
│   ├── Auth.js .................... Login, signup, password management
│   ├── consultation.routes.js ...... Consultation session REST endpoints
│   ├── Doctor.js .................. Doctor appointments, profile
│   ├── UserRequests.js ............ Patient appointment requests
│   ├── AI.js ...................... AI symptom analysis, chat endpoints
│   ├── ConsentApi.js .............. FHIR consent management
│   ├── Notification.js ............ Notifications
│   ├── admin/ ..................... Admin dashboard routes
│   └── [other routes]
├── models/
│   ├── User.js .................... User document (roles: user|doctor|admin|hospital_admin)
│   ├── Appointment.js ............. Appointment with consultation fields
│   ├── ChatMessage.js ............. Chat messages (conversationId-based)
│   └── [other models]
├── controllers/
│   ├── consultationController.js .. Start/end sessions, manage records
│   ├── authController.js .......... Auth logic
│   └── [other controllers]
├── middleware/
│   ├── authMiddleware.js .......... JWT verification, role checks
│   ├── errorHandler.js ............ Global error handling
│   └── phiSanitizer.js ............ PHI data security
├── config/
│   ├── Database.js ................ MongoDB connection
│   └── Cloudinary.js .............. File upload service
└── utils/
    ├── token.js ................... JWT creation/verification
    ├── mailSender.js .............. Email notifications
    └── [utilities]
```

---

## 2. FRONTEND — CHAT SYSTEM

### 2.1 Main Chat Component

**File:** `frontend/src/pages/Chat.jsx` (700+ lines)

#### Complete Code Structure:

```javascript
// ============================================
// SUB-COMPONENTS
// ============================================

const MessageBubble = ({ message, isOwnMessage }) => {
  // Renders individual message with file support
  // - Text messages with timestamps
  // - Image attachments (clickable)
  // - PDF/document downloads (📎 icon)
  // Returns: styled div with message content
  
  const renderFileContent = () => {
    if (!message.fileUrl) return null;

    const isImage = message.fileType?.startsWith('image/');
    const fileName = message.fileName || 'File';

    if (isImage) {
      return (
        <div className="mt-2">
          <img
            src={message.fileUrl}
            alt={fileName}
            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
          <p className="text-xs mt-1 opacity-75">{fileName}</p>
        </div>
      );
    }

    return (
      <div className="mt-2">
        <a
          href={message.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            isOwnMessage
              ? "bg-blue-700 hover:bg-blue-800"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
          } transition-colors`}
        >
          📎 {fileName}
        </a>
      </div>
    );
  };

  return (
    <div className={`flex mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl shadow-sm ${
          isOwnMessage
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-900 rounded-bl-md"
        }`}
      >
        {message.message && (
          <p className="text-sm leading-relaxed break-words">{message.message}</p>
        )}
        {renderFileContent()}
        <p
          className={`text-xs mt-2 ${
            isOwnMessage ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
};

const MessageList = ({ messages, messagesEndRef }) => {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start a conversation with your doctor!</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((msg, index) => (
            <MessageBubble
              key={`${msg.timestamp}-${index}`}
              message={msg}
              isOwnMessage={msg.senderRole?.toLowerCase() === "user"}
            />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

const ChatInput = ({
  messageInput,
  setMessageInput,
  handleSendMessage,
  handleFileUpload,
  isConnected,
  error,
  onClearError
}) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = '';
  };

  return (
    <div className="w-full bg-white border-t border-gray-200 px-6 py-4">
      <form onSubmit={handleSendMessage} className="flex gap-3">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => {
            setMessageInput(e.target.value);
            if (onClearError) onClearError();
          }}
          placeholder="Type your message..."
          disabled={!isConnected}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!isConnected}
          className="px-4 py-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
          title="Attach file"
        >
          📎
        </button>
        <button
          type="submit"
          disabled={!isConnected || !messageInput.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
        >
          Send
        </button>
      </form>
      {!isConnected && (
        <p className="text-sm text-red-600 mt-2 text-center">⚠️ Connection lost. Reconnecting...</p>
      )}
      {error ? (
        <div className="error-box mt-2" role="alert" aria-live="polite">
          {error}
        </div>
      ) : null}
    </div>
  );
};

const ChatHeader = ({ appointmentDetails, isConnected }) => {
  return (
    <div className="w-full bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">
            {appointmentDetails?.doctorName || "doctor"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {appointmentDetails && (
              <>
                {new Date(appointmentDetails.appointmentDate).toLocaleDateString()} at{" "}
                {appointmentDetails.appointmentTime}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN CHAT COMPONENT
// ============================================

const Chat = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketInitialized = useRef(false);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ────────────────────────────────────────
  // FILE UPLOAD HANDLER
  // ────────────────────────────────────────
  const handleFileUpload = async (file) => {
    setInputError("");
    if (!socket.connected || !isConnected) {
      setInputError("Cannot upload file - not connected");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setInputError("File size must be less than 10MB");
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (!allowedTypes.includes(file.type)) {
      setInputError("File type not supported. Please upload images, PDFs, or documents.");
      return;
    }

    try {
      toast.info("Uploading file...");

      const formData = new FormData();
      formData.append('file', file);
      formData.append('appointmentId', appointmentId);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api/v1"}/upload/chat-file`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }
        throw new Error(data.message || "File upload failed");
      }

      const token_payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = (token_payload.role || "user").toLowerCase();

      const fileMessageData = {
        appointmentId,
        message: file.name,
        fileUrl: data.url,
        fileName: file.name,
        fileType: file.type,
        timestamp: new Date(),
        senderRole: userRole,
      };

      socket.emit("send_message", fileMessageData);
      toast.success("File uploaded successfully!");

    } catch (error) {
      console.error("File upload error:", error);
      setInputError(error.message || "Failed to upload file");
    }
  };

  // ────────────────────────────────────────
  // VERIFY CHAT ACCESS & REGISTER LISTENERS
  // ────────────────────────────────────────
  useEffect(() => {
    if (socketInitialized.current) {
      console.log("Socket listeners already initialized, skipping");
      return;
    }

    socketInitialized.current = true;

    let handleConnect;
    let handleDisconnect;
    let handleReceiveMessage;
    let handleChatHistory;
    let handleAppointmentAuthenticated;
    let handleSocketError;
    let connectionTimeout;
    let connectHandler;
    let isMounted = true;

    const verifyChatAccess = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        let userRole = "user";

        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = (payload.role || "user").toLowerCase();
          } catch (error) {
            console.error("Error parsing token:", error);
          }
        }

        let response;
        if (userRole === "doctor") {
          const authHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          };

          const apiResponse = await fetch(
            `${process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api/v1"}/appointments/${appointmentId}/chat-access`,
            {
              method: "GET",
              headers: authHeaders,
            }
          );

          response = await apiResponse.json();

          if (!apiResponse.ok) {
            if (apiResponse.status === 401) {
              handleUnauthorized();
              return;
            }
            throw new Error(response.message || "Failed to check chat access");
          }
        } else {
          response = await checkChatAccess(appointmentId);
        }

        if (!response.canAccess) {
          if (!isMounted) return;
          setAccessDenied(true);
          toast.error(response.reason || "Chat access not available");
          setTimeout(() => navigate(userRole === "doctor" ? "/doctor/appointments" : "/my-requests"), 2000);
          return;
        }

        if (!isMounted) return;
        setAppointmentDetails(response.appointment);

        // Emit appointment auth to socket
        const authPayload = {
          token: localStorage.getItem("token"),
          appointmentId: appointmentId,
        };

        // Register listeners first
        registerChatListeners();

        console.log('📍 [Chat] Socket state check:');
        console.log('  - socket.connected:', socket.connected);
        console.log('  - socket.connecting:', socket.connecting);
        console.log('  - socket.disconnected:', socket.disconnected);

        const attemptAuth = () => {
          console.log('📡 [Chat] Emitting authenticate_appointment...');
          if (isMounted) {
            socket.emit('authenticate_appointment', authPayload);
          }
        };

        if (socket.connected) {
          console.log('✅ [Chat] Socket already connected, authenticating immediately');
          attemptAuth();
        } else if (socket.connecting) {
          console.log('⏳ [Chat] Socket is currently connecting, waiting...');
          connectHandler = () => {
            console.log('📡 [Chat] Socket connected! Authenticating now...');
            attemptAuth();
            socket.off('connect', connectHandler);
          };
          socket.once('connect', connectHandler);
        } else {
          console.log('⚠️ [Chat] Socket is disconnected, attempting to reconnect first...');
          socket.auth = { token: localStorage.getItem("token") };
          socket.connect();
          
          connectHandler = () => {
            console.log('📡 [Chat] Socket reconnected! Authenticating now...');
            attemptAuth();
            socket.off('connect', connectHandler);
          };
          socket.once('connect', connectHandler);
        }

        // Set timeout for connection failure
        connectionTimeout = setTimeout(() => {
          if (isMounted && !socket.connected) {
            console.error('❌ [Chat] Socket failed to connect within 15 seconds');
            setAccessDenied(true);
            toast.error("Unable to establish connection. Please try again.");
            navigate(userRole === "doctor" ? "/doctor/appointments" : "/my-requests");
          }
        }, 15000);

        function registerChatListeners() {
          console.log('📡 [Chat] Registering socket listeners');
          
          handleConnect = () => {
            console.log("✅ Connected to chat server");
          };

          handleDisconnect = () => {
            console.log("❌ Disconnected from chat server");
            if (isMounted) setIsConnected(false);
          };

          handleReceiveMessage = (data) => {
            console.log("Received message:", data);
            if (isMounted) {
              setMessages((prev) => {
                const messageExists = prev.some(msg =>
                  msg.timestamp === data.timestamp &&
                  msg.message === data.message &&
                  msg.senderRole?.toLowerCase() === data.senderRole?.toLowerCase()
                );
                if (messageExists) {
                  console.log("Duplicate message detected, skipping");
                  return prev;
                }
                return [...prev, data];
              });
            }
          };

          handleChatHistory = (history) => {
            console.log("Received chat history:", history);
            if (isMounted) setMessages(history || []);
          };

          handleAppointmentAuthenticated = (data) => {
            console.log("✅ [Chat] Appointment authenticated, joining chat room");
            if (isMounted) {
              if (connectionTimeout) clearTimeout(connectionTimeout);
              setIsConnected(true);
              socket.emit("join_chat", { appointmentId });
            }
          };

          handleSocketError = (error) => {
            console.error("Socket error:", error);
            if (isMounted) {
              setIsConnected(false);
              toast.error("Connection error: " + error);
            }
          };

          socket.on("connect", handleConnect);
          socket.on("disconnect", handleDisconnect);
          socket.on("receive_message", handleReceiveMessage);
          socket.on("chat_history", handleChatHistory);
          socket.on("appointment_authenticated", handleAppointmentAuthenticated);
          socket.on("error", handleSocketError);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error verifying chat access:", error);
        setAccessDenied(true);
        toast.error(error.message || "Failed to verify chat access");

        const token = localStorage.getItem("token");
        let userRole = "user";
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = (payload.role || "user").toLowerCase();
          } catch (e) {
            console.error("Token parse error:", e);
          }
        }

        setTimeout(() => navigate(userRole === "doctor" ? "/doctor/appointments" : "/my-requests"), 2000);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifyChatAccess();

    return () => {
      console.log("🧹 [Chat] Cleaning up socket listeners (NOT disconnecting)");
      isMounted = false;
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (connectHandler) socket.off('connect', connectHandler);
      if (handleConnect) socket.off("connect", handleConnect);
      if (handleDisconnect) socket.off("disconnect", handleDisconnect);
      if (handleReceiveMessage) socket.off("receive_message", handleReceiveMessage);
      if (handleChatHistory) socket.off("chat_history", handleChatHistory);
      if (handleAppointmentAuthenticated) socket.off("appointment_authenticated", handleAppointmentAuthenticated);
      if (handleSocketError) socket.off("error", handleSocketError);
      socketInitialized.current = false;
    };
  }, [appointmentId]);

  // ────────────────────────────────────────
  // SEND MESSAGE
  // ────────────────────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !socket.connected || !isConnected) {
      setInputError("Cannot send message");
      return;
    }

    const token = localStorage.getItem("token");
    let userRole = "user";

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = (payload.role || "user").toLowerCase();
      } catch (error) {
        console.error("Error parsing token:", error);
      }
    }

    const messageData = {
      appointmentId,
      message: messageInput.trim(),
      timestamp: new Date(),
      senderRole: userRole,
    };

    setMessageInput("");
    setInputError("");
    socket.emit("send_message", messageData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Access denied. Please try again.</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <ChatHeader appointmentDetails={appointmentDetails} isConnected={isConnected} />
      <MessageList messages={messages} messagesEndRef={messagesEndRef} />
      <ChatInput
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        handleSendMessage={handleSendMessage}
        handleFileUpload={handleFileUpload}
        isConnected={isConnected}
        error={inputError}
        onClearError={() => setInputError("")}
      />
    </div>
  );
};

export default Chat;
```

### 2.2 Socket.io Initialization

**File:** `frontend/src/utils/socket.js`

```javascript
import { io } from "socket.io-client";

const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:4000";

const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: false,              // Don't auto-connect; controlled by app
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.1,
});

export default socket;
```

### 2.3 Socket Manager (Global Connection)

**File:** `frontend/src/utils/socketManager.js`

```javascript
import socket from './socket';

/**
 * Global Socket Manager
 * Controls socket connection lifecycle at the app level only.
 * Once connected, stays connected unless user logs out.
 * Never call connect/disconnect from individual components.
 */

let connectionAttempt = false;
let lastConnectTime = 0;
let currentToken = null;

/**
 * Establish socket connection with auth token
 * Safe to call multiple times — only connects if not already connected
 * Handles reconnection after disconnect properly
 */
export const connectSocket = (token) => {
  if (!token) {
    console.warn('⚠️ [Socket] Cannot connect without auth token');
    return;
  }

  currentToken = token;

  // If already connected, skip
  if (socket.connected) {
    console.log('📍 [Socket] Already connected, skipping');
    return;
  }

  // If already trying to connect, skip (but reset if it's been > 10s)
  if (connectionAttempt) {
    const timeSinceLastAttempt = Date.now() - lastConnectTime;
    if (timeSinceLastAttempt < 10000) {
      console.log('📍 [Socket] Connection attempt already in progress, skipping');
      return;
    }
    console.log('🔄 [Socket] Previous connection attempt timed out, retrying...');
    connectionAttempt = false;
  }

  connectionAttempt = true;
  lastConnectTime = Date.now();
  console.log('🔌 [Socket] Attempting connection with token...');
  console.log('  Socket state before connect:', {
    connected: socket.connected,
    connecting: socket.connecting,
    disconnected: socket.disconnected,
  });

  try {
    socket.auth = { token };
    socket.connect();
    
    console.log('📍 [Socket] Called socket.connect()');
    
    // Listen for successful connection
    socket.once('connect', () => {
      console.log('✅ [Socket] Connected successfully, socket ID:', socket.id);
      connectionAttempt = false;
      
      // Set up disconnect handler for automatic reconnection
      setupDisconnectHandler();
    });
    
    socket.once('connect_error', (error) => {
      console.error('❌ [Socket] Connection error:', error.message);
      connectionAttempt = false;
      
      // Try again after a delay
      console.log('🔄 [Socket] Scheduling reconnect attempt...');
      setTimeout(() => {
        if (!socket.connected && currentToken) {
          connectSocket(currentToken);
        }
      }, 3000);
    });
  } catch (error) {
    console.error('❌ [Socket] Connection failed:', error.message);
    connectionAttempt = false;
  }
};

/**
 * Disconnect socket (called on logout)
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    console.log('🔌 [Socket] Disconnecting socket...');
    socket.disconnect();
    connectionAttempt = false;
    currentToken = null;
  }
};

/**
 * Set up automatic reconnection on disconnect
 */
const setupDisconnectHandler = () => {
  // Remove old handler first
  socket.off('disconnect', handleDisconnect);
  
  // Add new handler
  socket.on('disconnect', handleDisconnect);
};

const handleDisconnect = (reason) => {
  console.log('🔌 [Socket] Disconnected, reason:', reason);
  
  // Don't try to reconnect if it was an intentional disconnect (logout)
  if (reason === 'io client namespace disconnect') {
    console.log('📍 [Socket] Intentional disconnect (logout), not reconnecting');
    return;
  }
  
  // Reconnect after delay if there's a token
  if (currentToken) {
    console.log('🔄 [Socket] Unintended disconnect, attempting reconnect in 3s...');
    setTimeout(() => {
      connectSocket(currentToken);
    }, 3000);
  }
};
```

### 2.4 Socket Emissions & Listeners in Chat

**Emissions (Chat.jsx):**
```javascript
// Authentication for specific appointment
socket.emit('authenticate_appointment', {
  token: localStorage.getItem("token"),
  appointmentId: appointmentId,
});

// Join chat room
socket.emit("join_chat", { appointmentId });

// Send message (text or file)
socket.emit("send_message", {
  appointmentId,
  message: messageInput.trim(),
  senderRole: userRole,
  fileUrl: data.url,      // (if file upload)
  fileName: file.name,
  fileType: file.type,
});
```

**Listeners (Chat.jsx):**
```javascript
socket.on("connect", handleConnect);
socket.on("disconnect", handleDisconnect);
socket.on("receive_message", handleReceiveMessage);
socket.on("chat_history", handleChatHistory);
socket.on("appointment_authenticated", handleAppointmentAuthenticated);
socket.on("error", handleSocketError);
```

### 2.5 Chat Widget

**File:** `frontend/src/components/chat/ChatWidget.jsx`

```javascript
import React, { useState } from 'react';
import AIChat from '../../pages/AIChat';
import { HiOutlineChat, HiOutlineX } from 'react-icons/hi';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem('token');
  
  if (!token) return null; // only render for logged-in users

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* inline panel above button */}
      {open && (
        <div className="mb-2 w-80 md:w-96 h-96 bg-white shadow-lg rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-2 bg-blue-600 text-white">
            <span className="font-semibold">Health Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200">
              <HiOutlineX className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            <AIChat />
          </div>
        </div>
      )}

      {/* floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none"
      >
        <HiOutlineChat className="w-8 h-8" />
      </button>
    </div>
  );
};

export default ChatWidget;
```

### 2.6 AI Chat (Separate from Socket.io)

**File:** `frontend/src/pages/AIChat.jsx`

```javascript
import React, { useState } from 'react';
import { chatWithAI } from '../services/aiApi';

const AIChat = () => {
  const [messages, setMessages] = useState([]); // {sender:'user'|'ai', text}
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((m) => [...m, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);
    try {
      const res = await chatWithAI(userText);
      setMessages((m) => [...m, { sender: 'ai', text: res.reply }]);
    } catch (err) {
      console.error('AI chat request failed:', err);
      const text = err?.message || 'Error contacting AI.';
      setMessages((m) => [...m, { sender: 'ai', text }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow overflow-auto p-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 max-w-md ${msg.sender === 'user' ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-gray-200 text-gray-900'} rounded-lg px-4 py-2`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask the AI health assistant..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-full disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default AIChat;
```

### 2.7 Other Socket Listeners

**ConsentManager.jsx:**
```javascript
socket.emit('joinRoom', user._id.toString());

socket.on('consentRequestReceived', (data) => {
  // {requestId, doctorId, doctorName, resourceTypes, message, appointmentId}
});
```

**Doctor ClinicalNotes.jsx:**
```javascript
socket.emit('requestConsent', {
  doctorId: currentDoctor._id,
  patientId: selectedPatient._id,
  resourceTypes: ['allergies', 'medications'],
  message: "Need to review medical history",
  appointmentId: appointmentId,
});

socket.on('consentResponse', handleConsentResponse);
socket.on('consentGranted', handleConsentGranted);
socket.on('consentRejected', handleConsentRejected);
```

---

## 3. FRONTEND — AUTHENTICATION

### 3.1 Auth State Management

**File:** `frontend/src/slices/authSlice.js`

```javascript
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: localStorage.getItem("token")
    ? (localStorage.getItem("token"))
    : null,
  loading: false, 
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
     setSignupData(state, value) {
      state.signupData = value.payload;
    },
    setToken(state, action) {
      state.token = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const {setSignupData, setToken, setLoading } = authSlice.actions;
export default authSlice.reducer;
```

### 3.2 User Object Structure

**From localStorage (parsed JWT token):**
```javascript
{
  _id: "ObjectId",
  email: "user@example.com",
  fullName: "User Name",
  role: "user" | "doctor" | "admin" | "hospital_admin",
  roles: ["user", "doctor"], // Array of roles
}
```

**From User Model (server):**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  fullName: String,
  contact: String,
  roles: [String] enum: ["user", "admin", "doctor", "hospital_admin"],
  role: String (primary role),
  image: String (URL),
  additionalDetails: ObjectId (ref: userProfile),
  doctorProfile: ObjectId (ref: doctorProfile),
  token: String,
  failedLoginAttempts: Number,
  lockUntil: Date,
  timestamps: true,
}
```

### 3.3 Auth Token Storage & Access

**Storage Location:** `localStorage.getItem('token')`

**Token Format:** JWT (3 parts: header.payload.signature)

**Token Payload Example:**
```javascript
{
  id: "userId_ObjectId",
  email: "user@example.com",
  role: "doctor",
  iat: 1234567890,
  exp: 1234654290
}
```

**Accessed via:**
```javascript
const token = localStorage.getItem("token");
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
  const userRole = payload.role;
}
```

### 3.4 Auth Session Management

**File:** `frontend/src/services/authSession.js`

```javascript
export const initAuthSession = () => {
  // Initialize auth from localStorage on app load
};

export const handleUnauthorized = () => {
  // Clear auth, redirect to login on 401 response
};
```

### 3.5 Protected Routes

**File:** `frontend/src/components/ProtectedRoute.jsx`

```javascript
const ProtectedRoute = ({ requiredRole, children }) => {
  const { token } = useSelector((state) => state.auth);
  
  if (!token) return <Navigate to="/login" />;
  
  if (requiredRole) {
    // Check if user has required role
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== requiredRole) {
      return <Navigate to="/" />;
    }
  }
  
  return children;
};
```

### 3.6 Global Socket Connection (App.js)

**File:** `frontend/src/App.js`

```javascript
import { connectSocket, disconnectSocket } from './utils/socketManager';

function App() {
  const location = useLocation();
  const { token, user } = useSelector((state) => state.auth);

  // ============================================
  // SOCKET.IO CONNECTION MANAGEMENT (App Level)
  // ============================================
  // Watch auth state and manage socket connection globally
  // This ensures only ONE socket connection exists for the entire app
  useEffect(() => {
    if (token && user) {
      // User is logged in — connect socket
      console.log('🔌 [App] User logged in, connecting socket...');
      connectSocket(token);
    } else {
      // User is logged out — disconnect socket
      console.log('🔌 [App] User logged out, disconnecting socket...');
      disconnectSocket();
    }
  }, [token, user]);

  return (
    <div className="App">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
      <FhirErrorToast />
      {!usesRoleLayout && <GlobalNavbar />}
      {!usesRoleLayout && <ChatWidget />}
      <div className={!usesRoleLayout ? "pt-24" : ""}>
        <Routes>
          {/* Routes here */}
        </Routes>
      </div>
    </div>
  );
}

export default App;
```

---

## 4. BACKEND — SERVER SETUP

### 4.1 Express + Socket.io Initialization

**File:** `server/index.js` (First 100 lines)

```javascript
// ============================================
// ENVIRONMENT SETUP
// ============================================
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
  override: false,
});
process.env.SUPPRESS_DOTENV_LOG = 'true';

// ============================================
// STARTUP VERIFICATION
// ============================================
process.stdout.write('\n\n🚀 [STARTUP] Server process started at ' + new Date().toISOString() + '\n');
process.stdout.write('🔧 [STARTUP] Node version: ' + process.version + '\n');
process.stdout.write('📍 [STARTUP] Working directory: ' + process.cwd() + '\n');
process.stdout.write('✅ [STARTUP] Environment loaded\n');

// ============================================
// CORE NODE / FRAMEWORK IMPORTS
// ============================================
const http = require("http");
const os = require("os");
const EventEmitter = require('events');

const express = require("express");
const socketIo = require("socket.io");

// ============================================
// THIRD-PARTY MIDDLEWARE IMPORTS
// ============================================
const helmet = require('helmet');
const cors = require("cors");
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoSanitize = require('express-mongo-sanitize');
const { clean: xssClean } = require('xss-clean/lib/xss');

// ============================================
// INTERNAL CONFIG / UTILITY IMPORTS
// ============================================
const connectDb = require('./config/Database');
const { connectCloudinary } = require('./config/Cloudinary');

// ============================================
// ROUTE IMPORTS
// ============================================
const Auth = require("./routes/Auth");
const Doctor = require("./routes/Doctor");
const UserRequests = require("./routes/UserRequests");
const Payment = require("./routes/Payment");
const Registration = require("./routes/Registration");
const Admin = require("./routes/Admin");
const Hospital = require("./routes/Hospital");
const AI = require("./routes/AI");
const internalRoutes = require("./routes/AI_internal");
const NotificationRoutes = require("./routes/Notification");
const OAuth = require("./routes/oauth");
const consultationRoutes = require("./routes/consultation.routes");

// ============================================
// APP & SERVER INIT
// ============================================
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

// ============================================
// SOCKET.IO INIT
// ============================================
const io = socketIo(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});
app.set('io', io);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// CSP nonce generator
const cspNonceGenerator = (req, res, next) => {
  const crypto = require('crypto');
  res.locals.nonce = crypto.randomBytes(16).toString('hex');
  next();
};
app.use(cspNonceGenerator);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      imgSrc: ["'self'", "data:", "https:", "https://res.cloudinary.com"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    'https://clinicall-5cjz.vercel.app'
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ============================================
// GENERAL MIDDLEWARE
// ============================================
if (!process.env.SESSION_SECRET) {
  throw new Error('FATAL: SESSION_SECRET environment variable is required');
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  },
}));

app.use(express.json({ type: ['application/json', 'application/fhir+json'] }));
app.use(cookieParser());

// ============================================
// SANITIZATION MIDDLEWARE
// ============================================
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body, { allowDots: true });
  if (req.params) req.params = mongoSanitize.sanitize(req.params, { allowDots: true });
  next();
});

app.use((req, res, next) => {
  if (req.body) req.body = xssClean(req.body);
  if (req.params) req.params = xssClean(req.params);
  if (req.query) {
    const cleaned = xssClean(req.query);
    Object.assign(req.query, cleaned);
  }
  next();
});

// ============================================
// REQUEST LOGGING MIDDLEWARE
// ============================================
app.use((req, res, next) => {
  if (req.path.includes('/fhir/') && req.method === 'POST') {
    console.log('📨 FHIR POST:', req.path);
  }
  next();
});

// ============================================
// EXTERNAL SERVICES
// ============================================
connectCloudinary();
console.log('✅ [STARTUP] Cloudinary connected');

// ============================================
// DATABASE READINESS SYSTEM
// ============================================
const dbReadyEmitter = new EventEmitter();
let dbReady = false;
let dbError = null;

(async () => {
  try {
    process.stdout.write("✅ [STARTUP] Attempting DB connection...\n");
    await connectDb();
    dbReady = true;
    dbError = null;
    process.stdout.write('\n✅ [STARTUP] Database connected successfully\n\n');
    dbReadyEmitter.emit('ready');
  } catch (err) {
    dbReady = false;
    dbError = err.message;
    process.stderr.write("❌ [STARTUP] Database connection failed: " + err.message + "\n");
  }
})();

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/health', (req, res) => {
  const health = {
    status: dbReady ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbReady ? 'connected' : 'disconnected',
    fhir: dbReady ? 'ready' : 'waiting-for-db',
  };
  if (dbError) health.dbError = dbError;
  res.status(dbReady ? 200 : 503).json(health);
});

// ============================================
// STATIC FILE SERVING FOR UPLOADS
// ============================================
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// ============================================
// STANDARD ROUTES
// ============================================
app.use("/api/v1", Auth);
app.use("/api/v1", Doctor);
app.use("/api/v1", UserRequests);
app.use("/api/v1", Payment);
app.use("/api/v1", Registration);
app.use("/api/v1", NotificationRoutes);
app.use("/api/v1", consultationRoutes);
app.use("/api/v1", Hospital);
app.use("/api/v1/admin", Admin);
app.use("/api/v1/ai", AI);
app.use("/api/v1", internalRoutes);
app.use("/api/v1/consent", require('./routes/ConsentApi'));
app.use("/auth/fhir", OAuth);
```

### 4.2 Auth Middleware

**File:** `server/middleware/authMiddleware.js`

```javascript
const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer {token}"
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};

const isDoctor = (req, res, next) => {
  if (!req.user.roles.includes('doctor')) {
    return res.status(403).json({ message: "Forbidden: Doctor access required" });
  }
  next();
};

module.exports = { authenticateUser, isDoctor };
```

### 4.3 Socket.io Auth Middleware

**File:** `server/index.js` (Socket.io section)

```javascript
// ============================================
// SOCKET.IO — AUTH MIDDLEWARE
// ============================================

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const appointmentId = socket.handshake.auth.appointmentId;

    if (!token || typeof token !== 'string') {
      return next(new Error("Authentication failed: token is required and must be a string"));
    }

    // Validate JWT format before attempting verification
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some(part => !part)) {
      return next(new Error("Authentication failed: invalid token format"));
    }

    const { verifyAccessToken } = require('./utils/token');
    const User = require('./models/User');

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (tokenErr) {
      return next(new Error("Authentication failed: invalid or expired token"));
    }

    const user = await User.findById(decoded.id).select('_id email role roles');
    if (!user) {
      return next(new Error("Authentication failed: user not found"));
    }

    socket.user = user;

    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return next(new Error("Appointment not found"));
      }

      const userId = user._id.toString();
      const isParticipant =
        appointment.userId?.toString() === userId ||
        appointment.doctorId?.toString() === userId;

      if (!isParticipant) {
        return next(new Error("Access denied: you are not a participant in this appointment"));
      }

      socket.appointmentId = appointmentId;
      socket.appointment = appointment;
    }

    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
});
```

---

## 5. BACKEND — CHAT LOGIC & SOCKET.IO EVENTS

### 5.1 Chat Room Identification

**Chat Room Naming Convention:**
```javascript
// Appointment-based chat room
const roomId = `chat_${appointmentId}`;

// Consultation session room
const roomId = `consultation_${appointmentId}`;

// Personal notification room (for single user)
const roomId = userId.toString();
```

**Active Chat Rooms Management:**
```javascript
const activeChatRooms = new Map();
// Format: {
//   roomId: {
//     messages: [ChatMessage[]],
//     participants: [socket.id, socket.id]
//   }
// }
```

### 5.2 All Socket.io Events & Handlers

**File:** `server/index.js` (Socket event section)

```javascript
// ============================================
// SOCKET.IO — EVENT HANDLERS
// ============================================

const Appointment = require("./models/Appointment");
const activeChatRooms = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Client connected");

  // --- Authenticate for specific appointment ---
  socket.on("authenticate_appointment", async ({ appointmentId }) => {
    try {
      if (!appointmentId) {
        return socket.emit("error", "Appointment ID is required");
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return socket.emit("error", "Appointment not found");
      }

      const userId = socket.user._id.toString();
      const isParticipant =
        appointment.userId?.toString() === userId ||
        appointment.doctorId?.toString() === userId;

      if (!isParticipant) {
        return socket.emit("error", "Access denied: you are not a participant in this appointment");
      }

      socket.appointmentId = appointmentId;
      socket.appointment = appointment;
      
      console.log("✅ Socket authenticated for appointment");
      socket.emit("appointment_authenticated", { success: true });
    } catch (error) {
      console.error("Error authenticating appointment:", error);
      socket.emit("error", "Failed to authenticate appointment");
    }
  });

  // --- Personal notification room ---
  socket.on("joinRoom", (userId) => {
    if (!userId) return;
    const roomId = userId.toString();
    socket.join(roomId);
    console.log("📢 Client joined notification room");
  });

  // --- Chat room ---
  socket.on("join_chat", ({ appointmentId }) => {
    try {
      const roomId = `chat_${appointmentId}`;
      socket.join(roomId);

      if (!activeChatRooms.has(roomId)) {
        activeChatRooms.set(roomId, { messages: [], participants: [] });
      }

      const chatRoom = activeChatRooms.get(roomId);
      chatRoom.participants.push(socket.id);

      socket.emit("chat_history", chatRoom.messages);
      socket.to(roomId).emit("user_joined", {
        message: "User joined the chat",
        timestamp: new Date(),
      });

      console.log("💬 Client joined chat room");
    } catch (error) {
      console.error("Error joining chat:", error);
      socket.emit("error", "Failed to join chat");
    }
  });

  // --- Send message ---
  socket.on("send_message", async ({ appointmentId, message, senderRole, fileUrl }) => {
    try {
      const roomId = `chat_${appointmentId}`;
      const msgObj = {
        conversationId: appointmentId,
        from: socket.user._id,
        to: null,
        text: message,
        fileUrl,
        read: false,
      };

      const ChatMessage = require('./models/ChatMessage');
      const saved = await ChatMessage.create(msgObj);

      io.to(roomId).emit("receive_message", {
        id: saved._id,
        senderId: socket.user._id,
        senderRole,
        message,
        fileUrl,
        timestamp: saved.createdAt,
      });

      console.log("📤 Message sent in chat");
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // --- Typing indicator ---
  socket.on('typing', ({ appointmentId }) => {
    socket.to(`chat_${appointmentId}`).emit('typing', { from: socket.user._id });
  });

  // --- Read receipt ---
  socket.on('read', async ({ appointmentId }) => {
    try {
      const ChatMessage = require('./models/ChatMessage');
      await ChatMessage.updateMany(
        { conversationId: appointmentId, to: socket.user._id, read: false },
        { read: true }
      );
      io.to(`chat_${appointmentId}`).emit('read', { appointmentId, reader: socket.user._id });
    } catch (err) {
      console.error('Error updating read status', err);
    }
  });

  // --- Consent request ---
  socket.on('requestConsent', async (data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SOCKET] requestConsent event received');
    }

    try {
      const ConsentRequest = require('./models/ConsentRequest');
      const User = require('./models/User');
      const mailSender = require('./utils/mailSender');
      const generateConsentRequestEmail = require('./utils/emailTemplates/consentRequestEmail');
      const { logFHIRAccess } = require('./middleware/auditLogger');
      const { sendNotification } = require('./utils/sendNotification');

      // 1. Save ConsentRequest
      const savedRequest = await ConsentRequest.create({
        doctor_ref: data.doctorId,
        patient_ref: data.patientId,
        appointment_ref: data.appointmentId || null,
        resourceTypes: data.resourceTypes,
        message: data.message || '',
        status: 'pending',
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[SOCKET] ConsentRequest created');
      }

      // 2. Fetch patient and doctor
      const patient = await User.findById(data.patientId).select('email fullName');
      const doctor = await User.findById(data.doctorId).select('fullName');

      if (!patient || !doctor) {
        console.error('[SOCKET] Patient or doctor not found in requestConsent');
        return;
      }

      // 3. Notify patient
      await sendNotification({
        recipient: data.patientId,
        type: 'CONSENT_REQUEST',
        title: `Consent Request from Dr. ${doctor.fullName || 'Doctor'}`,
        message: `Dr. ${doctor.fullName} is requesting access to your ${data.resourceTypes.join(', ')} records.`,
      });

      // 4. Emit to patient's socket room
      io.to(data.patientId.toString()).emit('consentRequestReceived', {
        requestId: savedRequest._id,
        doctorId: data.doctorId,
        doctorName: doctor.fullName,
        resourceTypes: data.resourceTypes,
        message: data.message,
        appointmentId: data.appointmentId,
        createdAt: savedRequest.createdAt,
      });

      // 5. Audit log
      await logFHIRAccess({
        userId: data.doctorId,
        role: 'doctor',
        action: 'CONSENT_REQUEST',
        resourceType: 'Consent',
        resourceId: savedRequest._id,
        patientId: data.patientId,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        success: true,
      });

      // 6. Send email (non-fatal)
      try {
        await mailSender(
          patient.email,
          `Dr. ${doctor.fullName} is requesting access to your medical records`,
          generateConsentRequestEmail({
            patientName: patient.fullName,
            doctorName: doctor.fullName,
            resourceTypes: data.resourceTypes,
            message: data.message,
            consentRequestId: savedRequest._id,
            appUrl: process.env.REACT_APP_BASE_URL,
          })
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[SOCKET] Email sent successfully');
        }

        await logFHIRAccess({
          userId: data.doctorId,
          role: 'doctor',
          action: 'CONSENT_REQUEST_EMAIL',
          resourceType: 'Consent',
          resourceId: savedRequest._id,
          patientId: data.patientId,
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent'],
          success: true,
        });
      } catch (emailErr) {
        console.error('[SOCKET] Consent request email send failed (non-fatal)');
      }

    } catch (err) {
      console.error('[SOCKET] requestConsent handler error:', {
        errorType: err.constructor.name,
        message: err.message,
      });
    }
  });

  // ============================================
  // CONSULTATION SESSION SOCKET EVENTS
  // ============================================

  /**
   * Join consultation room
   * Allows user to receive real-time updates during consultation
   */
  socket.on("join_consultation", ({ appointmentId }) => {
    const roomId = `consultation_${appointmentId}`;
    socket.join(roomId);
    if (process.env.NODE_ENV === 'development') {
      console.log('[CONSULTATION] Client joined consultation room');
    }
    
    socket.to(roomId).emit("user_in_consultation", {
      userId: socket.user._id,
      joinedAt: new Date(),
    });
  });

  /**
   * Leave consultation room
   */
  socket.on("leave_consultation", ({ appointmentId }) => {
    const roomId = `consultation_${appointmentId}`;
    socket.leave(roomId);
    if (process.env.NODE_ENV === 'development') {
      console.log('[CONSULTATION] Client left consultation room');
    }
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    activeChatRooms.forEach((room, roomId) => {
      const index = room.participants.indexOf(socket.id);
      if (index > -1) room.participants.splice(index, 1);
      if (room.participants.length === 0) activeChatRooms.delete(roomId);
    });
  });

  // --- Socket error ---
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});
```

### 5.3 Chat Message Model

**File:** `server/models/ChatMessage.js`

```javascript
const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String },
  fileUrl: { type: String },  // URL from Cloudinary
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
```

### 5.4 Appointment Model (Consultation Fields)

**File:** `server/models/Appointment.js`

```javascript
const mongoose = require("mongoose");
const fieldEncryption = require('mongoose-field-encryption').fieldEncryption;

const AppointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "NOT SCHEDULED"],
      default: "NOT SCHEDULED",
    },
    reason: {
      type: String,
    },
    
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    consultationStatus: {
      type: String,
      enum: ["locked", "active", "completed"],
      default: "locked",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    approvalstatus:{
      type:String,
      enum:["APPROVED","REJECTED","PENDING","CANCELLED"],
      default:"PENDING"
    },
    cancellationReason:{
      type:String
    },
    consultationMode:{
      type:String,
      enum:["online","offline"],
      default:null
    },
    isChatEnabled:{
      type:Boolean,
      default:false
    }
  },
  {
    timestamps: true,
  }
);

// Encrypt sensitive fields
if (!process.env.FIELD_ENC_KEY) {
  throw new Error('FATAL: FIELD_ENC_KEY environment variable is required for PHI encryption');
}
AppointmentSchema.plugin(fieldEncryption, {
  fields: ['reason', 'cancellationReason'],
  secret: process.env.FIELD_ENC_KEY,
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
```

### 5.5 Consultation REST Endpoints

**File:** `server/routes/consultation.routes.js`

```javascript
const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  startSession,
  endSession,
  addMedicalRecord,
  getSessionRecords,
  getSessionHistory,
  downloadRecord,
  getActiveSession,
} = require("../Controllers/consultationController");

const { authenticateUser, isDoctor } = require("../middleware/authMiddleware");

// ============================================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ============================================
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(file.originalname.toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, or PDF files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "File too large. Maximum size is 10MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed",
    });
  }
  next();
};

// ============================================
// DOCTOR ROUTES
// ============================================

router.post(
  "/consultation/start/:appointmentId",
  authenticateUser,
  isDoctor,
  startSession
);

router.put(
  "/consultation/end/:sessionId",
  authenticateUser,
  endSession
);

router.post(
  "/consultation/record/:sessionId",
  authenticateUser,
  isDoctor,
  upload.single('file'),
  multerErrorHandler,
  addMedicalRecord
);

router.get(
  "/consultation/records/:sessionId",
  authenticateUser,
  getSessionRecords
);

router.get(
  "/consultation/history/:appointmentId",
  authenticateUser,
  getSessionHistory
);

router.get(
  "/consultation/active/:appointmentId",
  authenticateUser,
  getActiveSession
);

router.get(
  "/consultation/download/:recordId",
  authenticateUser,
  downloadRecord
);

module.exports = router;
```

### 5.6 User Model

**File:** `server/models/User.js`

```javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    
 roles: {
  type: [String],
  enum: ["user", "admin", "doctor", "hospital_admin"],
  default: ["user"],
},

role: {
  type: String,
  enum: ["user", "admin", "doctor", "hospital_admin"],
  default: "user",
},

fullName:{
  type:String
} ,

  email: { type: String, unique: true },

  contact: { type:String},

  password: {type:String},

  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },

  additionalDetails: { type: mongoose.Schema.Types.ObjectId, ref: "userProfile" }, 
  doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "doctorProfile" },

  image: { type: String, trim: true, default: null },
  
  token :{ type: String },

},{timestamps:true})

module.exports = mongoose.model('User',UserSchema)
```

---

## 6. PACKAGE DEPENDENCIES

### 6.1 Frontend Dependencies

**File:** `frontend/package.json`

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router-dom": "^7.12.0",
    "react-scripts": "5.0.1",
    
    "socket.io-client": "^4.8.3",
    
    "axios": "^1.13.3",
    "react-toastify": "^11.0.5",
    
    "@reduxjs/toolkit": "^2.11.2",
    "react-redux": "^9.2.0",
    
    "react-hook-form": "^7.71.1",
    "react-icons": "^5.5.0",
    "@tabler/icons-react": "^3.40.0",
    "lucide-react": "^0.562.0",
    
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.2.8",
    
    "tailwindcss": "latest",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.5.0",
    "tailwindcss-animate": "^1.0.7",
    
    "framer-motion": "^12.35.2",
    "motion": "^12.35.2",
    "recharts": "^2.15.4",
    "jspdf": "^4.2.0",
    
    "embla-carousel-react": "^8.6.0",
    "react-otp-input": "^3.1.1",
    "react-use-measure": "^2.1.7",
    
    "@react-three/fiber": "^9.5.0",
    "three": "^0.183.2",
    "unicornstudio-react": "^2.1.1",
    
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "CI=false && react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### 6.2 Backend Dependencies

**File:** `server/package.json`

```json
{
  "name": "server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "nodemon index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cloudinary": "^2.8.0",
    "cookie-parser": "^1.4.7",
    "cookies": "^0.9.1",
    "cors": "^2.8.5",
    "crypto": "^1.0.1",
    "dotenv": "^17.2.3",
    "express": "^5.2.1",
    "express-fileupload": "^1.5.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^6.8.0",
    "express-session": "^1.19.0",
    "express-validator": "^7.0.1",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.3",
    "loader": "^2.1.1",
    "mongodb": "^7.0.0",
    "mongoose": "^9.1.1",
    "mongoose-field-encryption": "^7.0.1",
    "multer": "^1.4.5-lts.1",
    "node-cron": "^4.2.1",
    "nodemailer": "^7.0.12",
    "nodemon": "^3.1.11",
    "ollama": "^0.6.3",
    "openid-client": "^6.8.2",
    "otp-generator": "^4.0.1",
    "razorpay": "^2.9.6",
    "react-router-dom": "^7.11.0",
    "recharts": "^3.7.0",
    "socket.io": "^4.8.3",
    "uuid": "^13.0.0",
    "winston": "^3.19.0",
    "winston-daily-rotate-file": "^5.0.0",
    "xss-clean": "^0.1.4"
  },
  "description": ""
}
```

---

## 7. DEPLOYMENT & ENVIRONMENT

### 7.1 Environment Variables

**File:** `.env`

```bash
# ============================================
# PLAYWRIGHT TESTING
# ============================================
TEST_EMAIL=dheerajyadav72005@gmail.com
TEST_PASSWORD=rahul@2005
BASE_URL=http://localhost:3000
API_URL=http://localhost:4000/api/v1

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=4000
NODE_ENV=development
```

**Required Server Variables:**
- `SESSION_SECRET` — Session encryption key (REQUIRED)
- `FIELD_ENC_KEY` — Field encryption key for PHI (REQUIRED)
- `MONGODB_URI` or `DB_URL` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `CLIENT_URL` — Frontend URL (for CORS, Socket.io)
- `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` — File upload
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` — Email service
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — Payment processing
- `REACT_APP_BASE_URL` — Frontend-side backend URL
- `REACT_APP_SOCKET_URL` — Frontend-side socket URL
- `REACT_APP_API_BASE_URL` — Frontend API base URL

**Optional Variables:**
- `FRONTEND_URL` — Alternative frontend URL name
- `NODE_ENV` — production|development
- Ollama/AI service credentials

### 7.2 Frontend Configuration Files

**No explicit deployment config files found** (`vercel.json`, `netlify.toml` NOT present).

**Frontend Build Command (in package.json):**
```bash
"build": "CI=false && react-scripts build"
```

**Frontend Start:**
```bash
"start": "react-scripts start"  # Port 3000 (dev)
```

### 7.3 Backend Deployment

**Server Start:**
```bash
"start": "nodemon index.js"  # Dev with auto-reload, Port 4000
```

**Server Entry Point:** `server/index.js`

**Typical Production Deployment:**
- Express server on port 4000
- MongoDB Atlas (cloud database)
- Cloudinary (file storage)
- Vercel/Railway/Heroku (backend hosting)
- Vercel/Netlify (frontend hosting)

---

## INTEGRATION SUMMARY FOR JITSI MEET

| Aspect | Details |
|--------|---------|
| **Architecture** | Monorepo: React 19 frontend + Node.js/Express backend |
| **Main Communication** | Socket.io (already implemented for chat/notifications) |
| **Socket.io Status** | ✅ Initialized, used for chat & consultation |
| **Chat Rooms** | `chat_${appointmentId}`, `consultation_${appointmentId}` |
| **Auth Method** | JWT tokens, Socket.io middleware verification |
| **User Roles** | user, doctor, admin, hospital_admin |
| **Appointment Fields** | `consultationStatus`, `consultationMode`, `isChatEnabled` |
| **Consultation Routes** | REST endpoints for session management (/api/v1/consultation/*) |
| **File Upload** | Cloudinary integration via `/api/v1/upload/chat-file` |
| **Frontend State** | Redux (auth), React (component state) |
| **Active Integrations** | Chat messaging, consent management, consultation panels |
| **Database** | MongoDB with Mongoose ODM |
| **Frontend Entry** | `frontend/src/index.js` → `App.js` |
| **Backend Entry** | `server/index.js` (Express + Socket.io on port 4000) |
| **Production Ready** | Yes, backend serves on 4000, frontend on 3000 |
| **Missing for Jitsi** | Video calling infrastructure (integration point here) |

---

## KEY INTEGRATION POINTS FOR JITSI MEET

### Socket.io Events to Add:
```javascript
socket.emit('invite_video_call', { appointmentId, to: doctorId })
socket.on('video_call_incoming', (data) => {...})
socket.emit('accept_video_call', { appointmentId, jitsiToken })
socket.emit('decline_video_call', { appointmentId })
socket.on('video_call_started', (jitsiRoomUrl) => {...})
socket.emit('end_video_call', { appointmentId })
```

### REST Endpoints to Add:
```
POST /api/v1/consultation/video-token  - Generate JWT token for Jitsi
GET /api/v1/consultation/video-status/{appointmentId}  - Check video status
POST /api/v1/consultation/record-video  - Store video session metadata
```

### Components to Create:
- VideoCallModal.jsx (embedded Jitsi container)
- VideoCallButton.jsx (in chat/consultation interface)
- VideoRecording.js (integrat with consultation records)

---

**End of Report**
**Status:** Complete analysis, no modifications made  
**Ready for:** Jitsi Meet implementation planning
