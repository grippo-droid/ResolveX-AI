import { useState, useEffect, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type Category = "access" | "hardware" | "software" | "network" | "security" | "other";
type Priority = "low" | "medium" | "high" | "critical";
type Decision = "auto-resolved" | "human-review" | "escalated";

interface TicketForm {
  title:       string;
  category:    Category | "";
  priority:    Priority | "";
  description: string;
  system:      string;
  user:        string;
  department:  string;
  image:       File | null;
}

interface AIResult {
  decision:       Decision;
  confidence:     number;
  intent:         string;
  suggestedFix:   string;
  explanation:    string;
  ticketId:       string;
  processingTime: number;
}

// ── Mock AI engine ─────────────────────────────────────────────────────────
function simulateAI(form: TicketForm): Promise<AIResult> {
  return new Promise((resolve) => {
    const title = form.title.toLowerCase();
    const desc  = form.description.toLowerCase();

    let confidence = 60;
    let intent     = "General IT Issue";
    let fix        = "Our team will investigate and get back to you.";
    let explanation= "The system detected an unclassified issue requiring manual review.";

    if (title.includes("password") || desc.includes("password") || title.includes("reset")) {
      confidence = 97; intent = "Password Reset";
      fix        = "Account password has been reset. A temporary password has been sent to your registered email. Please change it upon first login.";
      explanation= "High confidence match: keyword 'password reset' found in title. Historical success rate for this pattern is 99.2%. Policy allows auto-resolution.";
    } else if (title.includes("vpn") || desc.includes("vpn") || title.includes("connect")) {
      confidence = 92; intent = "VPN Connectivity Issue";
      fix        = "VPN client has been reconfigured. Please disconnect, wait 10 seconds, and reconnect. If the issue persists, clear your VPN cache and retry.";
      explanation= "Strong semantic match to 'VPN connectivity' pattern. 94% of similar tickets were resolved with a client reset. Confidence above 85% threshold.";
    } else if (title.includes("access") || desc.includes("access") || title.includes("permission")) {
      confidence = 38; intent = "Access Request";
      fix        = "Access requests to production systems require manager approval. Your request has been forwarded to your department head and the security team.";
      explanation= "Access request to sensitive system detected. Confidence is below the 80% threshold due to business-critical nature. Policy mandates human review for all access grants.";
    } else if (title.includes("outlook") || title.includes("email") || desc.includes("email") || desc.includes("sync")) {
      confidence = 61; intent = "Email Client Issue";
      fix        = "Recommended fix: Open Outlook → File → Account Settings → Repair Account. If unresolved, try removing and re-adding your account.";
      explanation= "Moderate confidence match to email sync issue. Some contextual details are ambiguous. A human agent will verify before applying the fix.";
    } else if (title.includes("laptop") || title.includes("hardware") || title.includes("screen") || title.includes("keyboard")) {
      confidence = form.image ? 58 : 44; intent = "Hardware Malfunction";
      fix        = form.image
        ? "Screenshot received and analyzed. Hardware issue logged with visual evidence. A technician will contact you within 1 business day."
        : "A hardware replacement request has been raised with the IT assets team. You will be contacted within 2 business days.";
      explanation= form.image
        ? "Screenshot attachment increased confidence score. Visual evidence helps hardware team prioritize and diagnose remotely."
        : "Hardware issues cannot be auto-resolved remotely. Escalated to hardware support queue for physical inspection.";
    } else if (form.priority === "critical") {
      confidence = 22; intent = "Critical Priority Issue";
      fix        = "Due to critical priority, this ticket has been immediately escalated to the senior IT team.";
      explanation= "Policy engine override: critical priority tickets always require human review regardless of confidence score.";
    } else if (title.includes("slow") || title.includes("performance") || desc.includes("slow")) {
      confidence = 71; intent = "Performance Degradation";
      fix        = "Cleared browser cache and temp files remotely. Restarted background services on your workstation. Please test performance now.";
      explanation= "Performance issues have a 71% auto-resolution rate. Running standard remediation steps. Agent will follow up if not resolved.";
    }

    // Slight confidence boost if image attached
    if (form.image && confidence < 95) confidence = Math.min(confidence + 6, 99);

    let decision: Decision;
    if (form.priority === "critical" || (form.priority === "high" && confidence < 70)) {
      decision = "escalated"; confidence = Math.min(confidence, 45);
    } else if (confidence >= 80) {
      decision = "auto-resolved";
    } else if (confidence >= 55) {
      decision = "human-review";
    } else {
      decision = "escalated";
    }

    const processingTime = 1800 + Math.random() * 800;
    setTimeout(() => resolve({
      decision, confidence, intent,
      suggestedFix: fix, explanation,
      ticketId: `TKT-${Date.now().toString().slice(-5)}`,
      processingTime: Math.round(processingTime),
    }), processingTime);
  });
}

// ── Processing steps ───────────────────────────────────────────────────────
const STEPS = [
  { label: "Parsing ticket content",       icon: "📥" },
  { label: "Extracting intent & entities", icon: "🧠" },
  { label: "Analyzing screenshot",         icon: "🖼️" },
  { label: "Searching knowledge base",     icon: "🔍" },
  { label: "Calculating confidence score", icon: "📊" },
  { label: "Running policy engine",        icon: "🛡️" },
  { label: "Generating decision",          icon: "⚡" },
];

// ── Confidence ring ────────────────────────────────────────────────────────
function ConfidenceRing({ value, animate }: { value: number; animate: boolean }) {
  const safe   = Math.min(100, Math.max(0, value));
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (safe / 100) * circ;
  const color  = safe >= 80 ? "#16a34a" : safe >= 55 ? "#b45309" : "#FF4D00";

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg width="144" height="144" viewBox="0 0 144 144" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="72" cy="72" r={radius} fill="none" stroke="rgba(10,10,10,0.08)" strokeWidth="10"/>
        <circle cx="72" cy="72" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={animate ? offset : circ}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold" style={{ color }}>{safe}%</span>
        <span className="text-xs font-medium text-[#6B6B6B] mt-0.5">confidence</span>
      </div>
    </div>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "access",   label: "Access & Permissions", icon: "🔐" },
  { value: "hardware", label: "Hardware",              icon: "💻" },
  { value: "software", label: "Software / App",        icon: "⚙️" },
  { value: "network",  label: "Network / VPN",         icon: "🌐" },
  { value: "security", label: "Security",              icon: "🛡️" },
  { value: "other",    label: "Other",                 icon: "📋" },
];

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "low",      label: "Low",      color: "#6B6B6B" },
  { value: "medium",   label: "Medium",   color: "#b45309" },
  { value: "high",     label: "High",     color: "#FF4D00" },
  { value: "critical", label: "Critical", color: "#dc2626" },
];

