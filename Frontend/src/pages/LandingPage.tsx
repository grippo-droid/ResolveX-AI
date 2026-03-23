import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Animated counter ───────────────────────────────────────────────────────
function useCounter(target: number, duration = 1600, start = false) {
  const [value, setValue] = useState(0);
  const safeTarget = Number.isFinite(target) ? Math.max(0, target) : 0;

  useEffect(() => {
    if (!start || safeTarget === 0) return;
    let startTime: number | null = null;
    let rafId: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * safeTarget));
      if (p < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [start, safeTarget, duration]);

  return value;
}

// ── Typewriter hook ────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 20, start = false) {
  const [displayed, setDisplayed] = useState("");
  const safeText = typeof text === "string" ? text : "";

  useEffect(() => {
    if (!start || !safeText) return;
    setDisplayed("");
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    let delayTimer: ReturnType<typeof setTimeout>;
    const tick = () => {
      i++;
      setDisplayed(safeText.slice(0, i));
      if (i < safeText.length) timer = setTimeout(tick, speed);
    };
    delayTimer = setTimeout(tick, 500);
    return () => { clearTimeout(delayTimer); clearTimeout(timer); };
  }, [start, safeText, speed]);

  return displayed;
}

// ── useInView ──────────────────────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    const current = ref.current;
    if (current) obs.observe(current);
    return () => { if (current) obs.unobserve(current); obs.disconnect(); };
  }, [threshold]);

  return { ref, inView };
}

// ── AnimatedTitle ──────────────────────────────────────────────────────────
function AnimatedTitle({ children, className }: { children: string; className?: string }) {
  const { ref, inView } = useInView(0.3);
  const safeChildren = typeof children === "string" ? children.trim() : "";
  const words = safeChildren ? safeChildren.split(" ").filter(Boolean) : [];
  if (!words.length) return null;

  return (
    <h2 ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          style={{
            display: "inline-block",
            marginRight: "0.28em",
            transform: inView ? "translateY(0)" : "translateY(60%)",
            opacity: inView ? 1 : 0,
            transition: `transform 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s, opacity 0.4s ease ${i * 0.08}s`,
          }}
        >
          {word}
        </span>
      ))}
    </h2>
  );
}

// ── Stat item ──────────────────────────────────────────────────────────────
interface StatItemProps { value: number; suffix: string; label: string; animate: boolean; }
function StatItem({ value, suffix, label, animate }: StatItemProps) {
  const count = useCounter(value, 1800, animate);
  return (
    <div className="flex flex-col items-center gap-1 px-10 py-5 border-r border-black/10 last:border-r-0">
      <span className="text-3xl font-extrabold tracking-tight text-[#0A0A0A]">
        {count}{suffix}
      </span>
      <span className="text-xs font-medium text-[#6B6B6B] whitespace-nowrap tracking-wide">
        {label}
      </span>
    </div>
  );
}

// ── Floating card ──────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  "auto-resolved": "#16a34a",
  escalated:       "#FF4D00",
  reviewing:       "#b45309",
};

interface FloatingCardProps {
  style: React.CSSProperties;
  label: string;
  status: "auto-resolved" | "escalated" | "reviewing";
  score: number;
}

