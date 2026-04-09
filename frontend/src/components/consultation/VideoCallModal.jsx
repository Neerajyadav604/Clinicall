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
  const joinedRef    = useRef(false); // Track if user already joined
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
    console.log(`${FUNC} [1/6] DATA VALIDATION:`);
    console.log(`${FUNC}   - Domain: ${jitsiData.domain}`);
    console.log(`${FUNC}   - Room: ${jitsiData.fullRoom}`);
    console.log(`${FUNC}   - Token Length: ${jitsiData.token?.length || 0}`);
    console.log(`${FUNC}   - Display Name: ${displayName}`);

    const SCRIPT_ID = "jaas-external-api";

    const init = () => {
      console.log(`${FUNC} [3/6] CONTAINER & API CHECK:`);
      console.log(`${FUNC}   - Container Found: ${containerRef.current ? '✅ YES' : '❌ NO'}`);
      console.log(`${FUNC}   - Container HTML:`, containerRef.current?.id);
      console.log(`${FUNC}   - API Already Init: ${apiRef.current ? '⚠️ YES (skipping)' : '❌ NO'}`);
      
      if (!containerRef.current) {
        console.error(`${FUNC} ❌ NO CONTAINER - Cannot initialize Jitsi`);
        return;
      }
      
      if (apiRef.current) {
        console.warn(`${FUNC}   - API already exists, skipping init`);
        return;
      }

      try {
        console.log(`${FUNC} [4/6] JITSI SDK AVAILABILITY CHECK:`);
        if (!window.JitsiMeetExternalAPI) {
          console.error(`${FUNC} ❌ JitsiMeetExternalAPI not available on window`);
          setStatus("error");
          onError?.(new Error("Jitsi SDK not loaded"));
          return;
        }
        console.log(`${FUNC}   - ✅ JitsiMeetExternalAPI available`);

        console.log(`${FUNC} [5/6] JITSI INSTANCE CREATION:`);
        console.log(`${FUNC}   - Calling: new window.JitsiMeetExternalAPI()`);
        console.log(`${FUNC}     Domain: ${jitsiData.domain}`);
        console.log(`${FUNC}     Room: ${jitsiData.fullRoom}`);
        
        apiRef.current = new window.JitsiMeetExternalAPI(jitsiData.domain, {
          roomName: jitsiData.fullRoom,
          jwt:      jitsiData.token,
          parentNode: containerRef.current,
          width:  "100%",
          height: "100%",
          userInfo: {
            displayName: displayName,
          },
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
            logLevel:                'debug', // 🔧 Enable debug logging
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

        console.log(`${FUNC}   - ✅ Instance created successfully`);

        console.log(`${FUNC} [6/6] EVENT LISTENER REGISTRATION:`);
        
        // ⚠️ CRITICAL: Attach listeners IMMEDIATELY after instance creation
        // videoConferenceJoined might fire before we attach listeners
        apiRef.current.addEventListeners({
          videoConferenceJoined: () => {
            if (joinedRef.current) {
              console.log(`${FUNC}   EVENT: videoConferenceJoined (already joined, ignoring duplicate)`);
              return;
            }
            joinedRef.current = true;
            console.log(`${FUNC}   EVENT: videoConferenceJoined ✅`);
            console.log(`${FUNC}   - User successfully joined the call`);
            setStatus("ready");
          },
          
          participantJoined: (id) => {
            console.log(`${FUNC}   EVENT: participantJoined`);
            console.log(`${FUNC}   - Participant ID: ${id}`);
          },
          
          readyToClose: () => {
            console.log(`${FUNC}   EVENT: readyToClose`);
            console.log(`${FUNC}   - User initiated hangup`);
            setStatus("loading");
            onLeave?.();
          },
          
          errorOccurred: (err) => {
            console.error(`${FUNC}   EVENT: errorOccurred ❌`);
            console.error(`${FUNC}   - Error Type: ${err?.constructor?.name || 'Unknown'}`);
            console.error(`${FUNC}   - Error: ${err?.message || err?.error || err?.errorCode || JSON.stringify(err)}`);
            console.error(`${FUNC}   - Full Error:`, err);
            setStatus("error");
            onError?.(err);
          },
          
          onConferenceLeft: () => {
            console.log(`${FUNC}   EVENT: onConferenceLeft`);
            joinedRef.current = false;
          },
        });
        
        console.log(`${FUNC}   - ✅ All listeners attached`);
        
        // 🔧 TIMEOUT: If videoConferenceJoined doesn't fire after 10s, show error
        const timeoutId = setTimeout(() => {
          if (!joinedRef.current && status === "loading") {
            console.error(`${FUNC} ⏱️  TIMEOUT: videoConferenceJoined took >10 seconds`);
            console.error(`${FUNC}   - Possible issues:`);
            console.error(`${FUNC}     1. Invalid JWT token`);
            console.error(`${FUNC}     2. Room name not matching expected format`);
            console.error(`${FUNC}     3. Network connectivity issue`);
            console.error(`${FUNC}     4. Jitsi server blocked/unreachable`);
            // Don't auto-fail, just log - Jitsi might still connect
          }
        }, 10000);
        
        console.log(`${FUNC} ${'═'.repeat(65)}\n`);
        
        return () => clearTimeout(timeoutId);

      } catch (err) {
        console.error(`${FUNC} ❌ JITSI INIT FAILED:`);
        console.error(`${FUNC}   - Error Type: ${err.constructor.name}`);
        console.error(`${FUNC}   - Message: ${err.message}`);
        console.error(`${FUNC}   - Stack: ${err.stack}`);
        console.error(`${FUNC}   - Full Error:`, err);
        setStatus("error");
        onError?.(err);
      }
    };

    console.log(`${FUNC} [2/6] JITSI SDK CHECK:`);
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
        script.crossOrigin = "anonymous"; // 🔧 Ensure CORS is allowed
        
        script.onload = () => {
          console.log(`${FUNC}   - ✅ Script loaded successfully`);
          console.log(`${FUNC}   - Jitsi SDK loaded: ${typeof window.JitsiMeetExternalAPI}`);
          
          if (!window.JitsiMeetExternalAPI) {
            console.error(`${FUNC}   - ❌ ERROR: Script loaded but JitsiMeetExternalAPI still not in window`);
            setStatus("error");
            onError?.(new Error("Jitsi SDK loaded but API not accessible"));
            return;
          }
          
          console.log(`${FUNC}   - Calling init()...`);
          init();
        };
        
        script.onerror = (err) => {
          console.error(`${FUNC}   - ❌ Script load failed:`);
          console.error(`${FUNC}   - Error: ${err?.message || 'Unknown error'}`);
          console.error(`${FUNC}   - Check: Is CDN (8x8.vc) accessible?`);
          setStatus("error");
          onError?.(new Error("Failed to load Jitsi SDK from CDN. Check internet connection."));
        };
        
        console.log(`${FUNC}   - Appending script to document.head`);
        document.head.appendChild(script);
      } else {
        console.log(`${FUNC}   - Script already exists, waiting for load...`);
        // Wait for SDK to be available
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.JitsiMeetExternalAPI) {
            console.log(`${FUNC}   - ✅ JitsiMeetExternalAPI now available (after ${attempts} checks)`);
            clearInterval(checkInterval);
            init();
          } else if (attempts > 100) {
            console.error(`${FUNC}   - ❌ JitsiMeetExternalAPI never became available`);
            clearInterval(checkInterval);
            setStatus("error");
            onError?.(new Error("Jitsi SDK failed to initialize"));
          }
        }, 100);
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

      {/* Jitsi iframe container — ALWAYS VISIBLE so Jitsi can render/show errors */}
      <div
        ref={containerRef}
        id="jitsi-container"
        style={{ 
          width: "100%", 
          height: "100%", 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#f3f4f6",
        }}
      />
      
      {/* Loading overlay — semi-transparent, doesn't block Jitsi */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-40 gap-3 pointer-events-none">
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "3px solid #dbeafe",
            borderTopColor: "#2563eb",
            animation: "vc-spin 0.8s linear infinite",
          }} />
          <p className="text-sm text-gray-600 font-medium">Connecting to secure call…</p>
          <p className="text-xs text-gray-500">Starting Jitsi Meet</p>
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-40 gap-3">
          <div className="bg-white border border-gray-300 rounded-xl p-8 flex flex-col items-center gap-3 shadow-lg">
            <span className="text-4xl">⚠️</span>
            <p className="text-gray-800 font-semibold">Could not connect to video call</p>
            <p className="text-sm text-gray-600 text-center max-w-xs">
              Check your internet connection, camera/microphone permissions, and ensure Jitsi server is accessible.
            </p>
            <button
              onClick={onLeave}
              className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
