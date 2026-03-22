// ─────────────────────────────────────────────────────────────────────────────
// Jitsi JaaS iframe wrapper.
// Matches Clinicall's existing blue-600 / white / gray design system.
//
// Props:
//   jitsiData   { token, fullRoom, domain }  from useVideoCall hook
//   displayName string                        from parsed localStorage token
//   onLeave     func                          called when user hangs up
//   onError     func                          called on Jitsi error
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";

export default function VideoCallModal({ jitsiData, displayName = "User", onLeave, onError }) {
  const containerRef = useRef(null);
  const apiRef       = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    if (!jitsiData?.token || !jitsiData?.fullRoom) return;

    const SCRIPT_ID = "jaas-external-api";

    const init = () => {
      if (!containerRef.current || apiRef.current) return;

      try {
        apiRef.current = new window.JitsiMeetExternalAPI(jitsiData.domain, {
          roomName: jitsiData.fullRoom,   // "vpaas-magic-cookie-xxx/appointment-id"
          jwt:      jitsiData.token,      // signed RS256 token from your server
          parentNode: containerRef.current,
          width:  "100%",
          height: "100%",
          configOverwrite: {
            prejoinPageEnabled:      false,  // skip lobby — doctor/patient go straight in
            startWithAudioMuted:     false,
            startWithVideoMuted:     false,
            disableDeepLinking:      true,
            disableInviteFunctions:  true,   // no "invite others" — room is appointment-locked
            enableNoisyMicDetection: true,
            p2p: { enabled: true },          // direct P2P for 2-person consultations
            // Medical use: disable recording by default (HIPAA consideration)
            fileRecordingsEnabled:   false,
            liveStreamingEnabled:    false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              "microphone", "camera", "desktop",
              "fullscreen", "fodeviceselection",
              "hangup", "raisehand", "videoquality",
              "tileview", "settings",
            ],
            SHOW_JITSI_WATERMARK:     false,
            SHOW_WATERMARK_FOR_GUESTS:false,
            MOBILE_APP_PROMO:         false,
            HIDE_INVITE_MORE_HEADER:  true,
            DEFAULT_BACKGROUND:       "#f8fafc",
          },
        });

        apiRef.current.addEventListeners({
          videoConferenceJoined: () => setStatus("ready"),
          readyToClose:          () => { setStatus("loading"); onLeave?.(); },
          errorOccurred:         (err) => { setStatus("error"); onError?.(err); },
        });
      } catch (err) {
        console.error("[VideoCall] Jitsi init failed:", err);
        setStatus("error");
        onError?.(err);
      }
    };

    if (window.JitsiMeetExternalAPI) {
      init();
    } else {
      if (!document.getElementById(SCRIPT_ID)) {
        const script    = document.createElement("script");
        script.id       = SCRIPT_ID;
        script.src      = "https://8x8.vc/external_api.js";
        script.async    = true;
        script.onload   = init;
        script.onerror  = () => { setStatus("error"); onError?.(new Error("Jitsi SDK failed to load")); };
        document.head.appendChild(script);
      }
    }

    return () => {
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }
    };
  }, [jitsiData?.token, jitsiData?.fullRoom]);

  return (
    <div className="relative w-full h-full min-h-96 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
      <style>{`@keyframes vc-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Loading */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "3px solid #dbeafe",
            borderTopColor: "#2563eb",
            animation: "vc-spin 0.8s linear infinite",
          }} />
          <p className="text-sm text-gray-500">Connecting to secure call…</p>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 shadow-sm">
            <span className="text-3xl">⚠️</span>
            <p className="text-gray-700 font-medium">Could not connect to video call</p>
            <p className="text-sm text-gray-500">Please check your camera/microphone permissions</p>
            <button
              onClick={onLeave}
              className="mt-2 px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Jitsi iframe */}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", opacity: status === "ready" ? 1 : 0, transition: "opacity 0.3s ease" }}
      />
    </div>
  );
}
