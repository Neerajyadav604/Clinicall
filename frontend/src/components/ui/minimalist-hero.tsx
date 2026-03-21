import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────
   CHAT CONVERSATIONS
───────────────────────────────────────────────────────────────── */
const CONVOS = [
  [
    { role: 'agent' as const, text: "Hi! I'd like to book an appointment with a cardiologist." },
    { role: 'user' as const,  text: 'Sure! When works best for you?' },
    { role: 'agent' as const, text: 'Tomorrow at 10 AM, or Friday at 3 PM?' },
    { role: 'user' as const,  text: 'Friday at 3 PM please.' },
    { role: 'agent' as const, text: 'Booked! Dr. Kavya Sharma — Friday, 3:00 PM ✓' },
  ],
  [
    { role: 'agent' as const, text: 'Your appointment with Dr. Arjit is confirmed.' },
    { role: 'user' as const,  text: 'Can I view my prescription?' },
    { role: 'agent' as const, text: 'Opening your clinical records now...' },
    { role: 'user' as const,  text: 'Thank you so much!' },
    { role: 'agent' as const, text: 'Prescription sent to your email. Stay well 💊' },
  ],
  [
    { role: 'agent' as const, text: 'Dr. Rahul has approved your consultation.' },
    { role: 'user' as const,  text: 'How do I join the session?' },
    { role: 'agent' as const, text: "Click 'Live Consultation' after payment." },
    { role: 'user' as const,  text: 'Payment done!' },
    { role: 'agent' as const, text: 'Session is live — connecting you now 🟢' },
  ],
] as const;

/* ─────────────────────────────────────────────────────────────────
   DEFAULT SCENES — replace src with real Pexels .mp4 URLs
───────────────────────────────────────────────────────────────── */
const DEFAULT_SCENES = [
  { label: 'Patient Booking',     src: '' },
  { label: 'Doctor Consultation', src: '' },
  { label: 'Clinical Records',    src: '' },
];

/* ─────────────────────────────────────────────────────────────────
   TYPE DEFINITIONS
───────────────────────────────────────────────────────────────── */
interface Message {
  role: 'agent' | 'user';
  text: string;
}

interface Scene {
  label: string;
  src: string;
}

