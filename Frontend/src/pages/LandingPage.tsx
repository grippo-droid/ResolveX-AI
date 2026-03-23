import { useEffect, useRef, useState } from "react";

// ── Animated counter ───────────────────────────────────────────────────────
function useCounter(target: number, duration = 1600, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

// ── Typewriter hook ────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 20, start = false) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!start) return;
    setDisplayed("");
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i < text.length) timer = setTimeout(tick, speed);
    };
    const delay = setTimeout(tick, 500);
    return () => { clearTimeout(delay); clearTimeout(timer); };
  }, [start, text, speed]);
  return displayed;
}

// ── useInView ──────────────────────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── AnimatedTitle ──────────────────────────────────────────────────────────
function AnimatedTitle({ children, className }: { children: string; className?: string }) {
  const { ref, inView } = useInView(0.3);
  const words = children.split(" ");
  return (
    <h2 ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
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
    <div className="stat-item">
      <span className="stat-number">{count}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// ── Floating ambient ticket card ───────────────────────────────────────────
function FloatingCard({
  style, label, status, score,
}: {
  style: React.CSSProperties;
  label: string;
  status: "auto-resolved" | "escalated" | "reviewing";
  score: number;
}) {
  const colors: Record<string, string> = {
    "auto-resolved": "#16a34a",
    escalated: "#FF4D00",
    reviewing: "#b45309",
  };
  return (
    <div className="float-card" style={style}>
      <div className="float-card-header">
        <span className="float-card-label">{label}</span>
        <span className="float-card-status" style={{ color: colors[status], borderColor: colors[status] + "44", background: colors[status] + "14" }}>
          {status}
        </span>
      </div>
      <div className="float-card-bar-wrap">
        <div className="float-card-bar" style={{ width: `${score}%`, background: colors[status] }} />
      </div>
      <div className="float-card-score" style={{ color: colors[status] }}>Confidence {score}%</div>
    </div>
  );
}

// ── Security badge ─────────────────────────────────────────────────────────
function SecurityBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="sec-badge">
      <span className="sec-badge-icon">{icon}</span>
      <span className="sec-badge-text">{text}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
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
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true); },
      { threshold: 0.4 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const features = [
    {
      tag: "01 — Classify",
      title: "Intent recognition at scale",
      body: "Every incoming ticket is instantly parsed for intent, entities, and urgency. NLP pipelines trained on enterprise IT patterns extract structured signals in milliseconds.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="15" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="15" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
        </svg>
      ),
    },
    {
      tag: "02 — Score",
      title: "Confidence-gated decisions",
      body: "A multi-factor confidence engine weighs semantic similarity, historical resolution rates, and policy rules. The system only acts when it's sure — and escalates when it's not.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M14 8v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      tag: "03 — Resolve",
      title: "Safe autonomous execution",
      body: "High-confidence tickets are resolved automatically with a full action log. Password resets, access grants, and known fixes — handled without a single human click.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M6 14l5.5 5.5L22 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      tag: "04 — Review",
      title: "Human-in-the-loop safety net",
      body: "Novel, ambiguous, or business-critical tickets are surfaced to engineers with AI-generated context, recommended solutions, and explainable reasoning — not just a score.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 22c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M20 6l2 2-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  const securityBadges = [
    {
      text: "End-to-end encrypted",
      icon: (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <rect x="3" y="6.5" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M5 6.5V4.5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <circle cx="7.5" cy="10" r="1" fill="currentColor"/>
        </svg>
      ),
    },
    {
      text: "Full audit trail",
      icon: (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M3 4h9M3 7.5h6M3 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <circle cx="11.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M13 12l1 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      text: "Policy-governed automation",
      icon: (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M7.5 1.5L2 4v4c0 3 2.5 5.5 5.5 5.5S13 11 13 8V4L7.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M5 7.5l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      text: "Zero blind automation",
      icon: (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M7.5 5v3l2 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      text: "HITL on every edge case",
      icon: (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M11 3l1.5 1.5-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      text: "Explainable AI decisions",
      icon: (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M7.5 5.5V8M7.5 10v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #E9E9E9;
          --fg: #0A0A0A;
          --accent: #FF4D00;
          --accent-dim: rgba(255,77,0,0.12);
          --muted: #6B6B6B;
          --border: rgba(10,10,10,0.10);
          --card-bg: rgba(255,255,255,0.55);
          --font: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        html { scroll-behavior: smooth; }
        body { background-color: var(--bg); font-family: var(--font); color: var(--fg); overflow-x: hidden; }

        /* ── NAVBAR ── */
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 48px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          transition: background 0.3s, box-shadow 0.3s;
        }
        .navbar.scrolled {
          background: rgba(233,233,233,0.88);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 var(--border);
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--fg); }
        .nav-logo-mark { width: 32px; height: 32px; background: var(--fg); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nav-logo-text { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; }
        .nav-logo-text span { color: var(--accent); }
        .nav-links { display: flex; align-items: center; gap: 36px; list-style: none; }
        .nav-links a {
          text-decoration: none; color: var(--muted); font-size: 14px; font-weight: 500;
          letter-spacing: 0.1px; transition: color 0.2s; position: relative;
        }
        .nav-links a::after {
          content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
          height: 1.5px; background: var(--accent); border-radius: 1px;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .nav-links a:hover { color: var(--fg); }
        .nav-links a:hover::after { transform: scaleX(1); }

        /* Nav dashboard button */
        .nav-dashboard-btn {
          background: var(--fg); color: var(--bg); border: none; cursor: pointer;
          font-family: var(--font); font-size: 13px; font-weight: 600;
          padding: 9px 18px; border-radius: 8px; letter-spacing: 0.1px;
          display: flex; align-items: center; gap: 7px;
          transition: background 0.2s, transform 0.15s;
        }
        .nav-dashboard-btn:hover { background: #1a1a1a; transform: translateY(-1px); }
        .nav-dashboard-btn svg { transition: transform 0.2s; }
        .nav-dashboard-btn:hover svg { transform: translateX(2px); }

        .hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; }
        .hamburger span { display: block; width: 22px; height: 2px; background: var(--fg); border-radius: 2px; transition: transform 0.25s, opacity 0.25s; }
        .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; }
        .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        .mobile-menu { display: none; position: fixed; top: 64px; left: 0; right: 0; background: rgba(233,233,233,0.97); backdrop-filter: blur(20px); padding: 24px 32px 32px; border-bottom: 1px solid var(--border); z-index: 99; flex-direction: column; gap: 20px; animation: slideDown 0.2s ease; }
        .mobile-menu.open { display: flex; }
        .mobile-menu a { text-decoration: none; color: var(--fg); font-size: 18px; font-weight: 500; }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);} }

        /* ── HERO ── */
        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 100px 24px 80px; position: relative; overflow: hidden; }
        .hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(10,10,10,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          animation: gridShift 20s linear infinite;
        }
        @keyframes gridShift { from{background-position:0 0;}to{background-position:48px 48px;} }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent-dim); border: 1px solid rgba(255,77,0,0.2);
          color: var(--accent); font-size: 12px; font-weight: 600;
          letter-spacing: 0.8px; text-transform: uppercase;
          padding: 6px 14px; border-radius: 100px; margin-bottom: 28px;
          position: relative; overflow: hidden;
          animation: fadeUp 0.5s ease both;
        }
        .hero-badge::after {
          content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
          animation: shimmer 3.5s ease-in-out infinite 1.2s;
        }
        @keyframes shimmer { 0%,100%{left:-80%;}50%{left:120%;} }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s ease infinite; flex-shrink: 0; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.5;transform:scale(0.8);} }

        .hero-title { font-size: clamp(42px,7vw,88px); font-weight: 800; line-height: 1.05; letter-spacing: -2.5px; max-width: 900px; position: relative; z-index: 1; }
        .hero-title-word { display: inline-block; margin-right: 0.22em; transform: translateY(80%) skewY(4deg); opacity: 0; }
        .hero-title-word.up { animation: wordReveal 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes wordReveal { from{transform:translateY(80%) skewY(4deg);opacity:0;}to{transform:translateY(0) skewY(0deg);opacity:1;} }
        .accent-word { color: var(--accent); position: relative; }
        .accent-word::after { content:''; position:absolute; bottom:2px; left:0; right:0; height:3px; background:var(--accent); border-radius:2px; transform:scaleX(0); transform-origin:left; transition:transform 0.55s cubic-bezier(0.22,1,0.36,1) 0.6s; }
        .accent-word.line-visible::after { transform: scaleX(1); }

        .hero-sub { font-size: clamp(15px,2vw,18px); font-weight: 400; color: var(--muted); max-width: 540px; line-height: 1.7; margin-top: 24px; position: relative; z-index: 1; min-height: 3.4em; }
        .cursor { display: inline-block; width: 2px; height: 1.05em; background: var(--accent); margin-left: 2px; vertical-align: text-bottom; border-radius: 1px; animation: blink 0.85s step-end infinite; }
        @keyframes blink { 0%,100%{opacity:1;}50%{opacity:0;} }

        /* Single hero CTA */
        .hero-actions { display: flex; align-items: center; justify-content: center; margin-top: 40px; animation: fadeUp 0.6s 1s ease both; position: relative; z-index: 1; }
        .btn-hero-primary {
          background: var(--fg); color: var(--bg); border: none; cursor: pointer;
          font-family: var(--font); font-size: 16px; font-weight: 700;
          padding: 16px 34px; border-radius: 12px;
          display: flex; align-items: center; gap: 10px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          letter-spacing: -0.2px;
        }
        .btn-hero-primary:hover { background: #111; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(10,10,10,0.2); }
        .btn-hero-primary svg { transition: transform 0.2s; }
        .btn-hero-primary:hover svg { transform: translateX(4px); }

        /* Stats */
        .hero-stats { display: flex; margin-top: 64px; position: relative; z-index: 1; border: 1px solid var(--border); border-radius: 14px; background: var(--card-bg); backdrop-filter: blur(8px); overflow: hidden; animation: fadeUp 0.6s 1.1s ease both; }
        .stat-item { padding: 20px 40px; display: flex; flex-direction: column; align-items: center; gap: 4px; border-right: 1px solid var(--border); }
        .stat-item:last-child { border-right: none; }
        .stat-number { font-size: 28px; font-weight: 800; letter-spacing: -1px; color: var(--fg); }
        .stat-label { font-size: 12px; font-weight: 500; color: var(--muted); letter-spacing: 0.2px; white-space: nowrap; }

        /* Floating cards */
        .float-card { position: absolute; background: rgba(255,255,255,0.72); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(10,10,10,0.08); border-radius: 12px; padding: 14px 16px; width: 200px; pointer-events: none; box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
        .float-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
        .float-card-label { font-size: 11px; font-weight: 600; color: var(--fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
        .float-card-status { font-size: 10px; font-weight: 600; letter-spacing: 0.3px; padding: 2px 7px; border-radius: 100px; border: 1px solid; white-space: nowrap; flex-shrink: 0; }
        .float-card-bar-wrap { height: 4px; background: rgba(10,10,10,0.08); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
        .float-card-bar { height: 100%; border-radius: 2px; }
        .float-card-score { font-size: 10px; font-weight: 500; }
        @keyframes float1 { 0%,100%{transform:translateY(0) rotate(-2deg);}50%{transform:translateY(-14px) rotate(-1deg);} }
        @keyframes float2 { 0%,100%{transform:translateY(0) rotate(2deg);}50%{transform:translateY(-10px) rotate(3deg);} }
        @keyframes float3 { 0%,100%{transform:translateY(0) rotate(-1deg);}50%{transform:translateY(-18px) rotate(-2deg);} }

        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }

        /* ── SECURITY STRIP ── */
        .security-section { padding: 0 48px 80px; }
        .security-inner {
          max-width: 1200px; margin: 0 auto;
          border: 1px solid var(--border); border-radius: 16px;
          padding: 32px 40px;
          background: rgba(255,255,255,0.35);
        }
        .security-label {
          font-size: 11px; font-weight: 700; letter-spacing: 1.4px;
          text-transform: uppercase; color: var(--muted);
          margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
        }
        .security-label::before { content: ''; display: block; width: 16px; height: 1.5px; background: var(--muted); border-radius: 1px; }
        .security-badges { display: flex; flex-wrap: wrap; gap: 12px; }
        .sec-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.6); border: 1px solid var(--border);
          border-radius: 100px; padding: 7px 14px;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.4s ease, transform 0.4s ease, background 0.2s, border-color 0.2s;
        }
        .sec-badge.visible { opacity: 1; transform: translateY(0); }
        .sec-badge:hover { background: rgba(255,255,255,0.9); border-color: rgba(10,10,10,0.2); }
        .sec-badge-icon { color: var(--accent); display: flex; align-items: center; flex-shrink: 0; }
        .sec-badge-text { font-size: 13px; font-weight: 500; color: var(--fg); white-space: nowrap; }

        /* ── FEATURES ── */
        .section { padding: 100px 48px; max-width: 1200px; margin: 0 auto; }
        .section-header { margin-bottom: 64px; }
        .section-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; }
        .section-eyebrow::before { content: ''; display: block; width: 20px; height: 2px; background: var(--accent); border-radius: 1px; }
        .eyebrow-text { display: inline-block; transform: translateX(-10px); opacity: 0; transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease; }
        .eyebrow-text.visible { transform: translateX(0); opacity: 1; }
        .section-title { font-size: clamp(30px,4vw,48px); font-weight: 800; letter-spacing: -1.2px; line-height: 1.1; max-width: 560px; }
        .section-desc { font-size: 16px; color: var(--muted); line-height: 1.7; max-width: 480px; margin-top: 14px; }

        .features-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 2px; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; background: var(--border); }
        .feature-card { background: var(--card-bg); padding: 40px; display: flex; flex-direction: column; gap: 20px; opacity: 0; transform: translateY(28px); transition: background 0.25s, opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1); }
        .feature-card.visible { opacity: 1; transform: translateY(0); }
        .feature-card:hover { background: rgba(255,255,255,0.82); }
        .feature-icon { width: 52px; height: 52px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); display: flex; align-items: center; justify-content: center; color: var(--fg); transition: border-color 0.2s, color 0.2s, background 0.2s, transform 0.25s; }
        .feature-card:hover .feature-icon { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); transform: rotate(-4deg) scale(1.05); }
        .feature-tag { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: var(--muted); }
        .feature-title { font-size: 20px; font-weight: 700; letter-spacing: -0.4px; color: var(--fg); line-height: 1.25; }
        .feature-body { font-size: 14px; color: var(--muted); line-height: 1.75; flex: 1; }
        .feature-arrow { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--accent); opacity: 0; transform: translateX(-6px); transition: opacity 0.2s, transform 0.2s; }
        .feature-card:hover .feature-arrow { opacity: 1; transform: translateX(0); }

        /* ── CTA ── */
        .cta-section { padding: 0 48px 100px; }
        .cta-inner {
          max-width: 1200px; margin: 0 auto; background: var(--fg); border-radius: 24px;
          padding: 80px 64px; display: flex; align-items: center; justify-content: space-between;
          gap: 48px; position: relative; overflow: hidden;
          opacity: 0; transform: translateY(32px);
          transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1);
        }
        .cta-inner.visible { opacity: 1; transform: translateY(0); }
        .cta-bg-shape { position: absolute; right: -60px; top: -60px; width: 320px; height: 320px; border-radius: 50%; border: 60px solid rgba(255,77,0,0.12); pointer-events: none; animation: spinSlow 18s linear infinite; }
        .cta-bg-shape2 { position: absolute; left: 40%; bottom: -80px; width: 200px; height: 200px; border-radius: 50%; border: 40px solid rgba(255,77,0,0.08); pointer-events: none; animation: spinSlow 24s linear infinite reverse; }
        @keyframes spinSlow { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
        .cta-content { position: relative; z-index: 1; }
        .cta-label { font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: rgba(255,77,0,0.9); display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .cta-label::before { content: ''; display: block; width: 20px; height: 2px; background: rgba(255,77,0,0.9); border-radius: 1px; }
        .cta-title { font-size: clamp(28px,3.5vw,42px); font-weight: 800; letter-spacing: -1.2px; color: #E9E9E9; line-height: 1.1; max-width: 440px; }
        .cta-title span { color: var(--accent); }
        .cta-right { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 16px; align-items: flex-start; flex-shrink: 0; }
        .cta-note { font-size: 13px; color: rgba(233,233,233,0.45); display: flex; align-items: center; gap: 6px; }
        .cta-note svg { flex-shrink: 0; }
        .btn-cta-primary { background: var(--accent); color: #fff; border: none; cursor: pointer; font-family: var(--font); font-size: 15px; font-weight: 700; padding: 15px 30px; border-radius: 10px; white-space: nowrap; display: flex; align-items: center; gap: 8px; transition: filter 0.2s, transform 0.15s, box-shadow 0.2s; }
        .btn-cta-primary:hover { filter: brightness(1.08); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,77,0,0.3); }

        @media (max-width: 900px) {
          .navbar { padding: 0 24px; }
          .nav-links { display: none; }
          .hamburger { display: flex; }
          .section { padding: 72px 24px; }
          .features-grid { grid-template-columns: 1fr; }
          .cta-inner { flex-direction: column; padding: 48px 32px; }
          .cta-right { align-items: stretch; width: 100%; }
          .hero-stats { flex-wrap: wrap; }
          .stat-item { padding: 16px 24px; }
          .cta-section { padding: 0 24px 72px; }
          .security-section { padding: 0 24px 60px; }
          .security-inner { padding: 24px; }
          .float-card { display: none; }
        }
        @media (max-width: 480px) {
          .hero-title { letter-spacing: -1.5px; }
          .cta-title { font-size: 26px; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <a href="#" className="nav-logo">
          <div className="nav-logo-mark">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9h5M9 3v5M9 9l4.5 4.5" stroke="#E9E9E9" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="9" r="2" fill="#FF4D00"/>
            </svg>
          </div>
          <span className="nav-logo-text">Resolve<span>X</span>-AI</span>
        </a>

        {/* Clean nav — only 2 links + dashboard button */}
        <ul className="nav-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#dashboard">Dashboard</a></li>
        </ul>

        <button className="nav-dashboard-btn">
          Open dashboard
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button className={`hamburger${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </nav>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        <a href="#dashboard" onClick={() => setMenuOpen(false)}>Dashboard</a>
        <button className="nav-dashboard-btn" style={{ width: "fit-content" }}>Open dashboard</button>
      </div>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />

        <FloatingCard label="VPN not connecting" status="auto-resolved" score={92}
          style={{ left: "6%", top: "28%", animation: "float1 6s ease-in-out infinite", opacity: 0.85 }} />
        <FloatingCard label="Access request: Prod DB" status="escalated" score={38}
          style={{ right: "5%", top: "22%", animation: "float2 7s ease-in-out infinite 1s", opacity: 0.8 }} />
        <FloatingCard label="Password reset — Sarah K." status="auto-resolved" score={97}
          style={{ left: "4%", bottom: "22%", animation: "float3 8s ease-in-out infinite 2s", opacity: 0.7 }} />
        <FloatingCard label="Outlook sync failing" status="reviewing" score={61}
          style={{ right: "6%", bottom: "26%", animation: "float1 9s ease-in-out infinite 0.5s", opacity: 0.75 }} />

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Confidence-Based AI · Enterprise HITL
        </div>

        <h1 className="hero-title">
          {["IT", "support,"].map((word, i) => (
            <span key={`r0${i}`} className={`hero-title-word${heroReady ? " up" : ""}`} style={{ animationDelay: `${i * 0.1}s` }}>{word}</span>
          ))}
          <br />
          <span className={`accent-word hero-title-word${heroReady ? " up line-visible" : ""}`} style={{ animationDelay: "0.18s" }}>intelligently</span>
          <br />
          <span className={`hero-title-word${heroReady ? " up" : ""}`} style={{ animationDelay: "0.28s" }}>automated.</span>
        </h1>

        <p className="hero-sub">
          {typedSub}
          {typedSub.length < heroSubText.length && <span className="cursor" />}
        </p>

        {/* Single focused CTA */}
        <div className="hero-actions">
          <button className="btn-hero-primary">
            Open dashboard
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="hero-stats" ref={statsRef}>
          <StatItem value={94}  suffix="%" label="Auto-resolution rate" animate={statsVisible} />
          <StatItem value={3}   suffix="s"  label="Avg. decision time"   animate={statsVisible} />
          <StatItem value={100} suffix="%" label="Auditable decisions"   animate={statsVisible} />
          <StatItem value={60}  suffix="%" label="SLA breach reduction"  animate={statsVisible} />
        </div>
      </section>


      {/* ── FEATURES ── */}
      <section id="how-it-works" style={{ background: "var(--bg)" }}>
        <div className="section">
          <div className="section-header">
            <div className="section-eyebrow" ref={eyebrowRef}>
              <span className={`eyebrow-text${eyebrowInView ? " visible" : ""}`}>How it works</span>
            </div>
            <AnimatedTitle className="section-title">
              Four stages. One intelligent pipeline.
            </AnimatedTitle>
            <p className="section-desc" style={{
              opacity: eyebrowInView ? 1 : 0,
              transform: eyebrowInView ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.6s 0.4s ease, transform 0.6s 0.4s ease",
            }}>
              Every ticket flows through a structured decision chain — from raw text
              to resolved action — with safety checkpoints at every step.
            </p>
          </div>

          <div className="features-grid" ref={featureRef}>
            {features.map((f, i) => (
              <div className={`feature-card${featureInView ? " visible" : ""}`} key={f.tag} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <div>
                  <div className="feature-tag">{f.tag}</div>
                  <div className="feature-title" style={{ marginTop: 6 }}>{f.title}</div>
                </div>
                <p className="feature-body">{f.body}</p>
                <div className="feature-arrow">
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
      <div className="cta-section">
        <div ref={ctaRef} className={`cta-inner${ctaInView ? " visible" : ""}`}>
          <div className="cta-bg-shape" aria-hidden="true" />
          <div className="cta-bg-shape2" aria-hidden="true" />
          <div className="cta-content">
            <div className="cta-label">Ready to automate</div>
            <h2 className="cta-title">
              Stop resolving tickets.<br />
              Start <span>automating</span> them.
            </h2>
          </div>
          <div className="cta-right">
            <button className="btn-cta-primary">
              Open the dashboard
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="cta-note">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
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