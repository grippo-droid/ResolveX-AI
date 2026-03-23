import { useEffect, useRef, useState } from "react";

// ── Animated counter hook ──────────────────────────────────────────────────
function useCounter(target: number, duration = 1600, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

// ── Types ──────────────────────────────────────────────────────────────────
interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  animate: boolean;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatItem({ value, suffix, label, animate }: StatItemProps) {
  const count = useCounter(value, 1800, animate);
  return (
    <div className="stat-item">
      <span className="stat-number">
        {count}
        {suffix}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Navbar scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Stats counter trigger on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.4 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #E9E9E9;
          --fg: #0A0A0A;
          --accent: #FF4D00;
          --accent-dim: rgba(255, 77, 0, 0.12);
          --muted: #6B6B6B;
          --border: rgba(10,10,10,0.10);
          --card-bg: rgba(255,255,255,0.55);
          --font: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        html { scroll-behavior: smooth; }

        body {
          background-color: var(--bg);
          font-family: var(--font);
          color: var(--fg);
          overflow-x: hidden;
        }

        /* ── NAVBAR ── */
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 48px;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          transition: background 0.3s, box-shadow 0.3s;
        }
        .navbar.scrolled {
          background: rgba(233,233,233,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 var(--border);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; color: var(--fg);
        }
        .nav-logo-mark {
          width: 32px; height: 32px;
          background: var(--fg);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .nav-logo-mark svg { display: block; }
        .nav-logo-text {
          font-size: 16px; font-weight: 700; letter-spacing: -0.3px;
        }
        .nav-logo-text span { color: var(--accent); }
        .nav-links {
          display: flex; align-items: center; gap: 36px;
          list-style: none;
        }
        .nav-links a {
          text-decoration: none; color: var(--muted);
          font-size: 14px; font-weight: 500; letter-spacing: 0.1px;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--fg); }
        .nav-cta {
          display: flex; align-items: center; gap: 12px;
        }
        .btn-ghost {
          background: none; border: none; cursor: pointer;
          font-family: var(--font); font-size: 14px; font-weight: 500;
          color: var(--muted); padding: 8px 0;
          transition: color 0.2s;
        }
        .btn-ghost:hover { color: var(--fg); }
        .btn-primary {
          background: var(--fg); color: var(--bg);
          border: none; cursor: pointer;
          font-family: var(--font); font-size: 14px; font-weight: 600;
          padding: 10px 20px; border-radius: 8px;
          letter-spacing: 0.1px;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-primary:hover { background: #1a1a1a; transform: translateY(-1px); }
        .hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 4px;
        }
        .hamburger span {
          display: block; width: 22px; height: 2px;
          background: var(--fg); border-radius: 2px;
          transition: transform 0.25s, opacity 0.25s;
        }
        .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; }
        .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        .mobile-menu {
          display: none; position: fixed;
          top: 64px; left: 0; right: 0;
          background: rgba(233,233,233,0.97);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 24px 32px 32px;
          border-bottom: 1px solid var(--border);
          z-index: 99;
          flex-direction: column; gap: 20px;
          animation: slideDown 0.2s ease;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          text-decoration: none; color: var(--fg);
          font-size: 18px; font-weight: 500;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 100px 24px 80px;
          position: relative; overflow: hidden;
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(10,10,10,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,10,10,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          animation: gridShift 20s linear infinite;
        }
        @keyframes gridShift {
          from { background-position: 0 0; }
          to   { background-position: 48px 48px; }
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent-dim);
          border: 1px solid rgba(255,77,0,0.2);
          color: var(--accent);
          font-size: 12px; font-weight: 600; letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 6px 14px; border-radius: 100px;
          margin-bottom: 28px;
          animation: fadeUp 0.6s ease both;
        }
        .hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent);
          animation: pulse 2s ease infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
        .hero-title {
          font-size: clamp(42px, 7vw, 88px);
          font-weight: 800; line-height: 1.0;
          letter-spacing: -2.5px; color: var(--fg);
          max-width: 900px; position: relative; z-index: 1;
          animation: fadeUp 0.6s 0.1s ease both;
        }
        .hero-title .accent-word {
          color: var(--accent);
          position: relative; display: inline-block;
        }
        .hero-title .accent-word::after {
          content: '';
          position: absolute; bottom: 2px; left: 0; right: 0;
          height: 3px; background: var(--accent);
          border-radius: 2px;
          animation: lineGrow 0.6s 0.7s ease both;
          transform-origin: left;
        }
        @keyframes lineGrow {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        .hero-sub {
          font-size: clamp(15px, 2vw, 18px);
          font-weight: 400; color: var(--muted);
          max-width: 540px; line-height: 1.7;
          margin-top: 24px;
          animation: fadeUp 0.6s 0.2s ease both;
        }
        .hero-actions {
          display: flex; align-items: center; gap: 16px;
          margin-top: 40px; flex-wrap: wrap; justify-content: center;
          animation: fadeUp 0.6s 0.3s ease both;
        }
        .btn-hero-primary {
          background: var(--fg); color: var(--bg);
          border: none; cursor: pointer;
          font-family: var(--font); font-size: 15px; font-weight: 600;
          padding: 14px 28px; border-radius: 10px;
          letter-spacing: 0.1px;
          display: flex; align-items: center; gap: 8px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .btn-hero-primary:hover {
          background: #111;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(10,10,10,0.18);
        }
        .btn-hero-primary svg { transition: transform 0.2s; }
        .btn-hero-primary:hover svg { transform: translateX(3px); }
        .btn-hero-secondary {
          background: none;
          border: 1.5px solid var(--border);
          cursor: pointer;
          font-family: var(--font); font-size: 15px; font-weight: 500;
          color: var(--fg);
          padding: 14px 28px; border-radius: 10px;
          letter-spacing: 0.1px;
          transition: border-color 0.2s, background 0.2s;
        }
        .btn-hero-secondary:hover {
          border-color: rgba(10,10,10,0.3);
          background: rgba(10,10,10,0.04);
        }

        /* Stats strip */
        .hero-stats {
          display: flex; gap: 0;
          margin-top: 72px; position: relative; z-index: 1;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: var(--card-bg);
          backdrop-filter: blur(8px);
          overflow: hidden;
          animation: fadeUp 0.6s 0.4s ease both;
        }
        .stat-item {
          padding: 20px 40px;
          display: flex; flex-direction: column; align-items: center;
          gap: 4px;
          border-right: 1px solid var(--border);
        }
        .stat-item:last-child { border-right: none; }
        .stat-number {
          font-size: 28px; font-weight: 800; letter-spacing: -1px;
          color: var(--fg);
        }
        .stat-label {
          font-size: 12px; font-weight: 500; color: var(--muted);
          letter-spacing: 0.2px; white-space: nowrap;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── HOW IT WORKS / FEATURES ── */
        .section {
          padding: 100px 48px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .section-header {
          margin-bottom: 64px;
        }
        .section-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 1.4px;
          text-transform: uppercase; color: var(--accent);
          margin-bottom: 16px;
        }
        .section-eyebrow::before {
          content: '';
          display: block; width: 20px; height: 2px;
          background: var(--accent); border-radius: 1px;
        }
        .section-title {
          font-size: clamp(30px, 4vw, 48px);
          font-weight: 800; letter-spacing: -1.2px;
          line-height: 1.1; max-width: 560px;
        }
        .section-desc {
          font-size: 16px; color: var(--muted);
          line-height: 1.7; max-width: 480px; margin-top: 14px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2px;
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          background: var(--border);
        }
        .feature-card {
          background: var(--card-bg);
          padding: 40px;
          display: flex; flex-direction: column; gap: 20px;
          transition: background 0.25s;
          cursor: default;
        }
        .feature-card:hover { background: rgba(255,255,255,0.8); }
        .feature-icon {
          width: 52px; height: 52px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg);
          display: flex; align-items: center; justify-content: center;
          color: var(--fg);
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .feature-card:hover .feature-icon {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--accent-dim);
        }
        .feature-tag {
          font-size: 11px; font-weight: 700; letter-spacing: 1.2px;
          text-transform: uppercase; color: var(--muted);
        }
        .feature-title {
          font-size: 20px; font-weight: 700; letter-spacing: -0.4px;
          color: var(--fg); line-height: 1.25;
        }
        .feature-body {
          font-size: 14px; color: var(--muted);
          line-height: 1.75; flex: 1;
        }
        .feature-arrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: var(--accent);
          opacity: 0; transform: translateX(-6px);
          transition: opacity 0.2s, transform 0.2s;
        }
        .feature-card:hover .feature-arrow {
          opacity: 1; transform: translateX(0);
        }

        /* ── CTA SECTION ── */
        .cta-section {
          padding: 40px 48px 100px;
        }
        .cta-inner {
          max-width: 1200px; margin: 0 auto;
          background: var(--fg);
          border-radius: 24px;
          padding: 80px 64px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 48px;
          position: relative; overflow: hidden;
        }
        .cta-bg-shape {
          position: absolute; right: -60px; top: -60px;
          width: 320px; height: 320px;
          border-radius: 50%;
          border: 60px solid rgba(255,77,0,0.12);
          pointer-events: none;
        }
        .cta-bg-shape2 {
          position: absolute; left: 40%; bottom: -80px;
          width: 200px; height: 200px;
          border-radius: 50%;
          border: 40px solid rgba(255,77,0,0.08);
          pointer-events: none;
        }
        .cta-content { position: relative; z-index: 1; }
        .cta-label {
          font-size: 11px; font-weight: 700; letter-spacing: 1.4px;
          text-transform: uppercase; color: rgba(255,77,0,0.9);
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 16px;
        }
        .cta-label::before {
          content: ''; display: block;
          width: 20px; height: 2px;
          background: rgba(255,77,0,0.9); border-radius: 1px;
        }
        .cta-title {
          font-size: clamp(28px, 3.5vw, 42px);
          font-weight: 800; letter-spacing: -1.2px;
          color: #E9E9E9; line-height: 1.1; max-width: 440px;
        }
        .cta-title span { color: var(--accent); }
        .cta-actions {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 14px;
          align-items: flex-start; flex-shrink: 0;
        }
        .btn-cta-primary {
          background: var(--accent); color: #fff;
          border: none; cursor: pointer;
          font-family: var(--font); font-size: 15px; font-weight: 600;
          padding: 14px 28px; border-radius: 10px;
          white-space: nowrap;
          display: flex; align-items: center; gap: 8px;
          transition: filter 0.2s, transform 0.15s;
        }
        .btn-cta-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
        }
        .btn-cta-ghost {
          background: none; border: 1.5px solid rgba(233,233,233,0.2);
          cursor: pointer;
          font-family: var(--font); font-size: 14px; font-weight: 500;
          color: rgba(233,233,233,0.7);
          padding: 12px 28px; border-radius: 10px;
          white-space: nowrap;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-cta-ghost:hover {
          border-color: rgba(233,233,233,0.4);
          color: #E9E9E9;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .navbar { padding: 0 24px; }
          .nav-links, .nav-cta { display: none; }
          .hamburger { display: flex; }
          .section { padding: 72px 24px; }
          .features-grid { grid-template-columns: 1fr; }
          .cta-inner { flex-direction: column; padding: 48px 32px; }
          .cta-actions { align-items: stretch; width: 100%; }
          .hero-stats { flex-wrap: wrap; }
          .stat-item { padding: 16px 24px; }
          .cta-section { padding: 40px 24px 72px; }
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
          <span className="nav-logo-text">Resolve<span>X</span></span>
        </a>

        <ul className="nav-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#docs">Docs</a></li>
        </ul>

        <div className="nav-cta">
          <button className="btn-ghost">Sign in</button>
          <button className="btn-primary">Try demo</button>
        </div>

        <button
          className={`hamburger${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#dashboard" onClick={() => setMenuOpen(false)}>Dashboard</a>
        <a href="#docs" onClick={() => setMenuOpen(false)}>Docs</a>
        <button className="btn-primary" style={{ width: "fit-content" }}>Try demo</button>
      </div>

      {/* ── HERO ── */}
      <section className="hero" ref={heroRef}>
        <div className="hero-grid" aria-hidden="true" />

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Confidence-Based AI · Enterprise HITL
        </div>

        <h1 className="hero-title">
          IT support,{" "}
          <span className="accent-word">intelligently</span>
          <br />automated.
        </h1>

        <p className="hero-sub">
          ResolveX-AI classifies, scores, and resolves support tickets at enterprise
          scale — automatically when confident, safely escalating when not.
        </p>

        <div className="hero-actions">
          <button className="btn-hero-primary">
            Open dashboard
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="btn-hero-secondary">Submit a ticket</button>
        </div>

        <div className="hero-stats" ref={statsRef}>
          <StatItem value={94}  suffix="%" label="Auto-resolution rate"  animate={statsVisible} />
          <StatItem value={3}   suffix="s"  label="Avg. decision time"    animate={statsVisible} />
          <StatItem value={100} suffix="%" label="Auditable decisions"    animate={statsVisible} />
          <StatItem value={60}  suffix="%" label="SLA breach reduction"   animate={statsVisible} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: "var(--bg)" }}>
        <div className="section">
          <div className="section-header">
            <div className="section-eyebrow">How it works</div>
            <h2 className="section-title">
              Four stages. One intelligent pipeline.
            </h2>
            <p className="section-desc">
              Every ticket flows through a structured decision chain — from raw text
              to resolved action — with safety checkpoints at every step.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f) => (
              <div className="feature-card" key={f.tag}>
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
        <div className="cta-inner">
          <div className="cta-bg-shape" aria-hidden="true" />
          <div className="cta-bg-shape2" aria-hidden="true" />

          <div className="cta-content">
            <div className="cta-label">Get started today</div>
            <h2 className="cta-title">
              Stop resolving tickets.<br/>
              Start <span>automating</span> them.
            </h2>
          </div>

          <div className="cta-actions">
            <button className="btn-cta-primary">
              Open the dashboard
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn-cta-ghost">Submit a test ticket</button>
          </div>
        </div>
      </div>
    </>
  );
}