// ─────────────────────────────────────────────────────────────────────────────
// Manages the full video call lifecycle for Clinicall.
// Uses your existing:
//   - socket from utils/socket.js
//   - token from localStorage ("token")
//   - appointmentId from useParams()
//   - REACT_APP_API_BASE_URL env var
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from "react";
import socket from "../utils/socket";

/**
 * @param {string} appointmentId  - from useParams() in Chat.jsx
 */
export function useVideoCall(appointmentId) {
  const [callState, setCallState]     = useState("idle");
  // idle | calling | in-call | incoming | ended | declined
  const [jitsiData, setJitsiData]     = useState(null);
  // { token, fullRoom, domain }
  const [incomingCall, setIncomingCall] = useState(null);
  // { calledBy: { name, role, avatar }, startedAt }
  const [participants, setParticipants] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError]              = useState(null);
  const fetchingRef                    = useRef(false);
  const timerRef                       = useRef(null);

  // ── Fetch JWT from your server ──────────────────────────────────────────
  const fetchJitsiToken = useCallback(async () => {
    if (fetchingRef.current) {
      console.log("[useVideoCall] 🔄 Token fetch already in progress, skipping...");
      return null;
    }
    fetchingRef.current = true;

    const FUNC = "[🎥 useVideoCall:fetchJitsiToken]";
    console.log(`\n${FUNC} TOKEN FETCH INITIATED`);
    console.log(`${FUNC} Appointment ID: ${appointmentId}`);
    
    try {
      const token = localStorage.getItem("token");
      const base  = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api/v1";
      const url = `${base}/consultation/video-token/${appointmentId}`;
      
      console.log(`${FUNC} [1/4] REQUEST CONFIG:`);
      console.log(`${FUNC}   - API Base: ${base}`);
      console.log(`${FUNC}   - Full URL: ${url}`);
      console.log(`${FUNC}   - Auth Token: ${token ? '✅ Found' : '❌ Missing'}`);
      console.log(`${FUNC}   - Token Length: ${token?.length || 0}`);

      console.log(`${FUNC} [2/4] SENDING REQUEST...`);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log(`${FUNC}   - Status: ${res.status} ${res.statusText}`);
      console.log(`${FUNC}   - Content-Type: ${res.headers.get('content-type')}`);

      if (res.status === 401) {
        console.error(`${FUNC} ❌ UNAUTHORIZED (401) - Token expired or invalid`);
        const { handleUnauthorized } = await import("../services/authSession");
        handleUnauthorized();
        setError("Session expired. Please login again.");
        return null;
      }

      console.log(`${FUNC} [3/4] PARSING RESPONSE...`);
      const data = await res.json();
      
      console.log(`${FUNC}   - Response Success: ${data.success}`);
      console.log(`${FUNC}   - Has Token: ${data.token ? '✅ YES' : '❌ NO'}`);
      console.log(`${FUNC}   - Has Room: ${data.fullRoom ? '✅ YES' : '❌ NO'}`);
      console.log(`${FUNC}   - Domain: ${data.domain}`);
      
      if (data.success) {
        console.log(`${FUNC}   - Token Length: ${data.token?.length || 0}`);
        console.log(`${FUNC}   - Room Name: ${data.roomName}`);
      }

      if (!data.success) {
        const errMsg = data.message || "Token fetch failed";
        console.error(`${FUNC} ❌ API Error: ${errMsg}`);
        if (data.debug) {
          console.error(`${FUNC}   - Debug Info:`, data.debug);
        }
        throw new Error(errMsg);
      }

      console.log(`${FUNC} [4/4] ✅ SUCCESS`);
      console.log(`${FUNC} Token fetched successfully\n`);
      return data;
    } catch (err) {
      console.error(`${FUNC} ❌ FETCH ERROR:`);
      console.error(`${FUNC}   - Type: ${err.constructor.name}`);
      console.error(`${FUNC}   - Message: ${err.message}`);
      setError(err.message || "Could not connect to video call");
      return null;
    } finally {
      fetchingRef.current = false;
    }
  }, [appointmentId]);

  // ── Start timer ─────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setCallDuration(0);
    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // ── Start call ──────────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    const FUNC = "[🎥 useVideoCall:startCall]";
    console.log(`\n${FUNC} INITIATING VIDEO CALL`);
    console.log(`${FUNC} Appointment: ${appointmentId}`);
    console.log(`${FUNC} Current State: ${callState}`);
    
    setError(null);
    setCallState("calling");
    console.log(`${FUNC} [1/4] State changed to "calling"`);

    console.log(`${FUNC} [2/4] Fetching Jitsi token...`);
    const data = await fetchJitsiToken();
    
    if (!data) {
      console.error(`${FUNC} ❌ Token fetch failed`);
      setCallState("idle");
      console.log(`${FUNC}   - State reverted to "idle"`);
      return;
    }

    console.log(`${FUNC} [3/4] Emitting socket event...`);
    console.log(`${FUNC}   - Event: "call:video:start"`);
    console.log(`${FUNC}   - Payload: { appointmentId: "${appointmentId}" }`);
    
    setJitsiData(data);
    socket.emit("call:video:start", { appointmentId });

    console.log(`${FUNC} [4/4] Starting call timer`);
    setCallState("in-call");
    startTimer();
    console.log(`${FUNC} ✅ Call initiated successfully\n`);
  }, [appointmentId, fetchJitsiToken, startTimer]);

  // ── Accept incoming call ─────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    const FUNC = "[🎥 useVideoCall:acceptCall]";
    console.log(`\n${FUNC} ACCEPTING INCOMING CALL`);
    console.log(`${FUNC} Appointment: ${appointmentId}`);
    console.log(`${FUNC} Current State: ${callState}`);
    
    setError(null);
    setCallState("calling");
    console.log(`${FUNC} [1/4] State changed to "calling"`);

    console.log(`${FUNC} [2/4] Fetching Jitsi token...`);
    const data = await fetchJitsiToken();
    
    if (!data) {
      console.error(`${FUNC} ❌ Token fetch failed`);
      setCallState("idle");
      console.log(`${FUNC}   - State reverted to "idle"`);
      return;
    }

    console.log(`${FUNC} [3/4] Emitting socket event...`);
    console.log(`${FUNC}   - Event: "call:video:join"`);
    console.log(`${FUNC}   - Payload: { appointmentId: "${appointmentId}" }`);
    
    setJitsiData(data);
    socket.emit("call:video:join", { appointmentId });
    setCallState("in-call");
    setIncomingCall(null);

    console.log(`${FUNC} [4/4] Starting call timer`);
    startTimer();
    console.log(`${FUNC} ✅ Call accepted successfully\n`);
  }, [appointmentId, fetchJitsiToken, startTimer]);

  // ── Decline incoming call ────────────────────────────────────────────────
  const declineCall = useCallback(() => {
    const FUNC = "[🎥 useVideoCall:declineCall]";
    console.log(`\n${FUNC} DECLINING CALL`);
    console.log(`${FUNC} Appointment: ${appointmentId}`);
    console.log(`${FUNC} Event emitted: "call:video:decline"`);
    
    socket.emit("call:video:decline", { appointmentId });
    setIncomingCall(null);
    setCallState("idle");
    console.log(`${FUNC} ✅ Call declined\n`);
  }, [appointmentId]);

  // ── Leave call ───────────────────────────────────────────────────────────
  const leaveCall = useCallback(() => {
    const FUNC = "[🎥 useVideoCall:leaveCall]";
    console.log(`\n${FUNC} LEAVING CALL`);
    console.log(`${FUNC} Appointment: ${appointmentId}`);
    console.log(`${FUNC} Duration: ${callDuration}s`);
    console.log(`${FUNC} Event emitted: "call:video:leave"`);
    
    socket.emit("call:video:leave", { appointmentId });
    setCallState("idle");
    setJitsiData(null);
    stopTimer();
    console.log(`${FUNC} ✅ Left call\n`);
  }, [appointmentId, callDuration, stopTimer]);

  // ── End call for everyone (doctor) ───────────────────────────────────────
  const endCallForAll = useCallback(() => {
    const FUNC = "[🎥 useVideoCall:endCallForAll]";
    console.log(`\n${FUNC} ENDING CALL FOR ALL PARTICIPANTS`);
    console.log(`${FUNC} Appointment: ${appointmentId}`);
    console.log(`${FUNC} Duration: ${callDuration}s`);
    console.log(`${FUNC} Event emitted: "call:video:end"`);
    
    socket.emit("call:video:end", { appointmentId });
    setCallState("idle");
    setJitsiData(null);
    stopTimer();
    console.log(`${FUNC} ✅ Call ended for all\n`);
  }, [appointmentId, callDuration, stopTimer]);

  // ── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const FUNC = "[🎥 useVideoCall:socketListeners]";
    console.log(`\n${FUNC} ═══════════════════════════════════════════════════════════════════════════════════════`);
    console.log(`${FUNC} REGISTERING SOCKET EVENT LISTENERS`);
    console.log(`${FUNC}   - Apartment ID: ${appointmentId}`);
    console.log(`${FUNC}   - Socket Connected: ${socket.connected ? '✅ YES' : '❌ NO'}`);
    console.log(`${FUNC}   - Current Call State: ${callState}`);
    
    // ✅ DEBUG: Request current room status from server
    console.log(`${FUNC} [DEBUG] Requesting current socket rooms from server...`);
    socket.emit("debug:rooms");
    socket.once("debug:rooms:response", (response) => {
      console.log(`${FUNC} [DEBUG] SOCKET ROOMS ON SERVER:`);
      console.log(`${FUNC}   - User: ${response.userId}`);
      console.log(`${FUNC}   - Socket ID: ${response.socketId}`);
      console.log(`${FUNC}   - Rooms (${response.rooms.length} total):`);
      response.rooms.forEach(room => {
        console.log(`${FUNC}     • ${room}`);
      });
    });
    
    const onIncoming = (data) => {
      console.log(`\n${FUNC} EVENT: "call:video:incoming" RECEIVED ✅`);
      console.log(`${FUNC}   - Caller: ${data.calledBy?.name} (ID: ${data.calledBy?.id})`);
      console.log(`${FUNC}   - Caller Role: ${data.calledBy?.role}`);
      console.log(`${FUNC}   - Appointment: ${data.appointmentId}`);
      console.log(`${FUNC}   - Current Call State: ${callState}`);
      console.log(`${FUNC}   - Expected Appointment ID: ${appointmentId}`);
      console.log(`${FUNC}   - IDs Match: ${data.appointmentId === appointmentId}`);
      
      if (callState !== "idle") {
        console.log(`${FUNC}   - ℹ️  IGNORING: Not in idle state (current: ${callState})`);
        return;
      }
      
      if (data.appointmentId !== appointmentId) {
        console.log(`${FUNC}   - ℹ️  IGNORING: Wrong appointment (received ${data.appointmentId}, expected ${appointmentId})`);
        return;
      }
      
      console.log(`${FUNC}   - ✅ CONDITIONS MET - Showing incoming call banner`);
      setIncomingCall(data);
      setCallState("incoming");
    };

    const onEnded = ({ duration }) => {
      console.log(`${FUNC} EVENT: "call:video:ended"`);
      console.log(`${FUNC}   - Duration: ${duration}s`);
      stopTimer();
      setCallState("ended");
      setJitsiData(null);
      setCallDuration(duration || 0);
      console.log(`${FUNC}   - Setting state to "ended", will revert to "idle" in 4s`);
      setTimeout(() => setCallState("idle"), 4000);
    };

    const onDeclined = ({ declinedBy }) => {
      console.log(`${FUNC} EVENT: "call:video:declined"`);
      console.log(`${FUNC}   - Declined by: ${declinedBy}`);
      setError(`${declinedBy} declined the call`);
      setCallState("idle");
      setJitsiData(null);
      console.log(`${FUNC}   - Error displayed for 4s`);
      setTimeout(() => setError(null), 4000);
    };

    const onParticipantJoined = ({ participantCount }) => {
      console.log(`${FUNC} EVENT: "call:video:participant_joined"`);
      console.log(`${FUNC}   - Participant Count: ${participantCount}`);
      setParticipants(participantCount);
    };

    const onParticipantLeft = ({ participantCount }) => {
      console.log(`${FUNC} EVENT: "call:video:participant_left"`);
      console.log(`${FUNC}   - Participant Count: ${participantCount}`);
      setParticipants(participantCount);
    };

    console.log(`${FUNC} ✅ Registering listeners...`);
    socket.on("call:video:incoming",          onIncoming);
    socket.on("call:video:ended",             onEnded);
    socket.on("call:video:declined",          onDeclined);
    socket.on("call:video:participant_joined",onParticipantJoined);
    socket.on("call:video:participant_left",  onParticipantLeft);
    console.log(`${FUNC} ✅ All listeners registered`);
    console.log(`${FUNC} ${'='.repeat(100)}\n`);

    return () => {
      console.log(`${FUNC} 🧹 Cleaning up listeners for appointmentId: ${appointmentId}`);
      socket.off("call:video:incoming",          onIncoming);
      socket.off("call:video:ended",             onEnded);
      socket.off("call:video:declined",          onDeclined);
      socket.off("call:video:participant_joined",onParticipantJoined);
      socket.off("call:video:participant_left",  onParticipantLeft);
      console.log(`${FUNC} ✅ All listeners removed\n`);
    };
  }, [appointmentId, callState, stopTimer]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── DEBUG HELPER: Expose diagnostic functions to window ────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.debugVideoCall = {
        checkRooms: () => {
          console.log("[🐛 DEBUG] Requesting room info...");
          socket.emit("debug:rooms");
        },
        getState: () => ({
          appointmentId,
          callState,
          hasIncomingCall: !!incomingCall,
          socketConnected: socket.connected,
          jitsiDataReady: !!jitsiData,
        }),
        logState: function() {
          console.log("[🐛 DEBUG] Current Video Call State:");
          console.table(this.getState());
        }
      };
      console.log("[🎥 VIDEO CALL] Debug helpers available. Use: window.debugVideoCall.checkRooms() or window.debugVideoCall.logState()");
    }
  }, [appointmentId, callState, incomingCall, jitsiData, socket]);

  return {
    callState,       // "idle"|"calling"|"in-call"|"incoming"|"ended"|"declined"
    jitsiData,       // { token, fullRoom, domain } — pass to VideoCallModal
    incomingCall,    // { calledBy: { name, role, avatar }, startedAt }
    participants,
    callDuration,    // seconds, for in-call timer display
    error,
    startCall,
    acceptCall,
    declineCall,
    leaveCall,
    endCallForAll,
  };
}