/* ─────────────────────────────────────────────────────────────────
   CHAT WIDGET
───────────────────────────────────────────────────────────────── */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping]     = useState(false);
  const convRef                 = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      while (!cancelled) {
        const conv = CONVOS[convRef.current % CONVOS.length];
        setMessages([]);
        for (const msg of conv) {
          if (cancelled) return;
          if (msg.role === 'agent') { setTyping(true); await wait(980); setTyping(false); }
          else await wait(520);
          setMessages((prev) => {
            const next = [...prev, msg];
            return next.length > 4 ? next.slice(next.length - 4) : next;
          });
          await wait(680);
        }
        await wait(2600);
        convRef.current++;
      }
    }
    const t = setTimeout(run, 900);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      bottom: 44,
      left: 56,
      zIndex: 30,
      width: 360,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 13, padding: '0 2px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg,#1a56a4,#0a8a6a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>AM</div>
        <div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 600, margin: 0 }}>
            AppointMed Assistant
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
            Online · Instant replies
          </p>
        </div>
        <span style={{
          width: 9, height: 9, borderRadius: '50%', background: '#22c55e',
          marginLeft: 'auto', flexShrink: 0,
          boxShadow: '0 0 0 3px rgba(34,197,94,0.22)',
          animation: 'chatPulse 2s infinite',
        }} />
      </div>

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={`${convRef.current}-${i}`}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{
                maxWidth: '88%',
                padding: '12px 16px',
                fontSize: 14,
                lineHeight: 1.55,
                borderRadius: msg.role === 'agent' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                background: msg.role === 'agent' ? 'rgba(255,255,255,0.13)' : '#fff',
                color: msg.role === 'agent' ? 'rgba(255,255,255,0.92)' : '#0c1929',
                border: msg.role === 'agent' ? '0.5px solid rgba(255,255,255,0.18)' : 'none',
                backdropFilter: msg.role === 'agent' ? 'blur(12px)' : 'none',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginLeft: msg.role === 'user' ? 'auto' : 0,
              }}
            >
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {typing && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.11)',
              borderRadius: '16px 16px 16px 4px',
              border: '0.5px solid rgba(255,255,255,0.15)',
              width: 'fit-content',
              backdropFilter: 'blur(12px)',
            }}
          >
            {[0, 0.18, 0.36].map((delay, i) => (
              <span key={i} style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'rgba(255,255,255,0.55)',
                display: 'inline-block',
                animation: `typingBounce 1.2s ${delay}s ease-in-out infinite`,
              }} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   VIDEO BACKGROUND
───────────────────────────────────────────────────────────────── */
function VideoBg({ scenes, currentIdx }: { scenes: Scene[]; currentIdx: number }) {
  const FALLBACKS = [
    'linear-gradient(135deg,#0c1929 0%,#0f2d4a 50%,#0a3d62 100%)',
    'linear-gradient(135deg,#0d2137 0%,#0a3d2e 50%,#0b4d3a 100%)',
    'linear-gradient(135deg,#1a1030 0%,#0f1e4a 50%,#0c2960 100%)',
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {scenes.map((scene: Scene, i: number) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          opacity: i === currentIdx ? 1 : 0,
          transition: 'opacity 1.4s ease',
          background: FALLBACKS[i % FALLBACKS.length],
        }}>
          {scene.src && (
            <video autoPlay muted loop playsInline preload="auto"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}>
              <source src={scene.src} type="video/mp4" />
            </video>
          )}
        </div>
      ))}

      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(to bottom,rgba(8,16,32,0.70) 0%,rgba(8,16,32,0.48) 50%,rgba(8,16,32,0.82) 100%)',
      }} />

      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),
          linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)
        `,
        backgroundSize: '64px 64px',
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export function MinimalistHero({
  className   = '',
  videoScenes = DEFAULT_SCENES,
}) {
  const [sceneIdx, setSceneIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setSceneIdx((p) => (p + 1) % videoScenes.length),
      5000
    );
    return () => clearInterval(id);
  }, [videoScenes.length]);

  return (
    <>
      <style>{`
        @keyframes chatPulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.4;transform:scale(0.8)}
        }
        @keyframes typingBounce {
          0%,60%,100%{transform:translateY(0);opacity:0.4}
          30%{transform:translateY(-6px);opacity:1}
        }
        .mh-scene-dot{
          border:none;cursor:pointer;height:6px;border-radius:3px;
          background:rgba(255,255,255,0.28);transition:all 0.4s ease;padding:0;
        }
        .mh-scene-dot.active{background:#fff;}
        @media(max-width:480px){
          .mh-chat-wrap{left:16px!important;width:calc(100vw - 32px)!important;bottom:24px!important;}
        }
      `}</style>

      <div
        className={className}
        style={{
          position: 'relative',
          minHeight: '100vh',
          width: '100%',
          overflow: 'hidden',
          background: '#0c1929',
        }}
      >
        {/* ── VIDEO BACKGROUND ── */}
        <VideoBg scenes={videoScenes} currentIdx={sceneIdx} />

        {/* ── SCENE DOT INDICATORS — bottom center ── */}
        <div style={{
          position: 'absolute',
          bottom: 52,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          gap: 8,
        }}>
          {videoScenes.map((_, i) => (
            <button
              key={i}
              className={`mh-scene-dot${i === sceneIdx ? ' active' : ''}`}
              style={{ width: i === sceneIdx ? 28 : 6 }}
              onClick={() => setSceneIdx(i)}
              aria-label={`Scene ${i + 1}`}
            />
          ))}
        </div>

        {/* ── SCENE LABEL — bottom center above dots ── */}
        <div style={{
          position: 'absolute',
          bottom: 72,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.32)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {videoScenes[sceneIdx]?.label}
        </div>

        {/* ── CHAT WIDGET ── */}
        <div className="mh-chat-wrap" style={{
          position: 'absolute',
          bottom: 44,
          left: 56,
          zIndex: 30,
        }}>
          <ChatWidget />
        </div>
      </div>
    </>
  );
}

export default MinimalistHero;