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
    const FUNC = "[🎥 VideoCallModal:Jitsi]";
    
    if (!jitsiData?.token || !jitsiData?.fullRoom) {
      console.log(`${FUNC} Missing data, skipping init`);
      console.log(`${FUNC}   - Has Token: ${jitsiData?.token ? 'YES' : 'NO'}`);
      console.log(`${FUNC}   - Has Room: ${jitsiData?.fullRoom ? 'YES' : 'NO'}`);
      return;
    }

    console.log(`\n${FUNC} INITIALIZING JITSI`);
    console.log(`${FUNC} ═══════════════════════════════════════════════════════════════════`);
    console.log(`${FUNC} [1/5] DATA VALIDATION:`);
    console.log(`${FUNC}   - Domain: ${jitsiData.domain}`);
    console.log(`${FUNC}   - Room: ${jitsiData.fullRoom}`);
    console.log(`${FUNC}   - Token Length: ${jitsiData.token?.length || 0}`);
    console.log(`${FUNC}   - Display Name: ${displayName}`);

    const SCRIPT_ID = "jaas-external-api";

    const init = () => {
      console.log(`${FUNC} [2/5] CONTAINER & API CHECK:`);
      console.log(`${FUNC}   - Container Found: ${containerRef.current ? '✅ YES' : '❌ NO'}`);
      console.log(`${FUNC}   - API Already Init: ${apiRef.current ? '⚠️ YES (skipping)' : '❌ NO'}`);
      
      if (!containerRef.current || apiRef.current) {
        console.warn(`${FUNC}   - Skipping init (container missing or API already exists)`);
        return;
      }

      try {
        console.log(`${FUNC} [3/5] JITSI INSTANCE CREATION:`);
        console.log(`${FUNC}   - Calling: new window.JitsiMeetExternalAPI()`);
        
        apiRef.current = new window.JitsiMeetExternalAPI(jitsiData.domain, {
          roomName: jitsiData.fullRoom,
          jwt:      jitsiData.token,
          parentNode: containerRef.current,
          width:  "100%",
          height: "100%",
          configOverwrite: {
            prejoinPageEnabled:      false,
            startWithAudioMuted:     false,
            startWithVideoMuted:     false,
            disableDeepLinking:      true,
            disableInviteFunctions:  true,
            enableNoisyMicDetection: true,
            p2p: { enabled: true },
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

        console.log(`${FUNC}   - ✅ Instance created`);

        console.log(`${FUNC} [4/5] EVENT LISTENER REGISTRATION:`);
        
        apiRef.current.addEventListeners({
          videoConferenceJoined: () => {
            console.log(`${FUNC}   EVENT: videoConferenceJoined`);
            console.log(`${FUNC}   - User successfully joined the call`);
            setStatus("ready");
          },
          readyToClose: () => {
            console.log(`${FUNC}   EVENT: readyToClose`);
            console.log(`${FUNC}   - User initiated hangup`);
            setStatus("loading");
            onLeave?.();
          },
          errorOccurred: (err) => {
            console.error(`${FUNC}   EVENT: errorOccurred`);
            console.error(`${FUNC}   - Error Type: ${err?.constructor?.name || 'Unknown'}`);
            console.error(`${FUNC}   - Error: ${err?.message || err?.error || JSON.stringify(err)}`);
            setStatus("error");
            onError?.(err);
          },
        });
        
        console.log(`${FUNC}   - ✅ All listeners attached`);
        console.log(`${FUNC} ${'═'.repeat(65)}\n`);

      } catch (err) {
        console.error(`${FUNC} ❌ JITSI INIT FAILED:`);
        console.error(`${FUNC}   - Error Type: ${err.constructor.name}`);
        console.error(`${FUNC}   - Message: ${err.message}`);
        console.error(`${FUNC}   - Stack: ${err.stack}`);
        setStatus("error");
        onError?.(err);
      }
    };

    console.log(`${FUNC} [2/5] JITSI SDK CHECK:`);
    if (window.JitsiMeetExternalAPI) {
      console.log(`${FUNC}   - ✅ JitsiMeetExternalAPI already loaded`);
      init();
    } else {
      console.log(`${FUNC}   - ❌ JitsiMeetExternalAPI not in window`);
      console.log(`${FUNC}   - Checking for existing script...`);
      
      if (!document.getElementById(SCRIPT_ID)) {
        console.log(`${FUNC}   - No script found, creating new one`);
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = "https://8x8.vc/external_api.js";
        script.async = true;
        
        script.onload = () => {
          console.log(`${FUNC}   - ✅ Script loaded successfully`);
          console.log(`${FUNC}   - Jitsi SDK loaded: ${typeof window.JitsiMeetExternalAPI}`);
          init();
        };
        
        script.onerror = (err) => {
          console.error(`${FUNC}   - ❌ Script load failed:`);
          console.error(`${FUNC}   - Error: ${err?.message || 'Unknown error'}`);
          setStatus("error");
          onError?.(new Error("Failed to load Jitsi SDK from CDN"));
        };
        
        console.log(`${FUNC}   - Appending script to document.head`);
        document.head.appendChild(script);
      } else {
        console.log(`${FUNC}   - Script already exists, waiting for load...`);
      }
    }

    return () => {
      console.log(`${FUNC} 🧹 CLEANUP:`);
      if (apiRef.current) {
        console.log(`${FUNC}   - Disposing Jitsi instance`);
        apiRef.current.dispose();
        apiRef.current = null;
        console.log(`${FUNC}   - ✅ Instance disposed`);
      }
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
