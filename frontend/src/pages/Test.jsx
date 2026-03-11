import { useState, useEffect, useRef } from "react";
import UnicornScene from "unicornstudio-react";

// ── Animated Counter ──────────────────────────────────────────────
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const step = Math.ceil(target / 60);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(start);
          }, 24);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Feature Card ──────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div
      className="group relative p-8 rounded-2xl border border-slate-200 bg-white hover:border-teal-400 hover:shadow-2xl transition-all duration-500 cursor-default overflow-hidden"
      style={{ animationDelay: delay }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center mb-5 group-hover:bg-teal-100 transition-colors duration-300 text-2xl">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{title}</h3>
        <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-teal-400 to-cyan-400 group-hover:w-full transition-all duration-500" />
    </div>
  );
}

// ── Testimonial Card ──────────────────────────────────────────────
function TestimonialCard({ name, role, avatar, text, rating }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-400">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <span key={i} className="text-amber-400 text-sm">★</span>
        ))}
      </div>
      <p className="text-slate-600 leading-relaxed mb-6 text-sm italic">"{text}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
          {avatar}
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">{name}</p>
          <p className="text-slate-400 text-xs">{role}</p>
        </div>
      </div>
    </div>
  );
}

// ── Nav Link ──────────────────────────────────────────────────────
function NavLink({ children }) {
  return (
    <a href="#" className="text-slate-600 hover:text-teal-600 text-sm font-medium transition-colors duration-200 relative group">
      {children}
      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-teal-500 group-hover:w-full transition-all duration-300" />
    </a>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────
export default function MediAILanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const features = [
    {
      icon: "🧠",
      title: "AI Doctor Matching",
      desc: "Our neural engine analyzes your symptoms, history, and preferences to recommend the most compatible specialist in seconds.",
      delay: "0ms",
    },
    {
      icon: "📅",
      title: "Instant Scheduling",
      desc: "Book, reschedule, or cancel appointments 24/7. Real-time calendar sync ensures zero double-bookings across 500+ clinics.",
      delay: "100ms",
    },
    {
      icon: "🔔",
      title: "Smart Reminders",
      desc: "Receive personalized SMS, email, and push reminders. Automated follow-up care plans keep you on track post-visit.",
      delay: "200ms",
    },
    {
      icon: "🔒",
      title: "HIPAA-Compliant Security",
      desc: "End-to-end encryption and zero-knowledge storage protect every piece of your health data, always.",
      delay: "300ms",
    },
    {
      icon: "💬",
      title: "Pre-visit AI Chat",
      desc: "Describe your concerns to our AI triage assistant before your appointment — arrive prepared, save consultation time.",
      delay: "400ms",
    },
    {
      icon: "📊",
      title: "Health Dashboard",
      desc: "Track appointments, prescriptions, and vitals in one unified dashboard with exportable health reports.",
      delay: "500ms",
    },
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Verified Patient · Cardiologist Visit",
      avatar: "SM",
      text: "I was matched with the perfect cardiologist within minutes. The AI understood my complex history better than I explained it. Truly remarkable experience.",
      rating: 5,
    },
    {
      name: "James R.",
      role: "Verified Patient · Dermatology",
      avatar: "JR",
      text: "Booking used to take me 30 minutes on the phone. MediAI had me confirmed in under 2 minutes. The reminders kept me perfectly on track too.",
      rating: 5,
    },
    {
      name: "Priya K.",
      role: "Verified Patient · General Practitioner",
      avatar: "PK",
      text: "As someone with health anxiety, the pre-visit AI chat was a game changer. I arrived calm, informed, and my doctor was already aware of my concerns.",
      rating: 5,
    },
    {
      name: "David L.",
      role: "Verified Patient · Pediatrics",
      avatar: "DL",
      text: "Managing appointments for three kids was chaos. Now it's effortless. MediAI is the only health app I actually keep on my home screen.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Instrument Serif', serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20,184,166,0.4); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 14px rgba(20,184,166,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20,184,166,0); }
        }

        .animate-fade-up   { animation: fadeUp 0.7s ease forwards; }
        .animate-fade-in   { animation: fadeIn 0.9s ease forwards; }
        .animate-pulse-ring { animation: pulse-ring 2.5s ease-in-out infinite; }

        .hero-glass {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .gradient-text {
          background: linear-gradient(135deg, #0d9488 0%, #06b6d4 60%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .btn-primary {
          background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%);
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(13,148,136,0.35);
          filter: brightness(1.08);
        }
        .btn-primary:active {
          transform: translateY(0px);
        }
        .unicorn-wrapper {
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center animate-pulse-ring">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">
              Medi<span className="text-teal-500">AI</span>
            </span>
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink>Features</NavLink>
            <NavLink>How it Works</NavLink>
            <NavLink>Pricing</NavLink>
            <NavLink>Blog</NavLink>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">
              Sign In
            </a>
            <a
              href="#"
              className="btn-primary text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-md"
            >
              Get Started
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-teal-600 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-4 animate-fade-in">
            {["Features", "How it Works", "Pricing", "Blog"].map(l => (
              <a key={l} href="#" className="text-slate-700 hover:text-teal-600 font-medium text-sm transition-colors">{l}</a>
            ))}
            <a href="#" className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl text-center">
              Book Appointment
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
        {/* UnicornScene as full background */}
        <div className="absolute inset-0 w-full h-full unicorn-wrapper animate-fade-in">
          <UnicornScene
            projectId="1Yq1Yakv3cmwt5RL7wxQ"
            width="1440px"
            height="900px"
            scale={1}
            dpi={1.5}
            sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.3/dist/unicornStudio.umd.js"
          />
        </div>

        {/* Overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-900/20 to-slate-900/60" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-medium mb-8 animate-fade-up"
            style={{ animationDelay: "100ms" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Now available in 40+ cities · 500+ verified doctors
          </div>

          <h1
            className="font-display text-5xl md:text-7xl text-white leading-[1.1] mb-6 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            Healthcare,{" "}
            <span className="italic text-teal-300">reimagined</span>
            <br />for the digital age.
          </h1>

          <p
            className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-up"
            style={{ animationDelay: "350ms" }}
          >
            MediAI uses advanced intelligence to match you with the right doctor,
            schedule your visit instantly, and keep your health journey on track — all from one place.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up"
            style={{ animationDelay: "500ms" }}
          >
            <a
              href="#"
              className="btn-primary text-white font-semibold px-8 py-4 rounded-2xl text-base shadow-2xl flex items-center gap-2.5 group"
            >
              <span>Book Appointment</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="#"
              className="flex items-center gap-2.5 text-white/90 hover:text-white text-sm font-medium transition-colors px-6 py-4 rounded-2xl border border-white/20 hover:border-white/40 backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Demo
            </a>
          </div>

          {/* Trust badges */}
          <div
            className="mt-14 flex flex-wrap items-center justify-center gap-6 animate-fade-up"
            style={{ animationDelay: "650ms" }}
          >
            {[
              { label: "Patients Served", value: 120000, suffix: "+" },
              { label: "Verified Doctors", value: 500, suffix: "+" },
              { label: "Cities Covered", value: 40, suffix: "+" },
              { label: "Avg Wait Time", value: 2, suffix: " min" },
            ].map(({ label, value, suffix }) => (
              <div key={label} className="text-center px-5">
                <div className="text-2xl font-bold text-white">
                  <Counter target={value} suffix={suffix} />
                </div>
                <div className="text-white/50 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: "1.2s" }}>
          <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-teal-600 text-xs font-semibold tracking-widest uppercase mb-4">
              Why MediAI
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 leading-tight mb-4">
              Every feature built around{" "}
              <span className="italic gradient-text">your wellbeing</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              We obsessed over every detail so your healthcare experience is frictionless, smart, and deeply personal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-teal-600 text-xs font-semibold tracking-widest uppercase mb-4">
              Simple Process
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 leading-tight">
              From search to{" "}
              <span className="italic gradient-text">seen</span>
              {" "}in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Describe Your Needs", desc: "Tell our AI about your symptoms, preferred location, and schedule. No forms, just conversation.", icon: "💬" },
              { step: "02", title: "Get Matched", desc: "Our engine surfaces the best-fit doctors with real-time availability and verified reviews.", icon: "🎯" },
              { step: "03", title: "Book & Relax", desc: "Confirm your appointment in one tap. We handle reminders, paperwork prep, and follow-ups.", icon: "✅" },
            ].map(({ step, title, desc, icon }, i) => (
              <div key={step} className="relative text-center group">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-slate-200" />
                )}
                <div className="relative inline-flex w-20 h-20 rounded-2xl bg-teal-50 items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300">
                  {icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-teal-600 text-xs font-semibold tracking-widest uppercase mb-4">
              Patient Stories
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 leading-tight">
              Trusted by thousands,{" "}
              <span className="italic gradient-text">loved by all</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>

          {/* App store badges */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#" className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors duration-200">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div>
                <div className="text-xs text-slate-400 leading-none">Download on the</div>
                <div className="text-sm font-semibold leading-tight">App Store</div>
              </div>
            </a>
            <a href="#" className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors duration-200">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.16.64.2.98.1l13.12-7.58-2.83-2.83zM.5 1.4C.19 1.72 0 2.2 0 2.82v18.36c0 .62.19 1.1.5 1.42l.08.07 10.28-10.28v-.24L.58 1.32zM20.27 10.43l-2.75-1.59-3.15 3.15 3.15 3.15 2.77-1.6c.79-.46.79-1.2-.02-1.67zM4.16.24L17.28 7.82l-2.83 2.83z"/>
              </svg>
              <div>
                <div className="text-xs text-slate-400 leading-none">Get it on</div>
                <div className="text-sm font-semibold leading-tight">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4 leading-tight">
            Your health deserves{" "}
            <span className="italic">better</span>
          </h2>
          <p className="text-white/80 text-lg mb-10">
            Join over 120,000 patients who've taken control of their healthcare journey with MediAI.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2.5 bg-white text-teal-700 font-bold px-10 py-4 rounded-2xl text-base hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group"
          >
            Book Your First Appointment — Free
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <p className="text-white/50 text-xs mt-4">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">M</span>
                </div>
                <span className="font-semibold text-white tracking-tight">
                  Medi<span className="text-teal-400">AI</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Intelligent healthcare scheduling for the modern patient.
              </p>
            </div>

            {/* Links */}
            {[
              {
                heading: "Company",
                links: ["About Us", "Careers", "Press", "Blog"],
              },
              {
                heading: "Support",
                links: ["Contact", "Help Center", "Status", "Feedback"],
              },
              {
                heading: "Legal",
                links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "HIPAA"],
              },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <h4 className="text-white text-sm font-semibold mb-4 tracking-wide">{heading}</h4>
                <ul className="space-y-2.5">
                  {links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm hover:text-teal-400 transition-colors duration-200">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} MediAI Inc. All rights reserved. Not a substitute for professional medical advice.
            </p>
            <div className="flex items-center gap-5">
              {/* Twitter / X */}
              <a href="#" className="hover:text-teal-400 transition-colors duration-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" className="hover:text-teal-400 transition-colors duration-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="hover:text-teal-400 transition-colors duration-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}