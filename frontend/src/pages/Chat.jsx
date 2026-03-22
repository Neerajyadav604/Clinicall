import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import socket from "../utils/socket";
import { checkChatAccess } from "../services/operations/consultationApi";
import { handleUnauthorized } from "../services/authSession";

// ── VIDEO CALL IMPORTS ───────────────────────────────────────────────────────
import { useVideoCall } from "../hooks/useVideoCall";
import VideoCallModal from "../components/consultation/VideoCallModal";
import IncomingCallBanner from "../components/consultation/IncomingCallBanner";
// ────────────────────────────────────────────────────────────────────────────

// ============================================================
// SUB-COMPONENTS (unchanged)
// ============================================================

const MessageBubble = ({ message, isOwnMessage }) => {
  const renderFileContent = () => {
    if (!message.fileUrl) return null;
    const isImage  = message.fileType?.startsWith('image/');
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
            isOwnMessage ? "bg-blue-700 hover:bg-blue-800" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
          } transition-colors`}
        >
          📎 {fileName}
        </a>
      </div>
    );
  };

  return (
    <div className={`flex mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl shadow-sm ${
        isOwnMessage ? "bg-blue-600 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"
      }`}>
        {message.message && <p className="text-sm leading-relaxed break-words">{message.message}</p>}
        {renderFileContent()}
        <p className={`text-xs mt-2 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

const MessageList = ({ messages, messagesEndRef }) => (
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

const ChatInput = ({ messageInput, setMessageInput, handleSendMessage, handleFileUpload, isConnected, error, onClearError }) => {
  const fileInputRef = useRef(null);
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };
  return (
    <div className="w-full bg-white border-t border-gray-200 px-6 py-4">
      <form onSubmit={handleSendMessage} className="flex gap-3">
        <input
          type="text" value={messageInput}
          onChange={(e) => { setMessageInput(e.target.value); if (onClearError) onClearError(); }}
          placeholder="Type your message..."
          disabled={!isConnected}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
        />
        <input type="file" ref={fileInputRef} onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!isConnected}
          className="px-4 py-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
          title="Attach file">📎</button>
        <button type="submit" disabled={!isConnected || !messageInput.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md">
          Send
        </button>
      </form>
      {!isConnected && <p className="text-sm text-red-600 mt-2 text-center">⚠️ Connection lost. Reconnecting...</p>}
      {error ? <div className="error-box mt-2" role="alert" aria-live="polite">{error}</div> : null}
    </div>
  );
};

// ── VIDEO CALL: Updated ChatHeader with video call button ────────────────────
const ChatHeader = ({ appointmentDetails, isConnected, callState, callDuration, onStartCall, onEndCall, onLeaveCall, userRole }) => {
  const isInCall    = callState === "in-call";
  const isCalling   = callState === "calling";
  const isDoctor    = userRole === "doctor";

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">
            {appointmentDetails?.doctorName || "Doctor"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {appointmentDetails && (
              <>{new Date(appointmentDetails.appointmentDate).toLocaleDateString()} at {appointmentDetails.appointmentTime}</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>

          {/* VIDEO CALL BUTTON / IN-CALL CONTROLS */}
          {callState === "idle" && isConnected && (
            <button
              onClick={onStartCall}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M15 8v8H5V8h10m1-2H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4V5.5l-4 4V7a1 1 0 00-1-1z"/>
              </svg>
              Video Call
            </button>
          )}

          {isCalling && (
            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm border border-blue-200">
              Connecting…
            </span>
          )}

          {isInCall && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {formatDuration(callDuration)}
              </span>
              <button
                onClick={onLeaveCall}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                Leave
              </button>
              {isDoctor && (
                <button
                  onClick={onEndCall}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-sm border border-red-200 hover:bg-red-100 transition-colors"
                >
                  End for all
                </button>
              )}
            </div>
          )}
          {/* END VIDEO CALL CONTROLS */}
        </div>
      </div>
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────

// ============================================================
// MAIN CHAT COMPONENT
// ============================================================

const Chat = () => {
  const { appointmentId } = useParams();
  const navigate           = useNavigate();
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [messages, setMessages]                     = useState([]);
  const [messageInput, setMessageInput]             = useState("");
  const [inputError, setInputError]                 = useState("");
  const [loading, setLoading]                       = useState(true);
  const [accessDenied, setAccessDenied]             = useState(false);
  const [isConnected, setIsConnected]               = useState(false);
  const [userRole, setUserRole]                     = useState("user");
  const [displayName, setDisplayName]               = useState("User");
  const messagesEndRef   = useRef(null);
  const socketInitialized = useRef(false);

  // ── VIDEO CALL HOOK ────────────────────────────────────────────────────────
  const {
    callState,
    jitsiData,
    incomingCall,
    callDuration,
    error: callError,
    startCall,
    acceptCall,
    declineCall,
    leaveCall,
    endCallForAll,
  } = useVideoCall(appointmentId);
  // ──────────────────────────────────────────────────────────────────────────

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Parse token once for role + display name
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole((payload.role || "user").toLowerCase());
        setDisplayName(payload.fullName || payload.name || "User");
      } catch (e) { /* ignore */ }
    }
  }, []);

  // ── FILE UPLOAD (unchanged) ───────────────────────────────────────────────
  const handleFileUpload = async (file) => {
    setInputError("");
    if (!socket.connected || !isConnected) { setInputError("Cannot upload file - not connected"); return; }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) { setInputError("File size must be less than 10MB"); return; }
    const allowedTypes = ['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'];
    if (!allowedTypes.includes(file.type)) { setInputError("File type not supported."); return; }
    try {
      toast.info("Uploading file...");
      const formData = new FormData();
      formData.append('file', file);
      formData.append('appointmentId', appointmentId);
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api/v1"}/upload/chat-file`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await response.json();
      if (!response.ok) { if (response.status === 401) { handleUnauthorized(); return; } throw new Error(data.message || "File upload failed"); }
      const token_payload = JSON.parse(atob(token.split('.')[1]));
      const role = (token_payload.role || "user").toLowerCase();
      socket.emit("send_message", { appointmentId, message: file.name, fileUrl: data.url, fileName: file.name, fileType: file.type, timestamp: new Date(), senderRole: role });
      toast.success("File uploaded successfully!");
    } catch (error) {
      setInputError(error.message || "Failed to upload file");
    }
  };

  // ── SOCKET SETUP (unchanged, only socketInitialized guard added) ──────────
  useEffect(() => {
    if (socketInitialized.current) return;
    socketInitialized.current = true;
    let handleConnect, handleDisconnect, handleReceiveMessage, handleChatHistory, handleAppointmentAuthenticated, handleSocketError, connectionTimeout, connectHandler;
    let isMounted = true;

    const verifyChatAccess = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        let role = "user";
        if (token) {
          try { const p = JSON.parse(atob(token.split('.')[1])); role = (p.role || "user").toLowerCase(); } catch (e) {}
        }

        let response;
        if (role === "doctor") {
          const apiResponse = await fetch(
            `${process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api/v1"}/appointments/${appointmentId}/chat-access`,
            { method: "GET", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
          );
          response = await apiResponse.json();
          if (!apiResponse.ok) { if (apiResponse.status === 401) { handleUnauthorized(); return; } throw new Error(response.message || "Failed to check chat access"); }
        } else {
          response = await checkChatAccess(appointmentId);
        }

        if (!response.canAccess) {
          if (!isMounted) return;
          setAccessDenied(true);
          toast.error(response.reason || "Chat access not available");
          setTimeout(() => navigate(role === "doctor" ? "/doctor/appointments" : "/my-requests"), 2000);
          return;
        }

        if (!isMounted) return;
        setAppointmentDetails(response.appointment);

        const authPayload = { token: localStorage.getItem("token"), appointmentId };

        registerChatListeners();

        const attemptAuth = () => { if (isMounted) socket.emit('authenticate_appointment', authPayload); };

        if (socket.connected)       { attemptAuth(); }
        else if (socket.connecting) { connectHandler = () => { attemptAuth(); socket.off('connect', connectHandler); }; socket.once('connect', connectHandler); }
        else {
          socket.auth = { token: localStorage.getItem("token") };
          socket.connect();
          connectHandler = () => { attemptAuth(); socket.off('connect', connectHandler); };
          socket.once('connect', connectHandler);
        }

        connectionTimeout = setTimeout(() => {
          if (isMounted && !socket.connected) {
            setAccessDenied(true);
            toast.error("Unable to establish connection. Please try again.");
            navigate(role === "doctor" ? "/doctor/appointments" : "/my-requests");
          }
        }, 15000);

        function registerChatListeners() {
          handleConnect    = () => {};
          handleDisconnect = () => { if (isMounted) setIsConnected(false); };
          handleReceiveMessage = (data) => {
            if (isMounted) {
              setMessages((prev) => {
                const exists = prev.some(m => m.timestamp === data.timestamp && m.message === data.message && m.senderRole?.toLowerCase() === data.senderRole?.toLowerCase());
                return exists ? prev : [...prev, data];
              });
            }
          };
          handleChatHistory             = (history) => { if (isMounted) setMessages(history || []); };
          handleAppointmentAuthenticated = () => {
            if (isMounted) {
              if (connectionTimeout) clearTimeout(connectionTimeout);
              setIsConnected(true);
              socket.emit("join_chat", { appointmentId });
            }
          };
          handleSocketError = (error) => {
            if (isMounted) { setIsConnected(false); toast.error("Connection error: " + error); }
          };
          socket.on("connect",                  handleConnect);
          socket.on("disconnect",               handleDisconnect);
          socket.on("receive_message",          handleReceiveMessage);
          socket.on("chat_history",             handleChatHistory);
          socket.on("appointment_authenticated",handleAppointmentAuthenticated);
          socket.on("error",                    handleSocketError);
        }
      } catch (error) {
        if (!isMounted) return;
        setAccessDenied(true);
        toast.error(error.message || "Failed to verify chat access");
        const token = localStorage.getItem("token");
        let role = "user";
        if (token) { try { const p = JSON.parse(atob(token.split('.')[1])); role = p.role || "user"; } catch (e) {} }
        setTimeout(() => navigate(role === "doctor" ? "/doctor/appointments" : "/my-requests"), 2000);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifyChatAccess();

    return () => {
      isMounted = false;
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (connectHandler)              socket.off('connect',                   connectHandler);
      if (handleConnect)               socket.off("connect",                   handleConnect);
      if (handleDisconnect)            socket.off("disconnect",                handleDisconnect);
      if (handleReceiveMessage)        socket.off("receive_message",           handleReceiveMessage);
      if (handleChatHistory)           socket.off("chat_history",              handleChatHistory);
      if (handleAppointmentAuthenticated) socket.off("appointment_authenticated", handleAppointmentAuthenticated);
      if (handleSocketError)           socket.off("error",                     handleSocketError);
      socketInitialized.current = false;
    };
  }, [appointmentId]);

  // ── SEND MESSAGE (unchanged) ──────────────────────────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !socket.connected || !isConnected) { setInputError("Cannot send message"); return; }
    const token = localStorage.getItem("token");
    let role = "user";
    if (token) { try { const p = JSON.parse(atob(token.split('.')[1])); role = (p.role || "user").toLowerCase(); } catch (e) {} }
    socket.emit("send_message", { appointmentId, message: messageInput.trim(), timestamp: new Date(), senderRole: role });
    setMessageInput("");
    setInputError("");
  };

  // ── LOADING / ACCESS DENIED (unchanged) ──────────────────────────────────
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
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded">Go Back</button>
        </div>
      </div>
    );
  }

  const isInCall = callState === "in-call";

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header — now has video call button */}
      <ChatHeader
        appointmentDetails={appointmentDetails}
        isConnected={isConnected}
        callState={callState}
        callDuration={callDuration}
        userRole={userRole}
        onStartCall={startCall}
        onLeaveCall={leaveCall}
        onEndCall={endCallForAll}
      />

      {/* VIDEO CALL: Active call panel — renders above chat when in a call */}
      {isInCall && jitsiData && (
        <div className="border-b border-gray-200" style={{ height: "60vh" }}>
          <VideoCallModal
            jitsiData={jitsiData}
            displayName={displayName}
            onLeave={leaveCall}
            onError={(err) => toast.error("Video call error: " + err.message)}
          />
        </div>
      )}
      {/* END VIDEO CALL PANEL */}

      {/* Chat messages */}
      <MessageList messages={messages} messagesEndRef={messagesEndRef} />

      {/* Chat input */}
      <ChatInput
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        handleSendMessage={handleSendMessage}
        handleFileUpload={handleFileUpload}
        isConnected={isConnected}
        error={inputError || callError}
        onClearError={() => setInputError("")}
      />

      {/* VIDEO CALL: Incoming call banner — overlays everything */}
      <IncomingCallBanner
        incomingCall={incomingCall}
        onAccept={acceptCall}
        onDecline={declineCall}
      />

      {/* VIDEO CALL: Call ended toast */}
      {callState === "ended" && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-2.5 rounded-full shadow-lg">
          Call ended
        </div>
      )}
    </div>
  );
};

export default Chat;