const SYSTEMS = [
  "Microsoft Outlook", "VPN Client", "Active Directory", "Slack",
  "Jira", "GitHub", "AWS Console", "SAP", "Salesforce", "Workday",
  "Zoom", "Microsoft Teams", "Laptop / Desktop", "Printer", "Other",
];

const DECISION_CONFIG: Record<Decision, { label: string; color: string; bg: string; border: string; icon: string; desc: string }> = {
  "auto-resolved": { label: "Auto Resolved",  color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", icon: "✓",  desc: "AI resolved this ticket automatically. No human action required."                          },
  "human-review":  { label: "Human Review",   color: "#b45309", bg: "#fffbeb", border: "#fde68a", icon: "👤", desc: "AI suggests a fix. A support engineer will verify before applying."                       },
  "escalated":     { label: "Escalated",      color: "#FF4D00", bg: "#fff7f5", border: "#ffd0c0", icon: "⬆",  desc: "This ticket requires immediate human attention. Escalated to senior team."               },
};

// ── Main ───────────────────────────────────────────────────────────────────
export default function Simulation() {
  const [form, setForm] = useState<TicketForm>({
    title: "", category: "", priority: "", description: "",
    system: "", user: "", department: "", image: null,
  });
  const [errors, setErrors]           = useState<Partial<Record<keyof TicketForm, string>>>({});
  const [phase, setPhase]             = useState<"form" | "processing" | "result">("form");
  const [stepIndex, setStepIndex]     = useState(0);
  const [result, setResult]           = useState<AIResult | null>(null);
  const [ringAnimate, setRingAnimate] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const stepTimer                     = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== "processing") return;
    setStepIndex(0);
    stepTimer.current = setInterval(() => {
      setStepIndex(prev => {
        if (prev >= STEPS.length - 1) { if (stepTimer.current) clearInterval(stepTimer.current); return prev; }
        return prev + 1;
      });
    }, 320);
    return () => { if (stepTimer.current) clearInterval(stepTimer.current); };
  }, [phase]);

  useEffect(() => {
    if (phase !== "result") return;
    const t = setTimeout(() => setRingAnimate(true), 200);
    return () => clearTimeout(t);
  }, [phase]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof TicketForm, string>> = {};
    if (!form.title.trim())       e.title       = "Title is required";
    if (!form.category)           e.category    = "Please select a category";
    if (!form.priority)           e.priority    = "Please select a priority";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.user.trim())        e.user        = "Your name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setPhase("processing");
      const aiResult = await simulateAI(form);
      setResult(aiResult);
      setPhase("result");
    } catch (err) {
      console.error("[Simulation] AI engine error:", err);
      setPhase("form");
    }
  };

  const handleReset = () => {
    setForm({ title: "", category: "", priority: "", description: "", system: "", user: "", department: "", image: null });
    setErrors({}); setResult(null); setRingAnimate(false); setImagePreview(null); setPhase("form");
  };

  const update = (field: keyof TicketForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setForm(prev => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{ opacity:0; transform:translateY(16px); } to{ opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from{ opacity:0; } to{ opacity:1; } }
        @keyframes stepIn  { from{ opacity:0; transform:translateX(-8px); } to{ opacity:1; transform:translateX(0); } }
        @keyframes spin    { to{ transform:rotate(360deg); } }
        @keyframes pulse   { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
        @keyframes slideUp { from{ opacity:0; transform:translateY(32px); } to{ opacity:1; transform:translateY(0); } }

        .fade-up  { animation: fadeUp  0.45s ease both; }
        .fade-in  { animation: fadeIn  0.3s  ease both; }
        .step-in  { animation: stepIn  0.3s  ease both; }
        .slide-up { animation: slideUp 0.5s  cubic-bezier(0.22,1,0.36,1) both; }
        .spinner  { animation: spin    0.8s  linear infinite; }
        .pulse-dot{ animation: pulse   1.4s  ease-in-out infinite; }

        .input-base {
          width:100%; background:white;
          border:1.5px solid rgba(10,10,10,0.12); border-radius:10px;
          padding:11px 14px; font-size:14px; color:#0A0A0A;
          outline:none; transition:border-color 0.2s, box-shadow 0.2s;
        }
        .input-base::placeholder{ color:#ABABAB; }
        .input-base:focus{ border-color:#FF4D00; box-shadow:0 0 0 3px rgba(255,77,0,0.08); }
        .input-error{ border-color:#dc2626 !important; }

        .select-base {
          width:100%; background:white;
          border:1.5px solid rgba(10,10,10,0.12); border-radius:10px;
          padding:11px 14px; font-size:14px; color:#0A0A0A;
          outline:none; cursor:pointer; appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%236B6B6B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 14px center;
          transition:border-color 0.2s, box-shadow 0.2s;
        }
        .select-base:focus{ border-color:#FF4D00; box-shadow:0 0 0 3px rgba(255,77,0,0.08); }
      `}</style>

      {/* ── PHASE: FORM ── */}
      {phase === "form" && (
        <div className="fade-up flex flex-col lg:flex-row gap-5 items-start">

          {/* ── LEFT: Theory panel ── */}
          <div className="lg:w-[270px] shrink-0 flex flex-col gap-4">

            {/* Sim mode badge */}
            <div className="flex items-center gap-2.5 bg-[#FF4D00]/[0.07] border border-[#FF4D00]/20 rounded-xl px-4 py-3">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#FF4D00] shrink-0" />
              <span className="text-[12px] font-medium text-[#FF4D00] leading-snug">
                Simulation mode — no real actions executed
              </span>
            </div>

            {/* What happens */}
            <div className="bg-white rounded-2xl border border-black/10 p-5 flex flex-col gap-4">
              <p className="text-[13px] font-bold text-[#0A0A0A]">What happens when you submit?</p>
              {[
                { color: "#FF4D00", title: "Intent Extraction",        desc: "NLP pipeline parses your ticket for intent, urgency & entities in milliseconds." },
                { color: "#16a34a", title: "Confidence Scoring",       desc: "Multi-factor engine scores against policy rules, history & any attached screenshot." },
                { color: "#b45309", title: "Auto-resolve or Escalate", desc: "High confidence → resolved automatically. Low confidence → routed to a human." },
              ].map(s => (
                <div key={s.title} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: s.color }} />
                  <div>
                    <p className="text-[12px] font-bold text-[#0A0A0A]">{s.title}</p>
                    <p className="text-[12px] text-[#6B6B6B] leading-relaxed mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Screenshot tip */}
            <div className="bg-white rounded-2xl border border-black/10 p-5 flex flex-col gap-3">
              <p className="text-[12px] font-bold text-[#0A0A0A]">💡 Pro tip — attach a screenshot</p>
              <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                Attaching a screenshot of the error gives the AI more visual context, which can increase the confidence score and lead to faster resolution.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#16a34a]/10 text-[#16a34a]">+6% confidence boost</span>
              </div>
            </div>

            {/* Sample outcomes */}
            <div className="bg-[#0A0A0A] rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[1.4px] text-[#FF4D00]">Sample Outcomes</p>
              {[
                { label: "Password Reset",  status: "Auto Resolved",  color: "#16a34a" },
                { label: "Prod DB Access",  status: "Escalated",      color: "#FF4D00" },
                { label: "Outlook Sync",    status: "Under Review",   color: "#b45309" },
                { label: "VPN Not Working", status: "Auto Resolved",  color: "#16a34a" },
              ].map(o => (
                <div key={o.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#888]">{o.label}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: o.color, background: o.color + "18" }}>{o.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Form ── */}
          <div className="flex-1 bg-white/70 border border-black/[0.08] rounded-2xl p-6 flex flex-col gap-5">

            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#FF4D00]/10 border border-[#FF4D00]/20 text-[#FF4D00] text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-3">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#FF4D00]" />
                AI-Powered · Live Simulation
              </div>
              <h2 className="text-[20px] font-extrabold text-[#0A0A0A] tracking-tight leading-tight mb-1">
                Submit a Support Ticket
              </h2>
              <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                Describe your IT issue. The AI engine will classify, score, and resolve or escalate it automatically.
              </p>
            </div>

            {/* Name + Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#0A0A0A]">Your Name <span className="text-[#FF4D00]">*</span></label>
                <input type="text" placeholder="e.g. Sarah Johnson" value={form.user}
                  onChange={e => update("user", e.target.value)}
                  className={`input-base ${errors.user ? "input-error" : ""}`} />
                {errors.user && <p className="text-xs text-red-600">{errors.user}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#0A0A0A]">Department</label>
                <input type="text" placeholder="e.g. Engineering, Finance…" value={form.department}
                  onChange={e => update("department", e.target.value)} className="input-base" />
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0A0A0A]">Issue Title <span className="text-[#FF4D00]">*</span></label>
              <input type="text" placeholder="e.g. Cannot connect to VPN after system update" value={form.title}
                onChange={e => update("title", e.target.value)}
                className={`input-base ${errors.title ? "input-error" : ""}`} />
              {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#0A0A0A]">Category <span className="text-[#FF4D00]">*</span></label>
                <select value={form.category} onChange={e => update("category", e.target.value)}
                  className={`select-base ${errors.category ? "input-error" : ""}`}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
                {errors.category && <p className="text-xs text-red-600">{errors.category}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#0A0A0A]">Priority <span className="text-[#FF4D00]">*</span></label>
                <div className="flex gap-2 flex-wrap">
                  {PRIORITIES.map(p => (
                    <button key={p.value} type="button" onClick={() => update("priority", p.value)}
                      className="flex-1 min-w-[60px] py-2.5 px-2 rounded-xl text-[12px] font-bold border-[1.5px] cursor-pointer transition-all duration-150"
                      style={{
                        borderColor: form.priority === p.value ? p.color : "rgba(10,10,10,0.1)",
                        background:  form.priority === p.value ? p.color + "15" : "white",
                        color:       form.priority === p.value ? p.color : "#6B6B6B",
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                {errors.priority && <p className="text-xs text-red-600">{errors.priority}</p>}
              </div>
            </div>

            {/* Affected system */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0A0A0A]">Affected System</label>
              <select value={form.system} onChange={e => update("system", e.target.value)} className="select-base">
                <option value="">Select affected system…</option>
                {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#0A0A0A]">Description <span className="text-[#FF4D00]">*</span></label>
                <span className="text-[11px] text-[#ABABAB]">{form.description.length}/500</span>
              </div>
              <textarea placeholder="Describe the issue in detail. Include when it started, what you were doing, any error messages you saw…"
                value={form.description} onChange={e => update("description", e.target.value.slice(0, 500))}
                rows={4} className={`input-base resize-none ${errors.description ? "input-error" : ""}`} />
              {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
            </div>

            {/* ── Screenshot upload ── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0A0A0A]">
                Screenshot / Attachment
                <span className="text-[#ABABAB] font-normal ml-1.5 text-[12px]">(optional — boosts AI confidence)</span>
              </label>

              {!imagePreview ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0] ?? null); }}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex flex-col items-center justify-center gap-2 border-[1.5px] border-dashed rounded-xl py-7 cursor-pointer transition-all duration-200"
                  style={{
                    borderColor: dragOver ? "#FF4D00" : "rgba(10,10,10,0.15)",
                    background:  dragOver ? "rgba(255,77,0,0.04)" : "white",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-[#ABABAB]">
                    <rect x="2" y="5" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="9" cy="11" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 19l6-5 4 4 4-3 10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-[13px] font-medium text-[#6B6B6B]">
                    <span className="text-[#FF4D00] font-semibold">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-[11px] text-[#ABABAB]">PNG, JPG, GIF up to 5MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => handleFile(e.target.files?.[0] ?? null)} />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-black/10 group">
                  <img src={imagePreview} alt="Attached screenshot" className="w-full max-h-[220px] object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                    <button onClick={removeImage}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-[#0A0A0A] text-[12px] font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 border border-black/10 cursor-pointer">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Remove
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-black/10">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <rect x="0.5" y="0.5" width="10" height="10" rx="2" stroke="#16a34a" strokeWidth="1.1"/>
                      <path d="M3 5.5l1.5 1.5 3-3" stroke="#16a34a" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[11px] font-semibold text-[#16a34a]">Screenshot attached</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sample tickets */}
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#ABABAB]">Try a sample ticket</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Password reset", title: "Need to reset my LDAP password",     category: "access"   as Category, priority: "medium" as Priority, desc: "I forgot my LDAP password and cannot log into my workstation or any internal tools. I need an urgent password reset.", system: "Active Directory" },
                  { label: "VPN issue",       title: "VPN not connecting after update",    category: "network"  as Category, priority: "high"   as Priority, desc: "After the latest Windows update, I cannot connect to the company VPN. It shows 'Authentication failed' even though my credentials are correct.", system: "VPN Client" },
                  { label: "Access request",  title: "Request access to Production DB",   category: "access"   as Category, priority: "high"   as Priority, desc: "I need read access to the production database to investigate a client reported data discrepancy. Please grant access at the earliest.", system: "AWS Console" },
                  { label: "Outlook sync",    title: "Outlook not syncing emails",         category: "software" as Category, priority: "medium" as Priority, desc: "Outlook stopped syncing about 2 hours ago. New emails are not appearing. I have tried restarting the app but the issue persists.", system: "Microsoft Outlook" },
                ].map(ex => (
                  <button key={ex.label} type="button"
                    onClick={() => setForm(prev => ({ ...prev, title: ex.title, category: ex.category, priority: ex.priority, description: ex.desc, system: ex.system }))}
                    className="text-[12px] font-medium text-[#6B6B6B] bg-white border border-black/10 px-3 py-1.5 rounded-lg hover:border-[#FF4D00]/40 hover:text-[#FF4D00] hover:bg-[#FF4D00]/5 transition-all duration-150 cursor-pointer">
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4 pt-2 border-t border-black/[0.07]">
              <button type="button" onClick={handleSubmit}
                className="flex items-center gap-2 bg-[#0A0A0A] text-[#E9E9E9] text-sm font-bold px-6 py-3.5 rounded-xl border-none cursor-pointer transition-all duration-200 hover:bg-[#1a1a1a] hover:-translate-y-px hover:shadow-lg">
                Submit to AI Engine
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <p className="text-[12px] text-[#ABABAB]">
                {form.image ? "📎 Screenshot attached · " : ""}AI will respond in ~2 seconds
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE: PROCESSING ── */}
      {phase === "processing" && (
        <div className="fade-in flex flex-col items-center justify-center min-h-[60vh] text-center gap-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-[3px] border-black/[0.06]" />
            <div className="spinner absolute inset-0 rounded-full border-[3px] border-transparent" style={{ borderTopColor: "#FF4D00" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9h5M9 3v5M9 9l4.5 4.5" stroke="#E9E9E9" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="9" r="2" fill="#FF4D00"/>
                </svg>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0A0A0A] tracking-tight mb-1">AI Engine Processing</h2>
            <p className="text-sm text-[#6B6B6B]">
              Running your ticket through the decision pipeline{form.image ? " + analyzing screenshot" : ""}…
            </p>
          </div>
          <div className="w-full max-w-sm flex flex-col gap-2.5">
            {STEPS.map((step, i) => {
              const done    = i < stepIndex;
              const current = i === stepIndex;
              // skip screenshot step if no image
              if (step.icon === "🖼️" && !form.image) return null;
              return (
                <div key={step.label} className="step-in flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    background:  current ? "rgba(255,77,0,0.06)" : done ? "white" : "rgba(255,255,255,0.4)",
                    borderColor: current ? "rgba(255,77,0,0.25)" : done ? "rgba(10,10,10,0.08)" : "rgba(10,10,10,0.05)",
                    opacity:     i > stepIndex + 1 ? 0.35 : 1,
                  }}>
                  <span className="text-base shrink-0 w-6 text-center">{done ? "✓" : current ? step.icon : "○"}</span>
                  <span className="text-sm font-medium" style={{ color: current ? "#FF4D00" : done ? "#0A0A0A" : "#ABABAB" }}>
                    {step.label}
                  </span>
                  {current && (
                    <div className="ml-auto flex gap-1">
                      {[0,1,2].map(d => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#FF4D00]"
                          style={{ animation: `pulse 1s ease-in-out ${d * 0.15}s infinite` }} />
                      ))}
                    </div>
                  )}
                  {done && <span className="ml-auto text-xs font-bold text-green-600">Done</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PHASE: RESULT ── */}
      {phase === "result" && result && (() => {
        const cfg = DECISION_CONFIG[result.decision];
        return (
          <div className="slide-up flex flex-col gap-5">

            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
                    style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span className="text-xs text-[#ABABAB] font-mono">{result.ticketId}</span>
                  {form.image && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#16a34a]/10 text-[#16a34a]">
                      📎 Screenshot analyzed
                    </span>
                  )}
                </div>
                <h2 className="text-[22px] font-extrabold text-[#0A0A0A] tracking-tight leading-tight">AI Decision Complete</h2>
                <p className="text-sm text-[#6B6B6B] mt-1">
                  Processed in {result.processingTime}ms · Intent: <strong className="text-[#0A0A0A]">{result.intent}</strong>
                </p>
              </div>
              <button onClick={handleReset}
                className="text-sm font-semibold text-[#6B6B6B] hover:text-[#0A0A0A] border border-black/10 hover:border-black/20 px-4 py-2 rounded-xl transition-all bg-white cursor-pointer">
                + New Ticket
              </button>
            </div>

            {/* Confidence ring */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border"
              style={{ background: cfg.bg, borderColor: cfg.border }}>
              <ConfidenceRing value={result.confidence} animate={ringAnimate} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[11px] font-bold tracking-[1.4px] uppercase mb-2" style={{ color: cfg.color }}>Decision</p>
                <p className="text-xl font-extrabold text-[#0A0A0A] tracking-tight mb-2">{cfg.label}</p>
                <p className="text-sm leading-relaxed" style={{ color: cfg.color }}>{cfg.desc}</p>
              </div>
            </div>

            {/* Screenshot in result */}
            {imagePreview && (
              <div className="bg-white/80 border border-black/[0.08] rounded-2xl p-5 flex flex-col gap-3">
                <h3 className="text-sm font-bold text-[#0A0A0A]">Attached Screenshot</h3>
                <img src={imagePreview} alt="Submitted screenshot" className="w-full max-h-[200px] object-cover rounded-xl border border-black/[0.06]" />
              </div>
            )}

            {/* Suggested fix */}
            <div className="bg-white/80 border border-black/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-[#0A0A0A] rounded-lg flex items-center justify-center shrink-0">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2M2.9 2.9l1.4 1.4M8.7 8.7l1.4 1.4M2.9 10.1l1.4-1.4M8.7 4.3l1.4-1.4" stroke="#E9E9E9" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#0A0A0A]">Suggested Resolution</h3>
              </div>
              <p className="text-sm text-[#3a3a3a] leading-relaxed">{result.suggestedFix}</p>
            </div>

            {/* Explainability */}
            <div className="bg-white/80 border border-black/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-[#FF4D00]/10 border border-[#FF4D00]/20 rounded-lg flex items-center justify-center shrink-0">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="5.5" stroke="#FF4D00" strokeWidth="1.3"/>
                    <path d="M6.5 4.5V7M6.5 9v.5" stroke="#FF4D00" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#0A0A0A]">Why this decision?</h3>
                <span className="ml-auto text-[11px] font-semibold text-[#FF4D00] bg-[#FF4D00]/10 px-2 py-0.5 rounded-full">
                  Explainable AI
                </span>
              </div>
              <p className="text-sm text-[#3a3a3a] leading-relaxed">{result.explanation}</p>
            </div>

            {/* Ticket summary */}
            <div className="bg-white/80 border border-black/[0.08] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-[#0A0A0A] mb-4">Ticket Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Ticket ID",      value: result.ticketId },
                  { label: "Submitted by",   value: form.user || "—" },
                  { label: "Category",       value: CATEGORIES.find(c => c.value === form.category)?.label || "—" },
                  { label: "Priority",       value: form.priority ? form.priority.charAt(0).toUpperCase() + form.priority.slice(1) : "—" },
                  { label: "System",         value: form.system || "—" },
                  { label: "Screenshot",     value: form.image ? "✓ Attached" : "None" },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#ABABAB] mb-0.5">{item.label}</p>
                    <p className="text-[13px] font-semibold text-[#0A0A0A]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={handleReset}
                className="flex items-center gap-2 bg-[#0A0A0A] text-[#E9E9E9] text-sm font-bold px-5 py-3 rounded-xl border-none cursor-pointer hover:bg-[#1a1a1a] transition-all hover:-translate-y-px">
                Submit Another Ticket
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );
}
