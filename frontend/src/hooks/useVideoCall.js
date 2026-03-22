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
    if (fetchingRef.current) return null;
    fetchingRef.current = true;

    try {
      const token = localStorage.getItem("token");
      const base  = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api/v1";

      const res = await fetch(`${base}/consultation/video-token/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        // Reuse your existing handleUnauthorized pattern
        const { handleUnauthorized } = await import("../services/authSession");
        handleUnauthorized();
        return null;
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Token fetch failed");
      return data;
    } catch (err) {
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
    setError(null);
    setCallState("calling");

    const data = await fetchJitsiToken();
    if (!data) { setCallState("idle"); return; }

    setJitsiData(data);
    socket.emit("call:video:start", { appointmentId });
    setCallState("in-call");
    startTimer();
  }, [appointmentId, fetchJitsiToken, startTimer]);

  // ── Accept incoming call ─────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    setError(null);
    setCallState("calling");

    const data = await fetchJitsiToken();
    if (!data) { setCallState("idle"); return; }

    setJitsiData(data);
    socket.emit("call:video:join", { appointmentId });
    setCallState("in-call");
    setIncomingCall(null);
    startTimer();
  }, [appointmentId, fetchJitsiToken, startTimer]);

  // ── Decline incoming call ────────────────────────────────────────────────
  const declineCall = useCallback(() => {
    socket.emit("call:video:decline", { appointmentId });
    setIncomingCall(null);
    setCallState("idle");
  }, [appointmentId]);

  // ── Leave call ───────────────────────────────────────────────────────────
  const leaveCall = useCallback(() => {
    socket.emit("call:video:leave", { appointmentId });
    setCallState("idle");
    setJitsiData(null);
    stopTimer();
  }, [appointmentId, stopTimer]);

  // ── End call for everyone (doctor) ───────────────────────────────────────
  const endCallForAll = useCallback(() => {
    socket.emit("call:video:end", { appointmentId });
    setCallState("idle");
    setJitsiData(null);
    stopTimer();
  }, [appointmentId, stopTimer]);

  // ── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const onIncoming = (data) => {
      // Only show in-chat banner if we're idle AND this call is for this appointment
      if (callState === "idle" && data.appointmentId === appointmentId) {
        setIncomingCall(data);
        setCallState("incoming");
      }
    };

    const onEnded = ({ duration }) => {
      stopTimer();
      setCallState("ended");
      setJitsiData(null);
      setCallDuration(duration || 0);
      setTimeout(() => setCallState("idle"), 4000);
    };

    const onDeclined = ({ declinedBy }) => {
      setError(`${declinedBy} declined the call`);
      setCallState("idle");
      setJitsiData(null);
      setTimeout(() => setError(null), 4000);
    };

    const onParticipantJoined = ({ participantCount }) => setParticipants(participantCount);
    const onParticipantLeft   = ({ participantCount }) => setParticipants(participantCount);

    socket.on("call:video:incoming",          onIncoming);
    socket.on("call:video:ended",             onEnded);
    socket.on("call:video:declined",          onDeclined);
    socket.on("call:video:participant_joined",onParticipantJoined);
    socket.on("call:video:participant_left",  onParticipantLeft);

    return () => {
      socket.off("call:video:incoming",          onIncoming);
      socket.off("call:video:ended",             onEnded);
      socket.off("call:video:declined",          onDeclined);
      socket.off("call:video:participant_joined",onParticipantJoined);
      socket.off("call:video:participant_left",  onParticipantLeft);
    };
  }, [callState, stopTimer]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => stopTimer(), [stopTimer]);

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
