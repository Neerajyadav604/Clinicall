import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { checkChatAccess } from "../services/operations/consultationApi";
import { toast } from "react-toastify";
import socket from "../utils/socket";
import { handleUnauthorized } from "../services/authSession";

/**
 * MessageBubble Component
 * Individual message bubble with proper styling and file support
 */
const MessageBubble = ({ message, isOwnMessage }) => {
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

/**
 * MessageList Component
 * Scrollable container for all messages
 */
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

/**
 * ChatInput Component
 * Fixed input bar at the bottom with file upload support
 */
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
    // Reset input
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

/**
 * ChatHeader Component
 * Header with appointment details and connection status
 */
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

/**
 * Chat Component
 * Full-width chat interface with modern design and file upload support
 */
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

  // File upload handler
  const handleFileUpload = async (file) => {
    setInputError("");
    if (!socket.connected || !isConnected) {
      setInputError("Cannot upload file - not connected");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setInputError("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setInputError("File type not supported. Please upload images, PDFs, or documents.");
      return;
    }

    try {
      toast.info("Uploading file...");

      // Upload file to Cloudinary via backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('appointmentId', appointmentId);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || "http://192.168.137.202:4000/api/v1/api/v1"}/upload/chat-file`,
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

      // Send file message via socket
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

  // Verify chat access and register socket listeners
  // App.js manages global socket connection — we only verify access and register listeners
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

        // Emit appointment auth to socket (it's already connected from App.js)
        // This tells the server to authenticate THIS client for THIS appointment
        const authPayload = {
          token: localStorage.getItem("token"),
          appointmentId: appointmentId,
        };

        // Register listeners first before checking connection state
        registerChatListeners();

        console.log('📍 [Chat] Socket state check:');
        console.log('  - socket.connected:', socket.connected);
        console.log('  - socket.connecting:', socket.connecting);
        console.log('  - socket.disconnected:', socket.disconnected);
        console.log('  - socket.auth:', socket.auth?.token ? 'token set' : 'no token');

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
          // Force reconnect
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
            // Don't join chat yet - wait for appointment authentication
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
              // Now join the chat room
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
      // ⚠️ DO NOT call socket.disconnect() — App.js manages the global connection
      socketInitialized.current = false;
    };
  }, [appointmentId]);

  // Send message
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

  if (accessDenied || !appointmentDetails) {
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

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-4xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            {accessDenied
              ? "You don't have access to this chat. Make sure the appointment is approved and payment is completed."
              : "Failed to load appointment details."}
          </p>
          <button
            onClick={() => navigate(userRole === "doctor" ? "/doctor/appointments" : "/my-requests")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to {userRole === "doctor" ? "Appointments" : "Requests"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col">
      {/* Header */}
      <ChatHeader appointmentDetails={appointmentDetails} isConnected={isConnected} />

      {/* Messages Area */}
      <MessageList messages={messages} messagesEndRef={messagesEndRef} />

      {/* Input Bar */}
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


