// ─────────────────────────────────────────────────────────────────────────────
// Shows when call:video:incoming fires. Matches Clinicall's clean white/blue UI.
//
// Props:
//   incomingCall  { calledBy: { name, role, avatar } }
//   onAccept      func
//   onDecline     func
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";

export default function IncomingCallBanner({ incomingCall, onAccept, onDecline }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!incomingCall) return;

    // Create ringtone using Web Audio API — no external file needed
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    let stopped = false;

    const ring = () => {
      if (stopped) return;

      // Two-tone medical ring: 880hz then 1100hz
      [880, 1100].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.18 + 0.02);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.18 + 0.16);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.18);
      });

      // Repeat every 2.5 seconds
      audioRef.current = setTimeout(ring, 2500);
    };

    ring();

    return () => {
      stopped = true;
      clearTimeout(audioRef.current);
      ctx.close();
    };
  }, [incomingCall]);
  if (!incomingCall) return null;

  const { calledBy } = incomingCall;
  const isDoctor     = calledBy?.role === "doctor";
  const initial      = (calledBy?.name || "?")[0].toUpperCase();

  return (
    <>
      <style>{`
        @keyframes ring-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes slide-up {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center pb-10">

        {/* Card */}
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 flex items-center gap-5 w-full max-w-sm mx-4"
          style={{ animation: "slide-up 0.25s ease" }}
        >
          {/* Avatar with ringing ring */}
          <div className="relative flex-shrink-0">
            {calledBy?.avatar ? (
              <img
                src={calledBy.avatar}
                alt={calledBy.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {initial}
              </div>
            )}
            {/* Ringing animation ring */}
            <div
              className="absolute inset-0 rounded-full border-2 border-blue-500"
              style={{ animation: "ring-pulse 1.2s ease-out infinite" }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{calledBy?.name || "Someone"}</p>
            <p className="text-sm text-gray-500">
              {isDoctor ? "Dr. · " : ""}Incoming video call…
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onDecline}
              className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
              title="Decline"
            >
              {/* Phone down icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
              </svg>
            </button>
            <button
              onClick={onAccept}
              className="w-11 h-11 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-md"
              title="Accept"
            >
              {/* Video camera icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M15 8v8H5V8h10m1-2H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4V5.5l-4 4V7a1 1 0 00-1-1z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