function FloatingCard({ style, label, status, score }: FloatingCardProps) {
  const safeScore = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0));
  const color = STATUS_COLORS[status] ?? "#6B6B6B";
  return (
    <div
      className="absolute w-[200px] rounded-xl p-3.5 pointer-events-none border border-black/[0.08] backdrop-blur-md hidden lg:block"
      style={{ background: "rgba(255,255,255,0.72)", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", ...style }}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[11px] font-semibold text-[#0A0A0A] truncate max-w-[100px]" title={label}>
          {label}
        </span>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap"
          style={{ color, borderColor: color + "44", background: color + "14" }}
        >
          {status}
        </span>
      </div>
      <div className="h-1 rounded-full bg-black/[0.08] overflow-hidden mb-1.5">
        <div className="h-full rounded-full" style={{ width: `${safeScore}%`, background: color }} />
      </div>
      <div className="text-[10px] font-medium" style={{ color }}>
        Confidence {safeScore}%
      </div>
    </div>
  );
}

// ── Security badge ─────────────────────────────────────────────────────────
function SecurityBadge({ icon, text, visible, delay }: {
  icon: React.ReactNode; text: string; visible: boolean; delay: number;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 bg-white/60 border border-black/10 rounded-full px-3.5 py-1.5 hover:bg-white/90 hover:border-black/20 transition-colors duration-200"
      style={{
        opacity:   visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`,
      }}
    >
      <span className="text-[#FF4D00] flex items-center shrink-0" aria-hidden="true">{icon}</span>
      <span className="text-[13px] font-medium text-[#0A0A0A] whitespace-nowrap">{text}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]         = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [heroReady, setHeroReady]       = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const { ref: featureRef,  inView: featureInView  } = useInView(0.1);
  const { ref: ctaRef,      inView: ctaInView      } = useInView(0.3);
  const { ref: eyebrowRef,  inView: eyebrowInView  } = useInView(0.3);
  const { ref: securityRef, inView: securityInView } = useInView(0.3);

  const heroSubText =
    "ResolveX-AI classifies, scores, and resolves support tickets at enterprise scale — automatically when confident, safely escalating when not.";
  const typedSub = useTypewriter(heroSubText, 18, heroReady);

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") { setStatsVisible(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true); },
      { threshold: 0.4 }
    );
    const current = statsRef.current;
    if (current) obs.observe(current);
    return () => { if (current) obs.unobserve(current); obs.disconnect(); };
  }, []);

  const features = [
    {
      tag: "01 — Classify",
      title: "Intent recognition at scale",
      body: "Every incoming ticket is instantly parsed for intent, entities, and urgency. NLP pipelines trained on enterprise IT patterns extract structured signals in milliseconds.",
      icon: (<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="15" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="15" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/></svg>),
    },
    {
      tag: "02 — Score",
      title: "Confidence-gated decisions",
      body: "A multi-factor confidence engine weighs semantic similarity, historical resolution rates, and policy rules. The system only acts when it's sure — and escalates when it's not.",
      icon: (<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M14 8v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
    },
    {
      tag: "03 — Resolve",
      title: "Safe autonomous execution",
      body: "High-confidence tickets are resolved automatically with a full action log. Password resets, access grants, and known fixes — handled without a single human click.",
      icon: (<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M6 14l5.5 5.5L22 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    },
    {
      tag: "04 — Review",
      title: "Human-in-the-loop safety net",
      body: "Novel, ambiguous, or business-critical tickets are surfaced to engineers with AI-generated context, recommended solutions, and explainable reasoning — not just a score.",
      icon: (<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="14" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M6 22c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20 6l2 2-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    },
  ] as const;

  const securityBadges = [
    { text: "End-to-end encrypted",      icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="3" y="6.5" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 6.5V4.5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7.5" cy="10" r="1" fill="currentColor"/></svg>) },
    { text: "Full audit trail",           icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 4h9M3 7.5h6M3 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="11.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M13 12l1 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>) },
    { text: "Policy-governed automation", icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5L2 4v4c0 3 2.5 5.5 5.5 5.5S13 11 13 8V4L7.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5 7.5l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { text: "Zero blind automation",      icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 5v3l2 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>) },
    { text: "HITL on every edge case",    icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 3l1.5 1.5-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { text: "Explainable AI decisions",   icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 5.5V8M7.5 10v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>) },
  ] as const;

  return (
    <>
      {/*
        ── KEYFRAMES ONLY ──
        No @import here — that lives in index.css.
        Only animations & pseudo-elements that Tailwind can't do.
      */}
      <style>{`
        @keyframes gridShift  { from { background-position: 0 0; }       to { background-position: 48px 48px; } }
        @keyframes shimmer    { 0%,100%{ left:-80%; }                    50%{ left:120%; } }
        @keyframes pulseDot   { 0%,100%{ opacity:1; transform:scale(1);} 50%{ opacity:0.5; transform:scale(0.8); } }
        @keyframes wordReveal { from{ transform:translateY(80%) skewY(4deg); opacity:0; } to{ transform:translateY(0) skewY(0deg); opacity:1; } }
        @keyframes fadeUp     { from{ opacity:0; transform:translateY(20px); } to{ opacity:1; transform:translateY(0); } }
        @keyframes blink      { 0%,100%{ opacity:1; } 50%{ opacity:0; } }
        @keyframes float1     { 0%,100%{ transform:translateY(0) rotate(-2deg); }  50%{ transform:translateY(-14px) rotate(-1deg); } }
        @keyframes float2     { 0%,100%{ transform:translateY(0) rotate(2deg); }   50%{ transform:translateY(-10px) rotate(3deg); } }
        @keyframes float3     { 0%,100%{ transform:translateY(0) rotate(-1deg); }  50%{ transform:translateY(-18px) rotate(-2deg); } }
        @keyframes spinSlow   { from{ transform:rotate(0deg); } to{ transform:rotate(360deg); } }
        @keyframes slideDown  { from{ opacity:0; transform:translateY(-8px); } to{ opacity:1; transform:translateY(0); } }

        .anim-grid      { animation: gridShift 20s linear infinite; }
        .anim-pulse     { animation: pulseDot 2s ease infinite; }
        .anim-fadeup-0  { animation: fadeUp 0.5s ease both; }
        .anim-fadeup-1  { animation: fadeUp 0.6s 1s ease both; }
        .anim-fadeup-2  { animation: fadeUp 0.6s 1.1s ease both; }
        .anim-blink     { animation: blink 0.85s step-end infinite; }
        .anim-spin      { animation: spinSlow 18s linear infinite; }
        .anim-spin-rev  { animation: spinSlow 24s linear infinite reverse; }
        .anim-slide-down{ animation: slideDown 0.2s ease; }
        .word-up        { animation: wordReveal 0.7s cubic-bezier(0.22,1,0.36,1) both; }

        .hero-grid {
          background-image:
            linear-gradient(rgba(10,10,10,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,10,10,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        .badge-shimmer::after {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
          animation: shimmer 3.5s ease-in-out infinite 1.2s;
        }

        .accent-underline { position: relative; }
        .accent-underline::after {
          content: '';
          position: absolute; bottom: 2px; left: 0; right: 0;
          height: 3px; background: #FF4D00; border-radius: 2px;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.55s cubic-bezier(0.22,1,0.36,1) 0.6s;
        }
        .accent-underline.show-line::after { transform: scaleX(1); }

        .nav-link-hover { position: relative; }
        .nav-link-hover::after {
          content: '';
          position: absolute; bottom: -2px; left: 0; right: 0;
          height: 1.5px; background: #FF4D00; border-radius: 1px;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .nav-link-hover:hover::after { transform: scaleX(1); }

        .eyebrow-line::before {
          content: ''; display: block; width: 20px; height: 2px;
          background: #FF4D00; border-radius: 1px; flex-shrink: 0;
        }
        .cta-label-line::before {
          content: ''; display: block; width: 20px; height: 2px;
          background: rgba(255,77,0,0.9); border-radius: 1px; flex-shrink: 0;
        }
        .security-label-line::before {
          content: ''; display: block; width: 16px; height: 1.5px;
          background: #6B6B6B; border-radius: 1px; flex-shrink: 0;
        }

        /* Float animations for ticket cards */
        .float-card-1 { animation: float1 6s ease-in-out infinite; }
        .float-card-2 { animation: float2 7s ease-in-out infinite 1s; }
        .float-card-3 { animation: float3 8s ease-in-out infinite 2s; }
        .float-card-4 { animation: float1 9s ease-in-out infinite 0.5s; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        className={[
          "fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-12 transition-all duration-300",
          scrolled ? "bg-[#E9E9E9]/90 backdrop-blur-md shadow-[0_1px_0_rgba(10,10,10,0.08)]" : "",
        ].join(" ")}
      >
        <a href="#" className="flex items-center gap-2.5 no-underline text-[#0A0A0A]">
          <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 9h5M9 3v5M9 9l4.5 4.5" stroke="#E9E9E9" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="9" r="2" fill="#FF4D00"/>
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight">
            Resolve<span className="text-[#FF4D00]">X</span>
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-9 list-none m-0 p-0">
          <li>
            <a href="#how-it-works" className="nav-link-hover text-sm font-medium text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors duration-200 no-underline">
              How it works
            </a>
          </li>
          <li>
            <a href="#dashboard" onClick={() => navigate("/dashboard")} className="nav-link-hover text-sm font-medium text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors duration-200 no-underline">
              Dashboard
            </a>
          </li>
        </ul>

        <button
          onClick={() => navigate("/dashboard")}
          className="hidden md:flex items-center gap-1.5 bg-[#0A0A0A] text-[#E9E9E9] text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-[#1a1a1a] hover:-translate-y-px cursor-pointer border-none"
          aria-label="Open dashboard"
        >
          Open dashboard
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          className="md:hidden flex flex-col gap-1.5 bg-transparent border-none cursor-pointer p-1"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span className={`block w-5 h-0.5 bg-[#0A0A0A] rounded transition-transform duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[#0A0A0A] rounded transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[#0A0A0A] rounded transition-transform duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="anim-slide-down md:hidden fixed top-16 left-0 right-0 z-40 bg-[#E9E9E9]/97 backdrop-blur-xl flex flex-col gap-5 px-8 pt-6 pb-8 border-b border-black/10"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="no-underline text-[#0A0A0A] text-lg font-medium">How it works</a>
          <a href="#dashboard"    onClick={() => setMenuOpen(false)} className="no-underline text-[#0A0A0A] text-lg font-medium">Dashboard</a>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-fit flex items-center gap-1.5 bg-[#0A0A0A] text-[#E9E9E9] text-sm font-semibold px-4 py-2.5 rounded-lg border-none cursor-pointer"
          >
            Open dashboard
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden"
        aria-label="Hero"
      >
        {/* Dot grid */}
        <div className="hero-grid anim-grid absolute inset-0" aria-hidden="true" />

        {/* Floating ticket cards */}
        <FloatingCard label="VPN not connecting"        status="auto-resolved" score={92} style={{ left: "6%",  top: "28%",    opacity: 0.85 }} />
        <FloatingCard label="Access request: Prod DB"   status="escalated"     score={38} style={{ right: "5%", top: "22%",    opacity: 0.8  }} />
        <FloatingCard label="Password reset — Sarah K." status="auto-resolved" score={97} style={{ left: "4%",  bottom: "22%", opacity: 0.7  }} />
        <FloatingCard label="Outlook sync failing"      status="reviewing"     score={61} style={{ right: "6%", bottom: "26%", opacity: 0.75 }} />

        {/* Badge */}
        <div
          className="badge-shimmer anim-fadeup-0 relative overflow-hidden inline-flex items-center gap-2 bg-[#FF4D00]/10 border border-[#FF4D00]/20 text-[#FF4D00] text-xs font-semibold tracking-widest uppercase px-3.5 py-1.5 rounded-full mb-7"
          role="status"
        >
          <span className="anim-pulse w-1.5 h-1.5 rounded-full bg-[#FF4D00] shrink-0" aria-hidden="true" />
          Confidence-Based AI · Enterprise HITL
        </div>

        {/* Title */}
        <h1 className="relative z-10 font-extrabold leading-[1.05] tracking-tight max-w-[900px]"
          style={{ fontSize: "clamp(42px, 7vw, 88px)", letterSpacing: "-2.5px" }}>
          {["IT", "support,"].map((word, i) => (
            <span
              key={`r0-${i}`}
              className={`inline-block mr-[0.22em] ${heroReady ? "word-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {word}
            </span>
          ))}
          <br />
          <span
            className={[
              "accent-underline text-[#FF4D00] inline-block mr-[0.22em]",
              heroReady ? "word-up show-line" : "opacity-0",
            ].join(" ")}
            style={{ animationDelay: "0.18s" }}
          >
            intelligently
          </span>
          <br />
          <span
            className={`inline-block ${heroReady ? "word-up" : "opacity-0"}`}
            style={{ animationDelay: "0.28s" }}
          >
            automated.
          </span>
        </h1>

        {/* Typewriter subtitle */}
        <p
          className="relative z-10 font-normal text-[#6B6B6B] max-w-[540px] leading-relaxed mt-6"
          style={{ fontSize: "clamp(15px, 2vw, 18px)", minHeight: "3.4em" }}
          aria-live="polite"
        >
          {typedSub}
          {typedSub.length < heroSubText.length && (
            <span className="anim-blink inline-block w-0.5 h-[1.05em] bg-[#FF4D00] ml-0.5 align-text-bottom rounded-sm" aria-hidden="true" />
          )}
        </p>

        {/* CTA */}
        <div className="anim-fadeup-1 relative z-10 flex items-center justify-center mt-10">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2.5 bg-[#0A0A0A] text-[#E9E9E9] text-base font-bold px-8 py-4 rounded-xl border-none cursor-pointer transition-all duration-200 hover:bg-[#111] hover:-translate-y-0.5 hover:shadow-xl"
            aria-label="Open the ResolveX dashboard"
          >
            Open dashboard
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Stats strip */}
        <div
          ref={statsRef}
          className="anim-fadeup-2 relative z-10 flex flex-wrap mt-16 border border-black/10 rounded-2xl bg-white/55 backdrop-blur-sm overflow-hidden"
          aria-label="Key metrics"
        >
          <StatItem value={94}  suffix="%" label="Auto-resolution rate" animate={statsVisible} />
          <StatItem value={3}   suffix="s"  label="Avg. decision time"   animate={statsVisible} />
          <StatItem value={100} suffix="%" label="Auditable decisions"   animate={statsVisible} />
          <StatItem value={60}  suffix="%" label="SLA breach reduction"  animate={statsVisible} />
        </div>
      </section>


      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" aria-label="How it works">
        <div className="max-w-[1200px] mx-auto px-12 py-24">

          <div className="mb-16">
            <div ref={eyebrowRef} className="eyebrow-line flex items-center gap-2 text-[11px] font-bold tracking-[1.4px] uppercase text-[#FF4D00] mb-4">
              <span
                className="inline-block"
                style={{
                  transform:  eyebrowInView ? "translateX(0)" : "translateX(-10px)",
                  opacity:    eyebrowInView ? 1 : 0,
                  transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease",
                }}
              >
                How it works
              </span>
            </div>

            <AnimatedTitle className="font-extrabold leading-tight max-w-[560px]"
              style={{ fontSize: "clamp(30px, 4vw, 48px)", letterSpacing: "-1.2px" } as React.CSSProperties}>
              Four stages. One intelligent pipeline.
            </AnimatedTitle>

            <p
              className="text-base text-[#6B6B6B] leading-relaxed max-w-[480px] mt-3.5"
              style={{
                opacity:    eyebrowInView ? 1 : 0,
                transform:  eyebrowInView ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.6s 0.4s ease, transform 0.6s 0.4s ease",
              }}
            >
              Every ticket flows through a structured decision chain — from raw text
              to resolved action — with safety checkpoints at every step.
            </p>
          </div>

          {/* Feature grid */}
          <div
            ref={featureRef}
            className="grid grid-cols-1 md:grid-cols-2 gap-0.5 border border-black/10 rounded-2xl overflow-hidden bg-black/10"
            role="list"
          >
            {features.map((f, i) => (
              <div
                key={f.tag}
                role="listitem"
                className="bg-white/55 p-10 flex flex-col gap-5 group hover:bg-white/80"
                style={{
                  opacity:    featureInView ? 1 : 0,
                  transform:  featureInView ? "translateY(0)" : "translateY(28px)",
                  transition: `background 0.25s, opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s`,
                }}
              >
                <div className="w-[52px] h-[52px] border border-black/10 rounded-xl bg-[#E9E9E9] flex items-center justify-center text-[#0A0A0A] transition-all duration-200 group-hover:border-[#FF4D00] group-hover:text-[#FF4D00] group-hover:bg-[#FF4D00]/10 group-hover:-rotate-[4deg] group-hover:scale-105">
                  {f.icon}
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#6B6B6B]">{f.tag}</div>
                  <div className="text-xl font-bold text-[#0A0A0A] leading-tight mt-1.5" style={{ letterSpacing: "-0.4px" }}>{f.title}</div>
                </div>
                <p className="text-sm text-[#6B6B6B] leading-[1.75] flex-1">{f.body}</p>
                <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#FF4D00] opacity-0 -translate-x-1.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" aria-hidden="true">
                  Learn more
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="px-12 pb-24">
        <div
          ref={ctaRef}
          className="max-w-[1200px] mx-auto bg-[#0A0A0A] rounded-3xl px-16 py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-12 relative overflow-hidden"
          style={{
            opacity:    ctaInView ? 1 : 0,
            transform:  ctaInView ? "translateY(0)" : "translateY(32px)",
            transition: "opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {/* Decorative rings */}
          <div className="anim-spin absolute -right-15 -top-15 w-80 h-80 rounded-full border-[60px] border-[#FF4D00]/10 pointer-events-none" aria-hidden="true" />
          <div className="anim-spin-rev absolute left-[40%] -bottom-20 w-48 h-48 rounded-full border-[40px] border-[#FF4D00]/8 pointer-events-none" aria-hidden="true" />

          <div className="relative z-10">
            <div className="cta-label-line flex items-center gap-2 text-[11px] font-bold tracking-[1.4px] uppercase text-[#FF4D00]/90 mb-4">
              Ready to automate
            </div>
            <h2
              className="font-extrabold text-[#E9E9E9] leading-tight max-w-[440px]"
              style={{ fontSize: "clamp(28px, 3.5vw, 42px)", letterSpacing: "-1.2px" }}
            >
              Stop resolving tickets.<br />
              Start <span className="text-[#FF4D00]">automating</span> them.
            </h2>
          </div>

          <div className="relative z-10 flex flex-col gap-4 items-start shrink-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 bg-[#FF4D00] text-white text-base font-bold px-7 py-4 rounded-xl border-none cursor-pointer whitespace-nowrap transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl"
              aria-label="Open the ResolveX dashboard"
            >
              Open the dashboard
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-1.5 text-sm text-[#E9E9E9]/40">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <rect x="1.5" y="1.5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 6.5l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              No login required · Fully auditable
            </div>
          </div>
        </div>
      </div>
    </>
  );
}