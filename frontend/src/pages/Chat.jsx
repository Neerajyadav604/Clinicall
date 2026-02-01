import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { checkChatAccess } from "../services/operations/consultationApi";
import { toast } from "react-toastify";
import io from "socket.io-client";

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
              isOwnMessage={msg.senderRole === "USER"}
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
const ChatInput = ({ messageInput, setMessageInput, handleSendMessage, handleFileUpload, isConnected }) => {
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
          onChange={(e) => setMessageInput(e.target.value)}
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
            {appointmentDetails?.doctorName || "Doctor"}
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
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [socket, setSocket] = useState(null);
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
    if (!socket || !isConnected) {
      toast.error("Cannot upload file - not connected");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not supported. Please upload images, PDFs, or documents.");
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
        throw new Error(data.message || "File upload failed");
      }

      // Send file message via socket
      const token_payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = token_payload.role || "USER";

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
      toast.error(error.message || "Failed to upload file");
    }
  };

  // Verify chat access and connect to socket
  useEffect(() => {
    if (socketInitialized.current) {
      console.log("Socket already initialized, skipping");
      return;
    }

    socketInitialized.current = true;

    const verifyChatAccess = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        let userRole = "USER";

        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.role || "USER";
          } catch (error) {
            console.error("Error parsing token:", error);
          }
        }

        let response;
        if (userRole === "DOCTOR") {
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
            throw new Error(response.message || "Failed to check chat access");
          }
        } else {
          response = await checkChatAccess(appointmentId);
        }

        if (!response.canAccess) {
          setAccessDenied(true);
          toast.error(response.reason || "Chat access not available");
          setTimeout(() => navigate(userRole === "DOCTOR" ? "/doctor/appointments" : "/my-requests"), 2000);
          return;
        }

        setAppointmentDetails(response.appointment);

        const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:4000";
        const newSocket = io(socketUrl, {
          auth: {
            token: localStorage.getItem("token"),
            appointmentId: appointmentId,
          },
        });

        newSocket.removeAllListeners();

        newSocket.on("connect", () => {
          setIsConnected(true);
          console.log("Connected to chat server");
          newSocket.emit("join_chat", { appointmentId });
        });

        newSocket.on("disconnect", () => {
          setIsConnected(false);
          console.log("Disconnected from chat server");
        });

        newSocket.on("receive_message", (data) => {
          console.log("Received message:", data);
          setMessages((prev) => {
            const messageExists = prev.some(msg =>
              msg.timestamp === data.timestamp &&
              msg.message === data.message &&
              msg.senderRole === data.senderRole
            );
            if (messageExists) {
              console.log("Duplicate message detected, skipping");
              return prev;
            }
            return [...prev, data];
          });
        });

        newSocket.on("chat_history", (history) => {
          console.log("Received chat history:", history);
          setMessages(history || []);
        });

        newSocket.on("error", (error) => {
          console.error("Socket error:", error);
          toast.error("Connection error: " + error);
        });

        setSocket(newSocket);
      } catch (error) {
        console.error("Error verifying chat access:", error);
        setAccessDenied(true);
        toast.error(error.message || "Failed to verify chat access");

        const token = localStorage.getItem("token");
        let userRole = "USER";
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.role || "USER";
          } catch (e) {
            console.error("Token parse error:", e);
          }
        }

        setTimeout(() => navigate(userRole === "DOCTOR" ? "/doctor/appointments" : "/my-requests"), 2000);
      } finally {
        setLoading(false);
      }
    };

    verifyChatAccess();

    return () => {
      if (socket) {
        console.log("Cleaning up socket connection");
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketInitialized.current = false;
    };
  }, [appointmentId]);

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !socket || !isConnected) {
      toast.error("Cannot send message");
      return;
    }

    const token = localStorage.getItem("token");
    let userRole = "USER";

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = payload.role || "USER";
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
    let userRole = "USER";
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = payload.role || "USER";
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
            Back to {userRole === "DOCTOR" ? "Appointments" : "Requests"}
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
      />
    </div>
  );
};

export default Chat;
